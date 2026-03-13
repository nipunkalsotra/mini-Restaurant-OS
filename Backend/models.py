from sqlalchemy import create_engine, Column, Integer, Text, DateTime, String, Float, Boolean, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
from database import Base


engine = create_engine("sqlite:///restaurant_os.db")

class Restaurant(Base):
    __tablename__ = "restaurants"

    restaurant_id = Column(Integer, primary_key= True)
    restaurant_name = Column(Text, nullable= False)
    restaurant_phone = Column(Text)
    restaurant_email = Column(Text, unique= True)
    password = Column(Text)
    created_at = Column(DateTime, default= datetime.utcnow, nullable= False)
    is_active = Column(Boolean, default= True)
    updated_at = Column(DateTime, default= datetime.utcnow, onupdate= datetime.utcnow)

    categories = relationship("Category", back_populates="restaurant", cascade= "all, delete-orphan")
    menu_items = relationship("MenuItem", back_populates="restaurant", cascade= "all, delete-orphan")
    customers = relationship("Customer", back_populates="restaurant", cascade= "all, delete-orphan")
    orders = relationship("Order", back_populates="restaurant", cascade= "all, delete-orphan")

    __table_args__ = (
        CheckConstraint("length(restaurant_phone) BETWEEN 10 AND 15", name = "rs_ph_ch"),
    )

class Category(Base):
    __tablename__ = "categories"

    category_id = Column(Integer, primary_key=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.restaurant_id", ondelete= "CASCADE"), nullable=False)
    category_name = Column(Text, nullable=False)
    display_order = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    restaurant = relationship("Restaurant", back_populates="categories")
    menu_items = relationship("MenuItem", back_populates="category", cascade= "all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("restaurant_id", "category_name", name = "rs_ct_uq"),
    )

class MenuItem(Base):
    __tablename__ = "menu_items"

    menu_item_id = Column(Integer, primary_key=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.restaurant_id", ondelete= "CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.category_id", ondelete= "CASCADE"), nullable=False)
    item_name = Column(Text, nullable=False)
    item_price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    low_stock_threshold = Column(Integer, default=5)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    restaurant = relationship("Restaurant", back_populates="menu_items")
    category = relationship("Category", back_populates="menu_items")
    order_items = relationship("OrderItem", back_populates="menu_item")

    __table_args__ = (
        UniqueConstraint("restaurant_id", "item_name", name = "rs_itnm_uq"),
        CheckConstraint("item_price >= 0", name = "check_price_neg"),
        CheckConstraint("stock >= 0", name = "stock_neg"),
        CheckConstraint("low_stock_threshold >= 0", name = "low_stock_threshold_neg"),
    )

class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(Integer, primary_key=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.restaurant_id", ondelete= "CASCADE"), nullable=False)
    customer_name = Column(Text, nullable=False)
    customer_phone = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    restaurant = relationship("Restaurant", back_populates="customers")
    orders = relationship("Order", back_populates="customer")

    __table_args__ = (
        UniqueConstraint("restaurant_id", "customer_phone", name = "rs_csph_uq"),
        CheckConstraint("length(customer_phone) BETWEEN 10 AND 15", name = "len_csph"),
    )

class Order(Base):
    __tablename__ = "orders"

    order_id = Column(Integer, primary_key=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.restaurant_id", ondelete= "CASCADE"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.customer_id", ondelete= "SET NULL"), nullable= True)
    table_number = Column(Integer)
    total_amount = Column(Float, default=0)
    status = Column(Text, default="pending")
    payment_method = Column(Text, nullable= False)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default= datetime.utcnow, onupdate= datetime.utcnow)

    restaurant = relationship("Restaurant", back_populates="orders")
    customer = relationship("Customer", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order")

    __table_args__ = (
        CheckConstraint("table_number >= 0", name = "tb_num_neg"),
        CheckConstraint("total_amount >= 0", name = "tt_amt_neg"),
        CheckConstraint("status IN ('pending', 'completed', 'cancelled', 'preparing')", name = "stt_ch"),
        CheckConstraint("payment_method IN ('cash', 'upi' ,'card')"),
    )

class OrderItem(Base):
    __tablename__ = "order_items"

    order_item_id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.menu_item_id"), nullable=False)
    item_name = Column(Text, nullable= False)
    quantity = Column(Integer)
    price_at_order = Column(Float, nullable=False)
    created_at = Column(DateTime, default= datetime.utcnow)
    updated_at = Column(DateTime, default= datetime.utcnow, onupdate= datetime.utcnow)

    order = relationship("Order", back_populates="order_items")
    menu_item = relationship("MenuItem", back_populates="order_items")

    __table_args__ = (
        UniqueConstraint("order_id", "menu_item_id", name = "od_mnit_uq"),
        CheckConstraint("quantity > 0", name = "qnt_neg"),
        CheckConstraint("price_at_order >= 0", name = "prc_od_neg"),
    )