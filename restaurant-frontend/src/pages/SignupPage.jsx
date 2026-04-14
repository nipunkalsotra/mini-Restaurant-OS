import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";
import { saveToken } from "../utils/auth";

function SignupPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        user_name: "",
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
            await API.post("/auth/signup", formData);

            const loginRes = await API.post("/auth/login", {
                user_email: formData.user_email,
                password: formData.password,
            });

            saveToken(loginRes.data.access_token);
            navigate("/restaurants");
        }
        catch (err) {
            console.error("Signup error:", err);
            console.error("Response data:", err.response?.data);
            setError(
                err.response?.data?.detail ||
                JSON.stringify(err.response?.data) ||
                "Signup failed"
            );
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "400px", margin: "40px auto", padding: "20px" }}>
            <h2>Sign Up</h2>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="user_name"
                    placeholder="Name"
                    value={formData.user_name}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", padding: "10px", marginBottom: "12px" }}
                />

                <input
                    type="email"
                    name="user_email"
                    placeholder="Email"
                    value={formData.user_email}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", padding: "10px", marginBottom: "12px" }}
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", padding: "10px", marginBottom: "12px" }}
                />

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: "10px",
                        cursor: "pointer",
                    }}
                >
                    {loading ? "Creating account..." : "Sign Up"}
                </button>
            </form>

            {error && (
                <p style={{ color: "red", marginTop: "12px" }}>{error}</p>
            )}

            <p style={{ marginTop: "16px" }}>
                Already have an account? <Link to="/login">Login</Link>
            </p>
        </div>
    );
}

export default SignupPage;