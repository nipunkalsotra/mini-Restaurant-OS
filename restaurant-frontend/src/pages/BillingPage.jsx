import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import API from "../api/api";
import PendingOrdersPanel from "../components/PendingOrdersPanel";
import Modal from "../components/Modal";

const ORDER_STATUS = {
  pending: "pending",
  preparing: "preparing",
  ready: "ready",
  served: "served",
  completed: "completed",
  cancelled: "cancelled"
};

const PAYMENT_STATUS = {
  unpaid: "unpaid",
  paid: "paid"
};

function BillingPage() {

  const location = useLocation();
  const navigate = useNavigate();

  // --- CURRENT CART ---
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

  const [pendingOrders, setPendingOrders] = useState([]);

  const fetchPendingOrders = useCallback(async () => {
    try {
      const res = await API.get("/orders/billing/pending");
      setPendingOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch pending orders", err);
    }
  }, []);

  useEffect(() => {
    fetchPendingOrders();
  }, [fetchPendingOrders]);

  // --- FETCH CUSTOMERS ---
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

  const total = cart.reduce(
    (sum, item) => sum + item.item_price * item.quantity,
    0
  );

  // --- PLACE ORDER ---
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
        table_number: orderDetails.table_number
          ? Number(orderDetails.table_number)
          : null,
        status: ORDER_STATUS.pending,
        payment_method:
          paymentType === "paylater"
            ? "cash"
            : orderDetails.payment_method,
        payment_status:
          paymentType === "paylater"
            ? PAYMENT_STATUS.unpaid
            : PAYMENT_STATUS.paid,
        notes: orderDetails.notes,
        items: cart.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity
        }))
      };

      await API.post("/orders", payload);

      localStorage.removeItem("cart");
      setCart([]);

      fetchPendingOrders();

      if (paymentType === "paylater") navigate("/");
      else navigate(`/billing/${payload.customer_id || "new"}`);

    } catch (err) {
      console.error(err.response?.data);
      alert(err.response?.data?.detail || "❌ Failed to place order");
    }
  };

  // --- MARK ORDER AS PAID ---
  const markPaid = async (orderId) => {
    try {
      await API.put(`/orders/${orderId}`, {
        payment_status: PAYMENT_STATUS.paid
      });

      fetchPendingOrders(); // 🔥 best practice

      alert("✅ Payment marked as paid");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to mark payment");
    }
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: "#f5f6fa"
    }}>

      {/* LEFT: CART */}
      <div style={{
        flex: 1,
        padding: "20px",
        borderRight: "1px solid #ddd",
        background: "#fff",
        overflowY: "auto"
      }}>
        <h2>🧾 Order Summary</h2>

        {cart.length === 0 ? (
          <p>No items in cart</p>
        ) : (
          <>
            {cart.map(item => (
              <div key={item.menu_item_id} style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
                padding: "8px",
                background: "#fafafa",
                borderRadius: "6px"
              }}>
                <div>{item.item_name} × {item.quantity}</div>
                <div>₹{item.item_price * item.quantity}</div>
              </div>
            ))}

            <hr />
            <h3>Total: ₹{total}</h3>
          </>
        )}
      </div>

      {/* MIDDLE: BILLING */}
      <div style={{
        flex: 1,
        padding: "20px",
        borderRight: "1px solid #ddd",
        background: "#fff",
        overflowY: "auto"
      }}>
        <h2>💳 Billing</h2>

        <input
          type="text"
          placeholder="Search customer..."
          value={customerSearch}
          onChange={e => setCustomerSearch(e.target.value)}
          style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
        />

        <div style={{
          maxHeight: "150px",
          overflowY: "auto",
          border: "1px solid #ddd",
          borderRadius: "6px",
          marginBottom: "10px"
        }}>
          <div
            onClick={() => setSelectedCustomerId("")}
            style={{
              padding: "8px",
              cursor: "pointer",
              background: selectedCustomerId === "" ? "#eee" : "#fff"
            }}
          >
            Walk-in Customer
          </div>

          {filteredCustomers.map(c => (
            <div
              key={c.customer_id}
              onClick={() => setSelectedCustomerId(c.customer_id)}
              style={{
                padding: "8px",
                cursor: "pointer",
                background: selectedCustomerId === c.customer_id ? "#dff0ff" : "#fff"
              }}
            >
              {c.customer_name} ({c.customer_phone})
            </div>
          ))}
        </div>

        <button onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}>
          ➕ Add Customer
        </button>

        {showNewCustomerForm && (
          <>
            <input
              placeholder="Name"
              value={newCustomer.name}
              onChange={e =>
                setNewCustomer({ ...newCustomer, name: e.target.value })
              }
              style={{ width: "100%", marginTop: "10px", padding: "8px" }}
            />
            <input
              placeholder="Phone"
              value={newCustomer.phone}
              onChange={e =>
                setNewCustomer({ ...newCustomer, phone: e.target.value })
              }
              style={{ width: "100%", marginTop: "10px", padding: "8px" }}
            />
          </>
        )}

        <input
          type="number"
          placeholder="Table Number"
          value={orderDetails.table_number}
          onChange={e =>
            setOrderDetails({ ...orderDetails, table_number: e.target.value })
          }
          style={{ width: "100%", marginTop: "10px", padding: "8px" }}
        />

        <textarea
          placeholder="Notes"
          value={orderDetails.notes}
          onChange={e =>
            setOrderDetails({ ...orderDetails, notes: e.target.value })
          }
          style={{ width: "100%", marginTop: "10px", padding: "8px" }}
        />

        <button
          onClick={() => setShowPaymentModal(true)}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "12px",
            background: "#2ecc71",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold"
          }}
        >
          Proceed →
        </button>
      </div>

      {/* RIGHT: PENDING ORDERS */}
      <div style={{
        width: "350px",
        borderLeft: "1px solid #ddd",
        background: "#fff",
        overflowY: "auto"
      }}>
        <PendingOrdersPanel
          pendingOrders={pendingOrders}
          markPaid={markPaid}
        />
      </div>
      {showPaymentModal && (
        <Modal onClose={() => setShowPaymentModal(false)}>
          <h3>Select Payment Flow</h3>
          <button onClick={() => placeOrder("paylater")}>Pay Later</button>
          <button onClick={() => setShowPaymentModal("method")}>Pay Now</button>
        </Modal>
      )}

      {showPaymentModal === "method" && (
        <Modal onClose={() => setShowPaymentModal(false)}>
          <h3>Select Payment Method</h3>
          <button onClick={() => placeOrder("paynow")}>Cash</button>
          <button onClick={() => placeOrder("paynow")}>UPI</button>
          <button onClick={() => placeOrder("paynow")}>Card</button>
        </Modal>
      )}
    </div>
  );
}

export default BillingPage;