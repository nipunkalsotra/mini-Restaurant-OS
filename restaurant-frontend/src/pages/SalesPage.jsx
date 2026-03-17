import { useEffect, useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

function SalesPage() {

    const navigate = useNavigate();

    const [sales, setSales] = useState(null);
    const [orders, setOrders] = useState([]);

    const restaurantId = 1;

    useEffect(() => {
        fetchSales();
        fetchOrders();
    }, []);

    const fetchSales = async () => {
        try {
            const res = await API.get(`/restaurants/${restaurantId}/sales`);
            setSales(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await API.get("/orders");
            setOrders(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    if (!sales) return <h2>Loading...</h2>;

    return (
        <div style={{ padding: "20px" }}>
            <h1>📊 Sales Dashboard</h1>

            {/* SUMMARY CARDS */}
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
                <div style={cardStyle}>
                    <h3>💰 Revenue</h3>
                    <h2>₹ {sales.total_revenue}</h2>
                </div>

                <div style={cardStyle}>
                    <h3>📦 Orders</h3>
                    <h2>{sales.total_orders}</h2>
                </div>
            </div>

            {/* STATUS COUNTS */}
            <div style={{ marginBottom: "20px" }}>
                <h2>Order Status</h2>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {Object.entries(sales.status_counts).map(([status, count]) => (
                        <div key={status} style={statusCard}>
                            <strong>{status.toUpperCase()}</strong>
                            <p>{count}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ORDERS LIST */}
            <h2>All Orders</h2>

            {orders.map(order => (
                <div key={order.order_id} style={orderCard}>
                    <div
                        key={order.order_id}
                        style={orderCard}
                        onClick={() => navigate(`/orders/${order.order_id}`)}
                    >
                        <h3>Order #{order.order_id}</h3>
                        <p>Status: {order.status}</p>
                        <p>Total: ₹ {order.total_amount}</p>
                        <p>Table: {order.table_number}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

const cardStyle = {
    padding: "20px",
    borderRadius: "10px",
    background: "#f5f5f5",
    minWidth: "150px"
};

const statusCard = {
    padding: "10px",
    borderRadius: "8px",
    background: "#e0f7fa",
    minWidth: "100px",
    textAlign: "center"
};

const orderCard = {
    border: "1px solid #ddd",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "8px",
    cursor: "pointer"
};

export default SalesPage;