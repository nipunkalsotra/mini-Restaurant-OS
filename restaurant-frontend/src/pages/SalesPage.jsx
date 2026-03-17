import { useEffect, useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

function SalesPage() {
    const navigate = useNavigate();

    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [sales, setSales] = useState(null);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchRestaurants();
    }, []);

    // Fetch all restaurants for dropdown
    const fetchRestaurants = async () => {
        try {
            const res = await API.get("/restaurants");
            setRestaurants(res.data);
            if (res.data.length > 0) {
                setSelectedRestaurant(res.data[0].restaurant_id); // default select first restaurant
            }
        } catch (err) {
            console.error("Error fetching restaurants:", err);
        }
    };

    // Fetch sales and orders whenever selectedRestaurant changes
    useEffect(() => {
        if (selectedRestaurant) {
            fetchSales(selectedRestaurant);
            fetchOrders(selectedRestaurant);
        }
    }, [selectedRestaurant]);

    const fetchSales = async (restaurantId) => {
        try {
            const res = await API.get(`/restaurants/${restaurantId}/sales`);
            setSales(res.data);
        } catch (err) {
            console.error("Error fetching sales:", err);
            setSales(null);
        }
    };

    const fetchOrders = async (restaurantId) => {
        try {
            const res = await API.get("/orders");
            const restaurantOrders = res.data.filter(order => order.restaurant_id === restaurantId);
            setOrders(restaurantOrders);
        } catch (err) {
            console.error("Error fetching orders:", err);
            setOrders([]);
        }
    };

    if (!restaurants.length) return <h2>Loading restaurants...</h2>;
    if (!sales) return <h2>Loading sales data...</h2>;

    return (
        <div style={{ padding: "20px" }}>
            <h1>📊 Sales Dashboard</h1>

            {/* Restaurant Selector */}
            <div style={{ marginBottom: "20px" }}>
                <label>
                    Select Restaurant:{" "}
                    <select
                        value={selectedRestaurant}
                        onChange={(e) => setSelectedRestaurant(parseInt(e.target.value))}
                    >
                        {restaurants.map(r => (
                            <option key={r.restaurant_id} value={r.restaurant_id}>
                                {r.restaurant_name}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {/* SUMMARY CARDS */}
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
                <div style={cardStyle}>
                    <h3>💰 Revenue</h3>
                    <h2>₹ {sales.total_revenue}</h2>
                </div>

                <div style={cardStyle}>
                    <h3>📦 Total Orders</h3>
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
            <h2>Orders</h2>
            {orders.length === 0 ? (
                <p>No orders yet.</p>
            ) : (
                orders.map(order => (
                    <div
                        key={order.order_id}
                        style={orderCard}
                        onClick={() => navigate(`/orders/${order.order_id}`)}
                    >
                        <h3>Order #{order.order_id}</h3>
                        <p>Status: {order.status}</p>
                        <p>Total: ₹ {order.total_amount}</p>
                        <p>Table: {order.table_number}</p>
                        <p>Customer: {order.customer_name || "Guest"}</p>
                    </div>
                ))
            )}
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
    cursor: "pointer",
    background: "#fff"
};

export default SalesPage;