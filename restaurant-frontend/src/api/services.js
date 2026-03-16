import API from "./api";

export const getRestaurants = () => API.get("/restaurants");
export const getRestaurantMenu = (id) => API.get(`/restaurants/${id}/menu`);
export const getCategories = () => API.get("/categories");

export const getMenuItems = () => API.get("/menu_items");
export const createMenuItem = (data) => API.post("/menu_items", data);
export const updateMenuItem = (id, data) => API.put(`/menu_items/${id}`, data);
export const deleteMenuItem = (id) => API.delete(`/menu_items/${id}`);

export const getOrders = (status) => 
  status ? API.get(`/orders/filter?status=${status}`) : API.get("/orders");
export const getOrderById = (id) => API.get(`/orders/${id}`);
export const createOrder = (data) => API.post("/orders", data);

export const getCustomers = () => API.get("/customers");
export const getCustomerOrders = (id) => API.get(`/customers/${id}/orders`);
export const createCustomer = (data) => API.post("/customers", data);

export const getSales = (restaurantId) => API.get(`/restaurants/${restaurantId}/sales`);
export const getLowStockItems = () => API.get("/menu_items/low_stock");