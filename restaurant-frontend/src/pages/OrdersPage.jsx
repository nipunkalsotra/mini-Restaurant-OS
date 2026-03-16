import { useEffect, useState } from "react";
import API from "../api/api";

function OrdersPage() {

  const [orders, setOrders] = useState([]);

  useEffect(() => {
    API.get("/orders")
      .then(res => setOrders(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>Orders</h1>

      {orders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        <table border="1">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Table</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {orders.map(o => (
              <tr key={o.order_id}>
                <td>{o.order_id}</td>
                <td>{o.table_number}</td>
                <td>{o.status}</td>
                <td>₹{o.total_amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default OrdersPage;