import { useEffect, useState } from "react";
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

    const navigate = useNavigate();

    useEffect(() => {
        const params = {};

        if (dateFilter.startDate && dateFilter.endDate) {
            params.start_date = dateFilter.startDate;
            params.end_date = dateFilter.endDate;
        } else if (dateFilter.range && dateFilter.range !== "all") {
            params.range = dateFilter.range;
        }

        API.get("/customers", { params })
            .then(res => setCustomers(res.data))
            .catch(err => console.error(err));

    }, [dateFilter]);

    // Fetch restaurants
    useEffect(() => {
        API.get("/restaurants")
            .then(res => setRestaurants(res.data))
            .catch(err => console.error(err));
    }, []);

    // 🔍 FILTER CUSTOMERS
    const filteredCustomers = customers.filter(c => {
        const matchesRestaurant =
            !selectedRestaurantId ||
            c.restaurant_id === Number(selectedRestaurantId);

        const matchesSearch =
            c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.customer_phone || "").includes(searchTerm);

        return matchesRestaurant && matchesSearch;
    });

    return (
        <div style={{ padding: "20px" }}>
            <h1>👥 Customers Dashboard</h1>

            <DataFilter onChange={setDateFilter} />

            {/* 🔽 FILTERS */}
            <div style={{
                margin: "20px 0",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap"
            }}>

                {/* Restaurant Filter */}
                <select
                    value={selectedRestaurantId}
                    onChange={(e) => setSelectedRestaurantId(e.target.value)}
                    style={{
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #ccc"
                    }}
                >
                    <option value="">All Restaurants</option>
                    {restaurants.map(r => (
                        <option key={r.restaurant_id} value={r.restaurant_id}>
                            {r.restaurant_name}
                        </option>
                    ))}
                </select>

                {/* Search */}
                <input
                    type="text"
                    placeholder="🔍 Search by name or phone"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        flex: 1
                    }}
                />
            </div>

            {/* 📊 COUNT */}
            <h3>
                Total Customers: {filteredCustomers.length}
                {dateFilter.range !== "all" && ` (${dateFilter.range})`}
            </h3>

            {/* 🔲 GRID */}
            {filteredCustomers.length === 0 ? (
                <p>No customers found</p>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                        gap: "20px",
                        marginTop: "20px"
                    }}
                >
                    {filteredCustomers.map((c) => (
                        <div
                            key={c.customer_id}
                            onClick={() => navigate(`/customers/${c.customer_id}`)}
                            style={{
                                padding: "15px",
                                borderRadius: "12px",
                                background: "#fff",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                borderTop: "5px solid #3498db",
                                cursor: "pointer",
                                transition: "0.2s"
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.transform = "scale(1.03)")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.transform = "scale(1)")
                            }
                        >
                            <h3>👤 {c.customer_name}</h3>

                            <p><b>📞 Phone:</b> {c.customer_phone || "N/A"}</p>

                            <p style={{ fontSize: "12px", color: "gray" }}>
                                Joined: {new Date(c.created_at).toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CustomersPage;