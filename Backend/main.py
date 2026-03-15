from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models
import schemas
from schemas import OrderStatus
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

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    return restaurant

@app.get("/restaurants/{restaurant_id}/menu", response_model= list[schemas.MenuItemResponse])
def get_restaurant_menu(restaurant_id: int, db: Session = Depends(get_db)):

    menu = db.query(models.MenuItem).filter(
        models.MenuItem.restaurant_id == restaurant_id,
        models.MenuItem.is_active == True
    ).all()

    return menu

@app.get("/restaurants/{restaurant_id}/menu/{category_id}")
def restaurant_menu_by_category(restaurant_id : int, category_id : int, db : Session = Depends(get_db)):
    menu_category = db.query(models.MenuItem).filter(
        models.MenuItem.restaurant_id == restaurant_id,
        models.MenuItem.category_id == category_id,
        models.MenuItem.is_active == True
    ).all()

    return menu_category

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
        raise HTTPException(status_code=404, detail="Category not found")
    
    for key, value in category.dict().items():
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
        raise HTTPException(status_code=404, detail="Category not found")

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
    menu_items = db.query(models.MenuItem).all()
    return menu_items

@app.put("/menu_items/{menu_item_id}", response_model= schemas.MenuItemResponse)
def update_menu_item(menu_item_id : int, menu_item : schemas.MenuItemCreate, db : Session = Depends(get_db)):
    db_item = db.query(models.MenuItem).filter(
        models.MenuItem.menu_item_id == menu_item_id
    ).first()

    if not db_item:
        raise HTTPException(status_code=404, detail="Menu Item not found")
    
    for key, value  in menu_item.dict().items():
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
        raise HTTPException(status_code=404, detail="Menu Item not found")
    
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
    customers = db.query(models.Customer).all()
    return customers

@app.get("/customers/{customer_id}/orders")
def customer_order(customer_id : int, db : Session = Depends(get_db)):
    orders = db.query(models.Order).filter(
        models.Order.customer_id == customer_id
    ).all()

    return orders

@app.post("/orders", response_model=schemas.OrderResponse)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    restaurant = db.query(models.Restaurant).filter(
        models.Restaurant.restaurant_id == order.restaurant_id
    ).first()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    new_order = models.Order(
        restaurant_id = order.restaurant_id,
        customer_id = order.customer_id,
        table_number = order.table_number,
        status = order.status,
        payment_method = order.payment_method,
        notes = order.notes,
        total_amount = 0
    )

    try:
        db.add(new_order)
        db.flush()

        total_amount = 0
        for item in order.items:
            menu_item = db.query(models.MenuItem).filter(
                models.MenuItem.menu_item_id == item.menu_item_id
            ).first()

            if not menu_item:
                raise HTTPException(status_code=404, detail="Menu Item not found")
            
            if not menu_item.is_active:
                raise HTTPException(status_code=400, detail="Menu Item is not Available")
            
            if menu_item.stock < item.quantity:
                raise HTTPException(status_code=400, detail= f"Not enough stock for {menu_item.item_name}")
            
            menu_item.stock -= item.quantity
            
            item_total = menu_item.item_price * item.quantity
            total_amount += item_total

            new_order_item = models.OrderItem(
                order_id = new_order.order_id,
                menu_item_id = item.menu_item_id,
                item_name = menu_item.item_name,
                quantity = item.quantity,
                price_at_order = menu_item.item_price
            )

            db.add(new_order_item)

        new_order.total_amount = total_amount
        db.commit()
        db.refresh(new_order)

        return new_order
    
    except:
        db.rollback()
        raise


@app.get("/orders", response_model= list[schemas.OrderResponse])
def get_order(db : Session = Depends(get_db)):
    orders = db.query(models.Order).all()
    return orders

@app.get("/orders/{order_id}", response_model= schemas.OrderDetailResponse)
def get_order_by_id(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(
        models.Order.order_id == order_id
        ).first()
    
    if not order:
        raise HTTPException(status_code= 404, detail= "Order not Found")
    
    order_items = db.query(models.OrderItem).filter(
        models.OrderItem.order_id == order_id
    ).all()

    return {
        "order" : order,
        "items" : order_items
    }

@app.put("/orders/{order_id}", response_model=schemas.OrderResponse)
def update_order(order_id: int, order: schemas.OrderUpdate, db: Session = Depends(get_db)):

    db_order = db.query(models.Order).filter(
        models.Order.order_id == order_id
    ).first()

    if not db_order:
       raise HTTPException(status_code=404, detail="Order not found")
    
    ORDER_STATUS_TRANSITIONS = {
        OrderStatus.pending : [OrderStatus.preparing, OrderStatus.cancelled],
        OrderStatus.preparing : [OrderStatus.ready, OrderStatus.cancelled],
        OrderStatus.ready : [OrderStatus.served],
        OrderStatus.served : [OrderStatus.completed],
        OrderStatus.completed : [],
        OrderStatus.cancelled : []
    }

    if order.status:
        current_status = db_order.status
        new_status = order.status

        if new_status not in ORDER_STATUS_TRANSITIONS[current_status]:
            raise HTTPException(status_code= 400, detail= f"Invalid status transition from {current_status} to {new_status}")
        
    if order.status == OrderStatus.cancelled and db_order.status != OrderStatus.cancelled:
        order_items = db.query(models.OrderItem).filter(
            models.OrderItem.order_id == order_id
        ).all()

        for item in order_items:
            menu_item = db.query(models.MenuItem).filter(
                models.MenuItem.menu_item_id == item.menu_item_id
            ).first()

            if menu_item:
                menu_item.stock += item.quantity

    updated_order = order.dict(exclude_unset=True)
    for key, value in updated_order.items():
        setattr(db_order, key, value)

    db.commit()
    db.refresh(db_order)

    return db_order

@app.get("/orders/kitchen")
def  get_kitchen_orders(db : Session = Depends(get_db)):
    orders = db.query(models.Order).filter(
        models.Order.status.in_([
            OrderStatus.pending,
            OrderStatus.preparing,
            OrderStatus.ready
        ]).all()
    )

    return orders

@app.get("/order_items", response_model= list[schemas.OrderItemResponse])
def get_orderitem(db : Session = Depends(get_db)):
    orderitems = db.query(models.OrderItem).all()
    return orderitems



