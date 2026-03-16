import { useEffect, useState } from "react";
import API from "../api/api";

function CustomersPage() {

  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    API.get("/customers")
      .then(res => setCustomers(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>Customers</h1>

      {customers.length === 0 ? (
        <p>No customers found</p>
      ) : (
        <table border="1">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
            </tr>
          </thead>

          <tbody>
            {customers.map(c => (
              <tr key={c.customer_id}>
                <td>{c.customer_id}</td>
                <td>{c.customer_name}</td>
                <td>{c.customer_phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CustomersPage;