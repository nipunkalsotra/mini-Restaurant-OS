from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
import models
import schemas
from database import get_db, engine

models.Base.metadata.create_all(bind = engine)
app = FastAPI()

@app.post("/restaurants", response_model= schemas.RestaurantResponse)
def create_restaurant(restaurant : schemas.RestaurantCreate, db : Session = Depends(get_db)):
    new_restaurant = models.Restaurant(**restaurant.dict())

    db.add(new_restaurant)
    db.commit()
    db.refresh(new_restaurant)

    return new_restaurant

@app.get("/restaurants/{restaurant_id}", response_model= schemas.RestaurantResponse)
def get_restaurant(restaurant_id : int, db : Session = Depends(get_db)):
    restaurant = db.query(models.Restaurant).filter(
        models.Restaurant.restaurant_id == restaurant_id
    ).first()
    return restaurant

@app.post("/categories", response_model= schemas.CategoryResponse)
def create_category(category : schemas.CategoryCreate, db : Session = Depends(get_db)):
    new_category = models.Category(**category.dict())

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category

@app.get("/categories", response_model= list[schemas.CategoryResponse])
def get_category(db : Session = Depends(get_db)):
    categories = db.query(models.Category).all()
    return categories

@app.put("/categories/{category_id}", response_model= schemas.CategoryResponse)
def update_category(category_id : int, category : schemas.CategoryCreate, db : Session = Depends(get_db)):
    db_category = db.query(models.Category).filter(
        models.Category.category_id == category_id
    ).first()

    if not db_category:
        return {"error" : "Category not Found"}
    
    updated_category = category.dict()
    for key, value in updated_category.items():
        setattr(db_category, key, value)

    db.commit()
    db.refresh(db_category)

    return db_category

@app.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):

    db_category = db.query(models.Category).filter(
        models.Category.category_id == category_id
    ).first()

    if not db_category:
        return {"error": "Category not found"}

    db.delete(db_category)
    db.commit()

    return {"message": "Category deleted successfully"}

@app.post("/menu_items", response_model= schemas.MenuItemResponse)
def create_menuitem(menu_item : schemas.MenuItemCreate, db : Session = Depends(get_db)):
    new_menu_item = models.MenuItem(**menu_item.dict())

    db.add(new_menu_item)
    db.commit()
    db.refresh(new_menu_item)

    return new_menu_item

@app.get("/menu_items", response_model= list[schemas.MenuItemResponse])
def get_menuitem(db : Session = Depends(get_db)):
    menu_item = db.query(models.MenuItem).all()
    return menu_item

@app.put("/menu_items/{menu_item_id}", response_model= schemas.MenuItemResponse)
def update_menu_item(menu_item_id : int, menu_item : schemas.MenuItemCreate, db : Session = Depends(get_db)):
    db_item = db.query(models.MenuItem).filter(
        models.MenuItem.menu_item_id == menu_item_id
    ).first()

    if not db_item:
        return {"error" : "Menu Item not Found"}
    
    update_data = menu_item.dict()
    for key, value  in update_data.items():
        setattr(db_item, key, value)

    db.commit()
    db.refresh(db_item)

    return db_item

@app.delete("/menu_items/{menu_item_id}")
def delete_menu_item(menu_item_id : int, db : Session = Depends(get_db)):
    db_item = db.query(models.MenuItem).filter(
        models.MenuItem.menu_item_id == menu_item_id
    ).first()

    if not db_item:
        return {"error" : "Menu Item not Found"}
    
    db.delete(db_item)
    db.commit()
    return {"message" : "Menu Item deleted successfully"}

@app.post("/customers", response_model= schemas.CustomerResponse)
def create_customer(customer : schemas.CustomerCreate, db : Session = Depends(get_db)):
   new_customer = models.Customer(**customer.dict())

   db.add(new_customer)
   db.commit()
   db.refresh(new_customer)

   return new_customer

@app.get("/customers", response_model= list[schemas.CustomerResponse])
def get_customer(db : Session = Depends(get_db)):
    customer = db.query(models.Customer).all()
    return customer

@app.post("/orders", response_model= schemas.OrderResponse)
def create_order(order : schemas.OrderCreate, db : Session = Depends(get_db)):
   new_order = models.Order(**order.dict())

   db.add(new_order)
   db.commit()
   db.refresh(new_order)

   return new_order

@app.get("/orders", response_model= list[schemas.OrderResponse])
def get_order(db : Session = Depends(get_db)):
    order = db.query(models.Order).all()
    return order

@app.get("/orders/{order_id}", response_model=schemas.OrderResponse)
def get_order_by_id(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(
        models.Order.order_id == order_id
        ).first()
    return order

@app.put("/orders/{order_id}", response_model= schemas.OrderResponse)
def update_order(order_id : int, order : schemas.OrderCreate, db : Session = Depends(get_db)):
    db_order = db.query(models.Order).filter(
        models.Order.order_id == order_id
    ).first()

    if not db_order:
        return {"error" : "Order not Found"}
    
    updated_order = order.dict()
    for key, value in updated_order.items():
        setattr(db_order, key, value)

    db.commit()
    db.refresh(db_order)

    return db_order

@app.get("/order_items", response_model= list[schemas.OrderItemResponse])
def get_orderitem(db : Session = Depends(get_db)):
    orderitem = db.query(models.OrderItem).all()
    return orderitem



