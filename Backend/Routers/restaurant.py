from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
import models, schemas
from database import get_db
from schemas import OrderStatus
from datetime import datetime, timedelta
from services.analytics_service import get_sales_analytics

router = APIRouter(prefix= "/restaurants", tags = ["Restaurants"])


@router.post("", response_model= schemas.RestaurantResponse)
def create_restaurant(restaurant : schemas.RestaurantCreate, db : Session = Depends(get_db)):
    new_restaurant = models.Restaurant(**restaurant.dict())

    db.add(new_restaurant)
    db.commit()
    db.refresh(new_restaurant)

    return new_restaurant

@router.put("/{restaurant_id}", response_model= schemas.RestaurantResponse)
def update_restaurant(restaurant_id : int, restaurant : schemas.RestaurantUpdate, db : Session = Depends(get_db)):
    db_restaurant = db.query(models.Restaurant).filter(
        models.Restaurant.restaurant_id == restaurant_id
    ).first()

    if not db_restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    updated_data = restaurant.dict(exclude_unset=True)

    for key, value in updated_data.items():
        setattr(db_restaurant, key, value)

    db.commit()
    db.refresh(db_restaurant)

    return db_restaurant

@router.get("", response_model=list[schemas.RestaurantResponse])
def get_all_restaurants(db: Session = Depends(get_db)):
    restaurants = db.query(models.Restaurant).all()
    return restaurants

@router.get("/{restaurant_id}", response_model= schemas.RestaurantResponse)
def get_restaurant(restaurant_id : int, db : Session = Depends(get_db)):
    restaurant = db.query(models.Restaurant).filter(
        models.Restaurant.restaurant_id == restaurant_id
    ).first()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    return restaurant

@router.get("/{restaurant_id}/menu", response_model= list[schemas.MenuItemResponse])
def get_restaurant_menu(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(models.Restaurant).filter(
        models.Restaurant.restaurant_id == restaurant_id
    ).first()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    menu = db.query(models.MenuItem).filter(
        models.MenuItem.restaurant_id == restaurant_id,
        models.MenuItem.is_active == True
    ).all()

    return menu

@router.get("/{restaurant_id}/menu/{category_id}", response_model= list[schemas.MenuItemResponse])
def restaurant_menu_by_category(restaurant_id : int, category_id : int, db : Session = Depends(get_db)):
    restaurant = db.query(models.Restaurant).filter(
        models.Restaurant.restaurant_id == restaurant_id
    ).first()

    if not restaurant:
        raise HTTPException(status_code= 404, detail= "Restaurant not Found")

    menu_category = db.query(models.MenuItem).filter(
        models.MenuItem.restaurant_id == restaurant_id,
        models.MenuItem.category_id == category_id,
        models.MenuItem.is_active == True
    ).all()

    return menu_category

@router.get("/{restaurant_id}/sales", response_model=schemas.SalesAnalyticsResponse)
def get_sales(
    restaurant_id: int,
    range: str | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db)
):
    return get_sales_analytics(db, restaurant_id, range, start_date, end_date)

@router.get("/{restaurant_id}/categories")
def get_categories(restaurant_id: int, db: Session = Depends(get_db)):
    return db.query(models.Category).filter(
        models.Category.restaurant_id == restaurant_id
    ).all()