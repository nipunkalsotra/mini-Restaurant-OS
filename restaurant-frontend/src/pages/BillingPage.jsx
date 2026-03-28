import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../api/api";

function BillingPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Load cart from state first, fallback to localStorage
  const [cart, setCart] = useState([]);
  useEffect(() => {
    if (location.state?.cart) {
      setCart(location.state.cart);
    } else {
      const saved = localStorage.getItem("cart");
      if (saved) setCart(JSON.parse(saved));
    }
  }, [location.state]);

  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  const [orderDetails, setOrderDetails] = useState({
    table_number: "",
    notes: "",
    payment_method: "cash",
  });

  useEffect(() => {
    API.get("/customers")
      .then(res => setCustomers(res.data))
      .catch(err => console.error(err));
  }, []);

  const filteredCustomers = customers.filter(c => {
    const search = customerSearch.toLowerCase();
    return (
      c.customer_name.toLowerCase().includes(search) ||
      (c.customer_phone || "").includes(search)
    );
  });

  const total = cart.reduce((sum, item) => sum + item.item_price * item.quantity, 0);

  const placeOrder = async (paymentType) => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    try {
      let customer_id = selectedCustomerId;

      if (showNewCustomerForm && !newCustomer.name) {
        alert("Customer name required");
        return;
      }

      if (showNewCustomerForm) {
        const res = await API.post("/customers", {
          restaurant_id: cart[0]?.restaurant_id || 1,
          customer_name: newCustomer.name,
          customer_phone: newCustomer.phone
        });
        customer_id = res.data.customer_id;
      }

      const payload = {
        restaurant_id: cart[0]?.restaurant_id || 1,
        customer_id: customer_id ? Number(customer_id) : null,
        table_number: orderDetails.table_number ? Number(orderDetails.table_number) : null,
        status: "pending",
        payment_method: paymentType === "paylater" ? "cash" : orderDetails.payment_method,
        payment_status: paymentType === "paylater" ? "unpaid" : "paid",
        notes: orderDetails.notes,
        items: cart.map(item => ({ menu_item_id: item.menu_item_id, quantity: item.quantity }))
      };

      await API.post("/orders", payload);

      // ✅ CLEAR cart and localStorage FIRST
      localStorage.removeItem("cart");
      setCart([]);

      // ✅ THEN navigate
      if (paymentType === "paylater") {
        navigate("/"); // back to menu
      } else {
        navigate(`/billing/${payload.customer_id || "new"}`); // pay now flow
      }

    } catch (err) {
      console.error(err.response?.data);
      alert(err.response?.data?.detail || "❌ Failed to place order");
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* LEFT */}
      <div style={{ flex: 1, padding: "20px", borderRight: "2px solid #ddd" }}>
        <h2>🧾 Order Summary</h2>
        {cart.map(item => (
          <div key={item.menu_item_id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <div>{item.item_name} × {item.quantity}</div>
            <div>₹{item.item_price * item.quantity}</div>
          </div>
        ))}
        <hr />
        <h3>Total: ₹{total}</h3>
      </div>

      {/* RIGHT */}
      <div style={{ flex: 1, padding: "20px" }}>
        <h2>💳 Billing Details</h2>
        <input
          type="text"
          placeholder="Search customer..."
          value={customerSearch}
          onChange={e => setCustomerSearch(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid #ccc", marginBottom: "10px" }}>
          <div
            onClick={() => setSelectedCustomerId("")}
            style={{ padding: "8px", cursor: "pointer", background: selectedCustomerId === "" ? "#eee" : "#fff" }}
          >
            Walk-in Customer
          </div>
          {filteredCustomers.map(c => (
            <div
              key={c.customer_id}
              onClick={() => setSelectedCustomerId(c.customer_id)}
              style={{ padding: "8px", cursor: "pointer", background: selectedCustomerId === c.customer_id ? "#dff0ff" : "#fff" }}
            >
              {c.customer_name} ({c.customer_phone})
            </div>
          ))}
        </div>

        <button onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}>➕ Add New Customer</button>
        {showNewCustomerForm && (
          <>
            <input placeholder="Name" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} style={{ width: "100%", marginTop: "10px" }} />
            <input placeholder="Phone" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} style={{ width: "100%", marginTop: "10px" }} />
          </>
        )}

        <input type="number" placeholder="Table Number" value={orderDetails.table_number} onChange={e => setOrderDetails({ ...orderDetails, table_number: e.target.value })} style={{ width: "100%", marginTop: "10px" }} />
        <textarea placeholder="Notes" value={orderDetails.notes} onChange={e => setOrderDetails({ ...orderDetails, notes: e.target.value })} style={{ width: "100%", marginTop: "10px" }} />

        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          <button onClick={() => setShowPaymentModal(true)} style={{ background: "#2ecc71", color: "#fff", padding: "10px", border: "none", borderRadius: "6px" }}>Proceed →</button>
          <button onClick={() => navigate(-1)}>⬅ Back</button>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <Modal>
          <h3>Select Payment Flow</h3>
          <button onClick={() => placeOrder("paylater")}>🕓 Pay Later</button>
          <button onClick={() => setShowPaymentModal("method")}>💳 Pay Now</button>
          <button onClick={() => setShowPaymentModal(false)}>Cancel</button>
        </Modal>
      )}

      {showPaymentModal === "method" && (
        <Modal>
          <h3>Select Payment Method</h3>
          <button onClick={() => { setOrderDetails({ ...orderDetails, payment_method: "cash" }); placeOrder("paynow"); }}>Cash</button>
          <button onClick={() => { setOrderDetails({ ...orderDetails, payment_method: "upi" }); placeOrder("paynow"); }}>UPI</button>
          <button onClick={() => { setOrderDetails({ ...orderDetails, payment_method: "card" }); placeOrder("paynow"); }}>Card</button>
          <button onClick={() => setShowPaymentModal(false)}>Cancel</button>
        </Modal>
      )}
    </div>
  );
}

const Modal = ({ children }) => (
  <div style={{
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }}>
    <div style={{
      background: "#fff",
      padding: "20px",
      borderRadius: "10px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      width: "300px"
    }}>
      {children}
    </div>
  </div>
);

export default BillingPage;