from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
import models, schemas
from database import get_db
from schemas import OrderStatus, PaymentStatus
from datetime import datetime, timedelta

router = APIRouter(prefix= "/orders", tags = ["Orders"])

@router.post("", response_model=schemas.OrderResponse)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    restaurant = db.query(models.Restaurant).filter(
        models.Restaurant.restaurant_id == order.restaurant_id
    ).first()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    new_order = models.Order(
        restaurant_id = order.restaurant_id,
        customer_id = order.customer_id,
        table_number = order.table_number,
        status = order.status,
        payment_status = order.payment_status,
        payment_method = order.payment_method,
        notes = order.notes,
        total_amount = 0
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
                raise HTTPException(status_code=404, detail="Menu Item not found")
            
            if not menu_item.is_active:
                raise HTTPException(status_code=400, detail="Menu Item is not Available")
            
            if menu_item.stock < item.quantity:
                raise HTTPException(status_code=400, detail= f"Not enough stock for {menu_item.item_name}")
            
            menu_item.stock -= item.quantity
            
            item_total = menu_item.item_price * item.quantity
            total_amount += item_total

            new_order_item = models.OrderItem(
                order_id = new_order.order_id,
                menu_item_id = item.menu_item_id,
                item_name = menu_item.item_name,
                quantity = item.quantity,
                price_at_order = menu_item.item_price
            )

            db.add(new_order_item)

        new_order.total_amount = total_amount
        db.commit()
        db.refresh(new_order)

        return schemas.OrderResponse.from_orm(new_order)
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Order creation failed")


@router.get("", response_model=list[schemas.OrderResponse])
def get_order(
    range: str | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    status: OrderStatus | None = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Order)

    if status:
        query = query.filter(models.Order.status == status)

    if start_date and end_date:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        end = end.replace(hour=23, minute=59, second=59)

        query = query.filter(
            models.Order.created_at >= start,
            models.Order.created_at <= end
        )

    elif range:
        now = datetime.utcnow()

        if range == "today":
            today = now.date()
            query = query.filter(func.date(models.Order.created_at) == today)

        elif range == "7d":
            query = query.filter(
                models.Order.created_at >= now - timedelta(days=7)
            )

        elif range == "30d":
            query = query.filter(
                models.Order.created_at >= now - timedelta(days=30)
            )

        elif range == "all":
            pass

    orders = query.order_by(models.Order.created_at.desc()).all()

    for order in orders:
        order.customer_name = order.customer.customer_name if order.customer else None

    return [schemas.OrderResponse.from_orm(o) for o in orders]

@router.get("/kitchen", response_model= list[schemas.OrderDetailResponse])
def  get_kitchen_orders(db : Session = Depends(get_db)):
    orders = db.query(models.Order).filter(
        models.Order.status.in_([
            OrderStatus.pending,
            OrderStatus.preparing,
            OrderStatus.ready
        ])
    ).order_by(models.Order.created_at).all()

    response = []
    for order in orders:
        order_items = db.query(models.OrderItem).filter(
            models.OrderItem.order_id == order.order_id
        ).all()

        order_response = schemas.OrderResponse.from_orm(order)
        order_response.customer_name = order.customer.customer_name if order.customer else None

        response.append(
            schemas.OrderDetailResponse(
                order=order_response,
                items=order_items
            )
        )
    return response

@router.get("/billing/pending", response_model= list[schemas.OrderDetailResponse])
def get_pending_billing_orders(db : Session = Depends(get_db)):
    pending_orders = db.query(models.Order).filter(
        models.Order.status == OrderStatus.served,
        models.Order.payment_status == PaymentStatus.unpaid
    ).order_by(
        models.Order.created_at.desc()
        ).all()

    response = []
    for order in pending_orders:
        order_items = db.query(models.OrderItem).filter(
            models.OrderItem.order_id == order.order_id
        ).all()

        order_response = schemas.OrderResponse.from_orm(order)
        order_response.customer_name = order.customer.customer_name if order.customer else None

        response.append(
            schemas.OrderDetailResponse(
                order = order_response,
                items = order_items
            )
        )

    return response or []

@router.get("/{order_id}", response_model= schemas.OrderDetailResponse)
def get_order_by_id(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(
        models.Order.order_id == order_id
        ).first()
    
    if not order:
        raise HTTPException(status_code= 404, detail= "Order not Found")
    
    order_items = db.query(models.OrderItem).filter(
        models.OrderItem.order_id == order_id
    ).all()

    order_response = schemas.OrderResponse.from_orm(order)
    order_response.customer_name = order.customer.customer_name if order.customer else None

    return schemas.OrderDetailResponse(
        order = order_response,
        items = order_items
    )

@router.put("/{order_id}", response_model=schemas.OrderResponse)
def update_order(order_id: int, order: schemas.OrderUpdate, db: Session = Depends(get_db)):

    db_order = db.query(models.Order).filter(
        models.Order.order_id == order_id
    ).first()

    if not db_order:
       raise HTTPException(status_code=404, detail="Order not found")
    
    ORDER_STATUS_TRANSITIONS = {
        OrderStatus.pending : [OrderStatus.preparing, OrderStatus.cancelled],
        OrderStatus.preparing : [OrderStatus.ready],
        OrderStatus.ready : [OrderStatus.served],
        OrderStatus.served : [OrderStatus.completed],
        OrderStatus.completed : [],
        OrderStatus.cancelled : []
    }

    PAYMENT_STATUS_TRANSITIONS = {
        PaymentStatus.unpaid : [PaymentStatus.paid],
        PaymentStatus.paid : []
    }

    if order.status:
        current_status = db_order.status
        new_status = order.status

        if new_status not in ORDER_STATUS_TRANSITIONS[current_status]:
            raise HTTPException(status_code= 400, detail= f"Invalid status transition from {current_status} to {new_status}")
        
    if order.payment_status:
        current_status = db_order.payment_status
        new_status = order.payment_status
        if new_status not in PAYMENT_STATUS_TRANSITIONS[current_status]:
            raise HTTPException(status_code= 400, detail= f"Invalid status transition from {current_status} to {new_status}")

    if order.status == OrderStatus.cancelled and db_order.status != OrderStatus.cancelled:
        order_items = db.query(models.OrderItem).filter(
            models.OrderItem.order_id == order_id
        ).all()

        for item in order_items:
            menu_item = db.query(models.MenuItem).filter(
                models.MenuItem.menu_item_id == item.menu_item_id
            ).first()

            if menu_item:
                menu_item.stock += item.quantity

    updated_order = order.dict(exclude_unset=True)
    for key, value in updated_order.items():
        setattr(db_order, key, value)

    if db_order.status == OrderStatus.served and db_order.payment_status == PaymentStatus.paid:
        db_order.status = OrderStatus.completed

    db.commit()
    db.refresh(db_order)

    return schemas.OrderResponse.from_orm(db_order)

@router.get("/filter", response_model= list[schemas.OrderResponse])
def get_order_history(status : OrderStatus | None = None, db : Session = Depends(get_db)):
    query = db.query(models.Order)

    if status:
        query = query.filter(
            models.Order.status == status
        )

    return query.all()
