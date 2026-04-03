from sqlalchemy.orm import Session
from sqlalchemy import func, extract
import models
from datetime import datetime, timedelta
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


def get_trend_bucket(filter_type):
    if filter_type == "day":
        return "hour"
    if filter_type == "week":
        return "day"
    if filter_type == "month":
        return "day"
    if filter_type == "year":
        return "month"
    if filter_type == "custom":
        return "day"
    return "day"


def format_trend_label(dt_value, bucket):
    if bucket == "hour":
        return dt_value.strftime("%H:00")
    if bucket == "month":
        return dt_value.strftime("%b %Y")
    return dt_value.strftime("%Y-%m-%d")


def get_bucket_start(dt_value, bucket):
    if bucket == "hour":
        return dt_value.replace(minute=0, second=0, microsecond=0)
    if bucket == "month":
        return dt_value.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return dt_value.replace(hour=0, minute=0, second=0, microsecond=0)


def build_trend_data(completed_orders, all_orders, bucket):
    revenue_map = {}
    orders_map = {}

    for order in completed_orders:
        bucket_start = get_bucket_start(order.created_at, bucket)
        revenue_map[bucket_start] = revenue_map.get(bucket_start, 0) + float(order.total_amount or 0)

    for order in all_orders:
        bucket_start = get_bucket_start(order.created_at, bucket)
        orders_map[bucket_start] = orders_map.get(bucket_start, 0) + 1

    all_buckets = sorted(set(revenue_map.keys()) | set(orders_map.keys()))

    return [
        {
            "date": format_trend_label(bucket_start, bucket),
            "revenue": round(revenue_map.get(bucket_start, 0), 2),
            "orders": int(orders_map.get(bucket_start, 0))
        }
        for bucket_start in all_buckets
    ]


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


def build_anomaly_flags(growth_metrics, customer_insights):
    flags = []

    revenue_change = growth_metrics.get("revenue_change_percentage", 0)
    orders_change = growth_metrics.get("orders_change_percentage", 0)
    new_customer_change = customer_insights.get("new_customers_change_percentage", 0)
    returning_customer_change = customer_insights.get("returning_customers_change_percentage", 0)

    if revenue_change <= -20:
        flags.append({
            "type": "danger",
            "title": "Revenue drop detected",
            "message": f"Revenue is down {abs(revenue_change):.2f}% versus previous period."
        })

    if orders_change <= -20:
        flags.append({
            "type": "warning",
            "title": "Orders declining",
            "message": f"Orders are down {abs(orders_change):.2f}% versus previous period."
        })

    if new_customer_change >= 25:
        flags.append({
            "type": "success",
            "title": "Customer acquisition spike",
            "message": f"New customers increased by {new_customer_change:.2f}%."
        })

    if returning_customer_change <= -20:
        flags.append({
            "type": "warning",
            "title": "Retention concern",
            "message": f"Returning customers are down {abs(returning_customer_change):.2f}%."
        })

    return flags


def build_top_insight(growth_metrics, customer_insights, top_selling_items, category_performance, payment_breakdown):
    top_item_name = top_selling_items[0]["item_name"] if top_selling_items else None
    top_item_qty = top_selling_items[0]["quantity_sold"] if top_selling_items else 0
    top_category_name = category_performance[0]["category_name"] if category_performance else None
    top_payment_method = None

    if payment_breakdown:
        top_payment = max(payment_breakdown, key=lambda x: x["revenue"])
        top_payment_method = top_payment["payment_method"]

    revenue_change = growth_metrics.get("revenue_change_percentage", 0)
    returning_customer_change = customer_insights.get("returning_customers_change_percentage", 0)

    if top_item_name and revenue_change > 0:
        return {
            "title": "Best performing item",
            "message": f"{top_item_name} led sales and revenue grew by {revenue_change:.2f}% this period.",
            "highlight": top_item_name,
            "metric": int(top_item_qty)
        }

    if top_category_name and returning_customer_change > 0:
        return {
            "title": "Retention bright spot",
            "message": f"Returning customers improved and {top_category_name} is the top category.",
            "highlight": top_category_name,
            "metric": round(returning_customer_change, 2)
        }

    if top_payment_method:
        return {
            "title": "Payment preference",
            "message": f"{top_payment_method} is the leading payment method in this period.",
            "highlight": top_payment_method,
            "metric": None
        }

    return {
        "title": "No major trend yet",
        "message": "Not enough data to generate a strong top insight for this period.",
        "highlight": None,
        "metric": None
    }


def build_insight_text(summary, growth_metrics, customer_insights, top_selling_items, category_performance, hourly_traffic, payment_breakdown):
    insights = []

    revenue_change = growth_metrics.get("revenue_change_percentage", 0)
    orders_change = growth_metrics.get("orders_change_percentage", 0)
    new_customer_change = customer_insights.get("new_customers_change_percentage", 0)
    returning_customer_change = customer_insights.get("returning_customers_change_percentage", 0)

    if revenue_change > 0:
        insights.append(f"Revenue increased by {revenue_change:.2f}% compared to the previous period.")
    elif revenue_change < 0:
        insights.append(f"Revenue decreased by {abs(revenue_change):.2f}% compared to the previous period.")
    else:
        insights.append("Revenue is flat versus the previous period.")

    if orders_change > 0:
        insights.append(f"Orders are up by {orders_change:.2f}%, showing stronger purchase activity.")
    elif orders_change < 0:
        insights.append(f"Orders are down by {abs(orders_change):.2f}%, so demand is softer than the previous period.")

    if new_customer_change > 0:
        insights.append(f"New customer acquisition improved by {new_customer_change:.2f}%.")
    elif new_customer_change < 0:
        insights.append(f"New customer acquisition fell by {abs(new_customer_change):.2f}%.")

    if returning_customer_change > 0:
        insights.append(f"Returning customer count improved by {returning_customer_change:.2f}%, which is a good retention sign.")
    elif returning_customer_change < 0:
        insights.append(f"Returning customer count dropped by {abs(returning_customer_change):.2f}%, suggesting a retention issue.")

    if top_selling_items:
        top_item = top_selling_items[0]
        insights.append(
            f"The best selling item is {top_item['item_name']} with {top_item['quantity_sold']} units sold."
        )

    if category_performance:
        best_category = max(category_performance, key=lambda x: x["revenue"])
        insights.append(
            f"The top category is {best_category['category_name']} with ₹{best_category['revenue']:.2f} in revenue."
        )

    if hourly_traffic:
        peak_hour = max(hourly_traffic, key=lambda x: x["orders"])
        insights.append(
            f"Peak traffic hour is {peak_hour['hour']}:00 with {peak_hour['orders']} orders."
        )

    if payment_breakdown:
        leading_payment = max(payment_breakdown, key=lambda x: x["revenue"])
        insights.append(
            f"{leading_payment['payment_method']} is the leading payment method by revenue."
        )

    if summary.get("avg_order_value", 0) > 0:
        insights.append(
            f"Average order value for this period is ₹{summary['avg_order_value']:.2f}."
        )

    return insights


def get_sales_analytics(db: Session, restaurant_id: int, range, start_date, end_date):
    filter_type = get_filter_type(range, start_date, end_date)
    trend_bucket = get_trend_bucket(filter_type)
    comparison_unit = get_comparison_unit(range, start_date, end_date)
    current_start, current_end = get_current_period(range, start_date, end_date)
    prev_start, prev_end = get_previous_period(range, start_date, end_date)
    show_period_insights = is_filtered(range, start_date, end_date)

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

    completed_orders_list = completed_query.all()
    all_orders_list = all_orders_query.all()

    total_orders = completed_query.count()

    total_revenue = completed_query.with_entities(
        func.sum(models.Order.total_amount)
    ).scalar() or 0

    avg_order_value = float(total_revenue) / total_orders if total_orders else 0

    daily_trend = build_trend_data(completed_orders_list, all_orders_list, trend_bucket)

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
    ).order_by(
        func.sum(models.OrderItem.quantity * models.OrderItem.price_at_order).desc()
    ).all()

    category_performance = [
        {
            "category_name": c[0],
            "revenue": float(c[1] or 0),
            "orders": int(c[2] or 0)
        }
        for c in category_data
    ]

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

    summary = {
        "total_orders": int(total_orders),
        "total_revenue": float(total_revenue),
        "avg_order_value": float(avg_order_value)
    }

    anomaly_flags = build_anomaly_flags(growth_metrics, customer_insights)
    top_insight = build_top_insight(
        growth_metrics,
        customer_insights,
        top_selling_items,
        category_performance,
        payment_breakdown
    )
    insight_text = build_insight_text(
        summary,
        growth_metrics,
        customer_insights,
        top_selling_items,
        category_performance,
        hourly_traffic,
        payment_breakdown
    )

    return {
        "summary": summary,
        "daily_trend": daily_trend,
        "trend_bucket": trend_bucket,
        "top_selling_items": top_selling_items,
        "hourly_traffic": hourly_traffic,
        "weekday_trends": weekday_trends,
        "payment_breakdown": payment_breakdown,
        "growth_metrics": growth_metrics,
        "customer_insights": customer_insights,
        "category_performance": category_performance,
        "low_performing_items": low_performing_items,
        "show_period_insights": show_period_insights,
        "anomaly_flags": anomaly_flags,
        "top_insight": top_insight,
        "insight_text": insight_text
    }