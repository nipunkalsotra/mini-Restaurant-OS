from sqlalchemy.orm import Session
from sqlalchemy import func
import models
from datetime import datetime, timedelta
from schemas import OrderStatus

def apply_date_filter(query, model, range, start_date, end_date):
    if start_date and end_date:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        end = end.replace(hour = 23, minute = 59, second = 59)

        query = query.filter(
            model.created_at >= start,
            model.created_at <= end
        )

    elif range:
        now  = datetime.utcnow()

        if range == "today":
            query = query.filter(func.date(model.created_at) == now.date())

        elif range == "7d":
            query = query.filter(model.created_at >= now - timedelta(days=7))

        elif range == "30d":
            query = query.filter(model.created_at >= now - timedelta(days=30))

    return query

def get_sales_analytics(db : Session, restaurant_id : int, range, start_date, end_date):
    query = db.query(models.Order).filter(
        models.Order.restaurant_id == restaurant_id,
        models.Order.status == OrderStatus.completed
    )

    query = apply_date_filter(query, models.Order, range, start_date, end_date)

    total_orders = query.count()
    total_revenue = query.with_entities(
        func.sum(models.Order.total_amount)
    ).scalar() or 0
    avg_order_value = float(total_revenue) / total_orders if total_orders else 0

    daily_data = query.with_entities(
        func.date(models.Order.created_at),
        func.sum(models.Order.total_amount),
        func.count(models.Order.order_id)
    ).group_by(
        func.date(models.Order.created_at)
    ).all()

    daily_trend = [
        {
            "date": str(d[0]),
            "revenue": float(d[1] or 0),
            "orders": d[2]
        }
        for d in daily_data
    ]

    return {
        "summary": {
            "total_orders": total_orders,
            "total_revenue": float(total_revenue),
            "avg_order_value": float(avg_order_value)
        },
        "daily_trend": daily_trend
    }