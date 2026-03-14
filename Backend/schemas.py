from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from enum import Enum

class RestaurantCreate(BaseModel):
    restaurant_name : str
    restaurant_phone : Optional[str] = None
    restaurant_email : Optional[str] = None
    password : Optional[str] = None

class RestaurantResponse(BaseModel):
    restaurant_id : int
    restaurant_name : str
    restaurant_phone : Optional[str] = None
    restaurant_email : Optional[str] = None
    created_at : datetime
    updated_at : datetime
    is_active : bool

    class Config:
        from_attributes = True


class CategoryCreate(BaseModel):
    restaurant_id : int
    category_name : str
    display_order : Optional[int] = None

class CategoryResponse(BaseModel):
    category_id : int
    restaurant_id : int
    category_name : str
    display_order : Optional[int] = None
    created_at : datetime
    updated_at : datetime

    class Config:
        from_attributes = True

class MenuItemCreate(BaseModel):
    restaurant_id : int
    category_id : int
    item_name : str
    item_price : float
    stock : Optional[int] = 0
    low_stock_threshold : Optional[int] = 5

class MenuItemResponse(BaseModel):
    menu_item_id : int
    restaurant_id : int
    category_id : int
    item_name : str
    item_price : float
    stock : int
    low_stock_threshold : int
    is_active : bool
    created_at : datetime
    updated_at : datetime

    class Config:
        from_attributes = True

class CustomerCreate(BaseModel):
    restaurant_id : int
    customer_name : str
    customer_phone : Optional[str] = None

class CustomerResponse(BaseModel):
    customer_id : int
    restaurant_id : int
    customer_name : str
    customer_phone : Optional[str] = None
    created_at : datetime

    class Config:
        from_attributes = True

class OrderStatus(str, Enum):
    pending = "pending"
    preparing = "preparing"
    completed = "completed"
    cancelled = "cancelled"

class PaymentMethod(str, Enum):
    cash = "cash"
    upi = "upi"
    card = "card"

class OrderItemCreateForOrder(BaseModel):
    menu_item_id : int
    quantity : int

class OrderCreate(BaseModel):
    restaurant_id : int
    customer_id : Optional[int] = None
    table_number : Optional[int] = None
    status : OrderStatus
    payment_method : PaymentMethod
    notes : Optional[str] = None
    items : List[OrderItemCreateForOrder]

class OrderResponse(BaseModel):
    order_id : int
    restaurant_id : int
    customer_id : Optional[int]= None
    table_number : Optional[int] = None
    total_amount : float
    status : OrderStatus
    payment_method : PaymentMethod
    notes : Optional[str] = None
    created_at : datetime
    updated_at : datetime

    class Config:
        from_attributes = True

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class OrderItemCreate(BaseModel):
    order_id : int
    menu_item_id : int
    item_name : str
    quantity : int
    price_at_order : float

class OrderItemResponse(BaseModel):
    order_item_id : int
    order_id : int
    menu_item_id : int
    item_name : str
    quantity : int
    price_at_order : float
    created_at : datetime
    updated_at : datetime

    class Config:
        from_attributes = True

class OrderDetailResponse(BaseModel):
        order: OrderResponse
        items: list[OrderItemResponse]

        class Config:
            from_attributes = True





    





