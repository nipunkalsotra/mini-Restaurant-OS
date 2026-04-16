import { useEffect, useState } from "react";
import { HiMoon, HiSun } from "react-icons/hi";

function ThemeToggle() {
  const getInitialTheme = () => {
    if (typeof window === "undefined") return false;

    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") return true;
    if (savedTheme === "light") return false;

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  };

  const [isDark, setIsDark] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      root.setAttribute("data-theme", "dark");
      root.style.colorScheme = "dark";
      localStorage.setItem("theme", "dark");
    } else {
      root.removeAttribute("data-theme");
      root.style.colorScheme = "light";
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const handleToggle = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="theme-toggle-btn"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      style={{
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border-color)",
        color: "var(--text-primary)",
        width: "42px",
        height: "42px",
        borderRadius: "12px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
        transition: "all var(--transition-fast)",
        boxShadow: "var(--shadow-sm)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.05)";
        e.currentTarget.style.background = "var(--border-color)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.background = "var(--bg-tertiary)";
      }}
    >
      {isDark ? (
        <HiSun style={{ color: "#fbbf24" }} />
      ) : (
        <HiMoon style={{ color: "#4f46e5" }} />
      )}
    </button>
  );
}

export default ThemeToggle;