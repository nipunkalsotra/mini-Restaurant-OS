import { useEffect, useMemo, useState, useCallback } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";
import DataFilter from "../components/DataFilter";

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState({
    range: "all",
    startDate: "",
    endDate: ""
  });

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("restaurant_os_token");

  const logoutAndRedirect = useCallback(() => {
    localStorage.removeItem("restaurant_os_token");
    localStorage.removeItem("user");
    navigate("/login");
  }, [navigate]);

  const fetchCustomers = useCallback(async () => {
    try {
      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);

      const params = {};

      if (dateFilter.startDate && dateFilter.endDate) {
        params.start_date = dateFilter.startDate;
        params.end_date = dateFilter.endDate;
      } else if (dateFilter.range && dateFilter.range !== "all") {
        params.range = dateFilter.range;
      }

      const res = await API.get("/customers", {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setCustomers(res.data);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        logoutAndRedirect();
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [dateFilter, token, navigate, logoutAndRedirect]);

  const fetchRestaurants = useCallback(async () => {
    try {
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await API.get("/restaurants", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setRestaurants(res.data);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        logoutAndRedirect();
      }
    }
  }, [token, navigate, logoutAndRedirect]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesRestaurant =
        !selectedRestaurantId ||
        c.restaurant_id === Number(selectedRestaurantId);

      const matchesSearch =
        c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.customer_phone || "").includes(searchTerm);

      return matchesRestaurant && matchesSearch;
    });
  }, [customers, selectedRestaurantId, searchTerm]);

  return (
    <div style={pageStyle}>
      <div style={headerCardStyle}>
        <div style={headerRowStyle}>
          <div>
            <h1 style={titleStyle}>👥 Customers Dashboard</h1>
            <p style={subtitleStyle}>
              View and manage all customers across restaurants.
            </p>
          </div>

          <div style={highlightCardStyle}>
            <div style={{ fontSize: "13px", color: "#666" }}>Total Customers</div>
            <div style={{ fontWeight: 700, fontSize: "22px" }}>
              {filteredCustomers.length}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "18px" }}>
          <DataFilter onChange={setDateFilter} />
        </div>
      </div>

      <div style={summaryGridStyle}>
        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>All Customers</div>
          <div style={summaryValueStyle}>{customers.length}</div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Filtered</div>
          <div style={summaryValueStyle}>{filteredCustomers.length}</div>
        </div>
      </div>

      <div style={filterCardStyle}>
        <div style={{ display: "grid", gap: "12px" }}>
          <select
            value={selectedRestaurantId}
            onChange={(e) => setSelectedRestaurantId(e.target.value)}
            style={inputStyle}
          >
            <option value="">All Restaurants</option>
            {restaurants.map((r) => (
              <option key={r.restaurant_id} value={r.restaurant_id}>
                {r.restaurant_name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="🔍 Search by name or phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {loading ? (
        <div style={emptyCardStyle}>Loading customers...</div>
      ) : filteredCustomers.length === 0 ? (
        <div style={emptyCardStyle}>No customers found.</div>
      ) : (
        <div style={gridStyle}>
          {filteredCustomers.map((c) => (
            <div
              key={c.customer_id}
              onClick={() => navigate(`/customers/${c.customer_id}`)}
              style={customerCardStyle}
            >
              <div style={customerHeaderStyle}>
                <h3 style={{ margin: 0 }}>👤 {c.customer_name}</h3>

                <span style={badgeStyle}>#{c.customer_id}</span>
              </div>

              <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
                <div style={infoRowStyle}>
                  <span style={infoLabelStyle}>Phone</span>
                  <span style={{ fontWeight: 600 }}>
                    {c.customer_phone || "N/A"}
                  </span>
                </div>

                <div style={infoRowStyle}>
                  <span style={infoLabelStyle}>Joined</span>
                  <span style={{ fontWeight: 600 }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#f7f8fa",
  padding: "24px"
};

const headerCardStyle = {
  background: "#fff",
  borderRadius: "18px",
  padding: "22px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  marginBottom: "20px"
};

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  flexWrap: "wrap",
  gap: "16px"
};

const titleStyle = {
  margin: 0,
  fontSize: "30px"
};

const subtitleStyle = {
  margin: "8px 0 0",
  color: "#666"
};

const highlightCardStyle = {
  background: "#f8faff",
  padding: "12px 16px",
  borderRadius: "14px",
  border: "1px solid #e8eefc"
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
  marginBottom: "20px"
};

const summaryCardStyle = {
  background: "#fff",
  borderRadius: "18px",
  padding: "18px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)"
};

const summaryLabelStyle = {
  fontSize: "14px",
  color: "#666"
};

const summaryValueStyle = {
  fontSize: "24px",
  fontWeight: 700
};

const filterCardStyle = {
  background: "#fff",
  borderRadius: "18px",
  padding: "18px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  marginBottom: "20px"
};

const inputStyle = {
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #d7dce5"
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "20px"
};

const customerCardStyle = {
  padding: "18px",
  borderRadius: "18px",
  background: "#fff",
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  cursor: "pointer",
  transition: "0.2s"
};

const customerHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const badgeStyle = {
  fontSize: "12px",
  background: "#eef3ff",
  color: "#335dff",
  padding: "6px 10px",
  borderRadius: "999px",
  fontWeight: 700
};

const infoRowStyle = {
  display: "flex",
  justifyContent: "space-between"
};

const infoLabelStyle = {
  color: "#666",
  fontSize: "14px"
};

const emptyCardStyle = {
  background: "#fff",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  color: "#666"
};

export default CustomersPage;