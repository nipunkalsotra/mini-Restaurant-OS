import { useEffect, useState } from "react";
import API from "../api/api";

function MenuPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all restaurants
  useEffect(() => {
    setLoadingRestaurants(true);
    API.get("/restaurants")
      .then((res) => setRestaurants(res.data))
      .catch(() => setError("Failed to load restaurants"))
      .finally(() => setLoadingRestaurants(false));
  }, []);

  // Fetch categories once
  useEffect(() => {
    API.get("/categories")
      .then((res) => setCategories(res.data))
      .catch(() => console.error("Failed to load categories"));
  }, []);

  // Fetch menu when a restaurant is selected
  useEffect(() => {
    if (!selectedRestaurantId) return;

    setLoadingMenu(true);
    setError(null);

    API.get(`/restaurants/${selectedRestaurantId}/menu`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setMenu(res.data);
        } else {
          console.error("Unexpected menu response:", res.data);
          setMenu([]);
        }
      })
      .catch(() => setError("Failed to load menu"))
      .finally(() => setLoadingMenu(false));
  }, [selectedRestaurantId]);

  // Filtered menu based on search term
  const filteredMenu = menu.filter((item) =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group filtered menu by category
  const groupedMenu = categories
    .map((cat) => ({
      ...cat,
      items: filteredMenu.filter((item) => item.category_id === cat.category_id),
    }))
    // Only include categories with at least one item
    .filter((cat) => cat.items.length > 0);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Restaurant Menu</h1>

      {/* Restaurant Selector */}
      {loadingRestaurants ? (
        <p>Loading restaurants...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="restaurant-select">Select Restaurant: </label>
          <select
            id="restaurant-select"
            value={selectedRestaurantId || ""}
            onChange={(e) => setSelectedRestaurantId(Number(e.target.value))}
          >
            <option value="">--Choose a restaurant--</option>
            {restaurants.map((r) => (
              <option key={r.restaurant_id} value={r.restaurant_id}>
                {r.restaurant_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Search Bar */}
      {selectedRestaurantId && menu.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "0.5rem", width: "100%", maxWidth: "400px" }}
          />
        </div>
      )}

      {/* Menu */}
      {loadingMenu ? (
        <p>Loading menu...</p>
      ) : !selectedRestaurantId ? (
        <p>Please select a restaurant to view its menu.</p>
      ) : groupedMenu.length === 0 ? (
        <p>No menu items found.</p>
      ) : (
        groupedMenu.map((cat) => (
          <div key={cat.category_id} style={{ marginBottom: "1.5rem" }}>
            <h2>{cat.category_name}</h2>
            {cat.items.map((item) => (
              <div
                key={item.menu_item_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  opacity: item.stock === 0 ? 0.5 : 1,
                  marginBottom: "0.5rem",
                }}
              >
                <span>
                  {item.item_name} {item.stock === 0 && "(Out of stock)"}
                </span>
                <span>₹{item.item_price}</span>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

export default MenuPage;