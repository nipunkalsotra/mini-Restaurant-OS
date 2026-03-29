function PendingOrdersPanel({ pendingOrders, markPaid }) {
    const totalPendingAmount = pendingOrders.reduce(
        (sum, o) => sum + (o.order?.total_amount || 0),
        0
    );
    return (
        <div style={{ padding: "15px" }}>
            <h3 style={{ padding: "10px" }}>🕓 Pending Payments</h3>

            <div style={{
                padding: "10px",
                background: "#fff3cd",
                borderBottom: "1px solid #ddd",
                fontWeight: "bold"
            }}>
                Total Pending: ₹{totalPendingAmount}
            </div>

            {pendingOrders.length === 0 ? (
                <p>No pending orders</p>
            ) : (
                pendingOrders.map(o => (
                    <div key={o.order.order_id} style={{
                        border: "1px solid #eee",
                        borderRadius: "8px",
                        padding: "10px",
                        marginBottom: "10px",
                        background: "#fafafa"
                    }}>
                        <b>Order #{o.order.order_id}</b>
                        <div style={{ fontSize: "12px", color: "#555" }}>
                            Table {o.order.table_number || "N/A"} • {o.order.customer_name}
                        </div>

                        <ul style={{ paddingLeft: "18px", marginTop: "5px" }}>
                            {o.items.map(i => (
                                <li key={i.menu_item_id}>
                                    {i.item_name} × {i.quantity}
                                </li>
                            ))}
                        </ul>

                        <div style={{ fontWeight: "bold", marginTop: "5px" }}>
                            ₹{o.order.total_amount}
                        </div>

                        <button
                            onClick={() => markPaid(o.order.order_id)}
                            style={{
                                marginTop: "8px",
                                width: "100%",
                                background: "#2ecc71",
                                color: "#fff",
                                border: "none",
                                padding: "6px",
                                borderRadius: "5px",
                                cursor: "pointer"
                            }}
                        >
                            Mark Paid
                        </button>
                    </div>
                ))
            )}
        </div>
    );
}

export default PendingOrdersPanel;