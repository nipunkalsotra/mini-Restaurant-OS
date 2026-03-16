from datetime import datetime
from models import Restaurant, Category, MenuItem
from database import get_db
from sqlalchemy.orm import Session

def main():
    db: Session = next(get_db())

    # Step 1: Sample Restaurants
    restaurant1 = Restaurant(restaurant_name="Tasty Bites")
    restaurant2 = Restaurant(restaurant_name="Foodies Hub")
    db.add_all([restaurant1, restaurant2])
    db.commit()
    db.refresh(restaurant1)
    db.refresh(restaurant2)

    # Step 2: Sample Categories
    category1 = Category(category_name="Pizza", restaurant_id=restaurant1.restaurant_id)
    category2 = Category(category_name="Burgers", restaurant_id=restaurant1.restaurant_id)
    category3 = Category(category_name="Snacks", restaurant_id=restaurant2.restaurant_id)
    db.add_all([category1, category2, category3])
    db.commit()
    db.refresh(category1)
    db.refresh(category2)
    db.refresh(category3)

    # Step 3: Sample Menu Items
    menu_items = [
        MenuItem(
            restaurant_id=restaurant1.restaurant_id,
            category_id=category1.category_id,
            item_name="Margherita Pizza",
            item_price=10.0,
            stock=20
        ),
        MenuItem(
            restaurant_id=restaurant1.restaurant_id,
            category_id=category2.category_id,
            item_name="Veg Burger",
            item_price=7.5,
            stock=15
        ),
        MenuItem(
            restaurant_id=restaurant2.restaurant_id,
            category_id=category3.category_id,
            item_name="French Fries",
            item_price=3.5,
            stock=30
        )
    ]
    db.add_all(menu_items)
    db.commit()
    db.close()
    print("Sample data inserted successfully!")

if __name__ == "__main__":
    main()