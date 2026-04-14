from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import random

import models
import schemas
from database import get_db
from auth import hash_password, authenticate_user, create_access_token


router = APIRouter(prefix="/auth", tags=["Authentication"])


def create_sample_data_for_user(db: Session, user: models.User):
    existing_restaurant = (
        db.query(models.Restaurant)
        .filter(models.Restaurant.user_id == user.user_id)
        .first()
    )

    if existing_restaurant:
        return

    # ---------------------
    # RESTAURANTS
    # ---------------------
    restaurants = [
        models.Restaurant(
            user_id=user.user_id,
            restaurant_name="Spice Garden",
            restaurant_phone="9876543210",
            restaurant_email=f"spice_{user.user_id}@example.com",
            restaurant_address="12 MG Road, Bangalore",
            tax_rate=5.0,
            is_active=True,
        ),
        models.Restaurant(
            user_id=user.user_id,
            restaurant_name="Tandoori Palace",
            restaurant_phone="9876543211",
            restaurant_email=f"tandoori_{user.user_id}@example.com",
            restaurant_address="45 Residency Road, Bangalore",
            tax_rate=8.0,
            is_active=True,
        ),
        models.Restaurant(
            user_id=user.user_id,
            restaurant_name="Urban Bites",
            restaurant_phone="9876543212",
            restaurant_email=f"urban_{user.user_id}@example.com",
            restaurant_address="78 Indiranagar, Bangalore",
            tax_rate=10.0,
            is_active=True,
        ),
    ]

    db.add_all(restaurants)
    db.flush()

    # ---------------------
    # CATEGORIES
    # ---------------------
    category_names = ["Starters", "Main Course", "Drinks"]

    categories = []
    restaurant_categories = {}

    for restaurant in restaurants:
        restaurant_categories[restaurant.restaurant_id] = []

        for i, name in enumerate(category_names):
            category = models.Category(
                restaurant_id=restaurant.restaurant_id,
                category_name=name,
                display_order=i + 1,
            )
            categories.append(category)
            restaurant_categories[restaurant.restaurant_id].append(category)

    db.add_all(categories)
    db.flush()

    # ---------------------
    # MENU ITEMS
    # ---------------------
    menu_data = {
        "Starters": ["Paneer Tikka", "Spring Roll", "Veg Manchurian", "Chicken Tikka"],
        "Main Course": ["Butter Chicken", "Veg Biryani", "Chicken Biryani", "Dal Makhani", "Naan"],
        "Drinks": ["Cold Coffee", "Lassi", "Lemon Soda", "Masala Tea"],
    }

    menu_items = []
    restaurant_menu_items = {}

    for restaurant in restaurants:
        restaurant_menu_items[restaurant.restaurant_id] = []

        for category in restaurant_categories[restaurant.restaurant_id]:
            for item_name in menu_data[category.category_name]:
                item = models.MenuItem(
                    restaurant_id=restaurant.restaurant_id,
                    category_id=category.category_id,
                    item_name=item_name,
                    item_price=random.randint(80, 400),
                    stock=random.randint(20, 60),
                    low_stock_threshold=5,
                    is_active=True,
                )
                menu_items.append(item)
                restaurant_menu_items[restaurant.restaurant_id].append(item)

    db.add_all(menu_items)
    db.flush()

    # ---------------------
    # CUSTOMERS
    # ---------------------
    customers = []
    restaurant_customers = {}

    for restaurant in restaurants:
        restaurant_customers[restaurant.restaurant_id] = []

        for i in range(1, 8):
            customer = models.Customer(
                restaurant_id=restaurant.restaurant_id,
                customer_name=f"{restaurant.restaurant_name} Customer {i}",
                customer_phone=f"{user.user_id % 100:02d}{restaurant.restaurant_id % 100:02d}{i:06d}"
            )
            customers.append(customer)
            restaurant_customers[restaurant.restaurant_id].append(customer)

    db.add_all(customers)
    db.flush()

    # ---------------------
    # ORDERS
    # ---------------------
    statuses = [
        schemas.OrderStatus.pending,
        schemas.OrderStatus.preparing,
        schemas.OrderStatus.ready,
        schemas.OrderStatus.served,
        schemas.OrderStatus.completed,
    ]

    payment_methods = [
        schemas.PaymentMethod.cash,
        schemas.PaymentMethod.upi,
        schemas.PaymentMethod.card,
    ]

    payment_statuses = [
        schemas.PaymentStatus.paid,
        schemas.PaymentStatus.paid,
        schemas.PaymentStatus.paid,
        schemas.PaymentStatus.unpaid,
    ]

    orders = []

    for _ in range(50):
        restaurant = random.choice(restaurants)
        customer = random.choice(restaurant_customers[restaurant.restaurant_id])

        order = models.Order(
            restaurant_id=restaurant.restaurant_id,
            customer_id=customer.customer_id,
            table_number=random.randint(1, 15),
            payment_method=random.choice(payment_methods),
            payment_status=random.choice(payment_statuses),
            status=random.choice(statuses),
            total_amount=0,
        )

        db.add(order)
        db.flush()

        total = 0
        available_items = restaurant_menu_items[restaurant.restaurant_id]
        order_menu_items = random.sample(
            available_items,
            k=min(len(available_items), random.randint(1, 3))
        )

        for item in order_menu_items:
            quantity = random.randint(1, 3)

            order_item = models.OrderItem(
                order_id=order.order_id,
                menu_item_id=item.menu_item_id,
                item_name=item.item_name,
                quantity=quantity,
                price_at_order=item.item_price,
            )

            total += quantity * item.item_price
            db.add(order_item)

        order.total_amount = total
        orders.append(order)

    # ---------------------
    # KITCHEN TEST ORDERS
    # ---------------------
    restaurant_1 = restaurants[0]
    restaurant_1_items = restaurant_menu_items[restaurant_1.restaurant_id]
    restaurant_1_customers = restaurant_customers[restaurant_1.restaurant_id]

    pending_item = restaurant_1_items[0]
    preparing_item = restaurant_1_items[1]
    ready_item = restaurant_1_items[2]

    o1 = models.Order(
        restaurant_id=restaurant_1.restaurant_id,
        customer_id=restaurant_1_customers[0].customer_id,
        table_number=1,
        payment_method=schemas.PaymentMethod.cash,
        payment_status=schemas.PaymentStatus.paid,
        status=schemas.OrderStatus.pending,
        total_amount=pending_item.item_price,
    )

    o2 = models.Order(
        restaurant_id=restaurant_1.restaurant_id,
        customer_id=restaurant_1_customers[1].customer_id,
        table_number=2,
        payment_method=schemas.PaymentMethod.upi,
        payment_status=schemas.PaymentStatus.paid,
        status=schemas.OrderStatus.preparing,
        total_amount=preparing_item.item_price,
    )

    o3 = models.Order(
        restaurant_id=restaurant_1.restaurant_id,
        customer_id=restaurant_1_customers[2].customer_id,
        table_number=3,
        payment_method=schemas.PaymentMethod.card,
        payment_status=schemas.PaymentStatus.paid,
        status=schemas.OrderStatus.ready,
        total_amount=ready_item.item_price,
    )

    db.add_all([o1, o2, o3])
    db.flush()

    oi1 = models.OrderItem(
        order_id=o1.order_id,
        menu_item_id=pending_item.menu_item_id,
        item_name=pending_item.item_name,
        quantity=1,
        price_at_order=pending_item.item_price,
    )

    oi2 = models.OrderItem(
        order_id=o2.order_id,
        menu_item_id=preparing_item.menu_item_id,
        item_name=preparing_item.item_name,
        quantity=1,
        price_at_order=preparing_item.item_price,
    )

    oi3 = models.OrderItem(
        order_id=o3.order_id,
        menu_item_id=ready_item.menu_item_id,
        item_name=ready_item.item_name,
        quantity=1,
        price_at_order=ready_item.item_price,
    )

    db.add_all([oi1, oi2, oi3])
    db.commit()


@router.post(
    "/signup",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED
)
def signup(user_data: schemas.UserSignup, db: Session = Depends(get_db)):
    existing_user = (
        db.query(models.User)
        .filter(models.User.user_email == user_data.user_email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    new_user = models.User(
        user_name=user_data.user_name,
        user_email=user_data.user_email,
        password_hash=hash_password(user_data.password),
    )

    db.add(new_user)
    db.flush()

    create_sample_data_for_user(db, new_user)
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=schemas.Token)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, user_data.user_email, user_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(data={"sub": user.user_email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }