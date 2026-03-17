import { useEffect, useState } from "react";
import API from "../api/api";

function KitchenPage() {

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
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

    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateStatus = (orderId, newStatus) => {
    API.put(`/orders/${orderId}`, { status: newStatus })
      .then(() => {
        fetchOrders();
      })
      .catch((err) => console.error(err));
  };

  const pending = orders.filter(o => o.status === "pending");
  const preparing = orders.filter(o => o.status === "preparing");
  const ready = orders.filter(o => o.status === "ready");

  const columnStyle = {
    flex: 1,
    padding: "15px",
    border: "1px solid #ddd",
    minHeight: "400px",
    background: "#f9f9f9"
  };

  const cardStyle = {
    background: "white",
    padding: "12px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc"
  };

  if (loading) {
    return <p>Loading kitchen orders...</p>;
  }

  return (
    <div>

      <h1>Kitchen Dashboard</h1>

      <div style={{ display: "flex", gap: "15px" }}>

        {/* Pending Orders */}
        <div style={columnStyle}>
          <h2>Pending</h2>

          {pending.length === 0 && <p>No pending orders</p>}

          {pending.map(order => (
            <div key={order.order_id} style={cardStyle}>
              <h4>Order #{order.order_id}</h4>

              <p>Table: {order.table_number}</p>
              <p>Total: ₹{order.total_amount}</p>

              {/* SHOW ORDER ITEMS */}
              {order.items?.map(item => (
                <p key={item.order_item_id}>
                  🍽 {item.item_name} x {item.quantity}
                </p>
              ))}

              <button
                onClick={() =>
                  updateStatus(order.order_id, "preparing")
                }
              >
                Start Cooking
              </button>

            </div>
          ))}
        </div>

        {/* Preparing Orders */}
        <div style={columnStyle}>
          <h2>Preparing</h2>

          {preparing.length === 0 && <p>No preparing orders</p>}

          {preparing.map(order => (
            <div key={order.order_id} style={cardStyle}>
              <h4>Order #{order.order_id}</h4>

              <p>Table: {order.table_number}</p>
              <p>Total: ₹{order.total_amount}</p>

              {/* SHOW ORDER ITEMS */}
              {order.items?.map(item => (
                <p key={item.order_item_id}>
                  🍽 {item.item_name} x {item.quantity}
                </p>
              ))}

              <button
                onClick={() =>
                  updateStatus(order.order_id, "ready")
                }
              >
                Mark Ready
              </button>

            </div>
          ))}
        </div>

        {/* Ready Orders */}
        <div style={columnStyle}>
          <h2>Ready</h2>

          {ready.length === 0 && <p>No ready orders</p>}

          {ready.map(order => (
            <div key={order.order_id} style={cardStyle}>
              <h4>Order #{order.order_id}</h4>

              <p>Table: {order.table_number}</p>
              <p>Total: ₹{order.total_amount}</p>

              {/* SHOW ORDER ITEMS */}
              {order.items?.map(item => (
                <p key={item.order_item_id}>
                  🍽 {item.item_name} x {item.quantity}
                </p>
              ))}

              {/* SERVE BUTTON */}
              <button
                onClick={() =>
                  updateStatus(order.order_id, "served")
                }
              >
                Serve Order
              </button>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default KitchenPage;