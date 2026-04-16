import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { motion } from "framer-motion";
import {
  FaStore,
  FaUtensils,
  FaUsers,
  FaChartLine,
  FaCashRegister,
  FaUtensilSpoon,
  FaArrowRight,
  FaBuilding,
  FaCheckCircle,
  FaRocket,
  FaLayerGroup,
  FaClipboardList,
} from "react-icons/fa";

function WelcomePage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await API.get("/restaurants");
        setRestaurants(res.data || []);

        if (res.data?.length > 0 && !localStorage.getItem("restaurantId")) {
          localStorage.setItem("restaurantId", String(res.data[0].restaurant_id));
        }
      } catch (err) {
        console.error("Failed to fetch restaurants", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const goToRestaurants = (restaurantId = null) => {
    if (restaurantId) {
      localStorage.setItem("restaurantId", String(restaurantId));
    }
    localStorage.removeItem("showWelcomeAfterSignup");
    navigate("/restaurants");
  };

  const activeRestaurantCount = restaurants.length;

  const projectModules = useMemo(
    () => [
      {
        title: "Restaurants",
        icon: <FaStore />,
        desc: "This is the main control area for restaurant setup. Create restaurants, update outlet details, and manage restaurant-level configuration from the Restaurants page.",
        action: "Go to Restaurants",
        path: "/restaurants",
      },
      {
        title: "Menu Management",
        icon: <FaUtensils />,
        desc: "Add and manage categories and menu items for your selected restaurant. Menu creation and updates should be handled from the restaurant workflow.",
        action: "Manage from Restaurants",
        path: "/restaurants",
      },
      {
        title: "Orders / POS",
        icon: <FaCashRegister />,
        desc: "Take orders, build carts, proceed to billing, and move orders into the restaurant workflow after setup is complete.",
        action: "Open POS",
        path: "/pos",
      },
      {
        title: "Kitchen Board",
        icon: <FaUtensilSpoon />,
        desc: "Track active orders through statuses such as pending, preparing, ready, and served for smooth kitchen coordination.",
        action: "Open Kitchen",
        path: "/kitchen",
      },
      {
        title: "Customers",
        icon: <FaUsers />,
        desc: "View customer profiles, order history, and repeat activity to better understand customer behavior.",
        action: "Open Customers",
        path: "/customers",
      },
      {
        title: "Sales & Analytics",
        icon: <FaChartLine />,
        desc: "Monitor sales, performance trends, operational numbers, and customer insights across your restaurants.",
        action: "Open Sales",
        path: "/sales",
      },
    ],
    []
  );

  const quickSteps = [
    "Go to the Restaurants page to create your first restaurant or manage an existing one.",
    "From the Restaurants workflow, add and update your menu items and categories.",
    "Use POS / Orders to start taking live customer orders.",
    "Track incoming order progress from the Kitchen page.",
    "Use Customers and Sales pages to review business performance.",
  ];

  const capabilities = [
    "Multi-restaurant support",
    "Restaurant creation and management",
    "Category and menu item management",
    "POS-style order workflow",
    "Billing support",
    "Kitchen order tracking",
    "Customer history and insights",
    "Sales and analytics view",
  ];

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f8fafc",
          color: "#334155",
          fontSize: "18px",
          fontWeight: 600,
        }}
      >
        Loading your workspace...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #eff6ff 0%, #f8fafc 30%, #ffffff 100%)",
        padding: "32px 20px 48px",
      }}
    >
      <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={{
            ...cardStyle,
            padding: "36px",
            background:
              "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #1d4ed8 100%)",
            color: "white",
            marginBottom: "28px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.45fr 1fr",
              gap: "28px",
              alignItems: "center",
            }}
          >
            <div>
              <div style={pillStyle}>
                <FaRocket />
                MINI RESTAURANT OS
              </div>

              <h1
                style={{
                  fontSize: "clamp(30px, 5vw, 54px)",
                  lineHeight: 1.08,
                  margin: "0 0 14px",
                  fontWeight: 900,
                }}
              >
                Welcome, {user?.user_name || "Operator"}
              </h1>

              <p
                style={{
                  fontSize: "17px",
                  lineHeight: 1.8,
                  color: "rgba(255,255,255,0.82)",
                  maxWidth: "760px",
                  marginBottom: "24px",
                }}
              >
                You have entered your restaurant operating system for the first time.
                This platform helps you manage restaurants, menus, orders, billing,
                kitchen flow, customers, and analytics from one place.
              </p>

              <p
                style={{
                  fontSize: "15px",
                  lineHeight: 1.8,
                  color: "rgba(255,255,255,0.74)",
                  maxWidth: "760px",
                  marginBottom: "26px",
                }}
              >
                To get started, go to the <strong>Restaurants</strong> page. That is where
                restaurant creation, restaurant updates, and menu setup should be done.
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <button
                  onClick={() => goToRestaurants()}
                  style={primaryButton}
                >
                  Go to Restaurants <FaArrowRight />
                </button>

                <button
                  onClick={() => navigate("/sales")}
                  style={secondaryDarkButton}
                >
                  View Analytics
                </button>

                <button
                  onClick={() => navigate("/customers")}
                  style={secondaryDarkButton}
                >
                  View Customers
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
              }}
            >
              <StatCard
                label="Restaurants"
                value={activeRestaurantCount}
                note={
                  activeRestaurantCount > 0
                    ? "Restaurants already available"
                    : "No restaurants created yet"
                }
              />
              <StatCard
                label="Modules"
                value="6+"
                note="Core restaurant operations"
              />
              <StatCard
                label="Start Here"
                value="Restaurants"
                note="Setup begins from Restaurants"
              />
              <StatCard
                label="Current State"
                value={activeRestaurantCount > 0 ? "Configured" : "Fresh Setup"}
                note="Based on current account data"
              />
            </div>
          </div>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              style={{ ...cardStyle, padding: "28px" }}
            >
              <h2 style={sectionTitle}>What this project does</h2>
              <p style={sectionSub}>
                Mini Restaurant OS is designed as a complete workflow system for restaurant
                operations. Instead of using separate tools for outlet setup, ordering,
                kitchen coordination, customer records, and sales monitoring, this project
                brings everything into one connected interface.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "16px",
                }}
              >
                {projectModules.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * index }}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "18px",
                      padding: "18px",
                      background: "#f8fafc",
                    }}
                  >
                    <div style={moduleIconWrap}>{item.icon}</div>

                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: "17px",
                        color: "#0f172a",
                        marginBottom: "8px",
                      }}
                    >
                      {item.title}
                    </div>

                    <div
                      style={{
                        color: "#475569",
                        fontSize: "14px",
                        lineHeight: 1.7,
                        marginBottom: "14px",
                      }}
                    >
                      {item.desc}
                    </div>

                    <button
                      onClick={() =>
                        item.path === "/restaurants"
                          ? goToRestaurants()
                          : navigate(item.path)
                      }
                      style={moduleButton}
                    >
                      {item.action} <FaArrowRight />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ ...cardStyle, padding: "28px" }}
            >
              <h2 style={sectionTitle}>How to use this project</h2>
              <p style={sectionSub}>
                For the best flow, begin from the Restaurants page and then move into menu,
                orders, kitchen, customers, and analytics.
              </p>

              <div style={{ display: "grid", gap: "14px" }}>
                {quickSteps.map((step, index) => (
                  <div
                    key={step}
                    style={{
                      display: "flex",
                      gap: "14px",
                      alignItems: "flex-start",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      padding: "16px",
                      background: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                    }}
                  >
                    <div style={stepNumberStyle}>{index + 1}</div>
                    <div
                      style={{
                        color: "#334155",
                        fontSize: "15px",
                        lineHeight: 1.7,
                        paddingTop: "4px",
                      }}
                    >
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{ ...cardStyle, padding: "28px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "18px",
                }}
              >
                <div>
                  <h2 style={{ ...sectionTitle, marginBottom: "6px" }}>
                    Your restaurants
                  </h2>
                  <p style={{ ...sectionSub, marginBottom: 0 }}>
                    View your existing restaurants or continue to the Restaurants page
                    to create and manage them.
                  </p>
                </div>

                <button
                  onClick={() => goToRestaurants()}
                  style={ghostButton}
                >
                  Manage Restaurants
                </button>
              </div>

              {restaurants.length === 0 ? (
                <div
                  style={{
                    border: "1px dashed #cbd5e1",
                    borderRadius: "18px",
                    padding: "22px",
                    color: "#64748b",
                    background: "#f8fafc",
                    lineHeight: 1.8,
                  }}
                >
                  No restaurants have been created yet. Go to the <strong>Restaurants</strong>{" "}
                  page to add your first restaurant, update details, and manage menu setup.
                </div>
              ) : (
                <div style={{ display: "grid", gap: "14px" }}>
                  {restaurants.map((restaurant) => (
                    <div
                      key={restaurant.restaurant_id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "18px",
                        padding: "18px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "14px",
                        flexWrap: "wrap",
                        background: "#ffffff",
                      }}
                    >
                      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "14px",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            display: "grid",
                            placeItems: "center",
                            fontSize: "18px",
                            flexShrink: 0,
                          }}
                        >
                          <FaBuilding />
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize: "17px",
                              fontWeight: 800,
                              color: "#0f172a",
                              marginBottom: "5px",
                            }}
                          >
                            {restaurant.restaurant_name}
                          </div>

                          <div
                            style={{
                              color: "#64748b",
                              fontSize: "14px",
                              lineHeight: 1.7,
                            }}
                          >
                            {restaurant.restaurant_email || "No email"} •{" "}
                            {restaurant.restaurant_phone || "No phone"} • GST/Tax{" "}
                            {restaurant.tax_rate ?? 0}%
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          onClick={() => goToRestaurants(restaurant.restaurant_id)}
                          style={smallPrimaryButton}
                        >
                          Open in Restaurants
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              style={{ ...cardStyle, padding: "28px" }}
            >
              <div
                style={{
                  width: "62px",
                  height: "62px",
                  borderRadius: "18px",
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "24px",
                  marginBottom: "16px",
                }}
              >
                <FaClipboardList />
              </div>

              <h2 style={{ ...sectionTitle, marginBottom: "8px" }}>
                Start from Restaurants page
              </h2>
              <p style={sectionSub}>
                Restaurant creation, restaurant updates, and menu setup are handled from the
                Restaurants page. This welcome page is only meant to guide you through the
                product and help you understand the workflow.
              </p>

              <div
                style={{
                  border: "1px solid #dbeafe",
                  background: "#f8fbff",
                  borderRadius: "16px",
                  padding: "18px",
                  color: "#334155",
                  lineHeight: 1.8,
                  fontSize: "14px",
                  marginBottom: "18px",
                }}
              >
                <strong>Suggested first action:</strong> Open the Restaurants page,
                create your first restaurant if needed, then continue with menu setup,
                order taking, and analytics tracking.
              </div>

              <button
                onClick={() => goToRestaurants()}
                style={{
                  ...primaryButton,
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                Continue to Restaurants <FaArrowRight />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              style={{ ...cardStyle, padding: "24px" }}
            >
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#0f172a",
                  marginBottom: "14px",
                }}
              >
                Key capabilities
              </h3>

              <div style={{ display: "grid", gap: "12px" }}>
                {capabilities.map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      color: "#334155",
                      fontSize: "15px",
                    }}
                  >
                    <FaCheckCircle color="#16a34a" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              style={{ ...cardStyle, padding: "24px" }}
            >
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#0f172a",
                  marginBottom: "12px",
                }}
              >
                Suggested navigation
              </h3>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <button onClick={() => goToRestaurants()} style={ghostButton}>
                  <FaLayerGroup /> Restaurants
                </button>
                <button onClick={() => navigate("/menu")} style={ghostButton}>
                  <FaUtensils /> Menu
                </button>
                <button onClick={() => navigate("/pos")} style={ghostButton}>
                  <FaCashRegister /> POS
                </button>
                <button onClick={() => navigate("/kitchen")} style={ghostButton}>
                  <FaUtensilSpoon /> Kitchen
                </button>
                <button onClick={() => navigate("/customers")} style={ghostButton}>
                  <FaUsers /> Customers
                </button>
                <button onClick={() => navigate("/sales")} style={ghostButton}>
                  <FaChartLine /> Sales
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, note }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: "18px",
        padding: "18px",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          textTransform: "uppercase",
          letterSpacing: "1px",
          color: "rgba(255,255,255,0.72)",
          marginBottom: "8px",
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "24px",
          fontWeight: 900,
          marginBottom: "4px",
        }}
      >
        {value}
      </div>
      <div style={{ color: "rgba(255,255,255,0.72)", fontSize: "13px" }}>
        {note}
      </div>
    </div>
  );
}

const sectionTitle = {
  fontSize: "28px",
  fontWeight: 800,
  marginBottom: "10px",
  color: "#0f172a",
};

const sectionSub = {
  fontSize: "15px",
  lineHeight: 1.7,
  color: "#475569",
  marginBottom: "24px",
};

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  boxShadow: "0 12px 40px rgba(15, 23, 42, 0.06)",
};

const pillStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "999px",
  padding: "10px 16px",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "1px",
  marginBottom: "18px",
};

const moduleIconWrap = {
  width: "48px",
  height: "48px",
  borderRadius: "14px",
  background: "#dbeafe",
  color: "#1d4ed8",
  display: "grid",
  placeItems: "center",
  fontSize: "20px",
  marginBottom: "14px",
};

const stepNumberStyle = {
  minWidth: "34px",
  height: "34px",
  borderRadius: "50%",
  background: "#1d4ed8",
  color: "white",
  display: "grid",
  placeItems: "center",
  fontWeight: 800,
  fontSize: "14px",
};

const primaryButton = {
  border: "none",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  padding: "14px 18px",
  borderRadius: "14px",
  fontWeight: 700,
  fontSize: "14px",
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  cursor: "pointer",
};

const secondaryDarkButton = {
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  padding: "14px 18px",
  borderRadius: "14px",
  fontWeight: 700,
  fontSize: "14px",
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  cursor: "pointer",
};

const moduleButton = {
  border: "none",
  background: "#0f172a",
  color: "white",
  padding: "11px 14px",
  borderRadius: "12px",
  fontWeight: 700,
  fontSize: "13px",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
};

const ghostButton = {
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  padding: "11px 14px",
  borderRadius: "12px",
  fontWeight: 700,
  fontSize: "13px",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
};

const smallPrimaryButton = {
  border: "none",
  background: "#2563eb",
  color: "white",
  padding: "10px 14px",
  borderRadius: "12px",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
};

export default WelcomePage;