from database import SessionLocal
from models import Restaurant

db = SessionLocal()

new_restaurant = Restaurant(
    restaurant_name="Test Restaurant"
)

db.add(new_restaurant)
db.commit()
db.refresh(new_restaurant)

restaurants = db.query(Restaurant).all()

for r in restaurants:
    print(r.restaurant_id, r.restaurant_name)

db.close()