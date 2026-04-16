from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import random

import models
import schemas
from database import get_db
from auth import hash_password, authenticate_user, create_access_token


router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post(
    "/signup",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED
)
def signup(user_data: schemas.UserSignup, db: Session = Depends(get_db)):
    existing_user = (
        db.query(models.User)
        .filter(models.User.user_email == user_data.user_email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    new_user = models.User(
        user_name=user_data.user_name,
        user_email=user_data.user_email,
        password_hash=hash_password(user_data.password),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=schemas.Token)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, user_data.user_email, user_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(data={"sub": user.user_email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }