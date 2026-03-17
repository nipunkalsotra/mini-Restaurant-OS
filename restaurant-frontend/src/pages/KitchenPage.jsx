import { useEffect, useState } from "react";
import API from "../api/api";

function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const statuses = ["pending", "preparing", "ready"];

  const fetchOrders = () => {
    setLoading(true);
    API.get("/orders/kitchen")
      .then((res) => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await API.put(`/orders/${orderId}`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update order status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#f39c12";
      case "preparing":
        return "#3498db";
      case "ready":
        return "#2ecc71";
      case "served":
        return "#9b59b6";
      default:
        return "#999";
    }
  };

  // Filter orders by status + search
  const filteredOrders = (status) =>
    orders
      .filter((o) =>
        o.order_id.toString().includes(searchTerm.toLowerCase()) ||
        (o.table_number || "").toString().includes(searchTerm.toLowerCase()) ||
        (o.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase())
          ? true
          : false
      )
      .filter((o) => o.status === status);

  const cardStyle = {
    padding: "15px",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    marginBottom: "15px",
    borderTop: "5px solid",
  };

  const columnStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  };

  if (loading) return <p>Loading kitchen orders...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>🍳 Kitchen Dashboard</h1>

      {/* 🔍 SEARCH BAR */}
      <div style={{ margin: "15px 0" }}>
        <input
          type="text"
          placeholder="🔍 Search by Order ID / Table / Customer"
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

      {/* 🔲 ORDERS COLUMNS */}
      <div style={{ display: "flex", gap: "20px" }}>
        {statuses.map((status) => {
          const ordersInStatus = filteredOrders(status);
          return (
            <div key={status} style={columnStyle}>
              {/* Heading with count */}
              <h2 style={{ textTransform: "capitalize" }}>
                {status} ({ordersInStatus.length})
              </h2>

              {ordersInStatus.length === 0 && <p>No {status} orders</p>}

              {ordersInStatus.map((o) => (
                <div
                  key={o.order_id}
                  style={{
                    ...cardStyle,
                    borderTopColor: getStatusColor(o.status),
                  }}
                >
                  <h3>🧾 Order #{o.order_id}</h3>
                  <p>
                    <b>🍽 Table:</b> {o.table_number || "N/A"}
                  </p>
                  <p>
                    <b>📌 Status:</b>{" "}
                    <span
                      style={{
                        color: getStatusColor(o.status),
                        fontWeight: "bold",
                      }}
                    >
                      {o.status}
                    </span>
                  </p>
                  <p>
                    <b>💰 Total:</b> ₹{o.total_amount || 0}
                  </p>

                  {/* ORDER ITEMS */}
                  <div style={{ marginTop: "10px", marginBottom: "10px" }}>
                    {o.items?.map((item) => (
                      <p
                        key={item.order_item_id}
                        style={{ fontSize: "14px", margin: "4px 0" }}
                      >
                        🍽 {item.item_name} x {item.quantity}
                      </p>
                    ))}
                  </div>

                  {/* ACTION BUTTON */}
                  {o.status === "pending" && (
                    <button
                      onClick={() => updateStatus(o.order_id, "preparing")}
                      style={{
                        padding: "6px 10px",
                        background: "#3498db",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Start Cooking
                    </button>
                  )}

                  {o.status === "preparing" && (
                    <button
                      onClick={() => updateStatus(o.order_id, "ready")}
                      style={{
                        padding: "6px 10px",
                        background: "#2ecc71",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Mark Ready
                    </button>
                  )}

                  {o.status === "ready" && (
                    <button
                      onClick={() => updateStatus(o.order_id, "served")}
                      style={{
                        padding: "6px 10px",
                        background: "#9b59b6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Serve Order
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default KitchenPage;