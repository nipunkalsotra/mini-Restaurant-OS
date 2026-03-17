import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/api";

function OrderDetailPage() {
    const { orderId } = useParams();

    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);

    useEffect(() => {
        API.get(`/orders/${orderId}`)
            .then(res => {
                setOrder(res.data.order);
                setItems(res.data.items);
            })
            .catch(err => console.error(err));
    }, [orderId]);

    if (!order) return <p>Loading...</p>;

    return (
        <div style={{ padding: "20px" }}>
            <h1>🧾 Order #{order.order_id}</h1>

            {/* ORDER INFO */}
            <div style={{
                background: "#fff",
                padding: "15px",
                borderRadius: "10px",
                marginBottom: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
                <p><strong>Customer Name:</strong> {order.customer_name || "Walk-in"}</p>
                <p><b>🍽 Table:</b> {order.table_number || "N/A"}</p>
                <p><b>📌 Status:</b> {order.status}</p>
                <p><b>💳 Payment:</b> {order.payment_method}</p>
                <p><b>💰 Total:</b> ₹{order.total_amount}</p>

                {order.notes && (
                    <p><b>📝 Notes:</b> {order.notes}</p>
                )}

                <p style={{ fontSize: "12px", color: "gray" }}>
                    {new Date(order.created_at).toLocaleString()}
                </p>
            </div>

            {/* ITEMS */}
            <h2>🍽 Items</h2>

            {items.length === 0 ? (
                <p>No items found</p>
            ) : (
                <table border="1" width="100%" style={{ background: "#fff" }}>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>

                    <tbody>
                        {items.map((item) => (
                            <tr key={item.order_item_id}>
                                <td>{item.item_name}</td>
                                <td>{item.quantity}</td>
                                <td>₹{item.price_at_order}</td>
                                <td>₹{item.quantity * item.price_at_order}</td>
                            </tr>
                        ))}
                    </tbody>

                    {/* ✅ TOTAL ROW */}
                    <tfoot>
                        <tr>
                            <td colSpan="3"><b>Grand Total</b></td>
                            <td><b>₹{order.total_amount}</b></td>
                        </tr>
                    </tfoot>
                </table>
            )}
        </div>
    );
}

export default OrderDetailPage;