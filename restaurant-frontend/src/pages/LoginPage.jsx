import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";
import { saveToken } from "../utils/auth";

function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    user_email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", formData);

      saveToken(res.data.access_token);

      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      // Normal login should NOT show welcome page
      localStorage.removeItem("showWelcomeAfterSignup");

      navigate("/restaurants");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #dbeafe 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "#ffffff",
          borderRadius: "20px",
          padding: "36px 30px",
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.12)",
          border: "1px solid rgba(148, 163, 184, 0.18)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 16px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "24px",
              fontWeight: "700",
              boxShadow: "0 10px 25px rgba(37, 99, 235, 0.25)",
            }}
          >
            R
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: "700",
              color: "#0f172a",
            }}
          >
            Welcome back
          </h2>

          <p
            style={{
              marginTop: "8px",
              marginBottom: 0,
              color: "#64748b",
              fontSize: "15px",
            }}
          >
            Sign in to manage your restaurant operations
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecaca",
              padding: "12px 14px",
              borderRadius: "10px",
              marginBottom: "18px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="user_email"
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#334155",
              }}
            >
              Email address
            </label>
            <input
              id="user_email"
              type="email"
              name="user_email"
              placeholder="Enter your email"
              value={formData.user_email}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "13px 14px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                outline: "none",
                fontSize: "15px",
                background: "#f8fafc",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "22px" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#334155",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "13px 14px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                outline: "none",
                fontSize: "15px",
                background: "#f8fafc",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "12px",
              background: loading
                ? "#93c5fd"
                : "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading
                ? "none"
                : "0 12px 24px rgba(37, 99, 235, 0.22)",
              transition: "0.2s ease",
            }}
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>
        </form>

        <p
          style={{
            marginTop: "22px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            style={{
              color: "#2563eb",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;