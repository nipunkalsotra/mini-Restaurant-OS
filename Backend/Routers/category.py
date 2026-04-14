from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/categories", tags=["Categories"])


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


def get_user_category(db: Session, category_id: int, user_id: int):
    category = (
        db.query(models.Category)
        .join(models.Restaurant, models.Category.restaurant_id == models.Restaurant.restaurant_id)
        .filter(
            models.Category.category_id == category_id,
            models.Restaurant.user_id == user_id
        )
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    return category


@router.post("", response_model=schemas.CategoryResponse)
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    get_user_restaurant(db, category.restaurant_id, current_user.user_id)

    new_category = models.Category(**category.model_dump())

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category


@router.get("", response_model=list[schemas.CategoryResponse])
def get_category(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    categories = (
        db.query(models.Category)
        .join(models.Restaurant, models.Category.restaurant_id == models.Restaurant.restaurant_id)
        .filter(models.Restaurant.user_id == current_user.user_id)
        .all()
    )

    return categories


@router.put("/{category_id}", response_model=schemas.CategoryResponse)
def update_category(
    category_id: int,
    category: schemas.CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_category = get_user_category(db, category_id, current_user.user_id)

    updated_data = category.model_dump(exclude_unset=True)

    for key, value in updated_data.items():
        setattr(db_category, key, value)

    db.commit()
    db.refresh(db_category)

    return db_category


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_category = get_user_category(db, category_id, current_user.user_id)

    db.delete(db_category)
    db.commit()

    return {"message": "Category deleted successfully"}