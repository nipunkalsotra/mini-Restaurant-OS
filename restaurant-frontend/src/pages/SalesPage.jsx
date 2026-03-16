import { useState } from "react";
import API from "../api/api";

function SalesPage() {

  const [restaurantId, setRestaurantId] = useState("");
  const [sales, setSales] = useState(null);

  const fetchSales = () => {
    API.get(`/restaurants/${restaurantId}/sales`)
      .then(res => setSales(res.data))
      .catch(err => console.error(err));
  };

  return (
    <div>
      <h1>Sales</h1>

      <input
        placeholder="Enter Restaurant ID"
        value={restaurantId}
        onChange={(e) => setRestaurantId(e.target.value)}
      />

      <button onClick={fetchSales}>
        Get Sales
      </button>

      {sales && (
        <div>
          <p>Total Orders: {sales.total_orders}</p>
          <p>Total Revenue: ₹{sales.total_revenue}</p>
        </div>
      )}

    </div>
  );
}

export default SalesPage;