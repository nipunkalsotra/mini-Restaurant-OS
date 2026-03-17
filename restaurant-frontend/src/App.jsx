import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";

import MenuPage from "./pages/MenuPage";
import OrdersPage from "./pages/OrdersPage";
import CustomersPage from "./pages/CustomersPage";
import SalesPage from "./pages/SalesPage";
import KitchenPage from "./pages/KitchenPage";
import OrderDetailPage from "./pages/OrderDetailPage";

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex" }}>

        <Sidebar />

        <div style={{ flex: 1, padding: "20px" }}>
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/kitchen" element={<KitchenPage />} />
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  );
}

export default App;