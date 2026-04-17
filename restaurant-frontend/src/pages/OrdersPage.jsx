import { useEffect, useMemo, useState, useCallback } from "react";
import API from "../api/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import DateFilter from "../components/DataFilter";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [searchParams] = useSearchParams();

  const initialStatus = searchParams.get("status") || "all";
  const restaurantId = searchParams.get("restaurant");

  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [dateFilter, setDateFilter] = useState({
    range: "all",
    startDate: "",
    endDate: ""
  });

  const navigate = useNavigate();

  const token = localStorage.getItem("restaurant_os_token");

  const logoutAndRedirect = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }, [navigate]);

  const fetchOrders = useCallback(async () => {
    try {
      if (!token) {
        navigate("/login");
        return;
      }

      setIsLoading(true);

      const params = {};

      if (dateFilter.startDate && dateFilter.endDate) {
        params.start_date = dateFilter.startDate;
        params.end_date = dateFilter.endDate;
      } else if (dateFilter.range && dateFilter.range !== "all") {
        params.range = dateFilter.range;
      }

      const res = await API.get("/orders", {
        params,
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

      alert(err.response?.data?.detail || "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, token, navigate, logoutAndRedirect]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
      case "pending":
        return "#f39c12";
      case "preparing":
        return "#3498db";
      case "ready":
        return "#2ecc71";
      case "served":
        return "#9b59b6";
      case "completed":
        return "#2c3e50";
      case "cancelled":
        return "#e74c3c";
      default:
        return "#999";
    }
  };

  const getPaymentColor = (paymentStatus) => {
    switch (paymentStatus) {
      case "unpaid":
        return "#e74c3c";
      case "paid":
        return "#2ecc71";
      default:
        return "#999";
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;

    try {
      await API.put(
        `/orders/${orderId}`,
        { status: "cancelled" },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === orderId ? { ...o, status: "cancelled" } : o
        )
      );
    } catch (err) {
      console.error(err.response?.data || err);

      if (err.response?.status === 401) {
        logoutAndRedirect();
        return;
      }

      alert(err.response?.data?.detail || "❌ Cannot cancel order");
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        o.order_id.toString().includes(search) ||
        (o.table_number || "").toString().includes(search) ||
        (o.customer_name || "").toLowerCase().includes(search);

      const matchesStatus =
        selectedStatus === "all" || o.status === selectedStatus;

      const matchesRestaurant =
        !restaurantId || o.restaurant_id === parseInt(restaurantId);

      return matchesSearch && matchesStatus && matchesRestaurant;
    });
  }, [orders, searchTerm, selectedStatus, restaurantId]);

  const getCount = (status) => {
    if (status === "all") return orders.length;
    return orders.filter((o) => o.status === status).length;
  };

  const grandTotal = useMemo(
    () => orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
    [orders]
  );

  const paidOrders = useMemo(
    () => orders.filter((o) => o.payment_status === "paid").length,
    [orders]
  );

  const unpaidOrders = useMemo(
    () => orders.filter((o) => o.payment_status === "unpaid").length,
    [orders]
  );

  const activeOrders = useMemo(
    () =>
      orders.filter((o) =>
        ["pending", "preparing", "ready", "served"].includes(o.status)
      ).length,
    [orders]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-secondary)",
        padding: "24px"
      }}
    >
      <div
        style={{
          background: "var(--bg-primary)",
          borderRadius: "18px",
          padding: "22px",
          boxShadow: "var(--shadow-sm)",
          marginBottom: "20px"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
            gap: "16px",
            flexWrap: "wrap"
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "30px" }}>📦 Orders Dashboard</h1>
            <p style={{ margin: "8px 0 0", color: "var(--text-secondary)" }}>
              Track order status, payment progress, and order activity in one place.
            </p>
          </div>

          <div style={highlightCardStyle}>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Current View</div>
            <div style={{ fontWeight: 700, fontSize: "18px" }}>
              {selectedStatus.toUpperCase()} Orders
            </div>
          </div>
        </div>

        <div style={{ marginTop: "18px" }}>
          <DateFilter onChange={setDateFilter} />
        </div>
      </div>

      <div style={summaryGridStyle}>
        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Total Orders</div>
          <div style={summaryValueStyle}>{orders.length}</div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Active Orders</div>
          <div style={summaryValueStyle}>{activeOrders}</div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Paid Orders</div>
          <div style={summaryValueStyle}>{paidOrders}</div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Unpaid Orders</div>
          <div style={summaryValueStyle}>{unpaidOrders}</div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Total Revenue</div>
          <div style={summaryValueStyle}>₹{grandTotal.toFixed(2)}</div>
        </div>
      </div>

      <div
        style={{
          background: "var(--bg-primary)",
          borderRadius: "18px",
          padding: "20px",
          boxShadow: "var(--shadow-sm)",
          marginBottom: "20px"
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "14px"
          }}
        >
          <input
            type="text"
            placeholder="🔍 Search by Order ID / Table / Customer"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px"
            }}
          >
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "999px",
                  border: "none",
                  cursor: "pointer",
                  background: selectedStatus === status ? "var(--text-primary)" : "var(--bg-tertiary)",
                  color: selectedStatus === status ? "var(--bg-primary)" : "var(--text-primary)",
                  fontWeight: 600
                }}
              >
                {status.toUpperCase()} ({getCount(status)})
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={emptyCardStyle}>Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div style={emptyCardStyle}>No orders found.</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px"
          }}
        >
          {filteredOrders.map((o) => (
            <div
              key={o.order_id}
              onClick={() => navigate(`/orders/${o.order_id}`)}
              style={{
                cursor: "pointer",
                padding: "18px",
                borderRadius: "18px",
                background: "var(--bg-primary)",
                boxShadow: "var(--shadow-sm)",
                borderTop: `5px solid ${getStatusColor(o.status)}`,
                transition: "0.2s ease"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  gap: "12px"
                }}
              >
                <div>
                  <h3 style={{ margin: 0 }}>🧾 Order #{o.order_id}</h3>
                  <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", fontSize: "14px" }}>
                    {o.customer_name || "Walk-in Customer"}
                  </p>
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    background: "var(--bg-tertiary)",
                    color: "#335dff",
                    padding: "6px 10px",
                    borderRadius: "999px",
                    fontWeight: 700,
                    whiteSpace: "nowrap"
                  }}
                >
                  Table {o.table_number || "N/A"}
                </div>
              </div>

              <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
                <div style={infoRowStyle}>
                  <span style={infoLabelStyle}>Status</span>
                  <span
                    style={{
                      ...badgeStyle,
                      background: `${getStatusColor(o.status)}20`,
                      color: getStatusColor(o.status)
                    }}
                  >
                    {o.status}
                  </span>
                </div>

                <div style={infoRowStyle}>
                  <span style={infoLabelStyle}>Payment Status</span>
                  <span
                    style={{
                      ...badgeStyle,
                      background: `${getPaymentColor(o.payment_status)}20`,
                      color: getPaymentColor(o.payment_status)
                    }}
                  >
                    {o.payment_status}
                  </span>
                </div>

                <div style={infoRowStyle}>
                  <span style={infoLabelStyle}>Payment Method</span>
                  <span style={{ fontWeight: 600 }}>{o.payment_method}</span>
                </div>

                <div style={infoRowStyle}>
                  <span style={infoLabelStyle}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: "18px" }}>
                    ₹{Number(o.total_amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {o.notes && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px 12px",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                    fontSize: "13px",
                    color: "var(--text-secondary)"
                  }}
                >
                  📝 {o.notes}
                </div>
              )}

              {o.status === "pending" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelOrder(o.order_id);
                  }}
                  style={{
                    marginTop: "14px",
                    padding: "10px 12px",
                    background: "#e74c3c",
                    color: "var(--bg-primary)",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: "bold"
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

const highlightCardStyle = {
  background: "var(--bg-tertiary)",
  padding: "12px 16px",
  borderRadius: "14px",
  border: "1px solid var(--border-color)",
  minWidth: "220px"
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
  marginBottom: "20px"
};

const summaryCardStyle = {
  background: "var(--bg-primary)",
  borderRadius: "18px",
  padding: "18px",
  boxShadow: "var(--shadow-sm)"
};

const summaryLabelStyle = {
  fontSize: "14px",
  color: "var(--text-secondary)",
  marginBottom: "8px"
};

const summaryValueStyle = {
  fontSize: "28px",
  fontWeight: 700,
  color: "var(--text-primary)"
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid var(--border-color)",
  background: "var(--bg-primary)",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box"
};

const emptyCardStyle = {
  background: "var(--bg-primary)",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "var(--shadow-sm)",
  color: "var(--text-secondary)"
};

const infoRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px"
};

const infoLabelStyle = {
  color: "var(--text-secondary)",
  fontSize: "14px"
};

const badgeStyle = {
  padding: "6px 10px",
  borderRadius: "999px",
  fontWeight: 700,
  fontSize: "12px",
  textTransform: "capitalize"
};

export default OrdersPage