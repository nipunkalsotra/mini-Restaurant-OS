import { useEffect, useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/orders")
      .then(res => setOrders(res.data))
      .catch(err => console.error(err));
  }, []);

  const statuses = [
    "all",
    "pending",
    "preparing",
    "ready",
    "served",
    "completed",
    "cancelled"
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "#f39c12";
      case "preparing": return "#3498db";
      case "ready": return "#2ecc71";
      case "served": return "#9b59b6";
      case "completed": return "#2c3e50";
      case "cancelled": return "#e74c3c";
      default: return "#999";
    }
  };

  const getPaymentColor = (paymentStatus) => {
    switch (paymentStatus) {
      case "unpaid": return "#e74c3c";
      case "paid": return "#2ecc71";
      default: return "#999";
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      await API.put(`/orders/${orderId}`, { status: "cancelled" });
      setOrders(prev =>
        prev.map(o => (o.order_id === orderId ? { ...o, status: "cancelled" } : o))
      );
    } catch (err) {
      console.error(err.response?.data);
      alert("❌ Cannot cancel order");
    }
  };

  const filteredOrders = orders.filter((o) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      o.order_id.toString().includes(search) ||
      (o.table_number || "").toString().includes(search) ||
      (o.customer_name || "").toLowerCase().includes(search);

    const matchesStatus = selectedStatus === "all" || o.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const getCount = (status) => {
    if (status === "all") return orders.length;
    return orders.filter(o => o.status === status).length;
  };

  const grandTotal = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

  return (
    <div style={{ padding: "20px" }}>
      <h1>📦 Orders Dashboard</h1>
      <h2 style={{ marginTop: "10px" }}>💰 Total Revenue: ₹{grandTotal}</h2>

      <div style={{ margin: "15px 0" }}>
        <input
          type="text"
          placeholder="🔍 Search by Order ID / Table / Customer"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: "8px", width: "300px", borderRadius: "6px", border: "1px solid #ccc" }}
        />
      </div>

      <div style={{ margin: "20px 0", display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            style={{
              padding: "8px 12px",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
              background: selectedStatus === status ? "#333" : "#eee",
              color: selectedStatus === status ? "#fff" : "#000"
            }}
          >
            {status.toUpperCase()} ({getCount(status)})
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {filteredOrders.map((o) => (
            <div
              key={o.order_id}
              onClick={() => navigate(`/orders/${o.order_id}`)}
              style={{
                cursor: "pointer",
                padding: "15px",
                borderRadius: "12px",
                background: "#fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                borderTop: `5px solid ${getStatusColor(o.status)}`
              }}
            >
              <h3>🧾 Order #{o.order_id}</h3>
              <p><b>🍽 Table:</b> {o.table_number || "N/A"}</p>
              <p>
                <b>📌 Status:</b>{" "}
                <span style={{ color: getStatusColor(o.status), fontWeight: "bold" }}>
                  {o.status}
                </span>
              </p>
              <p>
                <b>💳 Payment Status:</b>{" "}
                <span style={{ color: getPaymentColor(o.payment_status), fontWeight: "bold" }}>
                  {o.payment_status}
                </span>
              </p>
              <p><b>💳 Payment Method:</b> {o.payment_method}</p>
              <p><b>💰 Total:</b> ₹{o.total_amount}</p>

              {o.notes && <p style={{ fontSize: "13px", color: "#555" }}>📝 {o.notes}</p>}

              {o.status !== "cancelled" && o.status !== "completed" && (
                <button
                  onClick={(e) => { e.stopPropagation(); cancelOrder(o.order_id); }}
                  style={{
                    marginTop: "10px",
                    padding: "6px 10px",
                    background: "#e74c3c",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  ❌ Cancel Order
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrdersPage;