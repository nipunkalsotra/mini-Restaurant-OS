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
      case "pending": return "#f39c12";
      case "preparing": return "#3498db";
      case "ready": return "#2ecc71";
      case "served": return "#9b59b6";
      default: return "#999";
    }
  };

  const filteredOrders = (status) =>
    orders
      .filter((o) => {
        const search = searchTerm.toLowerCase();
        return (
          o.order.order_id.toString().includes(search) ||
          (o.order.table_number || "").toString().includes(search)
        );
      })
      .filter((o) => o.order.status === status);

  const columnStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  };

  const cardStyle = {
    padding: "15px",
    borderRadius: "8px",
    background: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    marginBottom: "15px",
    borderLeft: "6px solid",
  };

  if (loading) return <p>Loading kitchen orders...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>🍳 Kitchen Dashboard</h1>

      {/* Search */}
      <div style={{ margin: "15px 0" }}>
        <input
          type="text"
          placeholder="🔍 Search by Order ID / Table"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: "8px", width: "300px", borderRadius: "6px", border: "1px solid #ccc" }}
        />
      </div>

      {/* Columns */}
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
        {statuses.map((status) => {
          const ordersInStatus = filteredOrders(status);
          return (
            <div key={status} style={columnStyle}>
              <h2 style={{ textTransform: "capitalize" }}>
                {status} ({ordersInStatus.length})
              </h2>

              {ordersInStatus.length === 0 && <p>No {status} orders</p>}

              {ordersInStatus.map((o) => (
                <div key={o.order.order_id} style={{ ...cardStyle, borderLeftColor: getStatusColor(o.order.status) }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div>
                      <h3 style={{ margin: 0 }}>🧾 Order #{o.order.order_id}</h3>
                      <p style={{ margin: "2px 0" }}><b>🍽 Table:</b> {o.order.table_number || "N/A"}</p>
                    </div>
                    <span style={{
                      color: "#fff",
                      background: getStatusColor(o.order.status),
                      padding: "4px 10px",
                      borderRadius: "6px",
                      height: "fit-content"
                    }}>
                      {o.order.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div style={{
                    borderTop: "1px dashed #ccc",
                    paddingTop: "8px",
                    marginTop: "8px",
                    marginBottom: "8px"
                  }}>
                    {o.items?.map((item) => (
                      <div key={item.order_item_id} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", margin: "2px 0" }}>
                        <span>🍽 {item.item_name}</span>
                        <span>x {item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {o.order.status === "pending" && (
                      <button
                        onClick={() => updateStatus(o.order.order_id, "preparing")}
                        style={{ flex: 1, padding: "6px", background: "#3498db", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                      >
                        Start Cooking
                      </button>
                    )}
                    {o.order.status === "preparing" && (
                      <button
                        onClick={() => updateStatus(o.order.order_id, "ready")}
                        style={{ flex: 1, padding: "6px", background: "#2ecc71", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                      >
                        Mark Ready
                      </button>
                    )}
                    {o.order.status === "ready" && (
                      <button
                        onClick={() => updateStatus(o.order.order_id, "served")}
                        style={{ flex: 1, padding: "6px", background: "#9b59b6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                      >
                        Serve Order
                      </button>
                    )}
                  </div>
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