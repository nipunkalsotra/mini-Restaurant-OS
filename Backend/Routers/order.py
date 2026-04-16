from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

import models
import schemas
from database import get_db
from schemas import OrderStatus, PaymentStatus
from auth import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])

def get_user_restaurant(db: Session, restaurant_id: int, user_id: int):
    restaurant = db.query(models.Restaurant).filter(
        models.Restaurant.restaurant_id == restaurant_id,
        models.Restaurant.user_id == user_id
    ).first()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    return restaurant


def get_user_order(db: Session, order_id: int, user_id: int):
    order = (
        db.query(models.Order)
        .join(models.Restaurant, models.Order.restaurant_id == models.Restaurant.restaurant_id)
        .filter(
            models.Order.order_id == order_id,
            models.Restaurant.user_id == user_id
        )
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return order

@router.post("", response_model=schemas.OrderDetailResponse)
def create_order(
    order: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    restaurant = get_user_restaurant(db, order.restaurant_id, current_user.user_id)

    new_order = models.Order(
        restaurant_id=order.restaurant_id,
        customer_id=order.customer_id,
        table_number=order.table_number,
        status=order.status,
        payment_status=order.payment_status,
        payment_method=order.payment_method,
        notes=order.notes,
        total_amount=0
    )

    try:
        db.add(new_order)
        db.flush()

        total_amount = 0

        for item in order.items:
            menu_item = db.query(models.MenuItem).filter(
                models.MenuItem.menu_item_id == item.menu_item_id
            ).first()

            if not menu_item:
                raise HTTPException(status_code=404, detail=f"Menu item {item.menu_item_id} not found")

            if menu_item.restaurant_id != order.restaurant_id:
                raise HTTPException(status_code=400, detail="Item does not belong to this restaurant")

            if not menu_item.is_active:
                raise HTTPException(status_code=400, detail="Item not available")

            item_total = menu_item.item_price * item.quantity
            total_amount += item_total

            db.add(models.OrderItem(
                order_id=new_order.order_id,
                menu_item_id=item.menu_item_id,
                item_name=menu_item.item_name,
                quantity=item.quantity,
                price_at_order=menu_item.item_price
            ))

        new_order.total_amount = total_amount
        db.commit()
        db.refresh(new_order)

        items = db.query(models.OrderItem).filter(
            models.OrderItem.order_id == new_order.order_id
        ).all()

        order_response = schemas.OrderResponse.model_validate(new_order)
        order_response.customer_name = new_order.customer.customer_name if new_order.customer else None

        return schemas.OrderDetailResponse(order=order_response, items=items)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/billing/pending", response_model=list[schemas.OrderDetailResponse])
def get_pending_billing_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    orders = (
        db.query(models.Order)
        .join(models.Restaurant, models.Order.restaurant_id == models.Restaurant.restaurant_id)
        .filter(
            models.Restaurant.user_id == current_user.user_id,
            models.Order.payment_status == PaymentStatus.unpaid,
            models.Order.status.notin_([OrderStatus.completed, OrderStatus.cancelled])
        )
        .order_by(models.Order.created_at.desc())
        .all()
    )

    response = []
    for order in orders:
        items = db.query(models.OrderItem).filter(
            models.OrderItem.order_id == order.order_id
        ).all()

        order_response = schemas.OrderResponse.from_orm(order)
        order_response.customer_name = order.customer.customer_name if order.customer else None

        response.append(
            schemas.OrderDetailResponse(order=order_response, items=items)
        )

    return response

@router.get("", response_model=list[schemas.OrderResponse])
def get_orders(
    range: str | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    status: OrderStatus | None = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = (
        db.query(models.Order)
        .join(models.Restaurant, models.Order.restaurant_id == models.Restaurant.restaurant_id)
        .filter(models.Restaurant.user_id == current_user.user_id)
    )

    if status:
        query = query.filter(models.Order.status == status)

    if start_date and end_date:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59)

        query = query.filter(
            models.Order.created_at >= start,
            models.Order.created_at <= end
        )

    elif range:
        now = datetime.utcnow()

        if range == "today":
            query = query.filter(func.date(models.Order.created_at) == now.date())

        elif range == "7d":
            query = query.filter(models.Order.created_at >= now - timedelta(days=7))

        elif range == "30d":
            query = query.filter(models.Order.created_at >= now - timedelta(days=30))

    orders = query.order_by(models.Order.created_at.desc()).all()

    for o in orders:
        o.customer_name = o.customer.customer_name if o.customer else None

    return [schemas.OrderResponse.from_orm(o) for o in orders]

@router.get("/kitchen", response_model=list[schemas.OrderDetailResponse])
def get_kitchen_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    orders = (
        db.query(models.Order)
        .join(models.Restaurant)
        .filter(
            models.Restaurant.user_id == current_user.user_id,
            models.Order.status.in_([
                OrderStatus.pending,
                OrderStatus.preparing,
                OrderStatus.ready
            ])
        )
        .all()
    )

    response = []
    for order in orders:
        items = db.query(models.OrderItem).filter(
            models.OrderItem.order_id == order.order_id
        ).all()

        order_response = schemas.OrderResponse.from_orm(order)
        order_response.customer_name = order.customer.customer_name if order.customer else None

        response.append(schemas.OrderDetailResponse(order=order_response, items=items))

    return response

@router.get("/{order_id}", response_model=schemas.OrderDetailResponse)
def get_order_by_id(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    order = get_user_order(db, order_id, current_user.user_id)

    items = db.query(models.OrderItem).filter(
        models.OrderItem.order_id == order_id
    ).all()

    order_response = schemas.OrderResponse.from_orm(order)
    order_response.customer_name = order.customer.customer_name if order.customer else None

    return schemas.OrderDetailResponse(order=order_response, items=items)

@router.put("/{order_id}", response_model=schemas.OrderResponse)
def update_order(
    order_id: int,
    order: schemas.OrderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_order = get_user_order(db, order_id, current_user.user_id)

    updated_data = order.model_dump(exclude_unset=True)

    for key, value in updated_data.items():
        setattr(db_order, key, value)

    db.commit()
    db.refresh(db_order)

    return schemas.OrderResponse.from_orm(db_order)