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


def get_sales_analytics(db: Session, restaurant_id: int, range, start_date, end_date):

    # ✅ Base queries
    completed_query = db.query(models.Order).filter(
        models.Order.restaurant_id == restaurant_id,
        models.Order.status == OrderStatus.completed
    )

    all_orders_query = db.query(models.Order).filter(
        models.Order.restaurant_id == restaurant_id
    )

    completed_query = apply_date_filter(completed_query, models.Order, range, start_date, end_date)
    all_orders_query = apply_date_filter(all_orders_query, models.Order, range, start_date, end_date)

    # =========================
    # ✅ SUMMARY
    # =========================
    total_orders = completed_query.count()

    total_revenue = completed_query.with_entities(
        func.sum(models.Order.total_amount)
    ).scalar() or 0

    avg_order_value = float(total_revenue) / total_orders if total_orders else 0

    # =========================
    # ✅ DAILY TREND
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

    orders_map = {str(d[0]): d[1] for d in orders_data}

    daily_trend = [
        {
            "date": str(d[0]),
            "revenue": float(d[1] or 0),
            "orders": orders_map.get(str(d[0]), 0)
        }
        for d in revenue_data
    ]

    # =========================
    # 🔥 1. TOP SELLING ITEMS
    # =========================
    top_items_data = db.query(
        models.OrderItem.item_name,
        func.sum(models.OrderItem.quantity),
        func.sum(models.OrderItem.quantity * models.OrderItem.price_at_order)
    ).join(
        models.Order, models.Order.order_id == models.OrderItem.order_id
    ).filter(
        models.Order.restaurant_id == restaurant_id,
        models.Order.status == OrderStatus.completed
    )

    top_items_data = apply_date_filter(top_items_data, models.Order, range, start_date, end_date)

    top_items_data = top_items_data.group_by(
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
    # 🔥 2. HOURLY TRAFFIC
    # =========================
    hourly_data = all_orders_query.with_entities(
        extract('hour', models.Order.created_at),
        func.count(models.Order.order_id)
    ).group_by(
        extract('hour', models.Order.created_at)
    ).all()

    hourly_traffic = [
        {
            "hour": int(h[0]),
            "orders": h[1]
        }
        for h in hourly_data
    ]

    # =========================
    # 🔥 3. WEEKDAY TRENDS
    # =========================
    weekday_data = completed_query.with_entities(
        extract('dow', models.Order.created_at),
        func.sum(models.Order.total_amount),
        func.count(models.Order.order_id)
    ).group_by(
        extract('dow', models.Order.created_at)
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
    # 🔥 4. PAYMENT BREAKDOWN
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
    # ✅ FINAL RESPONSE
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
        "payment_breakdown": payment_breakdown
    }