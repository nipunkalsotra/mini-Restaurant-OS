import { NavLink } from "react-router-dom";
import { FaUtensils, FaClipboardList, FaUsers, FaChartLine, FaConciergeBell, FaMoneyCheckAlt } from "react-icons/fa"; // ✅ added icon for billing

function Sidebar() {
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

  return (
    <div style={{
      width: "220px",
      height: "100vh",
      background: "#222",
      color: "white",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start"
    }}>
      <h2 style={{ marginBottom: "40px", color: "#00bcd4" }}>Restaurant OS</h2>

      <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <NavLink to = "/restaurant-settings" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>
          <FaUtensils /> Restaurant
        </NavLink>

        <NavLink to="/" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>
          <FaUtensils /> Menu
        </NavLink>

        <NavLink to="/orders" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>
          <FaClipboardList /> Orders
        </NavLink>

        <NavLink to="/customers" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>
          <FaUsers /> Customers
        </NavLink>

        <NavLink to="/sales" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>
          <FaChartLine /> Sales
        </NavLink>

        <NavLink to="/kitchen" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>
          <FaConciergeBell /> Kitchen
        </NavLink>

        <NavLink to="/billing" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>
          <FaMoneyCheckAlt /> Billing
        </NavLink>
      </nav>
    </div>
  );
}

export default Sidebar;