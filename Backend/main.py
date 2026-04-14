from fastapi import FastAPI
import models
from database import engine
from fastapi.middleware.cors import CORSMiddleware
from Routers import restaurant, category, menu, customer, order, order_item
from auth_routes import router as auth_router

models.Base.metadata.create_all(bind = engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://mini-restaurant-os.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(restaurant.router)
app.include_router(category.router)
app.include_router(menu.router)
app.include_router(customer.router)
app.include_router(order.router)
app.include_router(order_item.router)
app.include_router(auth_router)