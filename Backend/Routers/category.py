from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import get_db

router = APIRouter(prefix= "/categories", tags = ["Categories"])

@router.post("", response_model= schemas.CategoryResponse)
def create_category(category : schemas.CategoryCreate, db : Session = Depends(get_db)):
    new_category = models.Category(**category.dict())

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category

@router.get("", response_model= list[schemas.CategoryResponse])
def get_category(db : Session = Depends(get_db)):
    categories = db.query(models.Category).all()
    return categories

@router.put("/{category_id}", response_model= schemas.CategoryResponse)
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

@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):

    db_category = db.query(models.Category).filter(
        models.Category.category_id == category_id
    ).first()

    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    db.delete(db_category)
    db.commit()

    return {"message": "Category deleted successfully"}