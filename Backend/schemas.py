from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from enum import Enum


class RestaurantCreate(BaseModel):
    restaurant_name: str
    restaurant_phone: Optional[str] = None
    restaurant_email: Optional[str] = None
    password: Optional[str] = None


class RestaurantResponse(BaseModel):
    restaurant_id: int
    restaurant_name: str
    restaurant_phone: Optional[str] = None
    restaurant_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class CategoryCreate(BaseModel):
    restaurant_id: int
    category_name: str
    display_order: Optional[int] = None


class CategoryResponse(BaseModel):
    category_id: int
    restaurant_id: int
    category_name: str
    display_order: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MenuItemCreate(BaseModel):
    restaurant_id: int
    category_id: int
    item_name: str
    item_price: float
    stock: Optional[int] = 0
    low_stock_threshold: Optional[int] = 5


class MenuItemResponse(BaseModel):
    menu_item_id: int
    restaurant_id: int
    category_id: int
    item_name: str
    item_price: float
    stock: int
    low_stock_threshold: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerCreate(BaseModel):
    restaurant_id: int
    customer_name: str
    customer_phone: Optional[str] = None


class CustomerResponse(BaseModel):
    customer_id: int
    restaurant_id: int
    customer_name: str
    customer_phone: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OrderStatus(str, Enum):
    pending = "pending"
    preparing = "preparing"
    ready = "ready"
    served = "served"
    completed = "completed"
    cancelled = "cancelled"


class PaymentMethod(str, Enum):
    na = "na"
    cash = "cash"
    upi = "upi"
    card = "card"


class PaymentStatus(str, Enum):
    unpaid = "unpaid"
    paid = "paid"


class OrderItemCreateForOrder(BaseModel):
    menu_item_id: int
    quantity: int


class OrderCreate(BaseModel):
    restaurant_id: int
    customer_id: Optional[int] = None
    table_number: Optional[int] = None
    status: OrderStatus
    payment_status: PaymentStatus
    payment_method: PaymentMethod
    notes: Optional[str] = None
    items: List[OrderItemCreateForOrder]


class OrderResponse(BaseModel):
    order_id: int
    restaurant_id: int
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    table_number: Optional[int] = None
    total_amount: float
    status: OrderStatus
    payment_status: PaymentStatus
    payment_method: PaymentMethod
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
    payment_method: Optional[PaymentMethod] = None

    customer_id: Optional[int] = None
    table_number: Optional[int] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class OrderItemCreate(BaseModel):
    order_id: int
    menu_item_id: int
    item_name: str
    quantity: int
    price_at_order: float


class OrderItemResponse(BaseModel):
    order_item_id: int
    order_id: int
    menu_item_id: int
    item_name: str
    quantity: int
    price_at_order: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderDetailResponse(BaseModel):
    order: OrderResponse
    items: list[OrderItemResponse]

    class Config:
        from_attributes = True


class SalesResponse(BaseModel):
    restaurant_id: int
    total_orders: int
    total_revenue: float
    status_counts: dict[str, int]


class SalesSummary(BaseModel):
    total_orders: int
    total_revenue: float
    avg_order_value: float


class DailyTrend(BaseModel):
    date: str
    revenue: float
    orders: int


class TopSellingItem(BaseModel):
    item_name: str
    quantity_sold: int
    revenue: float


class HourlyTrafficPoint(BaseModel):
    hour: int
    orders: int


class WeekdayTrendPoint(BaseModel):
    day: str
    revenue: float
    orders: int


class PaymentMethodBreakdown(BaseModel):
    payment_method: str
    orders: int
    revenue: float


class GrowthMetrics(BaseModel):
    comparison_unit: Optional[str] = None
    current_revenue: float
    previous_revenue: float
    revenue_change_percentage: float
    current_orders: int
    previous_orders: int
    orders_change_percentage: float


class CustomerInsights(BaseModel):
    comparison_unit: Optional[str] = None
    current_new_customers: int
    previous_new_customers: int
    new_customers_change_percentage: float
    current_returning_customers: int
    previous_returning_customers: int
    returning_customers_change_percentage: float


class CategoryPerformance(BaseModel):
    category_name: str
    revenue: float
    orders: int


class LowPerformingItem(BaseModel):
    item_name: str
    quantity_sold: int


class AnomalyFlag(BaseModel):
    type: str
    title: str
    message: str


class TopInsight(BaseModel):
    title: str
    message: str
    highlight: Optional[str] = None
    metric: Optional[float] = None


class SalesAnalyticsResponse(BaseModel):
    summary: SalesSummary
    daily_trend: list[DailyTrend]
    trend_bucket: str
    top_selling_items: list[TopSellingItem]
    hourly_traffic: list[HourlyTrafficPoint]
    weekday_trends: list[WeekdayTrendPoint]
    payment_breakdown: list[PaymentMethodBreakdown]
    show_period_insights: bool
    growth_metrics: GrowthMetrics
    customer_insights: CustomerInsights
    category_performance: list[CategoryPerformance]
    low_performing_items: list[LowPerformingItem]
    anomaly_flags: list[AnomalyFlag]
    top_insight: TopInsight
    insight_text: list[str]

class RestaurantUpdate(BaseModel):
    restaurant_name: Optional[str] = None
    restaurant_phone: Optional[str] = None
    restaurant_email: Optional[str] = None


class MenuItemUpdate(BaseModel):
    category_id: Optional[int] = None
    item_name: Optional[str] = None
    item_price: Optional[float] = None
    is_active: Optional[bool] = None


class CategoryUpdate(BaseModel):
    category_name: Optional[str] = None
    display_order: Optional[int] = None