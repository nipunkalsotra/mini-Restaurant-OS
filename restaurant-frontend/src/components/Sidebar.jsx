import { NavLink, useNavigate } from "react-router-dom";
import {
  FaUtensils,
  FaClipboardList,
  FaUsers,
  FaChartLine,
  FaConciergeBell,
  FaMoneyCheckAlt,
  FaSignOutAlt
} from "react-icons/fa";

import { removeToken } from "../utils/auth";

function Sidebar() {
  const navigate = useNavigate();

  const linkStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 15px",
    borderRadius: "8px",
    textDecoration: "none",
    color: "white",
    transition: "all 0.2s ease",
  };

  const activeStyle = {
    background: "#00bcd4",
    color: "#222",
  };

  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  return (
    <div
      style={{
        width: "220px",
        height: "100vh",
        background: "#222",
        color: "white",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between", // 👈 important
      }}
    >
      {/* TOP SECTION */}
      <div>
        <h2 style={{ marginBottom: "40px", color: "#00bcd4" }}>
          Restaurant OS
        </h2>

        <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <NavLink
            to="/restaurant-settings"
            style={({ isActive }) =>
              isActive ? { ...linkStyle, ...activeStyle } : linkStyle
            }
          >
            <FaUtensils /> Restaurant
          </NavLink>

          <NavLink
            to="/"
            style={({ isActive }) =>
              isActive ? { ...linkStyle, ...activeStyle } : linkStyle
            }
          >
            <FaUtensils /> Menu
          </NavLink>

          <NavLink
            to="/orders"
            style={({ isActive }) =>
              isActive ? { ...linkStyle, ...activeStyle } : linkStyle
            }
          >
            <FaClipboardList /> Orders
          </NavLink>

          <NavLink
            to="/customers"
            style={({ isActive }) =>
              isActive ? { ...linkStyle, ...activeStyle } : linkStyle
            }
          >
            <FaUsers /> Customers
          </NavLink>

          <NavLink
            to="/sales"
            style={({ isActive }) =>
              isActive ? { ...linkStyle, ...activeStyle } : linkStyle
            }
          >
            <FaChartLine /> Sales
          </NavLink>

          <NavLink
            to="/kitchen"
            style={({ isActive }) =>
              isActive ? { ...linkStyle, ...activeStyle } : linkStyle
            }
          >
            <FaConciergeBell /> Kitchen
          </NavLink>

          <NavLink
            to="/billing"
            style={({ isActive }) =>
              isActive ? { ...linkStyle, ...activeStyle } : linkStyle
            }
          >
            <FaMoneyCheckAlt /> Billing
          </NavLink>
        </nav>
      </div>

      {/* BOTTOM SECTION (LOGOUT) */}
      <button
        onClick={handleLogout}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          background: "#e74c3c",
          color: "white",
          fontWeight: "bold",
        }}
      >
        <FaSignOutAlt /> Logout
      </button>
    </div>
  );
}

export default Sidebar;