from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
import models, schemas
from database import get_db
from datetime import datetime, timedelta

router = APIRouter(prefix= "/customers", tags = ["Customers"])

@router.post("", response_model= schemas.CustomerResponse)
def create_customer(customer : schemas.CustomerCreate, db : Session = Depends(get_db)):
   new_customer = models.Customer(**customer.dict())

   db.add(new_customer)
   db.commit()
   db.refresh(new_customer)

   return new_customer

@router.get("", response_model= list[schemas.CustomerResponse])
def get_customer(
    range: str | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Customer)

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
            pass  # no filter

    customers = query.order_by(models.Customer.created_at.desc()).all()
    return customers

@router.get("/{customer_id}/orders", response_model= list[schemas.OrderResponse])
def customer_order(customer_id : int, db : Session = Depends(get_db)):
    orders = db.query(models.Order).filter(
        models.Order.customer_id == customer_id
    ).all()

    return orders