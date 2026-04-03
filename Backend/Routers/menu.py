from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import get_db

router = APIRouter(prefix= "/menu_items", tags= ["Menu"])

@router.post("", response_model= schemas.MenuItemResponse)
def create_menuitem(menu_item : schemas.MenuItemCreate, db : Session = Depends(get_db)):
    new_menu_item = models.MenuItem(**menu_item.dict())

    db.add(new_menu_item)
    db.commit()
    db.refresh(new_menu_item)

    return new_menu_item

@router.get("", response_model= list[schemas.MenuItemResponse])
def get_menuitem(db : Session = Depends(get_db)):
    menu_items = db.query(models.MenuItem).all()
    return menu_items

@router.put("/{menu_item_id}", response_model=schemas.MenuItemResponse)
def update_menu_item(menu_item_id: int, menu_item: schemas.MenuItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.MenuItem).filter(
        models.MenuItem.menu_item_id == menu_item_id
    ).first()

    if not db_item:
        raise HTTPException(status_code=404, detail="Menu Item not found")

    updated_data = menu_item.dict(exclude_unset=True)

    for key, value in updated_data.items():
        setattr(db_item, key, value)

    db.commit()
    db.refresh(db_item)

    return db_item

@router.delete("/{menu_item_id}")
def delete_menu_item(menu_item_id : int, db : Session = Depends(get_db)):
    db_item = db.query(models.MenuItem).filter(
        models.MenuItem.menu_item_id == menu_item_id
    ).first()

    if not db_item:
        raise HTTPException(status_code=404, detail="Menu Item not found")
    
    db.delete(db_item)
    db.commit()
    return {"message" : "Menu Item deleted successfully"}

@router.get("/low_stock", response_model= list[schemas.MenuItemResponse])
def low_stock_items(db : Session = Depends(get_db)):
    items = db.query(models.MenuItem).filter(
        models.MenuItem.stock < 5
    ).all()

    return items