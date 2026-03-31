import { useEffect, useState, useCallback } from "react";
import API from "../api/api";
import DateFilter from "../components/DataFilter";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from "recharts";

function SalesPage() {
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [sales, setSales] = useState(null);

    const [dateFilter, setDateFilter] = useState({
        range: "all",
        startDate: "",
        endDate: ""
    });

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const res = await API.get("/restaurants");
                setRestaurants(res.data);
                if (res.data.length > 0) {
                    setSelectedRestaurant(res.data[0].restaurant_id);
                }
            } catch (err) {
                console.error("Error fetching restaurants:", err);
            }
        };

        fetchRestaurants();
    }, []);

    const fetchSales = useCallback(async (restaurantId) => {
        try {
            const params = {};

            if (dateFilter.startDate && dateFilter.endDate) {
                params.start_date = dateFilter.startDate;
                params.end_date = dateFilter.endDate;
            } else if (dateFilter.range !== "all") {
                params.range = dateFilter.range;
            }

            const res = await API.get(`/restaurants/${restaurantId}/sales`, {
                params
            });

            setSales(res.data);
        } catch (err) {
            console.error("Error fetching sales:", err);
            setSales(null);
        }
    }, [dateFilter]);

    useEffect(() => {
        if (selectedRestaurant) {
            fetchSales(selectedRestaurant);
        }
    }, [selectedRestaurant, fetchSales]);

    if (!restaurants.length) return <h2>Loading restaurants...</h2>;
    if (!sales) return <h2>Loading sales data...</h2>;

    const chartData = sales.daily_trend || [];

    return (
        <div style={{ padding: "20px", background: "#f7f8fa", minHeight: "100vh" }}>
            <h1 style={{ marginBottom: "20px" }}>📊 Sales Dashboard</h1>

            <DateFilter onChange={setDateFilter} />

            <h3 style={{ marginBottom: "15px", color: "#666" }}>
                Showing: {
                    dateFilter.startDate
                        ? `${dateFilter.startDate} → ${dateFilter.endDate || ""}`
                        : dateFilter.range
                }
            </h3>

            <div style={{ marginBottom: "20px" }}>
                <label style={{ fontWeight: "600" }}>
                    Select Restaurant:{" "}
                    <select
                        value={selectedRestaurant || ""}
                        onChange={(e) =>
                            setSelectedRestaurant(parseInt(e.target.value))
                        }
                        style={{
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px solid #ccc"
                        }}
                    >
                        {restaurants.map((r) => (
                            <option key={r.restaurant_id} value={r.restaurant_id}>
                                {r.restaurant_name}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "20px",
                    marginBottom: "30px"
                }}
            >
                <div style={cardStyle}>
                    <h3 style={cardTitle}>💰 Revenue</h3>
                    <h2 style={cardValue}>₹ {sales.summary.total_revenue}</h2>
                </div>

                <div style={cardStyle}>
                    <h3 style={cardTitle}>📦 Orders</h3>
                    <h2 style={cardValue}>{sales.summary.total_orders}</h2>
                </div>

                <div style={cardStyle}>
                    <h3 style={cardTitle}>📊 Avg Order</h3>
                    <h2 style={cardValue}>₹ {Math.round(sales.summary.avg_order_value)}</h2>
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                    marginBottom: "30px"
                }}
            >
                <div style={chartCardStyle}>
                    <h3 style={{ marginBottom: "15px" }}>📈 Revenue Trend</h3>
                    {chartData.length === 0 ? (
                        <p>No revenue data available</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#2ecc71"
                                    strokeWidth={3}
                                    name="Revenue"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div style={chartCardStyle}>
                    <h3 style={{ marginBottom: "15px" }}>📊 Orders Trend</h3>
                    {chartData.length === 0 ? (
                        <p>No orders data available</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    dataKey="orders"
                                    fill="#3498db"
                                    name="Orders"
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div style={chartCardStyle}>
                <h3 style={{ marginBottom: "15px" }}>🗓 Daily Trend Table</h3>

                {chartData.length === 0 ? (
                    <p>No data available</p>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                                <th style={tableHead}>Date</th>
                                <th style={tableHead}>Revenue</th>
                                <th style={tableHead}>Orders</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chartData.map((d, i) => (
                                <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                    <td style={tableCell}>{d.date}</td>
                                    <td style={tableCell}>₹ {d.revenue}</td>
                                    <td style={tableCell}>{d.orders}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

const cardStyle = {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)"
};

const chartCardStyle = {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)"
};

const cardTitle = {
    fontSize: "18px",
    marginBottom: "12px",
    color: "#444"
};

const cardValue = {
    fontSize: "36px",
    margin: 0
};

const tableHead = {
    padding: "12px 10px",
    fontWeight: "600"
};

const tableCell = {
    padding: "12px 10px"
};

export default SalesPage;