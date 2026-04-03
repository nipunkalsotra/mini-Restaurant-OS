from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
import models
from datetime import datetime, timedelta, time
from schemas import OrderStatus


def start_of_day(dt: datetime) -> datetime:
    return dt.replace(hour=0, minute=0, second=0, microsecond=0)


def end_of_day(dt: datetime) -> datetime:
    return dt.replace(hour=23, minute=59, second=59, microsecond=999999)


def safe_percentage_change(current, previous):
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return float(((current - previous) / previous) * 100)


def get_filter_type(range_value, start_date, end_date):
    if start_date and end_date:
        return "custom"

    if not range_value or range_value == "all":
        return "all"

    range_value = range_value.lower()

    if range_value in ["today", "daily", "day"]:
        return "day"
    if range_value in ["7d", "week", "weekly"]:
        return "week"
    if range_value in ["30d", "month", "monthly"]:
        return "month"
    if range_value in ["year", "yearly"]:
        return "year"

    return "all"


def get_current_period(range_value, start_date, end_date):
    now = datetime.utcnow()

    if start_date and end_date:
        start = start_of_day(datetime.fromisoformat(start_date))
        end = end_of_day(datetime.fromisoformat(end_date))
        return start, end

    filter_type = get_filter_type(range_value, start_date, end_date)

    if filter_type == "day":
        return start_of_day(now), end_of_day(now)

    if filter_type == "week":
        start = start_of_day(now - timedelta(days=6))
        end = end_of_day(now)
        return start, end

    if filter_type == "month":
        start = start_of_day(now - timedelta(days=29))
        end = end_of_day(now)
        return start, end

    if filter_type == "year":
        start = start_of_day(now.replace(month=1, day=1))
        end = end_of_day(now)
        return start, end

    return None, None


def get_previous_period(range_value, start_date, end_date):
    current_start, current_end = get_current_period(range_value, start_date, end_date)
    filter_type = get_filter_type(range_value, start_date, end_date)

    if not current_start or not current_end or filter_type == "all":
        return None, None

    if filter_type == "day":
        prev_day = current_start - timedelta(days=1)
        return start_of_day(prev_day), end_of_day(prev_day)

    if filter_type == "week":
        prev_end = current_start - timedelta(microseconds=1)
        prev_start = start_of_day(current_start - timedelta(days=7))
        return prev_start, end_of_day(prev_end)

    if filter_type == "month":
        prev_end = current_start - timedelta(microseconds=1)
        prev_start = start_of_day(current_start - timedelta(days=30))
        return prev_start, end_of_day(prev_end)

    if filter_type == "year":
        previous_year = current_start.year - 1
        prev_start = datetime(previous_year, 1, 1, 0, 0, 0)
        prev_end = datetime(previous_year, 12, 31, 23, 59, 59, 999999)
        return prev_start, prev_end

    if filter_type == "custom":
        duration = current_end - current_start
        prev_end = current_start - timedelta(microseconds=1)
        prev_start = current_start - duration - timedelta(microseconds=1)
        prev_start = start_of_day(prev_start)
        prev_end = end_of_day(prev_end)
        return prev_start, prev_end

    return None, None


def get_comparison_unit(range_value, start_date, end_date):
    filter_type = get_filter_type(range_value, start_date, end_date)

    if filter_type == "day":
        return "day"
    if filter_type == "week":
        return "week"
    if filter_type == "month":
        return "month"
    if filter_type == "year":
        return "year"
    if filter_type == "custom":
        return "custom"

    return None


def apply_date_filter(query, model, range_value, start_date, end_date):
    period_start, period_end = get_current_period(range_value, start_date, end_date)

    if period_start and period_end:
        query = query.filter(
            model.created_at >= period_start,
            model.created_at <= period_end
        )

    return query


def is_filtered(range_value, start_date, end_date):
    return bool(
        (start_date and end_date) or
        (range_value and range_value.lower() != "all")
    )


def get_customer_insights_for_period(db: Session, restaurant_id: int, period_start: datetime, period_end: datetime):
    if not period_start or not period_end:
        return {
            "new_customers": 0,
            "returning_customers": 0
        }

    customer_first_orders = db.query(
        models.Order.customer_id,
        func.min(models.Order.created_at).label("first_order_at")
    ).filter(
        models.Order.restaurant_id == restaurant_id,
        models.Order.customer_id.isnot(None)
    ).group_by(
        models.Order.customer_id
    ).subquery()

    customers_in_period = db.query(
        models.Order.customer_id
    ).filter(
        models.Order.restaurant_id == restaurant_id,
        models.Order.customer_id.isnot(None),
        models.Order.created_at >= period_start,
        models.Order.created_at <= period_end
    ).distinct().subquery()

    new_customers = db.query(func.count()).select_from(
        customers_in_period
    ).join(
        customer_first_orders,
        customer_first_orders.c.customer_id == customers_in_period.c.customer_id
    ).filter(
        customer_first_orders.c.first_order_at >= period_start,
        customer_first_orders.c.first_order_at <= period_end
    ).scalar() or 0

    returning_customers = db.query(func.count()).select_from(
        customers_in_period
    ).join(
        customer_first_orders,
        customer_first_orders.c.customer_id == customers_in_period.c.customer_id
    ).filter(
        customer_first_orders.c.first_order_at < period_start
    ).scalar() or 0

    return {
        "new_customers": int(new_customers),
        "returning_customers": int(returning_customers)
    }


def get_sales_analytics(db: Session, restaurant_id: int, range, start_date, end_date):
    comparison_unit = get_comparison_unit(range, start_date, end_date)
    current_start, current_end = get_current_period(range, start_date, end_date)
    prev_start, prev_end = get_previous_period(range, start_date, end_date)
    show_period_insights = is_filtered(range, start_date, end_date)

    # =========================
    # BASE QUERIES
    # =========================
    completed_query = db.query(models.Order).filter(
        models.Order.restaurant_id == restaurant_id,
        models.Order.status == OrderStatus.completed
    )

    all_orders_query = db.query(models.Order).filter(
        models.Order.restaurant_id == restaurant_id
    )

    completed_query = apply_date_filter(
        completed_query, models.Order, range, start_date, end_date
    )
    all_orders_query = apply_date_filter(
        all_orders_query, models.Order, range, start_date, end_date
    )

    # =========================
    # SUMMARY
    # =========================
    total_orders = completed_query.count()

    total_revenue = completed_query.with_entities(
        func.sum(models.Order.total_amount)
    ).scalar() or 0

    avg_order_value = float(total_revenue) / total_orders if total_orders else 0

    # =========================
    # DAILY TREND
    # =========================
    revenue_data = completed_query.with_entities(
        func.date(models.Order.created_at),
        func.sum(models.Order.total_amount)
    ).group_by(
        func.date(models.Order.created_at)
    ).all()

    orders_data = all_orders_query.with_entities(
        func.date(models.Order.created_at),
        func.count(models.Order.order_id)
    ).group_by(
        func.date(models.Order.created_at)
    ).all()

    revenue_map = {str(d[0]): float(d[1] or 0) for d in revenue_data}
    orders_map = {str(d[0]): int(d[1]) for d in orders_data}

    all_dates = sorted(set(revenue_map.keys()) | set(orders_map.keys()))

    daily_trend = [
        {
            "date": date,
            "revenue": revenue_map.get(date, 0),
            "orders": orders_map.get(date, 0)
        }
        for date in all_dates
    ]

    # =========================
    # TOP SELLING ITEMS
    # =========================
    top_items_query = db.query(
        models.OrderItem.item_name,
        func.sum(models.OrderItem.quantity),
        func.sum(models.OrderItem.quantity * models.OrderItem.price_at_order)
    ).join(
        models.Order, models.Order.order_id == models.OrderItem.order_id
    ).filter(
        models.Order.restaurant_id == restaurant_id,
        models.Order.status == OrderStatus.completed
    )

    top_items_query = apply_date_filter(
        top_items_query, models.Order, range, start_date, end_date
    )

    top_items_data = top_items_query.group_by(
        models.OrderItem.item_name
    ).order_by(
        func.sum(models.OrderItem.quantity).desc()
    ).limit(5).all()

    top_selling_items = [
        {
            "item_name": i[0],
            "quantity_sold": int(i[1] or 0),
            "revenue": float(i[2] or 0)
        }
        for i in top_items_data
    ]

    # =========================
    # HOURLY TRAFFIC
    # =========================
    hourly_data = all_orders_query.with_entities(
        extract("hour", models.Order.created_at),
        func.count(models.Order.order_id)
    ).group_by(
        extract("hour", models.Order.created_at)
    ).all()

    hourly_traffic = [
        {
            "hour": int(h[0]),
            "orders": int(h[1])
        }
        for h in hourly_data
    ]

    # =========================
    # WEEKDAY TRENDS
    # =========================
    weekday_data = completed_query.with_entities(
        extract("dow", models.Order.created_at),
        func.sum(models.Order.total_amount),
        func.count(models.Order.order_id)
    ).group_by(
        extract("dow", models.Order.created_at)
    ).all()

    days_map = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    weekday_trends = [
        {
            "day": days_map[int(w[0])],
            "revenue": float(w[1] or 0),
            "orders": int(w[2] or 0)
        }
        for w in weekday_data
    ]

    # =========================
    # PAYMENT BREAKDOWN
    # =========================
    payment_data = all_orders_query.with_entities(
        models.Order.payment_method,
        func.count(models.Order.order_id),
        func.sum(models.Order.total_amount)
    ).group_by(
        models.Order.payment_method
    ).all()

    payment_breakdown = [
        {
            "payment_method": p[0] or "Unknown",
            "orders": int(p[1] or 0),
            "revenue": float(p[2] or 0)
        }
        for p in payment_data
    ]

    # =========================
    # GROWTH METRICS
    # =========================
    previous_orders = 0
    previous_revenue = 0.0
    revenue_change_percentage = 0.0
    orders_change_percentage = 0.0

    if show_period_insights and prev_start and prev_end:
        previous_completed_query = db.query(models.Order).filter(
            models.Order.restaurant_id == restaurant_id,
            models.Order.status == OrderStatus.completed,
            models.Order.created_at >= prev_start,
            models.Order.created_at <= prev_end
        )

        previous_orders = previous_completed_query.count()
        previous_revenue = previous_completed_query.with_entities(
            func.sum(models.Order.total_amount)
        ).scalar() or 0

        revenue_change_percentage = safe_percentage_change(total_revenue, previous_revenue)
        orders_change_percentage = safe_percentage_change(total_orders, previous_orders)

    growth_metrics = {
        "comparison_unit": comparison_unit,
        "current_revenue": float(total_revenue),
        "previous_revenue": float(previous_revenue),
        "revenue_change_percentage": float(revenue_change_percentage),
        "current_orders": int(total_orders),
        "previous_orders": int(previous_orders),
        "orders_change_percentage": float(orders_change_percentage)
    }

    # =========================
    # CUSTOMER INSIGHTS
    # =========================
    current_customer_metrics = {
        "new_customers": 0,
        "returning_customers": 0
    }
    previous_customer_metrics = {
        "new_customers": 0,
        "returning_customers": 0
    }

    if current_start and current_end:
        current_customer_metrics = get_customer_insights_for_period(
            db, restaurant_id, current_start, current_end
        )

    if show_period_insights and prev_start and prev_end:
        previous_customer_metrics = get_customer_insights_for_period(
            db, restaurant_id, prev_start, prev_end
        )

    customer_insights = {
        "comparison_unit": comparison_unit,
        "current_new_customers": int(current_customer_metrics["new_customers"]),
        "previous_new_customers": int(previous_customer_metrics["new_customers"]),
        "new_customers_change_percentage": float(
            safe_percentage_change(
                current_customer_metrics["new_customers"],
                previous_customer_metrics["new_customers"]
            )
        ),
        "current_returning_customers": int(current_customer_metrics["returning_customers"]),
        "previous_returning_customers": int(previous_customer_metrics["returning_customers"]),
        "returning_customers_change_percentage": float(
            safe_percentage_change(
                current_customer_metrics["returning_customers"],
                previous_customer_metrics["returning_customers"]
            )
        )
    }

    # =========================
    # CATEGORY PERFORMANCE
    # =========================
    category_query = db.query(
        models.Category.category_name,
        func.sum(models.OrderItem.quantity * models.OrderItem.price_at_order),
        func.count(models.Order.order_id)
    ).join(
        models.MenuItem, models.MenuItem.category_id == models.Category.category_id
    ).join(
        models.OrderItem, models.OrderItem.menu_item_id == models.MenuItem.menu_item_id
    ).join(
        models.Order, models.Order.order_id == models.OrderItem.order_id
    ).filter(
        models.Order.restaurant_id == restaurant_id,
        models.Order.status == OrderStatus.completed
    )

    category_query = apply_date_filter(
        category_query, models.Order, range, start_date, end_date
    )

    category_data = category_query.group_by(
        models.Category.category_name
    ).all()

    category_performance = [
        {
            "category_name": c[0],
            "revenue": float(c[1] or 0),
            "orders": int(c[2] or 0)
        }
        for c in category_data
    ]

    # =========================
    # LOW PERFORMING ITEMS
    # =========================
    low_items_query = db.query(
        models.OrderItem.item_name,
        func.sum(models.OrderItem.quantity)
    ).join(
        models.Order, models.Order.order_id == models.OrderItem.order_id
    ).filter(
        models.Order.restaurant_id == restaurant_id,
        models.Order.status == OrderStatus.completed
    )

    low_items_query = apply_date_filter(
        low_items_query, models.Order, range, start_date, end_date
    )

    low_items_data = low_items_query.group_by(
        models.OrderItem.item_name
    ).order_by(
        func.sum(models.OrderItem.quantity).asc()
    ).limit(5).all()

    low_performing_items = [
        {
            "item_name": i[0],
            "quantity_sold": int(i[1] or 0)
        }
        for i in low_items_data
    ]

    # =========================
    # FINAL RESPONSE
    # =========================
    return {
        "summary": {
            "total_orders": int(total_orders),
            "total_revenue": float(total_revenue),
            "avg_order_value": float(avg_order_value)
        },
        "daily_trend": daily_trend,
        "top_selling_items": top_selling_items,
        "hourly_traffic": hourly_traffic,
        "weekday_trends": weekday_trends,
        "payment_breakdown": payment_breakdown,
        "growth_metrics": growth_metrics,
        "customer_insights": customer_insights,
        "category_performance": category_performance,
        "low_performing_items": low_performing_items,
        "show_period_insights": show_period_insights
    }