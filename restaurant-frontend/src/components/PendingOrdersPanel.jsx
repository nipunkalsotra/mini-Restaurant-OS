import { useState } from "react";

function PendingOrdersPanel({ pendingOrders, onSelectOrder, selectedOrderId }) {
  const [search, setSearch] = useState("");

  const filteredOrders = pendingOrders.filter((o) =>
    `${o.order.customer_name || "walk-in"} ${o.order.order_id} ${o.order.table_number || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPendingAmount = filteredOrders.reduce(
    (sum, o) => sum + (o.order?.total_amount || 0),
    0
  );

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
        color: "var(--text-primary)"
      }}
    >
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid var(--border-color)",
          fontWeight: "bold",
          fontSize: "18px",
          color: "var(--text-primary)",
          background: "var(--bg-primary)"
        }}
      >
        🕓 Pending Payments
      </div>

      <div style={{ padding: "12px" }}>
        <input
          type="text"
          placeholder="Search by customer / order / table..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            outline: "none",
            background: "var(--bg-tertiary)",
            color: "var(--text-primary)",
            boxSizing: "border-box"
          }}
        />
      </div>

      <div
        style={{
          margin: "0 12px 12px",
          padding: "12px",
          background: "var(--bg-tertiary)",
          borderRadius: "12px",
          fontWeight: "bold",
          textAlign: "center",
          border: "1px solid var(--border-color)",
          color: "var(--text-primary)",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        💰 ₹{totalPendingAmount.toFixed(2)} Pending
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}
      >
        {filteredOrders.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>
            No matching orders
          </p>
        ) : (
          filteredOrders.map((o) => {
            const isSelected = Number(selectedOrderId) === Number(o.order.order_id);

            return (
              <div
                key={o.order.order_id}
                onClick={() => onSelectOrder(o)}
                style={{
                  background: isSelected ? "var(--bg-secondary)" : "var(--bg-primary)",
                  borderRadius: "14px",
                  padding: "14px",
                  border: isSelected
                    ? "2px solid #3498db"
                    : "1px solid var(--border-color)",
                  boxShadow: isSelected
                    ? "0 6px 16px rgba(52,152,219,0.18)"
                    : "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "0.2s ease",
                  color: "var(--text-primary)"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                    fontSize: "15px",
                    color: "var(--text-primary)"
                  }}
                >
                  <span>Order #{o.order.order_id}</span>
                  <span>₹{Number(o.order.total_amount || 0).toFixed(2)}</span>
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)"
                  }}
                >
                  Table: {o.order.table_number || "N/A"} |{" "}
                  {o.order.customer_name || "Walk-in"}
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--text-primary)",
                    background: "var(--bg-tertiary)",
                    padding: "8px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)"
                  }}
                >
                  {o.items?.map((i) => (
                    <div key={`${o.order.order_id}-${i.menu_item_id}`}>
                      {i.item_name} × {i.quantity}
                    </div>
                  ))}
                </div>

                {isSelected && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#4da3ff",
                      fontWeight: "bold"
                    }}
                  >
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