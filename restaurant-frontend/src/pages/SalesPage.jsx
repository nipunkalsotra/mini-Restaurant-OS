import { useEffect, useState, useCallback } from "react";
import API from "../api/api";
import DateFilter from "../components/DataFilter";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
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
    const [salesError, setSalesError] = useState("");
    const [isSalesLoading, setIsSalesLoading] = useState(false);

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
            if (!restaurantId) return;

            setIsSalesLoading(true);
            setSalesError("");

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
            setSalesError(
                err.response?.data?.detail ||
                err.message ||
                "Failed to load sales data"
            );
        } finally {
            setIsSalesLoading(false);
        }
    }, [dateFilter]);

    useEffect(() => {
        if (selectedRestaurant) {
            fetchSales(selectedRestaurant);
        }
    }, [selectedRestaurant, fetchSales]);

    if (!restaurants.length) return <h2>Loading restaurants...</h2>;
    if (salesError && !sales) return <h2 style={{ color: "red" }}>Error: {salesError}</h2>;
    if (!sales) return <h2>Loading sales data...</h2>;

    const dailyTrend = sales.daily_trend || [];
    const topItems = sales.top_selling_items || [];
    const hourlyTraffic = sales.hourly_traffic || [];
    const weekdayTrends = sales.weekday_trends || [];
    const paymentBreakdown = sales.payment_breakdown || [];
    const categoryPerformance = sales.category_performance || [];
    const lowPerformingItems = sales.low_performing_items || [];

    const paymentColors = ["#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#e74c3c"];

    return (
        <div style={{ padding: "20px", background: "#f7f8fa", minHeight: "100vh" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h1 style={{ margin: 0 }}>📊 Sales Dashboard</h1>
                {isSalesLoading && (
                    <span style={{ color: "#666", fontSize: "14px" }}>Updating sales data...</span>
                )}
            </div>

            {salesError && sales && (
                <p style={{ color: "red", marginBottom: "12px" }}>
                    Error updating data: {salesError}
                </p>
            )}

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
                        onChange={(e) => setSelectedRestaurant(parseInt(e.target.value))}
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
                    <h3 style={cardTitle}>📊 Avg Order Value</h3>
                    <h2 style={cardValue}>₹ {Math.round(sales.summary.avg_order_value)}</h2>
                </div>
            </div>

            {sales.show_period_insights && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "20px",
                        marginBottom: "30px"
                    }}
                >
                    <div style={chartCardStyle}>
                        <h3 style={{ marginBottom: "15px" }}>📈 Growth Metrics</h3>
                        <div style={{ display: "flex", gap: "30px" }}>
                            <div>
                                <strong>Revenue Growth</strong>
                                <p
                                    style={{
                                        fontSize: "22px",
                                        fontWeight: "bold",
                                        color: sales.growth_metrics?.revenue_change_percentage >= 0 ? "green" : "red"
                                    }}
                                >
                                    {sales.growth_metrics?.revenue_change_percentage >= 0 ? "▲" : "▼"}{" "}
                                    {Math.abs(sales.growth_metrics?.revenue_change_percentage || 0).toFixed(2)}%
                                </p>
                            </div>

                            <div>
                                <strong>Orders Growth</strong>
                                <p
                                    style={{
                                        fontSize: "22px",
                                        fontWeight: "bold",
                                        color: sales.growth_metrics?.orders_change_percentage >= 0 ? "green" : "red"
                                    }}
                                >
                                    {sales.growth_metrics?.orders_change_percentage >= 0 ? "▲" : "▼"}{" "}
                                    {Math.abs(sales.growth_metrics?.orders_change_percentage || 0).toFixed(2)}%
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={chartCardStyle}>
                        <h3 style={{ marginBottom: "15px" }}>👥 Customer Insights</h3>
                        <div style={{ display: "flex", gap: "30px" }}>
                            <div>
                                <strong>New Customers</strong>
                                <p style={{ fontSize: "26px", fontWeight: "bold" }}>
                                    {sales.customer_insights?.new_customers || 0}
                                </p>
                            </div>

                            <div>
                                <strong>Returning Customers</strong>
                                <p style={{ fontSize: "26px", fontWeight: "bold" }}>
                                    {sales.customer_insights?.returning_customers || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                    {dailyTrend.length === 0 ? (
                        <p>No revenue data available</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={dailyTrend}>
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
                    {dailyTrend.length === 0 ? (
                        <p>No orders data available</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dailyTrend}>
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

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                    marginBottom: "30px"
                }}
            >
                <div style={chartCardStyle}>
                    <h3 style={{ marginBottom: "15px" }}>🍔 Top Selling Items</h3>
                    {topItems.length === 0 ? (
                        <p>No item data available</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={topItems} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="item_name" type="category" width={120} />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    dataKey="quantity_sold"
                                    fill="#f39c12"
                                    name="Quantity Sold"
                                    radius={[0, 6, 6, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div style={chartCardStyle}>
                    <h3 style={{ marginBottom: "15px" }}>🕒 Hourly Traffic</h3>
                    {hourlyTraffic.length === 0 ? (
                        <p>No hourly data available</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={hourlyTraffic}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    dataKey="orders"
                                    fill="#9b59b6"
                                    name="Orders"
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
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
                    <h3 style={{ marginBottom: "15px" }}>📅 Weekday Trends</h3>
                    {weekdayTrends.length === 0 ? (
                        <p>No weekday data available</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={weekdayTrends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    dataKey="revenue"
                                    fill="#2ecc71"
                                    name="Revenue"
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div style={chartCardStyle}>
                    <h3 style={{ marginBottom: "15px" }}>💳 Payment Breakdown</h3>
                    {paymentBreakdown.length === 0 ? (
                        <p>No payment data available</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={paymentBreakdown}
                                    dataKey="revenue"
                                    nameKey="payment_method"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                >
                                    {paymentBreakdown.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={paymentColors[index % paymentColors.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
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
                    <h3 style={{ marginBottom: "15px" }}>🍽️ Category Performance</h3>
                    {categoryPerformance.length === 0 ? (
                        <p>No category data</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={categoryPerformance}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="category_name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    dataKey="revenue"
                                    fill="#1abc9c"
                                    name="Revenue"
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div style={chartCardStyle}>
                    <h3 style={{ marginBottom: "15px" }}>⚠️ Low Performing Items</h3>
                    {lowPerformingItems.length === 0 ? (
                        <p>No data</p>
                    ) : (
                        lowPerformingItems.map((item, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "10px 0",
                                    borderBottom: "1px solid #eee"
                                }}
                            >
                                <span>{item.item_name}</span>
                                <strong>{item.quantity_sold}</strong>
                            </div>
                        ))
                    )}
                </div>
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

export default SalesPage;