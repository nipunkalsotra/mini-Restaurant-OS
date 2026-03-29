import { useState } from "react";

function PendingOrdersPanel({ pendingOrders, onSelectOrder, selectedOrderId }) {

  const [search, setSearch] = useState("");

  // 🔍 FILTER LOGIC
  const filteredOrders = pendingOrders.filter(o =>
    (o.order.customer_name || "walk-in")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPendingAmount = filteredOrders.reduce(
    (sum, o) => sum + (o.order?.total_amount || 0),
    0
  );

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column"
    }}>

      {/* HEADER */}
      <div style={{
        padding: "15px",
        borderBottom: "1px solid #eee",
        fontWeight: "bold",
        fontSize: "18px"
      }}>
        🕓 Pending Payments
      </div>

      {/* 🔍 SEARCH BAR */}
      <div style={{ padding: "10px" }}>
        <input
          type="text"
          placeholder="Search by customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
        />
      </div>

      {/* TOTAL */}
      <div style={{
        margin: "10px",
        padding: "12px",
        background: "#ffeaa7",
        borderRadius: "10px",
        fontWeight: "bold",
        textAlign: "center"
      }}>
        💰 ₹{totalPendingAmount} Pending
      </div>

      {/* LIST */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "10px"
      }}>

        {filteredOrders.length === 0 ? (
          <p style={{ textAlign: "center" }}>No matching orders</p>
        ) : (
          filteredOrders.map(o => {

            const isSelected =
              Number(selectedOrderId) === Number(o.order.order_id);

            return (
              <div
                key={o.order.order_id}
                onClick={() => onSelectOrder(o)}

                // 🔥 HOVER + SELECT EFFECT
                style={{
                  background: isSelected ? "#d0ebff" : "#fff",
                  borderRadius: "12px",
                  padding: "12px",
                  border: isSelected ? "2px solid #3498db" : "1px solid #eee",
                  boxShadow: isSelected
                    ? "0 4px 12px rgba(52,152,219,0.3)"
                    : "0 2px 8px rgba(0,0,0,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}

                // 👇 HOVER EFFECT
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = "scale(1.02)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0,0,0,0.08)";
                  }
                }}
              >

                {/* TOP ROW */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "bold"
                }}>
                  <span>Order #{o.order.order_id}</span>
                  <span>₹{o.order.total_amount}</span>
                </div>

                {/* SUB INFO */}
                <div style={{ fontSize: "13px", color: "#555" }}>
                  Table: {o.order.table_number || "N/A"} |{" "}
                  {o.order.customer_name || "Walk-in"}
                </div>

                {/* ITEMS */}
                <div style={{
                  fontSize: "13px",
                  color: "#333",
                  background: "#fafafa",
                  padding: "8px",
                  borderRadius: "6px"
                }}>
                  {o.items?.map(i => (
                    <div key={i.menu_item_id}>
                      {i.item_name} × {i.quantity}
                    </div>
                  ))}
                </div>

                {/* ACTIVE BADGE */}
                {isSelected && (
                  <div style={{
                    fontSize: "12px",
                    color: "#3498db",
                    fontWeight: "bold"
                  }}>
                    ● Active Order
                  </div>
                )}

              </div>
            );
          })
        )}

      </div>
    </div>
  );
}

export default PendingOrdersPanel;