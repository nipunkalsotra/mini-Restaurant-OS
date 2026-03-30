from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
import models, schemas
from database import get_db
from schemas import OrderStatus
from datetime import datetime, timedelta

router = APIRouter(prefix= "/restaurants", tags = ["Restaurants"])


@router.post("", response_model= schemas.RestaurantResponse)
def create_restaurant(restaurant : schemas.RestaurantCreate, db : Session = Depends(get_db)):
    new_restaurant = models.Restaurant(**restaurant.dict())

    db.add(new_restaurant)
    db.commit()
    db.refresh(new_restaurant)

    return new_restaurant

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

@router.get("/{restaurant_id}/sales", response_model=schemas.SalesResponse)
def get_sales(
    restaurant_id: int,
    range: str | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Order).filter(
        models.Order.restaurant_id == restaurant_id
    )

    if start_date and end_date:
        try:
            start = datetime.fromisoformat(start_date)
            end = datetime.fromisoformat(end_date)
            end = end.replace(hour=23, minute=59, second=59)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")

        query = query.filter(
            models.Order.created_at >= start,
            models.Order.created_at <= end
        )

    elif range:
        now = datetime.now()

        if range == "today":
            today = now.date()
            query = query.filter(func.date(models.Order.created_at) == today)

        elif range == "7d":
            query = query.filter(
                models.Order.created_at >= now - timedelta(days=7)
            )

        elif range == "30d":
            query = query.filter(
                models.Order.created_at >= now - timedelta(days=30)
            )

        elif range == "all":
            pass

    total_orders = query.filter(
        models.Order.status == OrderStatus.completed
    ).count()

    total_revenue = query.with_entities(
        func.sum(models.Order.total_amount)
    ).filter(
        models.Order.status == OrderStatus.completed
    ).scalar()

    status_counts = query.with_entities(
        models.Order.status,
        func.count(models.Order.order_id)
    ).group_by(models.Order.status).all()

    status_dict = {status.value: count for status, count in status_counts}

    return schemas.SalesResponse(
        restaurant_id=restaurant_id,
        total_orders=total_orders,
        total_revenue=total_revenue or 0,
        status_counts=status_dict
    )

@router.get("/{restaurant_id}/categories")
def get_categories(restaurant_id: int, db: Session = Depends(get_db)):
    return db.query(models.Category).filter(
        models.Category.restaurant_id == restaurant_id
    ).all()