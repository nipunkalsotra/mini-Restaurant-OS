from sqlalchemy.orm import Session
from sqlalchemy import func, extract
import models
from datetime import datetime, timedelta
from schemas import OrderStatus


def apply_date_filter(query, model, range, start_date, end_date):
    if start_date and end_date:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        end = end.replace(hour=23, minute=59, second=59)

        query = query.filter(
            model.created_at >= start,
            model.created_at <= end
        )

    elif range:
        now = datetime.utcnow()

        if range == "today":
            query = query.filter(func.date(model.created_at) == now.date())

        elif range == "7d":
            query = query.filter(model.created_at >= now - timedelta(days=7))

        elif range == "30d":
            query = query.filter(model.created_at >= now - timedelta(days=30))

    return query


def get_previous_period(range, start_date, end_date):
    if start_date and end_date:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        duration = end - start
        prev_end = start - timedelta(days=1)
        prev_start = prev_end - duration
        prev_start = prev_start.replace(hour=0, minute=0, second=0)
        prev_end = prev_end.replace(hour=23, minute=59, second=59)
        return prev_start, prev_end

    now = datetime.utcnow()

    if range == "today":
        prev_day = now - timedelta(days=1)
        prev_start = prev_day.replace(hour=0, minute=0, second=0)
        prev_end = prev_day.replace(hour=23, minute=59, second=59)
        return prev_start, prev_end

    if range == "7d":
        prev_end = now - timedelta(days=7)
        prev_start = prev_end - timedelta(days=7)
        return prev_start, prev_end

    if range == "30d":
        prev_end = now - timedelta(days=30)
        prev_start = prev_end - timedelta(days=30)
        return prev_start, prev_end

    return None, None

def is_single_day_filter(range, start_date, end_date):
    if start_date and end_date:
        start = datetime.fromisoformat(start_date).date()
        end = datetime.fromisoformat(end_date).date()
        return start == end

    if range == "today":
        return True

    return False


def get_sales_analytics(db: Session, restaurant_id: int, range, start_date, end_date):

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
    orders_map = {str(d[0]): d[1] for d in orders_data}

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
    # PHASE 2 - TOP SELLING ITEMS
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
            "quantity_sold": int(i[1]),
            "revenue": float(i[2] or 0)
        }
        for i in top_items_data
    ]

    # =========================
    # PHASE 2 - HOURLY TRAFFIC
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
            "orders": h[1]
        }
        for h in hourly_data
    ]

    # =========================
    # PHASE 2 - WEEKDAY TRENDS
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
            "orders": w[2]
        }
        for w in weekday_data
    ]

    # =========================
    # PHASE 2 - PAYMENT BREAKDOWN
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
            "orders": p[1],
            "revenue": float(p[2] or 0)
        }
        for p in payment_data
    ]

       # =========================
    # PHASE 3 - GROWTH METRICS
    # =========================
    show_period_insights = not is_single_day_filter(range, start_date, end_date)
    prev_start, prev_end = get_previous_period(range, start_date, end_date)

    previous_completed_query = db.query(models.Order).filter(
        models.Order.restaurant_id == restaurant_id,
        models.Order.status == OrderStatus.completed
    )

    previous_orders = 0
    previous_revenue = 0
    revenue_change_percentage = 0
    orders_change_percentage = 0

    if prev_start and prev_end:
        previous_completed_query = previous_completed_query.filter(
            models.Order.created_at >= prev_start,
            models.Order.created_at <= prev_end
        )

        previous_orders = previous_completed_query.count()
        previous_revenue = previous_completed_query.with_entities(
            func.sum(models.Order.total_amount)
        ).scalar() or 0

        if previous_revenue == 0:
            revenue_change_percentage = 100 if total_revenue > 0 else 0
        else:
            revenue_change_percentage = (
                (total_revenue - previous_revenue) / previous_revenue
            ) * 100

        if previous_orders == 0:
            orders_change_percentage = 100 if total_orders > 0 else 0
        else:
            orders_change_percentage = (
                (total_orders - previous_orders) / previous_orders
            ) * 100

    growth_metrics = {
        "revenue_change_percentage": float(revenue_change_percentage),
        "orders_change_percentage": float(orders_change_percentage)
    }

    # =========================
    # PHASE 3 - CUSTOMER INSIGHTS
    # =========================
    customer_orders_query = db.query(
        models.Order.customer_id,
        func.count(models.Order.order_id)
    ).filter(
        models.Order.restaurant_id == restaurant_id,
        models.Order.customer_id.isnot(None)
    )

    customer_orders_query = apply_date_filter(
        customer_orders_query, models.Order, range, start_date, end_date
    )

    customer_orders_data = customer_orders_query.group_by(
        models.Order.customer_id
    ).all()

    new_customers = sum(1 for c in customer_orders_data if c[1] == 1)
    returning_customers = sum(1 for c in customer_orders_data if c[1] > 1)

    customer_insights = {
        "new_customers": new_customers,
        "returning_customers": returning_customers
    }

    # =========================
    # PHASE 3 - CATEGORY PERFORMANCE
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
            "orders": c[2]
        }
        for c in category_data
    ]

    # =========================
    # PHASE 3 - LOW PERFORMING ITEMS
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
            "quantity_sold": int(i[1])
        }
        for i in low_items_data
    ]

    # =========================
    # FINAL RESPONSE
    # =========================
    return {
        "summary": {
            "total_orders": total_orders,
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
        "show_period_insights" : show_period_insights
    }