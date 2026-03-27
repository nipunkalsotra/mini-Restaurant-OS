import { useState, useEffect } from "react";
import API from "../api/api";

function Cart({ cart, setCart }) {

    const [showForm, setShowForm] = useState(false);
    const [customerSearch, setCustomerSearch] = useState("");
    const [customers, setCustomers] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState("");

    const [newCustomer, setNewCustomer] = useState({
        name: "",
        phone: ""
    });

    const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);

    const [orderDetails, setOrderDetails] = useState({
        table_number: "",
        notes: ""
    });

    // ✅ Fetch customers
    useEffect(() => {
        API.get("/customers")
            .then(res => setCustomers(res.data))
            .catch(err => console.error(err));
    }, []);

    // Cart functions
    const increaseQty = (id) => {
        setCart(prev =>
            prev.map(item =>
                item.menu_item_id === id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        );
    };

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

    const removeItem = (id) => {
        setCart(prev =>
            prev.filter(item => item.menu_item_id !== id)
        );
    };

    const total = cart.reduce(
        (sum, item) => sum + item.item_price * item.quantity,
        0
    );

    // ✅ PLACE ORDER
    const placeOrder = async () => {
        try {
            let customer_id = selectedCustomerId;

            // 🔥 If creating new customer
            if (showNewCustomerForm) {
                if (!newCustomer.name) {
                    alert("Customer name required");
                    return;
                }

                const res = await API.post("/customers", {
                    restaurant_id: cart[0]?.restaurant_id,
                    customer_name: newCustomer.name,
                    customer_phone: newCustomer.phone
                });

                customer_id = res.data.customer_id;
            }

            // 🔥 ORDER PAYLOAD
            const payload = {
                restaurant_id: cart[0]?.restaurant_id,
                customer_id: customer_id || null,
                table_number: Number(orderDetails.table_number),
                status: "pending",
                payment_method: "cash",
                payment_status: "unpaid",
                notes: orderDetails.notes,
                items: cart.map(item => ({
                    menu_item_id: item.menu_item_id,
                    quantity: item.quantity
                }))
            };

            await API.post("/orders", payload);

            alert("✅ Order placed successfully!");

            // Reset
            setCart([]);
            setShowForm(false);
            setSelectedCustomerId("");
            setNewCustomer({ name: "", phone: "" });
            setShowNewCustomerForm(false);
            setOrderDetails({ table_number: "", notes: "" });

        } catch (error) {
            console.error(error.response?.data);
            alert("❌ Failed to place order");
        }
    };

    const filteredCustomers = customers.filter(c => {
        const search = customerSearch.toLowerCase();

        return (
            c.customer_name.toLowerCase().includes(search) ||
            (c.customer_phone || "").includes(search)
        );
    });
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
                            <div>₹{item.item_price} × {item.quantity}</div>

                            <div style={{ marginTop: "5px" }}>
                                <button onClick={() => decreaseQty(item.menu_item_id)}>➖</button>
                                <button onClick={() => increaseQty(item.menu_item_id)}>➕</button>
                                <button onClick={() => removeItem(item.menu_item_id)}>❌</button>
                            </div>
                        </div>
                    ))}

                    <hr />
                    <h3>Total: ₹{total}</h3>

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

            {/* 🔥 MODAL */}
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
                        width: "320px"
                    }}>
                        <h3>Order Details</h3>

                        {/* 👤 SELECT CUSTOMER */}
                        <div style={{ marginBottom: "10px" }}>
                            <input
                                type="text"
                                placeholder="🔍 Search customer by name or phone"
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    borderRadius: "6px",
                                    border: "1px solid #ccc",
                                    marginBottom: "5px"
                                }}
                            />

                            <div style={{
                                maxHeight: "120px",
                                overflowY: "auto",
                                border: "1px solid #ccc",
                                borderRadius: "6px"
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
                                            background:
                                                selectedCustomerId === c.customer_id ? "#dff0ff" : "#fff",
                                            borderTop: "1px solid #eee"
                                        }}
                                    >
                                        👤 {c.customer_name} <br />
                                        <small>📞 {c.customer_phone || "No phone"}</small>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ➕ NEW CUSTOMER */}
                        <button
                            onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                            style={{ marginBottom: "10px" }}
                        >
                            ➕ Add New Customer
                        </button>

                        {showNewCustomerForm && (
                            <>
                                <input
                                    placeholder="Customer Name"
                                    value={newCustomer.name}
                                    onChange={(e) =>
                                        setNewCustomer({ ...newCustomer, name: e.target.value })
                                    }
                                    style={{ width: "100%", marginBottom: "10px" }}
                                />

                                <input
                                    placeholder="Phone"
                                    value={newCustomer.phone}
                                    onChange={(e) =>
                                        setNewCustomer({ ...newCustomer, phone: e.target.value })
                                    }
                                    style={{ width: "100%", marginBottom: "10px" }}
                                />
                            </>
                        )}

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