from database import SessionLocal, engine
import models
from schemas import OrderStatus
import random

models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # ---------------------
    # RESTAURANTS
    # ---------------------
    restaurants = [
        models.Restaurant(
            restaurant_name="Spice Garden",
            restaurant_phone="9876543210",
            restaurant_email="spice@example.com",
            password="123",
            restaurant_address="12 MG Road, Bangalore",
            tax_rate=5.0
        ),
        models.Restaurant(
            restaurant_name="Tandoori Palace",
            restaurant_phone="9876543211",
            restaurant_email="tandoori@example.com",
            password="123",
            restaurant_address="45 Residency Road, Bangalore",
            tax_rate=8.0
        ),
        models.Restaurant(
            restaurant_name="Urban Bites",
            restaurant_phone="9876543212",
            restaurant_email="urban@example.com",
            password="123",
            restaurant_address="78 Indiranagar, Bangalore",
            tax_rate=10.0
        )
    ]

    db.add_all(restaurants)
    db.commit()
    for r in restaurants:
        db.refresh(r)

    # ---------------------
    # CATEGORIES
    # ---------------------
    category_names = ["Starters", "Main Course", "Drinks"]

    categories = []
    restaurant_categories = {}

    for r in restaurants:
        restaurant_categories[r.restaurant_id] = []
        for i, name in enumerate(category_names):
            category = models.Category(
                restaurant_id=r.restaurant_id,
                category_name=name,
                display_order=i + 1
            )
            categories.append(category)
            restaurant_categories[r.restaurant_id].append(category)

    db.add_all(categories)
    db.commit()

    for c in categories:
        db.refresh(c)

    # ---------------------
    # MENU ITEMS
    # ---------------------
    menu_data = {
        "Starters": ["Paneer Tikka", "Spring Roll", "Veg Manchurian", "Chicken Tikka"],
        "Main Course": ["Butter Chicken", "Veg Biryani", "Chicken Biryani", "Dal Makhani", "Naan"],
        "Drinks": ["Cold Coffee", "Lassi", "Lemon Soda", "Masala Tea"]
    }

    menu_items = []
    restaurant_menu_items = {}

    for r in restaurants:
        restaurant_menu_items[r.restaurant_id] = []

        for category in restaurant_categories[r.restaurant_id]:
            for item_name in menu_data[category.category_name]:
                item = models.MenuItem(
                    restaurant_id=r.restaurant_id,
                    category_id=category.category_id,
                    item_name=item_name,
                    item_price=random.randint(80, 400),
                    stock=random.randint(20, 60)
                )
                menu_items.append(item)
                restaurant_menu_items[r.restaurant_id].append(item)

    db.add_all(menu_items)
    db.commit()

    for item in menu_items:
        db.refresh(item)

    # ---------------------
    # CUSTOMERS
    # ---------------------
    customers = []
    restaurant_customers = {}

    for r in restaurants:
        restaurant_customers[r.restaurant_id] = []
        for i in range(1, 8):  # 7 customers per restaurant
            customer = models.Customer(
                restaurant_id=r.restaurant_id,
                customer_name=f"{r.restaurant_name} Customer {i}",
                customer_phone=f"99988{r.restaurant_id}{i:04d}"
            )
            customers.append(customer)
            restaurant_customers[r.restaurant_id].append(customer)

    db.add_all(customers)
    db.commit()

    for customer in customers:
        db.refresh(customer)

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

    for _ in range(50):
        restaurant = random.choice(restaurants)

        # pick customer from SAME restaurant
        customer = random.choice(restaurant_customers[restaurant.restaurant_id])

        order = models.Order(
            restaurant_id=restaurant.restaurant_id,
            customer_id=customer.customer_id,
            table_number=random.randint(1, 15),
            payment_method=random.choice(["cash", "upi", "card"]),
            status=random.choice(statuses),
            total_amount=0
        )

        db.add(order)
        db.flush()

        total = 0

        # pick menu items from SAME restaurant
        available_items = restaurant_menu_items[restaurant.restaurant_id]
        order_menu_items = random.sample(available_items, random.randint(1, 3))

        for item in order_menu_items:
            quantity = random.randint(1, 3)

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

    db.commit()

    # ---------------------
    # KITCHEN TEST ORDERS
    # ---------------------
    restaurant_1_items = restaurant_menu_items[restaurants[0].restaurant_id]
    restaurant_1_customers = restaurant_customers[restaurants[0].restaurant_id]

    pending_item = restaurant_1_items[0]
    preparing_item = restaurant_1_items[1]
    ready_item = restaurant_1_items[2]

    o1 = models.Order(
        restaurant_id=restaurants[0].restaurant_id,
        customer_id=restaurant_1_customers[0].customer_id,
        table_number=1,
        payment_method="cash",
        status=OrderStatus.pending,
        total_amount=pending_item.item_price
    )

    o2 = models.Order(
        restaurant_id=restaurants[0].restaurant_id,
        customer_id=restaurant_1_customers[1].customer_id,
        table_number=2,
        payment_method="upi",
        status=OrderStatus.preparing,
        total_amount=preparing_item.item_price
    )

    o3 = models.Order(
        restaurant_id=restaurants[0].restaurant_id,
        customer_id=restaurant_1_customers[2].customer_id,
        table_number=3,
        payment_method="card",
        status=OrderStatus.ready,
        total_amount=ready_item.item_price
    )

    db.add_all([o1, o2, o3])
    db.commit()

    db.refresh(o1)
    db.refresh(o2)
    db.refresh(o3)

    oi1 = models.OrderItem(
        order_id=o1.order_id,
        menu_item_id=pending_item.menu_item_id,
        item_name=pending_item.item_name,
        quantity=1,
        price_at_order=pending_item.item_price
    )

    oi2 = models.OrderItem(
        order_id=o2.order_id,
        menu_item_id=preparing_item.menu_item_id,
        item_name=preparing_item.item_name,
        quantity=1,
        price_at_order=preparing_item.item_price
    )

    oi3 = models.OrderItem(
        order_id=o3.order_id,
        menu_item_id=ready_item.menu_item_id,
        item_name=ready_item.item_name,
        quantity=1,
        price_at_order=ready_item.item_price
    )

    db.add_all([oi1, oi2, oi3])
    db.commit()

    print("Seed data inserted successfully!")

except Exception as e:
    db.rollback()
    print("Error while seeding data:", e)

finally:
    db.close()