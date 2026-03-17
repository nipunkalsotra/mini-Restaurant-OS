import { useState } from "react";
import API from "../api/api";

function Cart({ cart, setCart }) {

  const [showForm, setShowForm] = useState(false);

  const [orderDetails, setOrderDetails] = useState({
    customer_name: "",
    phone: "",
    table_number: "",
    notes: ""
  });

  // Increase quantity
  const increaseQty = (id) => {
    setCart(prev =>
      prev.map(item =>
        item.menu_item_id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  // Decrease quantity
  const decreaseQty = (id) => {
    setCart(prev =>
      prev
        .map(item =>
          item.menu_item_id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  // Remove item
  const removeItem = (id) => {
    setCart(prev =>
      prev.filter(item => item.menu_item_id !== id)
    );
  };

  const total = cart.reduce(
    (sum, item) => sum + item.item_price * item.quantity,
    0
  );

  // 🔥 PLACE ORDER WITH CUSTOMER CREATION
  const placeOrder = async () => {
    try {
      if (!orderDetails.customer_name) {
        alert("Customer name is required");
        return;
      }

      // 1️⃣ Create Customer
      const customerRes = await API.post("/customers", {
        restaurant_id: cart[0]?.restaurant_id,
        customer_name: orderDetails.customer_name,
        customer_phone: orderDetails.phone
      });

      const customer_id = customerRes.data.customer_id;

      // 2️⃣ Create Order
      const payload = {
        restaurant_id: cart[0]?.restaurant_id,
        customer_id: customer_id,
        table_number: Number(orderDetails.table_number),
        status: "pending",
        payment_method: "cash",
        notes: orderDetails.notes,
        items: cart.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity
        }))
      };

      console.log("ORDER PAYLOAD:", payload);

      await API.post("/orders", payload);

      alert("✅ Order placed successfully!");

      // Reset
      setCart([]);
      setShowForm(false);
      setOrderDetails({
        customer_name: "",
        phone: "",
        table_number: "",
        notes: ""
      });

    } catch (error) {
      console.error("ERROR:", error.response?.data || error.message);
      alert("❌ Failed to place order");
    }
  };

  return (
    <div style={{
      width: "300px",
      borderLeft: "2px solid #ccc",
      padding: "15px"
    }}>
      <h2>🛒 Cart</h2>

      {cart.length === 0 ? (
        <p>No items</p>
      ) : (
        <>
          {cart.map(item => (
            <div key={item.menu_item_id} style={{ marginBottom: "10px" }}>
              
              <div>{item.item_name}</div>

              <div>
                ₹{item.item_price} × {item.quantity}
              </div>

              <div style={{ marginTop: "5px" }}>
                <button onClick={() => decreaseQty(item.menu_item_id)}>➖</button>
                <button onClick={() => increaseQty(item.menu_item_id)}>➕</button>
                <button onClick={() => removeItem(item.menu_item_id)}>❌</button>
              </div>

            </div>
          ))}

          <hr />
          <h3>Total: ₹{total}</h3>

          {/* OPEN FORM */}
          <button
            onClick={() => setShowForm(true)}
            style={{
              marginTop: "10px",
              padding: "10px",
              width: "100%",
              background: "green",
              color: "white",
              border: "none",
              cursor: "pointer"
            }}
          >
            Place Order
          </button>
        </>
      )}

      {/* 🔥 MODAL FORM */}
      {showForm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>

          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "10px",
            width: "300px"
          }}>
            <h3>Enter Order Details</h3>

            <input
              placeholder="Customer Name"
              value={orderDetails.customer_name}
              onChange={(e) =>
                setOrderDetails({ ...orderDetails, customer_name: e.target.value })
              }
              style={{ width: "100%", marginBottom: "10px" }}
            />

            <input
              placeholder="Phone"
              value={orderDetails.phone}
              onChange={(e) =>
                setOrderDetails({ ...orderDetails, phone: e.target.value })
              }
              style={{ width: "100%", marginBottom: "10px" }}
            />

            <input
              placeholder="Table Number"
              type="number"
              value={orderDetails.table_number}
              onChange={(e) =>
                setOrderDetails({ ...orderDetails, table_number: e.target.value })
              }
              style={{ width: "100%", marginBottom: "10px" }}
            />

            <textarea
              placeholder="Notes"
              value={orderDetails.notes}
              onChange={(e) =>
                setOrderDetails({ ...orderDetails, notes: e.target.value })
              }
              style={{ width: "100%", marginBottom: "10px" }}
            />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={placeOrder}>Confirm</button>
              <button onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Cart;