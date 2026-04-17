import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import Cart from "../components/Cart";

function MenuPage({ cart, setCart }) {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(() => {
    const saved = localStorage.getItem("restaurantId");
    return saved ? Number(saved) : null;
  });

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart && cart.length === 0) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse saved cart:", e);
        localStorage.removeItem("cart");
      }
    }
  }, [cart.length, setCart]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoadingRestaurants(true);
        setError("");

        const res = await API.get("/restaurants");
        const restaurantList = res.data || [];
        setRestaurants(restaurantList);

        if (restaurantList.length === 0) {
          setSelectedRestaurantId(null);
          localStorage.removeItem("restaurantId");
          setCategories([]);
          setMenu([]);
          return;
        }

        const savedRestaurantId = localStorage.getItem("restaurantId");
        const validSavedRestaurant = restaurantList.find(
          (r) => Number(r.restaurant_id) === Number(savedRestaurantId)
        );

        const nextRestaurantId = validSavedRestaurant
          ? validSavedRestaurant.restaurant_id
          : restaurantList[0].restaurant_id;

        setSelectedRestaurantId(nextRestaurantId);
        localStorage.setItem("restaurantId", String(nextRestaurantId));
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.detail || "Failed to load restaurants"
        );
      } finally {
        setLoadingRestaurants(false);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!selectedRestaurantId) {
        setCategories([]);
        return;
      }

      try {
        const res = await API.get(`/restaurants/${selectedRestaurantId}/categories`);
        setCategories(res.data || []);
      } catch (err) {
        console.error("Failed to load categories:", err);
        setCategories([]);
      }
    };

    fetchCategories();
  }, [selectedRestaurantId]);

  useEffect(() => {
    const fetchMenu = async () => {
      if (!selectedRestaurantId) {
        setMenu([]);
        return;
      }

      try {
        setLoadingMenu(true);
        setError("");

        const res = await API.get(`/restaurants/${selectedRestaurantId}/menu`);
        setMenu(res.data || []);
      } catch (err) {
        console.error(err);
        setMenu([]);
        setError(
          err.response?.data?.detail || "Failed to load menu"
        );
      } finally {
        setLoadingMenu(false);
      }
    };

    fetchMenu();
  }, [selectedRestaurantId]);

  useEffect(() => {
    setSelectedCategory("all");
    setSearchTerm("");
  }, [selectedRestaurantId]);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.menu_item_id === item.menu_item_id
      );

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
    if (!selectedRestaurantId) {
      alert("Please select a restaurant first.");
      return;
    }

    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    navigate("/billing", {
      state: {
        cart,
        restaurantId: selectedRestaurantId,
      },
    });
  };

  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const matchesSearch = item.item_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" ||
        Number(item.category_id) === Number(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [menu, searchTerm, selectedCategory]);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-secondary)",
      }}
    >
      <div
        style={{
          flex: 1,
          padding: "24px 24px 24px 28px",
        }}
      >
        <div
          style={{
            background: "var(--bg-primary)",
            borderRadius: "18px",
            padding: "22px",
            boxShadow: "var(--shadow-sm)",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: "30px" }}>🍽 Menu Dashboard</h1>
              <p style={{ margin: "8px 0 0", color: "var(--text-secondary)" }}>
                Browse menu items, filter categories, and build orders faster.
              </p>
            </div>

            <div
              style={{
                background: "var(--bg-tertiary)",
                padding: "12px 16px",
                borderRadius: "14px",
                border: "1px solid var(--border-color)",
                minWidth: "220px",
              }}
            >
              <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
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
                marginTop: "18px",
              }}
            >
              <select
                value={selectedRestaurantId || ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedRestaurantId(id || null);
                  if (id) {
                    localStorage.setItem("restaurantId", String(id));
                  } else {
                    localStorage.removeItem("restaurantId");
                  }
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
                gap: "10px",
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
                    Number(selectedCategory) === Number(cat.category_id)
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
              marginBottom: "16px",
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
              gap: "20px",
            }}
          >
            {filteredMenu.map((item) => (
              <div
                key={item.menu_item_id}
                style={{
                  background: "var(--bg-primary)",
                  borderRadius: "18px",
                  padding: "18px",
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    gap: "10px",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "20px", color: "var(--text-primary)" }}>
                    {item.item_name}
                  </h3>

                  <span
                    style={{
                      fontSize: "12px",
                      background: "var(--bg-tertiary)",
                      color: "#335dff",
                      padding: "6px 10px",
                      borderRadius: "999px",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    #{item.menu_item_id}
                  </span>
                </div>

                <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                  Freshly available for quick order billing.
                </div>

                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginTop: "4px",
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
                    color: "var(--bg-primary)",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "14px",
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
  border: "1px solid var(--border-color)",
  background: "var(--bg-primary)",
  fontSize: "14px",
  outline: "none",
};

const inputStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid var(--border-color)",
  background: "var(--bg-primary)",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const stateCardStyle = {
  background: "var(--bg-primary)",
  borderRadius: "18px",
  padding: "22px",
  boxShadow: "var(--shadow-sm)",
  color: "var(--text-secondary)",
};

const getCategoryButtonStyle = (active) => ({
  padding: "8px 14px",
  borderRadius: "999px",
  border: "none",
  background: active ? "var(--text-primary)" : "var(--bg-tertiary)",
  color: active ? "var(--bg-primary)" : "var(--text-primary)",
  cursor: "pointer",
  fontWeight: 600,
});

export default MenuPage;