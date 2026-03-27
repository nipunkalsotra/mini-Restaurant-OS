import { useEffect, useState } from "react";
import API from "../api/api";
import Cart from "../components/Cart";

function MenuPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customerId, setCustomerId] = useState(null);

  // Load restaurants
  useEffect(() => {
    API.get("/restaurants")
      .then((res) => setRestaurants(res.data))
      .catch(() => setError("Failed to load restaurants"))
      .finally(() => setLoadingRestaurants(false));
  }, []);

  // Load categories
  useEffect(() => {
    if (!selectedRestaurantId) return;
    API.get(`/restaurants/${selectedRestaurantId}/categories`)
      .then((res) => setCategories(res.data))
      .catch(() => console.error("Failed to load categories"));
  }, [selectedRestaurantId]);

  // Load menu
  useEffect(() => {
    if (!selectedRestaurantId) return;
    setLoadingMenu(true);
    API.get(`/restaurants/${selectedRestaurantId}/menu`)
      .then((res) => setMenu(res.data))
      .catch(() => setError("Failed to load menu"))
      .finally(() => setLoadingMenu(false));
  }, [selectedRestaurantId]);

  // Reset category and cart when restaurant changes
  useEffect(() => {
    setSelectedCategory("all");
    setCart([]);
  }, [selectedRestaurantId]);

  // Add item to cart
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menu_item_id === item.menu_item_id);
      if (existing) {
        return prev.map((i) =>
          i.menu_item_id === item.menu_item_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // Filtered menu
  const filteredMenu = menu.filter((item) => {
    const matchesSearch = item.item_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Step 1: Open customer modal
  const onPlaceOrderClick = () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }
    setCustomerName("");
    setCustomerPhone("");
    setCustomerId(null);
    setShowCustomerModal(true);
  };

  // Step 2: Confirm customer info and create customer
  const onCustomerConfirm = async () => {
    if (!customerName) {
      alert("Customer name is required!");
      return;
    }

    try {
      const res = await API.post("/customers", {
        restaurant_id: selectedRestaurantId,
        customer_name: customerName,
        customer_phone: customerPhone || null,
      });

      console.log("Customer created:", res.data);
      setCustomerId(res.data.customer_id);
      setShowCustomerModal(false);
      setShowPaymentModal(true);
    } catch (err) {
      console.error("Error creating customer:", err.response?.data || err);
      alert("❌ Failed to create customer! Check console.");
    }
  };

  // Step 3: Place order using existing customerId
  const placeOrder = async (paymentOption) => {
    if (!customerId) {
      alert("Customer not created!");
      return;
    }

    const orderData = {
      restaurant_id: selectedRestaurantId,
      customer_id: customerId,
      table_number: null,
      status: "pending",
      payment_status: paymentOption === "payfirst" ? "paid" : "unpaid",
      payment_method: "cash", // must match backend enum
      notes: "",
      items: cart.map((i) => ({
        menu_item_id: i.menu_item_id,
        quantity: i.quantity,
      })),
    };

    console.log("Placing order:", orderData);

    try {
      const orderRes = await API.post("/orders", orderData);
      console.log("Order created:", orderRes.data);
      setCart([]);
      setShowPaymentModal(false);

      if (paymentOption === "payfirst") {
        window.location.href = `/billing/${orderRes.data.order_id}`;
      } else {
        window.location.href = "/kitchen";
      }
    } catch (err) {
      console.error("Error placing order:", err);
      if (err.response) {
        console.error("Response data:", err.response.data);
      }
      alert("❌ Failed to place order! Check console for details.");
    }
  };

  return (
    <div style={{ display: "flex", background: "#f4f6f8" }}>
      {/* LEFT SIDE */}
      <div style={{ flex: 3, padding: "20px" }}>
        <h1>🍽 Menu Dashboard</h1>

        {loadingRestaurants ? (
          <p>Loading restaurants...</p>
        ) : (
          <select
            value={selectedRestaurantId || ""}
            onChange={(e) => setSelectedRestaurantId(Number(e.target.value))}
            style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc", marginTop: "10px" }}
          >
            <option value="">Select Restaurant</option>
            {restaurants.map((r) => (
              <option key={r.restaurant_id} value={r.restaurant_id}>
                {r.restaurant_name}
              </option>
            ))}
          </select>
        )}

        {selectedRestaurantId && (
          <input
            type="text"
            placeholder="🔍 Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginTop: "15px", padding: "10px", width: "100%", borderRadius: "8px", border: "1px solid #ccc" }}
          />
        )}

        {categories.length > 0 && (
          <div style={{ margin: "20px 0", display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <button
              onClick={() => setSelectedCategory("all")}
              style={{
                padding: "6px 12px",
                borderRadius: "20px",
                border: "none",
                background: selectedCategory === "all" ? "#333" : "#eee",
                color: selectedCategory === "all" ? "#fff" : "#000",
                cursor: "pointer",
              }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                onClick={() => setSelectedCategory(cat.category_id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border: "none",
                  background: selectedCategory === cat.category_id ? "#333" : "#eee",
                  color: selectedCategory === cat.category_id ? "#fff" : "#000",
                  cursor: "pointer",
                }}
              >
                {cat.category_name}
              </button>
            ))}
          </div>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}

        {loadingMenu ? (
          <p>Loading menu...</p>
        ) : filteredMenu.length === 0 ? (
          <p>No items found</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
            {filteredMenu.map((item) => (
              <div key={item.menu_item_id} style={{ background: "#fff", padding: "15px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                <h3>{item.item_name}</h3>
                <p><b>₹{item.item_price}</b></p>
                <button
                  onClick={() => addToCart(item)}
                  style={{ marginTop: "10px", padding: "6px 10px", width: "100%", border: "none", borderRadius: "6px", background: "#2ecc71", color: "#fff", cursor: "pointer" }}
                >
                  ➕ Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT SIDE CART */}
      <Cart cart={cart} setCart={setCart} onPlaceOrderClick={onPlaceOrderClick} />

      {/* Customer Modal */}
      {showCustomerModal && (
        <Modal>
          <h2>Enter Customer Info</h2>
          <input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputStyle} />
          <input type="text" placeholder="Customer Phone (optional)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={inputStyle} />
          <button onClick={onCustomerConfirm} style={confirmBtnStyle}>✅ Confirm</button>
          <button onClick={() => setShowCustomerModal(false)} style={cancelBtnStyle}>❌ Cancel</button>
        </Modal>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <Modal>
          <h2>Choose Payment Option</h2>
          <button onClick={() => placeOrder("payfirst")} style={payFirstBtnStyle}>💳 Pay First</button>
          <button onClick={() => placeOrder("paylater")} style={payLaterBtnStyle}>🕓 Pay Later</button>
          <button onClick={() => setShowPaymentModal(false)} style={cancelBtnStyle}>❌ Cancel</button>
        </Modal>
      )}
    </div>
  );
}

// Reusable Modal wrapper
const Modal = ({ children }) => (
  <div style={modalStyle}>
    <div style={modalContentStyle}>{children}</div>
  </div>
);

// Styles
const modalStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 };
const modalContentStyle = { background: "#fff", padding: "20px", borderRadius: "10px", width: "300px", textAlign: "center" };
const inputStyle = { marginTop: "10px", padding: "10px", width: "100%", borderRadius: "6px", border: "1px solid #ccc" };
const confirmBtnStyle = { marginTop: "10px", padding: "10px", width: "100%", border: "none", borderRadius: "6px", background: "#2ecc71", color: "#fff", cursor: "pointer" };
const payFirstBtnStyle = { ...confirmBtnStyle };
const payLaterBtnStyle = { ...confirmBtnStyle, background: "#f39c12" };
const cancelBtnStyle = { ...confirmBtnStyle, background: "#e74c3c" };

export default MenuPage;