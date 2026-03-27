from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import models, schemas
from database import get_db

router = APIRouter(prefix= "/order_items", tags= ["Order_Item"])

@router.get("", response_model= list[schemas.OrderItemResponse])
def get_orderitem(db : Session = Depends(get_db)):
    orderitems = db.query(models.OrderItem).all()
    return orderitems
