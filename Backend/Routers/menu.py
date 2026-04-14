from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/menu_items", tags=["Menu"])


def get_user_restaurant(db: Session, restaurant_id: int, user_id: int):
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


def get_user_category(db: Session, category_id: int, restaurant_id: int):
    category = db.query(models.Category).filter(
        models.Category.category_id == category_id,
        models.Category.restaurant_id == restaurant_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found for this restaurant"
        )

    return category


def get_user_menu_item(db: Session, menu_item_id: int, user_id: int):
    menu_item = (
        db.query(models.MenuItem)
        .join(models.Restaurant, models.MenuItem.restaurant_id == models.Restaurant.restaurant_id)
        .filter(
            models.MenuItem.menu_item_id == menu_item_id,
            models.Restaurant.user_id == user_id
        )
        .first()
    )

    if not menu_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu Item not found"
        )

    return menu_item


@router.post("", response_model=schemas.MenuItemResponse)
def create_menuitem(
    menu_item: schemas.MenuItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    get_user_restaurant(db, menu_item.restaurant_id, current_user.user_id)
    get_user_category(db, menu_item.category_id, menu_item.restaurant_id)

    new_menu_item = models.MenuItem(**menu_item.model_dump())

    db.add(new_menu_item)
    db.commit()
    db.refresh(new_menu_item)

    return new_menu_item


@router.get("", response_model=list[schemas.MenuItemResponse])
def get_menuitem(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    menu_items = (
        db.query(models.MenuItem)
        .join(models.Restaurant, models.MenuItem.restaurant_id == models.Restaurant.restaurant_id)
        .filter(models.Restaurant.user_id == current_user.user_id)
        .all()
    )

    return menu_items


@router.put("/{menu_item_id}", response_model=schemas.MenuItemResponse)
def update_menu_item(
    menu_item_id: int,
    menu_item: schemas.MenuItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_item = get_user_menu_item(db, menu_item_id, current_user.user_id)

    updated_data = menu_item.model_dump(exclude_unset=True)

    if "category_id" in updated_data and updated_data["category_id"] is not None:
        get_user_category(db, updated_data["category_id"], db_item.restaurant_id)

    for key, value in updated_data.items():
        setattr(db_item, key, value)

    db.commit()
    db.refresh(db_item)

    return db_item


@router.delete("/{menu_item_id}")
def delete_menu_item(
    menu_item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_item = get_user_menu_item(db, menu_item_id, current_user.user_id)

    db.delete(db_item)
    db.commit()

    return {"message": "Menu Item deleted successfully"}


@router.get("/low_stock", response_model=list[schemas.MenuItemResponse])
def low_stock_items(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    items = (
        db.query(models.MenuItem)
        .join(models.Restaurant, models.MenuItem.restaurant_id == models.Restaurant.restaurant_id)
        .filter(
            models.Restaurant.user_id == current_user.user_id,
            models.MenuItem.stock < models.MenuItem.low_stock_threshold
        )
        .all()
    )

    return items