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
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(
    () => localStorage.getItem("restaurantId") ? Number(localStorage.getItem("restaurantId")) : null
  );

  const [cart, setCart] = useState([])
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      setCart(JSON.parse(saved));
    }
  }, []);

  // Load restaurants
  useEffect(() => {
    API.get("/restaurants")
      .then(res => setRestaurants(res.data))
      .catch(() => setError("Failed to load restaurants"))
      .finally(() => setLoadingRestaurants(false));
  }, []);

  // Load categories
  useEffect(() => {
    if (!selectedRestaurantId) return;
    API.get(`/restaurants/${selectedRestaurantId}/categories`)
      .then(res => setCategories(res.data))
      .catch(() => console.error("Failed to load categories"));
  }, [selectedRestaurantId]);

  // Load menu
  useEffect(() => {
    if (!selectedRestaurantId) return;
    setLoadingMenu(true);
    API.get(`/restaurants/${selectedRestaurantId}/menu`)
      .then(res => setMenu(res.data))
      .catch(() => setError("Failed to load menu"))
      .finally(() => setLoadingMenu(false));
  }, [selectedRestaurantId]);

  // Reset category when restaurant changes
  useEffect(() => {
    setSelectedCategory("all");
  }, [selectedRestaurantId]);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Add item to cart
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.menu_item_id === item.menu_item_id);
      if (existing) {
        return prev.map(i =>
          i.menu_item_id === item.menu_item_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // Checkout navigation
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }
    navigate("/billing", { state: { cart, setCart } });
  };

  // Filtered menu
  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelectedRestaurantId(id);
              localStorage.setItem("restaurantId", id);
            }}
            style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc", marginTop: "10px" }}
          >
            <option value="">Select Restaurant</option>
            {restaurants.map(r => (
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
            {categories.map(cat => (
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
            {filteredMenu.map(item => (
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
      <Cart cart={cart || []} setCart={setCart} onCheckout={handleCheckout} />
    </div>
  );
}

export default MenuPage;