import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
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

const TAX_RATE = 5;

function BillingPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState(0);

  const [orderDetails, setOrderDetails] = useState({
    table_number: "",
    notes: "",
    payment_method: "cash"
  });

  useEffect(() => {
    if (location.state?.cart) {
      setCart(location.state.cart);
    } else {
      const saved = localStorage.getItem("cart");
      if (saved) setCart(JSON.parse(saved));
    }
  }, [location.state]);

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

  useEffect(() => {
    API.get("/customers")
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error(err));
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const search = customerSearch.toLowerCase();
    return (
      c.customer_name.toLowerCase().includes(search) ||
      (c.customer_phone || "").includes(search)
    );
  });

  const selectedCustomer = customers.find(
    (c) => Number(c.customer_id) === Number(selectedCustomerId)
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.item_price * item.quantity, 0),
    [cart]
  );

  const discountAmount = useMemo(() => {
    const safeValue = Math.max(0, Number(discountValue) || 0);
    let discount = 0;

    if (discountType === "percent") {
      discount = subtotal * (safeValue / 100);
    } else {
      discount = safeValue;
    }

    return Math.min(discount, subtotal);
  }, [subtotal, discountType, discountValue]);

  const taxableAmount = useMemo(
    () => Math.max(0, subtotal - discountAmount),
    [subtotal, discountAmount]
  );

  const taxAmount = useMemo(
    () => taxableAmount * (TAX_RATE / 100),
    [taxableAmount]
  );

  const grandTotal = useMemo(
    () => taxableAmount + taxAmount,
    [taxableAmount, taxAmount]
  );

  const updateCartQuantity = (menuItemId, change) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.menu_item_id === menuItemId
            ? { ...item, quantity: item.quantity + change }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeCartItem = (menuItemId) => {
    setCart((prev) => prev.filter((item) => item.menu_item_id !== menuItemId));
  };

  const clearCurrentBill = () => {
    setSelectedOrderId(null);
    setSelectedCustomerId("");
    setCustomerSearch("");
    setShowNewCustomerForm(false);
    setNewCustomer({ name: "", phone: "" });
    setDiscountType("percent");
    setDiscountValue(0);
    setOrderDetails({
      table_number: "",
      notes: "",
      payment_method: "cash"
    });
    setCart([]);
    localStorage.removeItem("cart");
  };

  const createCustomerIfNeeded = async () => {
    let customerId = selectedCustomerId;

    if (showNewCustomerForm) {
      if (!newCustomer.name.trim()) {
        alert("Customer name required");
        return null;
      }

      const res = await API.post("/customers", {
        restaurant_id: cart[0]?.restaurant_id || 1,
        customer_name: newCustomer.name,
        customer_phone: newCustomer.phone
      });

      customerId = res.data.customer_id;
      setSelectedCustomerId(customerId);
    }

    return customerId ? Number(customerId) : null;
  };

  const createNewOrder = async (paymentMode) => {
    const customerId = await createCustomerIfNeeded();
    if (showNewCustomerForm && customerId === null && newCustomer.name.trim()) {
      return;
    }

    const payload = {
      restaurant_id: cart[0]?.restaurant_id || 1,
      customer_id: customerId,
      table_number: orderDetails.table_number
        ? Number(orderDetails.table_number)
        : null,
      status: paymentMode === "unpaid" ? ORDER_STATUS.served : ORDER_STATUS.pending,
      payment_method:
        paymentMode === "unpaid" ? "cash" : orderDetails.payment_method,
      payment_status:
        paymentMode === "unpaid"
          ? PAYMENT_STATUS.unpaid
          : PAYMENT_STATUS.paid,
      notes: orderDetails.notes,
      items: cart.map((item) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity
      }))
    };

    await API.post("/orders", payload);
  };

  const updateExistingOrder = async (paymentMode) => {
    const customerId = await createCustomerIfNeeded();
    if (showNewCustomerForm && customerId === null && newCustomer.name.trim()) {
      return;
    }

    const updatePayload = {
      customer_id: customerId,
      table_number: orderDetails.table_number
        ? Number(orderDetails.table_number)
        : null,
      notes: orderDetails.notes
    };

    if (paymentMode === "paid") {
      updatePayload.payment_status = PAYMENT_STATUS.paid;
      updatePayload.payment_method = orderDetails.payment_method;
    }

    await API.put(`/orders/${selectedOrderId}`, updatePayload);
  };

  const handleSaveUnpaid = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    try {
      setIsSubmitting(true);

      if (selectedOrderId) {
        await updateExistingOrder("unpaid");
      } else {
        await createNewOrder("unpaid");
      }

      await fetchPendingOrders();
      alert("Order saved for pending payment.");
      clearCurrentBill();
      navigate("/");
    } catch (err) {
      console.error(err.response?.data || err);
      alert(err.response?.data?.detail || "❌ Failed to save unpaid order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayNow = async (method) => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    try {
      setIsSubmitting(true);
      setOrderDetails((prev) => ({ ...prev, payment_method: method }));

      if (selectedOrderId) {
        await API.put(`/orders/${selectedOrderId}`, {
          customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
          table_number: orderDetails.table_number
            ? Number(orderDetails.table_number)
            : null,
          notes: orderDetails.notes,
          payment_status: PAYMENT_STATUS.paid,
          payment_method: method
        });
      } else {
        const customerId = await createCustomerIfNeeded();
        if (showNewCustomerForm && customerId === null && newCustomer.name.trim()) {
          return;
        }

        const payload = {
          restaurant_id: cart[0]?.restaurant_id || 1,
          customer_id: customerId,
          table_number: orderDetails.table_number
            ? Number(orderDetails.table_number)
            : null,
          status: ORDER_STATUS.pending,
          payment_method: method,
          payment_status: PAYMENT_STATUS.paid,
          notes: orderDetails.notes,
          items: cart.map((item) => ({
            menu_item_id: item.menu_item_id,
            quantity: item.quantity
          }))
        };

        await API.post("/orders", payload);
      }

      setShowPaymentModal(false);
      await fetchPendingOrders();
      alert(`Payment collected successfully via ${method.toUpperCase()}.`);
      clearCurrentBill();
      navigate("/");
    } catch (err) {
      console.error(err.response?.data || err);
      alert(err.response?.data?.detail || "❌ Failed to collect payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPendingOrder = (o) => {
    setSelectedOrderId(Number(o.order.order_id));

    const formattedCart = o.items.map((i) => ({
      menu_item_id: i.menu_item_id,
      item_name: i.item_name,
      quantity: i.quantity,
      item_price: i.price_at_order,
      restaurant_id: o.order.restaurant_id
    }));

    setCart(formattedCart);
    setSelectedCustomerId(o.order.customer_id || "");
    setShowNewCustomerForm(false);

    setOrderDetails({
      table_number: o.order.table_number || "",
      notes: o.order.notes || "",
      payment_method: o.order.payment_method || "cash"
    });
  };

  const modeLabel = selectedOrderId
    ? `Editing Pending Order #${selectedOrderId}`
    : "New Bill";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f5f6fa"
      }}
    >
      <div
        style={{
          flex: 1,
          padding: "20px",
          borderRight: "1px solid #ddd",
          background: "#fff",
          overflowY: "auto"
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ margin: 0 }}>🧾 Order Summary</h2>
          <p style={{ color: "#666", marginTop: "6px" }}>{modeLabel}</p>
        </div>

        {cart.length === 0 ? (
          <p>No items in cart</p>
        ) : (
          <>
            {cart.map((item) => (
              <div
                key={item.menu_item_id}
                style={{
                  marginBottom: "12px",
                  padding: "12px",
                  background: "#fafafa",
                  borderRadius: "10px",
                  border: "1px solid #eee"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                    fontWeight: 600
                  }}
                >
                  <div>{item.item_name}</div>
                  <div>₹{(item.item_price * item.quantity).toFixed(2)}</div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                      onClick={() => updateCartQuantity(item.menu_item_id, -1)}
                      style={qtyButtonStyle}
                    >
                      −
                    </button>
                    <span style={{ minWidth: "24px", textAlign: "center" }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.menu_item_id, 1)}
                      style={qtyButtonStyle}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeCartItem(item.menu_item_id)}
                    style={removeButtonStyle}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div
              style={{
                marginTop: "20px",
                padding: "14px",
                background: "#fff8e6",
                borderRadius: "12px",
                border: "1px solid #f1d97a"
              }}
            >
              <h4 style={{ margin: "0 0 10px 0" }}>💸 Discount</h4>

              <div style={{ display: "flex", gap: "10px" }}>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc"
                  }}
                >
                  <option value="percent">%</option>
                  <option value="amount">₹</option>
                </select>

                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                  placeholder="Enter discount"
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc"
                  }}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                background: "#f9fbff",
                borderRadius: "12px",
                border: "1px solid #e6eefb"
              }}
            >
              <BillRow label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
              <BillRow label="Discount" value={`- ₹${discountAmount.toFixed(2)}`} />
              <BillRow label="Taxable Amount" value={`₹${taxableAmount.toFixed(2)}`} />
              <BillRow label={`Tax (${TAX_RATE}%)`} value={`₹${taxAmount.toFixed(2)}`} />
              <hr style={{ margin: "12px 0" }} />
              <BillRow
                label="Grand Total"
                value={`₹${grandTotal.toFixed(2)}`}
                bold
              />
            </div>
          </>
        )}
      </div>

      <div
        style={{
          flex: 1,
          padding: "20px",
          borderRight: "1px solid #ddd",
          background: "#fff",
          overflowY: "auto"
        }}
      >
        <h2 style={{ marginTop: 0 }}>💳 Billing</h2>

        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            borderRadius: "10px",
            background: selectedOrderId ? "#eaf4ff" : "#f8f8f8",
            border: "1px solid #e5e5e5"
          }}
        >
          <strong>{modeLabel}</strong>
          <div style={{ marginTop: "6px", fontSize: "14px", color: "#666" }}>
            {selectedCustomer
              ? `Customer: ${selectedCustomer.customer_name} (${selectedCustomer.customer_phone || "No phone"})`
              : "Customer: Walk-in / Not selected"}
          </div>
        </div>

        <input
          type="text"
          placeholder="Search customer..."
          value={customerSearch}
          onChange={(e) => setCustomerSearch(e.target.value)}
          style={inputStyle}
        />

        <div
          style={{
            maxHeight: "180px",
            overflowY: "auto",
            border: "1px solid #ddd",
            borderRadius: "8px",
            marginBottom: "12px"
          }}
        >
          <div
            onClick={() => setSelectedCustomerId("")}
            style={{
              padding: "10px",
              cursor: "pointer",
              background: selectedCustomerId === "" ? "#eee" : "#fff",
              borderBottom: "1px solid #f2f2f2"
            }}
          >
            Walk-in Customer
          </div>

          {filteredCustomers.map((c) => (
            <div
              key={c.customer_id}
              onClick={() => {
                setSelectedCustomerId(c.customer_id);
                setShowNewCustomerForm(false);
              }}
              style={{
                padding: "10px",
                cursor: "pointer",
                background:
                  Number(selectedCustomerId) === Number(c.customer_id)
                    ? "#dff0ff"
                    : "#fff",
                borderBottom: "1px solid #f7f7f7"
              }}
            >
              {c.customer_name} {c.customer_phone ? `(${c.customer_phone})` : ""}
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
          style={secondaryButtonStyle}
        >
          ➕ {showNewCustomerForm ? "Hide New Customer Form" : "Add Customer"}
        </button>

        {showNewCustomerForm && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              border: "1px solid #eee",
              borderRadius: "10px",
              background: "#fafafa"
            }}
          >
            <input
              placeholder="Customer Name"
              value={newCustomer.name}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, name: e.target.value })
              }
              style={inputStyle}
            />
            <input
              placeholder="Customer Phone"
              value={newCustomer.phone}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, phone: e.target.value })
              }
              style={inputStyle}
            />
          </div>
        )}

        <input
          type="number"
          placeholder="Table Number"
          value={orderDetails.table_number}
          onChange={(e) =>
            setOrderDetails({ ...orderDetails, table_number: e.target.value })
          }
          style={inputStyle}
        />

        <textarea
          placeholder="Notes"
          value={orderDetails.notes}
          onChange={(e) =>
            setOrderDetails({ ...orderDetails, notes: e.target.value })
          }
          style={{
            ...inputStyle,
            minHeight: "90px",
            resize: "vertical"
          }}
        />

        <div
          style={{
            marginTop: "20px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px"
          }}
        >
          <button
            onClick={handleSaveUnpaid}
            disabled={isSubmitting || cart.length === 0}
            style={{
              ...actionButtonStyle,
              background: "#f39c12"
            }}
          >
            Save Unpaid
          </button>

          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={isSubmitting || cart.length === 0}
            style={{
              ...actionButtonStyle,
              background: "#2ecc71"
            }}
          >
            Collect Payment
          </button>
        </div>

        <button
          onClick={clearCurrentBill}
          disabled={isSubmitting}
          style={{
            marginTop: "12px",
            width: "100%",
            padding: "12px",
            background: "#ecf0f1",
            color: "#333",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Clear Current Bill
        </button>
      </div>

      <div
        style={{
          width: "360px",
          borderLeft: "1px solid #ddd",
          background: "#fff",
          overflowY: "auto"
        }}
      >
        <PendingOrdersPanel
          pendingOrders={pendingOrders}
          onSelectOrder={handleSelectPendingOrder}
          selectedOrderId={selectedOrderId}
        />
      </div>

      {showPaymentModal && (
        <Modal onClose={() => setShowPaymentModal(false)}>
          <div style={{ minWidth: "280px" }}>
            <h3 style={{ marginTop: 0 }}>Select Payment Method</h3>
            <div style={{ display: "grid", gap: "10px" }}>
              <button
                onClick={() => handlePayNow("cash")}
                style={{ ...actionButtonStyle, background: "#27ae60" }}
              >
                Cash
              </button>
              <button
                onClick={() => handlePayNow("upi")}
                style={{ ...actionButtonStyle, background: "#8e44ad" }}
              >
                UPI
              </button>
              <button
                onClick={() => handlePayNow("card")}
                style={{ ...actionButtonStyle, background: "#2980b9" }}
              >
                Card
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function BillRow({ label, value, bold = false }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "8px",
        fontWeight: bold ? "bold" : "normal",
        fontSize: bold ? "18px" : "14px"
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  marginTop: "10px",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  outline: "none",
  boxSizing: "border-box"
};

const qtyButtonStyle = {
  width: "30px",
  height: "30px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  background: "#fff",
  cursor: "pointer",
  fontWeight: "bold"
};

const removeButtonStyle = {
  padding: "6px 10px",
  borderRadius: "6px",
  border: "none",
  background: "#e74c3c",
  color: "#fff",
  cursor: "pointer"
};

const secondaryButtonStyle = {
  marginTop: "8px",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  background: "#fff",
  cursor: "pointer",
  fontWeight: "600"
};

const actionButtonStyle = {
  width: "100%",
  padding: "12px",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontWeight: "bold",
  cursor: "pointer"
};

export default BillingPage;