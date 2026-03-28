import { useNavigate } from "react-router-dom";

function Cart({ cart, setCart}) {

    const navigate = useNavigate();

    // ✅ Increase quantity
    const increaseQty = (id) => {
        setCart(prev =>
            prev.map(item =>
                item.menu_item_id === id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        );
    };

    // ✅ Decrease quantity
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

    // ✅ Remove item
    const removeItem = (id) => {
        setCart(prev =>
            prev.filter(item => item.menu_item_id !== id)
        );
    };

    // ✅ Total
    const total = cart.reduce(
        (sum, item) => sum + item.item_price * item.quantity,
        0
    );

    // ✅ Navigate to Billing
    const goToBilling = () => {
        if (cart.length === 0) {
            alert("Cart is empty");
            return;
        }

        navigate("/billing", {
            state: { cart, clearCart : true },
        }); 
    };

    return (
        <div style={{
            width: "300px",
            borderLeft: "2px solid #ccc",
            padding: "15px",
            background: "#fff"
        }}>
            <h2>🛒 Cart</h2>

            {cart.length === 0 ? (
                <p>No items</p>
            ) : (
                <>
                    {cart.map(item => (
                        <div
                            key={item.menu_item_id}
                            style={{
                                marginBottom: "10px",
                                paddingBottom: "8px",
                                borderBottom: "1px solid #eee"
                            }}
                        >
                            <div style={{ fontWeight: "bold" }}>
                                {item.item_name}
                            </div>

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

                    <button
                        onClick={goToBilling}
                        style={{
                            marginTop: "10px",
                            padding: "10px",
                            width: "100%",
                            background: "#2ecc71",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer"
                        }}
                    >
                        Proceed to Billing
                    </button>
                </>
            )}
        </div>
    );
}

export default Cart;