import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const token = localStorage.getItem("restaurant_os_token");

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
    const fetchRestaurants = async () => {
      try {
        const res = await API.get("/restaurants", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setRestaurants(res.data);

        if (res.data.length > 0) {
          setSelectedRestaurant(res.data[0].restaurant_id);
        }
      } catch (err) {
        console.error("Error fetching restaurants:", err);

        if (err.response?.status === 401) {
          logoutAndRedirect();
        }
      }
    };

    if (token) {
      fetchRestaurants();
    }
  }, [token, logoutAndRedirect]);

  const comparisonLabel = useMemo(() => {
    const unit =
      sales?.growth_metrics?.comparison_unit ||
      sales?.customer_insights?.comparison_unit;

    switch (unit) {
      case "day":
        return "Day-over-Day";
      case "week":
        return "Week-over-Week";
      case "month":
        return "Month-over-Month";
      case "year":
        return "Year-over-Year";
      case "custom":
        return "Previous Period Comparison";
      default:
        return "";
    }
  }, [sales]);

  const fetchSales = useCallback(
    async (restaurantId) => {
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
          params,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setSales(res.data);
      } catch (err) {
        console.error("Error fetching sales:", err);

        if (err.response?.status === 401) {
          logoutAndRedirect();
          return;
        }

        setSalesError(
          err.response?.data?.detail ||
            err.message ||
            "Failed to load sales data"
        );
      } finally {
        setIsSalesLoading(false);
      }
    },
    [dateFilter, token, logoutAndRedirect]
  );

  useEffect(() => {
    if (selectedRestaurant) {
      fetchSales(selectedRestaurant);
    }
  }, [selectedRestaurant, fetchSales]);

  if (!restaurants.length) return <h2>Loading restaurants...</h2>;
  if (salesError && !sales) return <h2 style={{ color: "red" }}>Error: {salesError}</h2>;
  if (!sales) return <h2>Loading sales data...</h2>;

  const summary = sales.summary || {};
  const growthMetrics = sales.growth_metrics || {};
  const customerInsights = sales.customer_insights || {};

  const dailyTrend = sales.daily_trend || [];
  const topItems = sales.top_selling_items || [];
  const hourlyTraffic = sales.hourly_traffic || [];
  const weekdayTrends = sales.weekday_trends || [];
  const paymentBreakdown = sales.payment_breakdown || [];
  const categoryPerformance = sales.category_performance || [];
  const lowPerformingItems = sales.low_performing_items || [];

  const anomalyFlags = sales.anomaly_flags || [];
  const topInsight = sales.top_insight || {};
  const insightText = sales.insight_text || [];
  const trendBucket = sales.trend_bucket || "day";

  const paymentColors = ["#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#e74c3c"];

  const formatPercent = (value) => {
    const num = Number(value || 0);
    return `${Math.abs(num).toFixed(2)}%`;
  };

  const getTrendArrow = (value) => (Number(value || 0) >= 0 ? "▲" : "▼");

  const getTrendColor = (value) => (Number(value || 0) >= 0 ? "green" : "red");

  const formatTrendBucketLabel = (bucket) => {
    switch (bucket) {
      case "hour":
        return "Hourly";
      case "day":
        return "Daily";
      case "month":
        return "Monthly";
      default:
        return bucket;
    }
  };

  return (
    <div style={{ padding: "20px", background: "var(--bg-secondary)", minHeight: "100vh" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"
        }}
      >
        <h1 style={{ margin: 0 }}>📊 Sales Dashboard</h1>
        {isSalesLoading && (
          <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Updating sales data...
          </span>
        )}
      </div>

      {salesError && sales && (
        <p style={{ color: "red", marginBottom: "12px" }}>
          Error updating data: {salesError}
        </p>
      )}

      <DateFilter onChange={setDateFilter} />

      <h3 style={{ marginBottom: "8px", color: "var(--text-secondary)" }}>
        Showing:{" "}
        {dateFilter.startDate
          ? `${dateFilter.startDate} → ${dateFilter.endDate || ""}`
          : dateFilter.range}
      </h3>

      {comparisonLabel && (
        <p style={{ marginTop: 0, marginBottom: "20px", color: "var(--text-secondary)" }}>
          Analytics comparison mode: <strong>{comparisonLabel}</strong>
        </p>
      )}

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
          <h2 style={cardValue}>₹ {Number(summary.total_revenue || 0).toFixed(2)}</h2>
        </div>

        <div style={cardStyle}>
          <h3 style={cardTitle}>📦 Orders</h3>
          <h2 style={cardValue}>{summary.total_orders || 0}</h2>
        </div>

        <div style={cardStyle}>
          <h3 style={cardTitle}>📊 Avg Order Value</h3>
          <h2 style={cardValue}>₹ {Math.round(summary.avg_order_value || 0)}</h2>
        </div>
      </div>

      {topInsight?.message && (
        <div
          style={{
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            color: "white",
            padding: "20px",
            borderRadius: "16px",
            marginBottom: "30px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.15)"
          }}
        >
          <h3 style={{ margin: 0 }}>🧠 {topInsight.title}</h3>
          <p style={{ margin: "10px 0 0", fontSize: "16px", lineHeight: 1.5 }}>
            {topInsight.message}
          </p>
        </div>
      )}

      {anomalyFlags.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          {anomalyFlags.map((flag, i) => (
            <div
              key={i}
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                marginBottom: "10px",
                background:
                  flag.type === "danger"
                    ? "#ffe5e5"
                    : flag.type === "warning"
                    ? "#fff5e6"
                    : "#e8f9f0",
                color:
                  flag.type === "danger"
                    ? "#c0392b"
                    : flag.type === "warning"
                    ? "#d35400"
                    : "#27ae60",
                border: "1px solid rgba(0,0,0,0.05)"
              }}
            >
              <strong>{flag.title}</strong>
              <div style={{ marginTop: "4px" }}>{flag.message}</div>
            </div>
          ))}
        </div>
      )}

      {insightText.length > 0 && (
        <div style={{ ...chartCardStyle, marginBottom: "30px" }}>
          <h3 style={{ marginTop: 0 }}>📌 Key Insights</h3>
          <ul style={{ paddingLeft: "20px", marginBottom: 0 }}>
            {insightText.map((text, i) => (
              <li key={i} style={{ marginBottom: "8px", lineHeight: 1.5 }}>
                {text}
              </li>
            ))}
          </ul>
        </div>
      )}

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
            <div style={sectionHeaderStyle}>
              <h3 style={{ margin: 0 }}>📈 Growth Metrics</h3>
              {comparisonLabel && <span style={badgeStyle}>{comparisonLabel}</span>}
            </div>

            <div style={metricsGridStyle}>
              <MetricCard
                title="Revenue Growth"
                value={`${getTrendArrow(growthMetrics.revenue_change_percentage)} ${formatPercent(growthMetrics.revenue_change_percentage)}`}
                color={getTrendColor(growthMetrics.revenue_change_percentage)}
                subtext={`Current: ₹${Number(growthMetrics.current_revenue || 0).toFixed(2)} | Previous: ₹${Number(growthMetrics.previous_revenue || 0).toFixed(2)}`}
              />

              <MetricCard
                title="Orders Growth"
                value={`${getTrendArrow(growthMetrics.orders_change_percentage)} ${formatPercent(growthMetrics.orders_change_percentage)}`}
                color={getTrendColor(growthMetrics.orders_change_percentage)}
                subtext={`Current: ${growthMetrics.current_orders || 0} | Previous: ${growthMetrics.previous_orders || 0}`}
              />
            </div>
          </div>

          <div style={chartCardStyle}>
            <div style={sectionHeaderStyle}>
              <h3 style={{ margin: 0 }}>👥 Customer Insights</h3>
              {comparisonLabel && <span style={badgeStyle}>{comparisonLabel}</span>}
            </div>

            <div style={metricsGridStyle}>
              <MetricCard
                title="New Customers"
                value={customerInsights.current_new_customers || 0}
                color="#222"
                subtext={`Previous: ${customerInsights.previous_new_customers || 0} | Change: ${formatPercent(customerInsights.new_customers_change_percentage)}`}
              />

              <MetricCard
                title="Returning Customers"
                value={customerInsights.current_returning_customers || 0}
                color="#222"
                subtext={`Previous: ${customerInsights.previous_returning_customers || 0} | Change: ${formatPercent(customerInsights.returning_customers_change_percentage)}`}
              />
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
          <h3 style={{ marginBottom: "15px" }}>
            📈 Revenue Trend ({formatTrendBucketLabel(trendBucket)})
          </h3>
          {dailyTrend.length === 0 ? (
            <p>No revenue data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
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
          <h3 style={{ marginBottom: "15px" }}>
            📊 Orders Trend ({formatTrendBucketLabel(trendBucket)})
          </h3>
          {dailyTrend.length === 0 ? (
            <p>No orders data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
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

function MetricCard({ title, value, color, subtext }) {
  return (
    <div
      style={{
        background: "var(--bg-tertiary)",
        borderRadius: "12px",
        padding: "14px",
        border: "1px solid #eee"
      }}
    >
      <strong>{title}</strong>
      <p
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          color,
          margin: "10px 0 6px"
        }}
      >
        {value}
      </p>
      <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.5 }}>
        {subtext}
      </p>
    </div>
  );
}

const cardStyle = {
  background: "var(--bg-primary)",
  borderRadius: "16px",
  padding: "20px",
  boxShadow: "var(--shadow-sm)"
};

const chartCardStyle = {
  background: "var(--bg-primary)",
  borderRadius: "16px",
  padding: "20px",
  boxShadow: "var(--shadow-sm)"
};

const cardTitle = {
  fontSize: "18px",
  marginBottom: "12px",
  color: "var(--text-secondary)"
};

const cardValue = {
  fontSize: "36px",
  margin: 0
};

const badgeStyle = {
  fontSize: "12px",
  background: "var(--bg-tertiary)",
  color: "#335dff",
  padding: "6px 10px",
  borderRadius: "999px",
  fontWeight: 600
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "15px",
  gap: "10px"
};

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px"
};

export default SalesPage;