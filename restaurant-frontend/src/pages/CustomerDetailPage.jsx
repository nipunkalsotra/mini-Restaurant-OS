import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";

function CustomerDetailPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("restaurant_os_token");

  const [orders, setOrders] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const logoutAndRedirect = useCallback(() => {
    localStorage.removeItem("restaurant_os_token");
    localStorage.removeItem("user");
    navigate("/login");
  }, [navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);

        const [customersRes, ordersRes] = await Promise.all([
          API.get("/customers", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          API.get(`/customers/${customerId}/orders`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        ]);

        const found = customersRes.data.find(
          (c) => c.customer_id === Number(customerId)
        );

        setCustomer(found || null);
        setOrders(ordersRes.data || []);
      } catch (err) {
        console.error(err);

        if (err.response?.status === 401) {
          logoutAndRedirect();
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCustomerData();
    }
  }, [customerId, token, logoutAndRedirect]);

  const totalSpent = useMemo(
    () => orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    [orders]
  );

  const avgOrderValue = useMemo(
    () => (orders.length > 0 ? totalSpent / orders.length : 0),
    [totalSpent, orders]
  );

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

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={emptyCardStyle}>Loading customer details...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={pageStyle}>
        <div style={emptyCardStyle}>Customer not found.</div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={headerCardStyle}>
        <div style={headerRowStyle}>
          <div>
            <button onClick={() => navigate(-1)} style={backButtonStyle}>
              ← Back
            </button>

            <h1 style={titleStyle}>👤 {customer.customer_name}</h1>
            <p style={subtitleStyle}>
              Customer profile, spending summary, and full order history.
            </p>
          </div>

          <div style={highlightCardStyle}>
            <div style={{ fontSize: "13px", color: "#666" }}>Customer ID</div>
            <div style={{ fontWeight: 700, fontSize: "22px" }}>
              #{customer.customer_id}
            </div>
          </div>
        </div>
      </div>

      <div style={summaryGridStyle}>
        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Phone</div>
          <div style={summaryValueStyle}>
            {customer.customer_phone || "N/A"}
          </div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Total Spent</div>
          <div style={summaryValueStyle}>₹{totalSpent.toFixed(2)}</div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Orders</div>
          <div style={summaryValueStyle}>{orders.length}</div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Avg Order Value</div>
          <div style={summaryValueStyle}>₹{avgOrderValue.toFixed(2)}</div>
        </div>
      </div>

      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "16px"
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>🧾 Order History</h2>
            <p style={{ margin: "8px 0 0", color: "#666" }}>
              Click any order to open full order details.
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div style={emptyInnerStyle}>No orders found for this customer.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Order ID</th>
                  <th style={thStyle}>Table</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Payment Status</th>
                  <th style={thStyle}>Total</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.order_id}
                    onClick={() => navigate(`/orders/${o.order_id}`)}
                    style={{
                      cursor: "pointer",
                      transition: "0.2s"
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f8fafc")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "white")
                    }
                  >
                    <td style={tdStyle}>#{o.order_id}</td>
                    <td style={tdStyle}>{o.table_number || "N/A"}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          ...badgeStyle,
                          background: `${getStatusColor(o.status)}20`,
                          color: getStatusColor(o.status)
                        }}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          ...badgeStyle,
                          background: `${getPaymentColor(o.payment_status)}20`,
                          color: getPaymentColor(o.payment_status)
                        }}
                      >
                        {o.payment_status}
                      </span>
                    </td>
                    <td style={tdStyle}>₹{Number(o.total_amount || 0).toFixed(2)}</td>
                    <td style={tdStyle}>
                      {new Date(o.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr>
                  <td colSpan="4" style={tfootLabelStyle}>
                    Total Spent
                  </td>
                  <td colSpan="2" style={tfootValueStyle}>
                    ₹{totalSpent.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
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
  padding: "22px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  marginBottom: "20px"
};

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  flexWrap: "wrap",
  gap: "16px"
};

const titleStyle = {
  margin: "12px 0 0",
  fontSize: "30px"
};

const subtitleStyle = {
  margin: "8px 0 0",
  color: "#666"
};

const highlightCardStyle = {
  background: "#f8faff",
  padding: "12px 16px",
  borderRadius: "14px",
  border: "1px solid #e8eefc",
  minWidth: "180px"
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
  marginBottom: "20px"
};

const summaryCardStyle = {
  background: "#fff",
  borderRadius: "18px",
  padding: "18px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)"
};

const summaryLabelStyle = {
  fontSize: "14px",
  color: "#666",
  marginBottom: "8px"
};

const summaryValueStyle = {
  fontSize: "22px",
  fontWeight: 700,
  color: "#222"
};

const cardStyle = {
  background: "#fff",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)"
};

const emptyCardStyle = {
  background: "#fff",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  color: "#666"
};

const emptyInnerStyle = {
  background: "#fafbfc",
  border: "1px solid #eef1f5",
  borderRadius: "12px",
  padding: "16px",
  color: "#666"
};

const backButtonStyle = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "none",
  background: "#ecf0f1",
  color: "#333",
  fontWeight: "bold",
  cursor: "pointer"
};

const badgeStyle = {
  padding: "6px 10px",
  borderRadius: "999px",
  fontWeight: 700,
  fontSize: "12px",
  textTransform: "capitalize"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fff"
};

const thStyle = {
  textAlign: "left",
  padding: "14px",
  background: "#f8fafc",
  borderBottom: "1px solid #e8edf3",
  fontSize: "14px",
  color: "#444",
  whiteSpace: "nowrap"
};

const tdStyle = {
  padding: "14px",
  borderBottom: "1px solid #eef1f5",
  color: "#222",
  whiteSpace: "nowrap"
};

const tfootLabelStyle = {
  padding: "14px",
  fontWeight: "bold",
  background: "#fafbfc"
};

const tfootValueStyle = {
  padding: "14px",
  fontWeight: "bold",
  background: "#fafbfc"
};

export default CustomerDetailPage;