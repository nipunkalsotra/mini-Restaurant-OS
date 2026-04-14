import { useEffect, useMemo, useState, useCallback } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("restaurant_os_token");

  const statuses = ["pending", "preparing", "ready"];

  const logoutAndRedirect = useCallback(() => {
    localStorage.removeItem("restaurant_os_token");
    localStorage.removeItem("user");
    navigate("/login");
  }, [navigate]);

  const fetchOrders = useCallback(async (showLoader = false) => {
    try {
      if (!token) {
        navigate("/login");
        return;
      }

      if (showLoader) {
        setLoading(true);
      }

      const res = await API.get("/orders/kitchen", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setOrders(res.data);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        logoutAndRedirect();
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate, logoutAndRedirect]);

  useEffect(() => {
    fetchOrders(true);

    const interval = setInterval(() => {
      fetchOrders(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await API.put(
        `/orders/${orderId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setOrders((prev) =>
        prev.map((o) =>
          o.order.order_id === orderId
            ? { ...o, order: { ...o.order, status: newStatus } }
            : o
        )
      );
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        logoutAndRedirect();
        return;
      }

      alert(err.response?.data?.detail || "❌ Failed to update order status");
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
      default:
        return "#999";
    }
  };

  const filteredOrders = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return orders.filter((o) => {
      return (
        o.order.order_id.toString().includes(search) ||
        (o.order.table_number || "").toString().includes(search)
      );
    });
  }, [orders, searchTerm]);

  const getOrdersByStatus = (status) =>
    filteredOrders.filter((o) => o.order.status === status);

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={emptyCardStyle}>Loading kitchen orders...</div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={headerCardStyle}>
        <div style={headerRowStyle}>
          <div>
            <h1 style={titleStyle}>🍳 Kitchen Dashboard</h1>
            <p style={subtitleStyle}>
              Real-time order flow for kitchen operations.
            </p>
          </div>

          <div style={highlightCardStyle}>
            <div style={{ fontSize: "13px", color: "#666" }}>
              Active Orders
            </div>
            <div style={{ fontSize: "22px", fontWeight: "bold" }}>
              {orders.length}
            </div>
          </div>
        </div>

        <input
          type="text"
          placeholder="🔍 Search by Order ID / Table"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={searchStyle}
        />
      </div>

      <div style={columnsWrapper}>
        {statuses.map((status) => {
          const ordersInStatus = getOrdersByStatus(status);

          return (
            <div key={status} style={columnStyle}>
              <div style={columnHeaderStyle}>
                <h2 style={{ margin: 0, textTransform: "capitalize" }}>
                  {status}
                </h2>
                <span style={countBadge}>{ordersInStatus.length}</span>
              </div>

              {ordersInStatus.length === 0 ? (
                <div style={emptyInnerStyle}>No {status} orders</div>
              ) : (
                ordersInStatus.map((o) => (
                  <div
                    key={o.order.order_id}
                    style={{
                      ...cardStyle,
                      borderTop: `4px solid ${getStatusColor(o.order.status)}`
                    }}
                  >
                    <div style={cardHeader}>
                      <div>
                        <h3 style={{ margin: 0 }}>
                          🧾 Order #{o.order.order_id}
                        </h3>
                        <p style={{ margin: "4px 0", color: "#666" }}>
                          🍽 Table: {o.order.table_number || "N/A"}
                        </p>
                      </div>

                      <span
                        style={{
                          ...statusBadge,
                          background: `${getStatusColor(o.order.status)}20`,
                          color: getStatusColor(o.order.status)
                        }}
                      >
                        {o.order.status}
                      </span>
                    </div>

                    <div style={itemsBox}>
                      {o.items?.map((item) => (
                        <div key={item.order_item_id} style={itemRow}>
                          <span>🍽 {item.item_name}</span>
                          <span>x {item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      {o.order.status === "pending" && (
                        <button
                          onClick={() =>
                            updateStatus(o.order.order_id, "preparing")
                          }
                          style={{ ...btnStyle, background: "#3498db" }}
                        >
                          Start Cooking
                        </button>
                      )}

                      {o.order.status === "preparing" && (
                        <button
                          onClick={() =>
                            updateStatus(o.order.order_id, "ready")
                          }
                          style={{ ...btnStyle, background: "#2ecc71" }}
                        >
                          Mark Ready
                        </button>
                      )}

                      {o.order.status === "ready" && (
                        <button
                          onClick={() =>
                            updateStatus(o.order.order_id, "served")
                          }
                          style={{ ...btnStyle, background: "#9b59b6" }}
                        >
                          Serve
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#f7f8fa",
  padding: "24px"
};

const headerCardStyle = {
  background: "#fff",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  marginBottom: "20px"
};

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  flexWrap: "wrap"
};

const titleStyle = { margin: 0, fontSize: "30px" };
const subtitleStyle = { margin: "6px 0", color: "#666" };

const highlightCardStyle = {
  background: "#f8faff",
  padding: "10px 16px",
  borderRadius: "12px",
  border: "1px solid #e8eefc"
};

const searchStyle = {
  marginTop: "15px",
  padding: "10px",
  borderRadius: "10px",
  border: "1px solid #ddd",
  width: "300px"
};

const columnsWrapper = {
  display: "flex",
  gap: "20px",
  alignItems: "flex-start"
};

const columnStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: "12px"
};

const columnHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const countBadge = {
  background: "#eef3ff",
  padding: "5px 10px",
  borderRadius: "999px",
  fontWeight: "bold"
};

const cardStyle = {
  background: "#fff",
  borderRadius: "16px",
  padding: "15px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)"
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "10px"
};

const statusBadge = {
  padding: "5px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "capitalize"
};

const itemsBox = {
  borderTop: "1px dashed #ddd",
  marginTop: "10px",
  paddingTop: "10px",
  marginBottom: "10px"
};

const itemRow = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "14px"
};

const btnStyle = {
  flex: 1,
  padding: "8px",
  border: "none",
  borderRadius: "8px",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold"
};

const emptyCardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "16px"
};

const emptyInnerStyle = {
  background: "#fafbfc",
  padding: "12px",
  borderRadius: "10px",
  color: "#777"
};

export default KitchenPage;