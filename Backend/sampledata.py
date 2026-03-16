from database import SessionLocal, engine
import models
from schemas import OrderStatus
import random

models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ---------------------
# RESTAURANTS
# ---------------------

restaurants = [
    models.Restaurant(
        restaurant_name="Spice Garden",
        restaurant_phone="9876543210",
        restaurant_email="spice@example.com",
        password="123"
    ),
    models.Restaurant(
        restaurant_name="Tandoori Palace",
        restaurant_phone="9876543211",
        restaurant_email="tandoori@example.com",
        password="123"
    ),
    models.Restaurant(
        restaurant_name="Urban Bites",
        restaurant_phone="9876543212",
        restaurant_email="urban@example.com",
        password="123"
    )
]

db.add_all(restaurants)
db.commit()

# ---------------------
# CATEGORIES
# ---------------------

category_names = ["Starters", "Main Course", "Drinks"]

categories = []

for r in restaurants:
    for i, name in enumerate(category_names):
        categories.append(
            models.Category(
                restaurant_id=r.restaurant_id,
                category_name=name,
                display_order=i + 1
            )
        )

db.add_all(categories)
db.commit()

# ---------------------
# MENU ITEMS
# ---------------------

menu_names = [
    "Paneer Tikka","Spring Roll","Veg Manchurian","Butter Chicken",
    "Veg Biryani","Chicken Biryani","Dal Makhani","Naan",
    "Cold Coffee","Lassi","Lemon Soda","Masala Tea"
]

menu_items = []

for r in restaurants:
    for name in menu_names:
        menu_items.append(
            models.MenuItem(
                restaurant_id=r.restaurant_id,
                category_id=random.choice(categories).category_id,
                item_name=name + f" {r.restaurant_id}",
                item_price=random.randint(80, 400),
                stock=random.randint(20, 60)
            )
        )

db.add_all(menu_items)
db.commit()

# ---------------------
# CUSTOMERS
# ---------------------

customers = []

for i in range(1, 21):
    customers.append(
        models.Customer(
            restaurant_id=random.choice(restaurants).restaurant_id,
            customer_name=f"Customer {i}",
            customer_phone=f"99988877{i:02d}"
        )
    )

db.add_all(customers)
db.commit()

# ---------------------
# ORDERS
# ---------------------

statuses = [
    OrderStatus.pending,
    OrderStatus.preparing,
    OrderStatus.ready,
    OrderStatus.served,
    OrderStatus.completed
]

orders = []

for i in range(50):

    restaurant = random.choice(restaurants)

    order = models.Order(
        restaurant_id=restaurant.restaurant_id,
        customer_id=random.choice(customers).customer_id,
        table_number=random.randint(1,15),
        payment_method=random.choice(["cash","upi","card"]),
        status=random.choice(statuses),
        total_amount=0
    )

    db.add(order)
    db.flush()

    total = 0

    # pick UNIQUE items
    order_menu_items = random.sample(menu_items, random.randint(1,3))

    for item in order_menu_items:

        quantity = random.randint(1,3)

        order_item = models.OrderItem(
            order_id=order.order_id,
            menu_item_id=item.menu_item_id,
            item_name=item.item_name,
            quantity=quantity,
            price_at_order=item.item_price
        )

        total += quantity * item.item_price

        db.add(order_item)

    order.total_amount = total

    orders.append(order)

# kitchen test orders

o1 = models.Order(
    restaurant_id=1,
    customer_id=1,
    table_number=1,
    payment_method="cash",
    status=OrderStatus.pending,
    total_amount=220
)

o2 = models.Order(
    restaurant_id=1,
    customer_id=2,
    table_number=2,
    payment_method="upi",
    status=OrderStatus.preparing,
    total_amount=350
)

o3 = models.Order(
    restaurant_id=1,
    customer_id=3,
    table_number=3,
    payment_method="card",
    status=OrderStatus.ready,
    total_amount=250
)

db.add_all([o1, o2, o3])
db.commit()

oi1 = models.OrderItem(order_id=o1.order_id, menu_item_id=1, item_name="Paneer Tikka", quantity=1, price_at_order=220)
oi2 = models.OrderItem(order_id=o2.order_id, menu_item_id=3, item_name="Butter Chicken", quantity=1, price_at_order=350)
oi3 = models.OrderItem(order_id=o3.order_id, menu_item_id=4, item_name="Veg Biryani", quantity=1, price_at_order=250)

db.add_all([oi1, oi2, oi3])
db.commit()

db.commit()

print("Seed data inserted successfully!")