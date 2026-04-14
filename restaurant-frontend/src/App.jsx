import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";

import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import MenuPage from "./pages/MenuPage";
import OrdersPage from "./pages/OrdersPage";
import CustomersPage from "./pages/CustomersPage";
import SalesPage from "./pages/SalesPage";
import KitchenPage from "./pages/KitchenPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import BillingPage from "./pages/BillingPage";
import RestaurantPage from "./pages/RestaurantPage";

import { isLoggedIn } from "./utils/auth";

function AppLayout({ cart, setCart }) {
  const location = useLocation();

  const hideSidebar =
    location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div style={{ display: "flex" }}>
      {!hideSidebar && <Sidebar />}

      <div style={{ flex: 1, padding: "20px" }}>
        <Routes>
          <Route
            path="/login"
            element={
              isLoggedIn() ? <Navigate to="/" replace /> : <LoginPage />
            }
          />

          <Route
            path="/signup"
            element={
              isLoggedIn() ? <Navigate to="/" replace /> : <SignupPage />
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MenuPage cart={cart} setCart={setCart} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <CustomersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sales"
            element={
              <ProtectedRoute>
                <SalesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/kitchen"
            element={
              <ProtectedRoute>
                <KitchenPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/:orderId"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customers/:customerId"
            element={
              <ProtectedRoute>
                <CustomerDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <BillingPage cart={cart} setCart={setCart} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/restaurant-settings"
            element={
              <ProtectedRoute>
                <RestaurantPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              isLoggedIn()
                ? <Navigate to="/" replace />
                : <Navigate to="/login" replace />
            }
          />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  const [cart, setCart] = useState([]);

  return (
    <BrowserRouter>
      <AppLayout cart={cart} setCart={setCart} />
    </BrowserRouter>
  );
}

export default App;