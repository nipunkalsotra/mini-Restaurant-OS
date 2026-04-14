from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/order_items", tags=["Order_Item"])


@router.get("", response_model=list[schemas.OrderItemResponse])
def get_orderitem(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    orderitems = (
        db.query(models.OrderItem)
        .join(models.Order, models.OrderItem.order_id == models.Order.order_id)
        .join(models.Restaurant, models.Order.restaurant_id == models.Restaurant.restaurant_id)
        .filter(models.Restaurant.user_id == current_user.user_id)
        .all()
    )

    return orderitems