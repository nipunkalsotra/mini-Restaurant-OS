import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";

function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("restaurant_os_token");

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
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
    const fetchOrder = async () => {
      try {
        setLoading(true);

        const res = await API.get(`/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setOrder(res.data.order);
        setItems(res.data.items || []);
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
      fetchOrder();
    }
  }, [orderId, token, logoutAndRedirect]);

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

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f7f8fa",
          padding: "24px"
        }}
      >
        <div style={emptyCardStyle}>Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f7f8fa",
          padding: "24px"
        }}
      >
        <div style={emptyCardStyle}>Order not found.</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f8fa",
        padding: "24px"
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "18px",
          padding: "22px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
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
            <button onClick={() => navigate(-1)} style={backButtonStyle}>
              ← Back
            </button>

            <h1 style={{ margin: "12px 0 0", fontSize: "30px" }}>
              🧾 Order #{order.order_id}
            </h1>

            <p style={{ margin: "8px 0 0", color: "#666" }}>
              {order.customer_name || "Walk-in Customer"} •{" "}
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>

          <div style={highlightCardStyle}>
            <div style={{ fontSize: "13px", color: "#666" }}>Order Total</div>
            <div style={{ fontWeight: 700, fontSize: "22px" }}>
              ₹{Number(order.total_amount || 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div style={summaryGridStyle}>
        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Table</div>
          <div style={summaryValueStyle}>{order.table_number || "N/A"}</div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Items</div>
          <div style={summaryValueStyle}>{itemCount}</div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Status</div>
          <div
            style={{
              ...badgeStyle,
              background: `${getStatusColor(order.status)}20`,
              color: getStatusColor(order.status),
              display: "inline-block",
              marginTop: "8px"
            }}
          >
            {order.status}
          </div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Payment Status</div>
          <div
            style={{
              ...badgeStyle,
              background: `${getPaymentColor(order.payment_status)}20`,
              color: getPaymentColor(order.payment_status),
              display: "inline-block",
              marginTop: "8px"
            }}
          >
            {order.payment_status}
          </div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Payment Method</div>
          <div style={summaryValueStyle}>{order.payment_method}</div>
        </div>
      </div>

      <div style={gridStyle}>
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>📋 Order Info</h2>

          <div style={infoListStyle}>
            <InfoRow label="Customer Name" value={order.customer_name || "Walk-in"} />
            <InfoRow label="Table Number" value={order.table_number || "N/A"} />
            <InfoRow label="Status" value={order.status} />
            <InfoRow label="Payment Method" value={order.payment_method} />
            <InfoRow label="Payment Status" value={order.payment_status} />
            <InfoRow
              label="Created At"
              value={new Date(order.created_at).toLocaleString()}
            />
            {order.updated_at && (
              <InfoRow
                label="Last Updated"
                value={new Date(order.updated_at).toLocaleString()}
              />
            )}
          </div>

          {order.notes && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                background: "#fafbfc",
                border: "1px solid #eef1f5",
                borderRadius: "12px",
                color: "#555"
              }}
            >
              <strong>📝 Notes</strong>
              <p style={{ margin: "8px 0 0" }}>{order.notes}</p>
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>💰 Bill Summary</h2>

          <div style={billCardStyle}>
            <BillRow
              label="Items Total"
              value={`₹${Number(order.total_amount || 0).toFixed(2)}`}
            />
            <BillRow label="Number of Items" value={itemCount} />
            <hr style={{ margin: "12px 0" }} />
            <BillRow
              label="Grand Total"
              value={`₹${Number(order.total_amount || 0).toFixed(2)}`}
              bold
            />
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: "20px" }}>
        <h2 style={sectionTitleStyle}>🍽️ Ordered Items</h2>

        {items.length === 0 ? (
          <div style={emptyInnerStyle}>No items found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Item</th>
                  <th style={thStyle}>Qty</th>
                  <th style={thStyle}>Price</th>
                  <th style={thStyle}>Total</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.order_item_id}>
                    <td style={tdStyle}>{item.item_name}</td>
                    <td style={tdStyle}>{item.quantity}</td>
                    <td style={tdStyle}>₹{Number(item.price_at_order).toFixed(2)}</td>
                    <td style={tdStyle}>
                      ₹{Number(item.quantity * item.price_at_order).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr>
                  <td colSpan="3" style={tfootLabelStyle}>
                    Grand Total
                  </td>
                  <td style={tfootValueStyle}>
                    ₹{Number(order.total_amount || 0).toFixed(2)}
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

function InfoRow({ label, value }) {
  return (
    <div style={infoRowStyle}>
      <span style={infoLabelStyle}>{label}</span>
      <span style={{ fontWeight: 600, color: "#222", textTransform: "capitalize" }}>
        {value}
      </span>
    </div>
  );
}

function BillRow({ label, value, bold = false }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "10px",
        fontWeight: bold ? "bold" : "normal",
        fontSize: bold ? "18px" : "14px"
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1.3fr 0.8fr",
  gap: "20px"
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

const highlightCardStyle = {
  background: "#f8faff",
  padding: "12px 16px",
  borderRadius: "14px",
  border: "1px solid #e8eefc",
  minWidth: "220px"
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
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
  fontSize: "24px",
  fontWeight: 700,
  color: "#222",
  textTransform: "capitalize"
};

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: "16px"
};

const badgeStyle = {
  padding: "6px 10px",
  borderRadius: "999px",
  fontWeight: 700,
  fontSize: "12px",
  textTransform: "capitalize"
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

const infoListStyle = {
  display: "grid",
  gap: "12px"
};

const infoRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  paddingBottom: "10px",
  borderBottom: "1px solid #f1f3f6"
};

const infoLabelStyle = {
  color: "#666",
  fontSize: "14px"
};

const billCardStyle = {
  background: "#f9fbff",
  border: "1px solid #e6eefb",
  borderRadius: "14px",
  padding: "16px"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fff",
  overflow: "hidden"
};

const thStyle = {
  textAlign: "left",
  padding: "14px",
  background: "#f8fafc",
  borderBottom: "1px solid #e8edf3",
  fontSize: "14px",
  color: "#444"
};

const tdStyle = {
  padding: "14px",
  borderBottom: "1px solid #eef1f5",
  color: "#222"
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

export default OrderDetailPage;