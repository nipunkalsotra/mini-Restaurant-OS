import { useNavigate } from "react-router-dom";

function Cart({ cart, setCart, onCheckout }) {
  const navigate = useNavigate();

  const increaseQty = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.menu_item_id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQty = (id) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.menu_item_id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item.menu_item_id !== id));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm("Are you sure you want to empty the cart?")) {
      setCart([]);
    }
  };

  const total = cart.reduce(
    (sum, item) => sum + item.item_price * item.quantity,
    0
  );

  const goToBilling = () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    if (onCheckout) {
      onCheckout();
      return;
    }

    navigate("/billing", {
      state: { cart }
    });
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      style={{
        width: "360px",
        padding: "20px",
        background: "#f7f8fa",
        position: "sticky",
        top: 0,
        height: "100vh",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          height: "100%",
          background: "#fff",
          borderRadius: "20px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            padding: "18px 18px 14px",
            borderBottom: "1px solid #eef1f5"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <h2 style={{ margin: 0 }}>🛒 Cart</h2>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                style={{
                  background: "#fff3f3",
                  border: "1px solid #ffd4d4",
                  cursor: "pointer",
                  fontSize: "14px",
                  borderRadius: "10px",
                  padding: "8px 10px",
                  color: "#c0392b",
                  fontWeight: 700
                }}
                title="Clear Cart"
              >
                Clear
              </button>
            )}
          </div>

          <p style={{ margin: "8px 0 0", color: "#666", fontSize: "14px" }}>
            {totalItems} item{totalItems !== 1 ? "s" : ""} added
          </p>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px"
          }}
        >
          {cart.length === 0 ? (
            <div
              style={{
                background: "#fafafa",
                border: "1px dashed #d8dee8",
                borderRadius: "14px",
                padding: "20px",
                textAlign: "center",
                color: "#777"
              }}
            >
              No items in cart
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.menu_item_id}
                style={{
                  marginBottom: "14px",
                  padding: "14px",
                  borderRadius: "14px",
                  background: "#fafafa",
                  border: "1px solid #edf0f4"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    marginBottom: "8px"
                  }}
                >
                  <div style={{ fontWeight: "bold", color: "#222" }}>
                    {item.item_name}
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    ₹{(item.item_price * item.quantity).toFixed(2)}
                  </div>
                </div>

                <div style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
                  ₹{item.item_price} × {item.quantity}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <button
                      onClick={() => decreaseQty(item.menu_item_id)}
                      style={qtyButtonStyle}
                    >
                      −
                    </button>

                    <div
                      style={{
                        minWidth: "28px",
                        textAlign: "center",
                        fontWeight: 700
                      }}
                    >
                      {item.quantity}
                    </div>

                    <button
                      onClick={() => increaseQty(item.menu_item_id)}
                      style={qtyButtonStyle}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.menu_item_id)}
                    style={removeButtonStyle}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div
          style={{
            padding: "18px",
            borderTop: "1px solid #eef1f5",
            background: "#fff"
          }}
        >
          <div
            style={{
              background: "#f8fbff",
              border: "1px solid #e5eef8",
              borderRadius: "14px",
              padding: "14px",
              marginBottom: "14px"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
                color: "#555"
              }}
            >
              <span>Items</span>
              <span>{totalItems}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 700,
                fontSize: "18px",
                color: "#222"
              }}
            >
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={goToBilling}
            style={{
              padding: "14px",
              width: "100%",
              background: "#2ecc71",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "15px",
              boxShadow: "0 6px 14px rgba(46,204,113,0.25)"
            }}
          >
            Proceed to Billing →
          </button>
        </div>
      </div>
    </div>
  );
}

const qtyButtonStyle = {
  width: "32px",
  height: "32px",
  borderRadius: "8px",
  border: "1px solid #d7dce5",
  background: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "16px"
};

const removeButtonStyle = {
  padding: "8px 10px",
  borderRadius: "8px",
  border: "none",
  background: "#fff0f0",
  color: "#c0392b",
  cursor: "pointer",
  fontWeight: 700
};

export default Cart;