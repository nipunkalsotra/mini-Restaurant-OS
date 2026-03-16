import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div style={{
      width: "200px",
      height: "100vh",
      background: "#222",
      color: "white",
      padding: "20px"
    }}>
      <h2>Restaurant OS</h2>

      <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <Link to="/" style={{ color: "white" }}>Menu</Link>
        <Link to="/orders" style={{ color: "white" }}>Orders</Link>
        <Link to="/customers" style={{ color: "white" }}>Customers</Link>
        <Link to="/sales" style={{ color: "white" }}>Sales</Link>
        <Link to="/kitchen" style={{ color: "white" }}>Kitchen</Link>
      </nav>
    </div>
  );
}

export default Sidebar;