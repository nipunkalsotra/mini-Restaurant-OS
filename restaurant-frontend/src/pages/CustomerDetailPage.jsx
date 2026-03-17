import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

function CustomerDetailPage() {
    const { customerId } = useParams();

    const [orders, setOrders] = useState([]);
    const [customer, setCustomer] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        // Fetch all customers to get this one
        API.get("/customers")
            .then(res => {
                const found = res.data.find(
                    c => c.customer_id === Number(customerId)
                );
                setCustomer(found);
            });

        // Fetch orders of this customer
        API.get(`/customers/${customerId}/orders`)
            .then(res => setOrders(res.data))
            .catch(err => console.error(err));
    }, [customerId]);

    if (!customer) return <p>Loading...</p>;

    const totalSpent = orders.reduce(
        (sum, o) => sum + (o.total_amount || 0),
        0
    );

    return (
        <div style={{ padding: "20px" }}>
            <h1>👤 {customer.customer_name}</h1>

            <div style={{
                background: "#fff",
                padding: "15px",
                borderRadius: "10px",
                marginBottom: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
                <p><b>📞 Phone:</b> {customer.customer_phone || "N/A"}</p>
                <p><b>💰 Total Spent:</b> ₹{totalSpent}</p>
                <p><b>🧾 Orders:</b> {orders.length}</p>
            </div>

            <h2>🧾 Order History</h2>
            <p style={{ color: "gray" }}> Click an order to view full details →</p>

            {orders.length === 0 ? (
                <p>No orders found</p>
            ) : (
                <table
                    border="1"
                    width="100%"
                    style={{ background: "#fff" }}
                >
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Table</th>
                            <th>Status</th>
                            <th>Total</th>
                            <th>Date</th>
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
                                    (e.currentTarget.style.background = "#f5f5f5")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = "white")
                                }
                            >
                                <td>{o.order_id}</td>
                                <td>{o.table_number || "N/A"}</td>
                                <td>{o.status}</td>
                                <td>₹{o.total_amount}</td>
                                <td>
                                    {new Date(o.created_at).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default CustomerDetailPage;