from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import get_db

router = APIRouter(prefix= "/customers", tags = ["Customers"])

@router.post("", response_model= schemas.CustomerResponse)
def create_customer(customer : schemas.CustomerCreate, db : Session = Depends(get_db)):
   new_customer = models.Customer(**customer.dict())

   db.add(new_customer)
   db.commit()
   db.refresh(new_customer)

   return new_customer

@router.get("", response_model= list[schemas.CustomerResponse])
def get_customer(db : Session = Depends(get_db)):
    customers = db.query(models.Customer).all()
    return customers

@router.get("/{customer_id}/orders", response_model= list[schemas.OrderResponse])
def customer_order(customer_id : int, db : Session = Depends(get_db)):
    orders = db.query(models.Order).filter(
        models.Order.customer_id == customer_id
    ).all()

    return orders