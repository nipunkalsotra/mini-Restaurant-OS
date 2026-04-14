from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from services.analytics_service import get_sales_analytics
from auth import get_current_user

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])


def get_user_restaurant_or_404(
    db: Session,
    restaurant_id: int,
    user_id: int
):
    restaurant = db.query(models.Restaurant).filter(
        models.Restaurant.restaurant_id == restaurant_id,
        models.Restaurant.user_id == user_id
    ).first()

    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )

    return restaurant


@router.post("", response_model=schemas.RestaurantResponse)
def create_restaurant(
    restaurant: schemas.RestaurantCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if restaurant.tax_rate is not None and restaurant.tax_rate < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tax rate cannot be negative"
        )

    new_restaurant = models.Restaurant(
        **restaurant.model_dump(),
        user_id=current_user.user_id
    )

    db.add(new_restaurant)
    db.commit()
    db.refresh(new_restaurant)

    return new_restaurant


@router.put("/{restaurant_id}", response_model=schemas.RestaurantResponse)
def update_restaurant(
    restaurant_id: int,
    restaurant: schemas.RestaurantUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_restaurant = get_user_restaurant_or_404(
        db, restaurant_id, current_user.user_id
    )

    updated_data = restaurant.model_dump(exclude_unset=True)

    if "tax_rate" in updated_data and updated_data["tax_rate"] is not None:
        if updated_data["tax_rate"] < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tax rate cannot be negative"
            )

    for key, value in updated_data.items():
        setattr(db_restaurant, key, value)

    db.commit()
    db.refresh(db_restaurant)

    return db_restaurant


@router.get("", response_model=list[schemas.RestaurantResponse])
def get_all_restaurants(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    restaurants = db.query(models.Restaurant).filter(
        models.Restaurant.user_id == current_user.user_id
    ).all()

    return restaurants


@router.get("/{restaurant_id}", response_model=schemas.RestaurantResponse)
def get_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    restaurant = get_user_restaurant_or_404(
        db, restaurant_id, current_user.user_id
    )
    return restaurant


@router.get("/{restaurant_id}/menu", response_model=list[schemas.MenuItemResponse])
def get_restaurant_menu(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    get_user_restaurant_or_404(db, restaurant_id, current_user.user_id)

    menu = db.query(models.MenuItem).filter(
        models.MenuItem.restaurant_id == restaurant_id,
        models.MenuItem.is_active == True
    ).all()

    return menu


@router.get("/{restaurant_id}/menu/{category_id}", response_model=list[schemas.MenuItemResponse])
def restaurant_menu_by_category(
    restaurant_id: int,
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    get_user_restaurant_or_404(db, restaurant_id, current_user.user_id)

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
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    get_user_restaurant_or_404(db, restaurant_id, current_user.user_id)

    return get_sales_analytics(db, restaurant_id, range, start_date, end_date)


@router.get("/{restaurant_id}/categories", response_model=list[schemas.CategoryResponse])
def get_categories(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    get_user_restaurant_or_404(db, restaurant_id, current_user.user_id)

    return db.query(models.Category).filter(
        models.Category.restaurant_id == restaurant_id
    ).all()