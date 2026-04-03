import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import Cart from "../components/Cart";

function MenuPage() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(() =>
    localStorage.getItem("restaurantId")
      ? Number(localStorage.getItem("restaurantId"))
      : null
  );

  const [cart, setCart] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      setCart(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    API.get("/restaurants")
      .then((res) => setRestaurants(res.data))
      .catch(() => setError("Failed to load restaurants"))
      .finally(() => setLoadingRestaurants(false));
  }, []);

  useEffect(() => {
    if (!selectedRestaurantId) return;
    API.get(`/restaurants/${selectedRestaurantId}/categories`)
      .then((res) => setCategories(res.data))
      .catch(() => console.error("Failed to load categories"));
  }, [selectedRestaurantId]);

  useEffect(() => {
    if (!selectedRestaurantId) return;
    setLoadingMenu(true);
    API.get(`/restaurants/${selectedRestaurantId}/menu`)
      .then((res) => setMenu(res.data))
      .catch(() => setError("Failed to load menu"))
      .finally(() => setLoadingMenu(false));
  }, [selectedRestaurantId]);

  useEffect(() => {
    setSelectedCategory("all");
  }, [selectedRestaurantId]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

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

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }
    navigate("/billing", { state: { cart } });
  };

  const filteredMenu = menu.filter((item) => {
    const matchesSearch = item.item_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f7f8fa"
      }}
    >
      <div
        style={{
          flex: 1,
          padding: "24px 24px 24px 28px"
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            padding: "22px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
            marginBottom: "20px"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap"
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: "30px" }}>🍽 Menu Dashboard</h1>
              <p style={{ margin: "8px 0 0", color: "#666" }}>
                Browse menu items, filter categories, and build orders faster.
              </p>
            </div>

            <div
              style={{
                background: "#f8faff",
                padding: "12px 16px",
                borderRadius: "14px",
                border: "1px solid #e8eefc",
                minWidth: "220px"
              }}
            >
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                Cart Summary
              </div>
              <div style={{ fontWeight: 700, fontSize: "18px" }}>
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
              </div>
            </div>
          </div>

          {loadingRestaurants ? (
            <p style={{ marginTop: "16px" }}>Loading restaurants...</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(240px, 320px) 1fr",
                gap: "14px",
                marginTop: "18px"
              }}
            >
              <select
                value={selectedRestaurantId || ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedRestaurantId(id);
                  localStorage.setItem("restaurantId", id);
                }}
                style={selectStyle}
              >
                <option value="">Select Restaurant</option>
                {restaurants.map((r) => (
                  <option key={r.restaurant_id} value={r.restaurant_id}>
                    {r.restaurant_name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="🔍 Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={inputStyle}
                disabled={!selectedRestaurantId}
              />
            </div>
          )}

          {categories.length > 0 && (
            <div
              style={{
                marginTop: "18px",
                display: "flex",
                flexWrap: "wrap",
                gap: "10px"
              }}
            >
              <button
                onClick={() => setSelectedCategory("all")}
                style={getCategoryButtonStyle(selectedCategory === "all")}
              >
                All
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.category_id}
                  onClick={() => setSelectedCategory(cat.category_id)}
                  style={getCategoryButtonStyle(
                    selectedCategory === cat.category_id
                  )}
                >
                  {cat.category_name}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              background: "#fff0f0",
              color: "#c0392b",
              border: "1px solid #f3c4c4",
              padding: "12px 14px",
              borderRadius: "12px",
              marginBottom: "16px"
            }}
          >
            {error}
          </div>
        )}

        {loadingMenu ? (
          <div style={stateCardStyle}>Loading menu...</div>
        ) : !selectedRestaurantId ? (
          <div style={stateCardStyle}>Select a restaurant to view menu.</div>
        ) : filteredMenu.length === 0 ? (
          <div style={stateCardStyle}>No items found.</div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "20px"
            }}
          >
            {filteredMenu.map((item) => (
              <div
                key={item.menu_item_id}
                style={{
                  background: "#fff",
                  borderRadius: "18px",
                  padding: "18px",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    gap: "10px"
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "20px", color: "#222" }}>
                    {item.item_name}
                  </h3>

                  <span
                    style={{
                      fontSize: "12px",
                      background: "#eef3ff",
                      color: "#335dff",
                      padding: "6px 10px",
                      borderRadius: "999px",
                      fontWeight: 600,
                      whiteSpace: "nowrap"
                    }}
                  >
                    #{item.menu_item_id}
                  </span>
                </div>

                <div style={{ color: "#666", fontSize: "14px" }}>
                  Freshly available for quick order billing.
                </div>

                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#1f2937",
                    marginTop: "4px"
                  }}
                >
                  ₹{item.item_price}
                </div>

                <button
                  onClick={() => addToCart(item)}
                  style={{
                    marginTop: "8px",
                    padding: "12px",
                    width: "100%",
                    border: "none",
                    borderRadius: "10px",
                    background: "#2ecc71",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "14px"
                  }}
                >
                  ➕ Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Cart cart={cart || []} setCart={setCart} onCheckout={handleCheckout} />
    </div>
  );
}

const selectStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #d7dce5",
  background: "#fff",
  fontSize: "14px",
  outline: "none"
};

const inputStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #d7dce5",
  background: "#fff",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box"
};

const stateCardStyle = {
  background: "#fff",
  borderRadius: "18px",
  padding: "22px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  color: "#666"
};

const getCategoryButtonStyle = (active) => ({
  padding: "8px 14px",
  borderRadius: "999px",
  border: "none",
  background: active ? "#333" : "#eceff3",
  color: active ? "#fff" : "#222",
  cursor: "pointer",
  fontWeight: 600
});

export default MenuPage;