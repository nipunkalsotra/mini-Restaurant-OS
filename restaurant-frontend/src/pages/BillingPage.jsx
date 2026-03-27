import { useState, useEffect } from "react";
import API from "../api/api";

function BillingPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get("/orders/filter"); // fetch all orders or filter ?payment_status=unpaid
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const markAsPaid = async (orderId) => {
    try {
      await API.put(`/orders/${orderId}`, { payment_status: "paid" });
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Failed to update payment status");
    }
  };

  const filteredOrders = orders.filter((o) => {
    const search = searchTerm.toLowerCase();
    return (
      o.order_id.toString().includes(search) ||
      (o.table_number || "").toString().includes(search) ||
      (o.customer_name || "").toLowerCase().includes(search)
    );
  });

  const cardStyle = {
    padding: "15px",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    marginBottom: "15px",
    borderTop: "5px solid #2ecc71",
  };

  if (loading) return <p>Loading billing orders...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>💰 Billing Dashboard</h1>

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

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {filteredOrders.length === 0 && <p>No orders found</p>}

        {filteredOrders.map((o) => (
          <div key={o.order_id} style={cardStyle}>
            <h3>🧾 Order #{o.order_id}</h3>
            <p>
              <b>🍽 Table:</b> {o.table_number || "N/A"}
            </p>
            <p>
              <b>👤 Customer:</b> {o.customer_name || "Walk-in"}
            </p>
            <p>
              <b>💳 Payment Method:</b> {o.payment_method}
            </p>
            <p>
              <b>💰 Total Amount:</b> ₹{o.total_amount}
            </p>
            <p>
              <b>📌 Status:</b> {o.status}
            </p>
            <p>
              <b>💲 Payment Status:</b> {o.payment_status}
            </p>

            <div style={{ marginTop: "10px", marginBottom: "10px" }}>
              <b>Order Items:</b>
              {o.items?.map((item) => (
                <p key={item.order_item_id} style={{ margin: "2px 0" }}>
                  🍽 {item.item_name} x {item.quantity}
                </p>
              ))}
            </div>

            {o.payment_status === "unpaid" && (
              <button
                onClick={() => markAsPaid(o.order_id)}
                style={{
                  padding: "6px 10px",
                  background: "#2ecc71",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Mark as Paid
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BillingPage;