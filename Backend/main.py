from fastapi import FastAPI
import models
from database import engine
from fastapi.middleware.cors import CORSMiddleware
from Routers import restaurant, category, menu, customer, order, order_item

models.Base.metadata.create_all(bind = engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow all origins during development
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