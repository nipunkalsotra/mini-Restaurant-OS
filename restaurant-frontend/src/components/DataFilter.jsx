import { useState, useEffect } from "react";

function DateFilter({ onChange }) {
  const [timeFilter, setTimeFilter] = useState("today");
  const [selectedDates, setSelectedDates] = useState([]);

  useEffect(() => {
    if (timeFilter === "custom") {
      if (selectedDates.length === 1) {
        // ✅ Single date → same start & end
        onChange({
          range: "",
          startDate: selectedDates[0],
          endDate: selectedDates[0]
        });
      } else if (selectedDates.length === 2) {
        // ✅ Range
        const [start, end] = selectedDates.sort();
        onChange({
          range: "",
          startDate: start,
          endDate: end
        });
      }
    } else {
      onChange({
        range: timeFilter,
        startDate: "",
        endDate: ""
      });
    }
  }, [timeFilter, selectedDates, onChange]);

  const handleDateSelect = (date) => {
    if (!date) return;

    // reset if already 2 selected
    if (selectedDates.length === 2) {
      setSelectedDates([date]);
    } else {
      setSelectedDates(prev => [...prev, date]);
    }
  };

  const clearDates = () => {
    setSelectedDates([]);
    setTimeFilter("all");
  };

  return (
    <div style={{
      background: "#fff",
      padding: "10px",
      borderRadius: "10px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      marginBottom: "10px"
    }}>

      {/* FILTER BUTTONS */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          { label: "Today", value: "today" },
          { label: "7 Days", value: "7d" },
          { label: "30 Days", value: "30d" },
          { label: "All", value: "all" },
          { label: "Custom", value: "custom" }
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setTimeFilter(f.value)}
            style={{
              padding: "6px 12px",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              background: timeFilter === f.value ? "#3498db" : "#eee",
              color: timeFilter === f.value ? "#fff" : "#333"
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* CUSTOM DATE PICKER */}
      {timeFilter === "custom" && (
        <div style={{ marginTop: "10px" }}>
          <input
            type="date"
            onChange={(e) => handleDateSelect(e.target.value)}
            style={{
              padding: "6px",
              borderRadius: "6px",
              border: "1px solid #ddd"
            }}
          />

          {/* SELECTED DATES DISPLAY */}
          {selectedDates.length > 0 && (
            <div style={{
              marginTop: "8px",
              fontSize: "12px",
              color: "#555"
            }}>
              {selectedDates.length === 1 && (
                <>Selected: {selectedDates[0]}</>
              )}
              {selectedDates.length === 2 && (
                <>Range: {selectedDates[0]} → {selectedDates[1]}</>
              )}
            </div>
          )}

          {/* CLEAR BUTTON */}
          {selectedDates.length > 0 && (
            <button
              onClick={clearDates}
              style={{
                marginTop: "6px",
                padding: "4px 10px",
                fontSize: "12px",
                borderRadius: "6px",
                border: "none",
                background: "#e74c3c",
                color: "#fff",
                cursor: "pointer"
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default DateFilter;