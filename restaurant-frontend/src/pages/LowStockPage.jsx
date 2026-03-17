import { useEffect, useState } from "react";
import API from "../api/api";

function LowStockPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLowStock = () => {
    setLoading(true);
    API.get("/menu_items/low_stock")
      .then((res) => {
        setItems(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLowStock();
    const interval = setInterval(fetchLowStock, 5000); // auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  // Stock color indicator
  const getStockColor = (stock) => {
    if (stock === 0) return "#e74c3c"; // red for out of stock
    if (stock <= 2) return "#f39c12"; // orange for critically low
    return "#2ecc71"; // green for low but okay
  };

  const filteredItems = items.filter((item) =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cardStyle = {
    padding: "15px",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    marginBottom: "15px",
    borderTop: "5px solid",
  };

  if (loading) return <p>Loading low stock items...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>📉 Low Stock Items</h1>

      {/* Search */}
      <div style={{ margin: "15px 0" }}>
        <input
          type="text"
          placeholder="🔍 Search by Item Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "8px",
            width: "300px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      {filteredItems.length === 0 ? (
        <p>No low stock items found</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredItems.map((item) => (
            <div
              key={item.menu_item_id}
              style={{
                ...cardStyle,
                borderTopColor: getStockColor(item.stock),
              }}
            >
              <h3>🍽 {item.item_name}</h3>
              <p>
                <b>Category:</b> {item.category_name || "N/A"}
              </p>
              <p>
                <b>Price:</b> ₹{item.item_price}
              </p>
              <p>
                <b>Stock:</b>{" "}
                <span style={{ color: getStockColor(item.stock), fontWeight: "bold" }}>
                  {item.stock}
                </span>
              </p>

              {/* Optional: Restock button */}
              {/* <button
                style={{
                  padding: "6px 10px",
                  background: "#3498db",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
              >
                Restock
              </button> */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LowStockPage;