from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/customers", tags=["Customers"])


def get_user_restaurant(db: Session, restaurant_id: int, user_id: int):
    restaurant = db.query(models.Restaurant).filter(
        models.Restaurant.restaurant_id == restaurant_id,
        models.Restaurant.user_id == user_id
    ).first()

    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )

    return restaurant


def get_user_customer(db: Session, customer_id: int, user_id: int):
    customer = (
        db.query(models.Customer)
        .join(models.Restaurant, models.Customer.restaurant_id == models.Restaurant.restaurant_id)
        .filter(
            models.Customer.customer_id == customer_id,
            models.Restaurant.user_id == user_id
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    return customer


@router.post("", response_model=schemas.CustomerResponse)
def create_customer(
    customer: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    get_user_restaurant(db, customer.restaurant_id, current_user.user_id)

    new_customer = models.Customer(**customer.model_dump())

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    return new_customer


@router.get("", response_model=list[schemas.CustomerResponse])
def get_customer(
    range: str | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = (
        db.query(models.Customer)
        .join(models.Restaurant, models.Customer.restaurant_id == models.Restaurant.restaurant_id)
        .filter(models.Restaurant.user_id == current_user.user_id)
    )

    if start_date and end_date:
        try:
            start = datetime.fromisoformat(start_date)
            end = datetime.fromisoformat(end_date)
            end = end.replace(hour=23, minute=59, second=59)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")

        query = query.filter(
            models.Customer.created_at >= start,
            models.Customer.created_at <= end
        )

    elif range:
        now = datetime.now()

        if range == "today":
            today = now.date()
            query = query.filter(func.date(models.Customer.created_at) == today)

        elif range == "7d":
            query = query.filter(
                models.Customer.created_at >= now - timedelta(days=7)
            )

        elif range == "30d":
            query = query.filter(
                models.Customer.created_at >= now - timedelta(days=30)
            )

        elif range == "all":
            pass

    customers = query.order_by(models.Customer.created_at.desc()).all()
    return customers


@router.get("/{customer_id}/orders", response_model=list[schemas.OrderResponse])
def customer_order(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    customer = get_user_customer(db, customer_id, current_user.user_id)

    orders = db.query(models.Order).filter(
        models.Order.customer_id == customer.customer_id
    ).all()

    return orders