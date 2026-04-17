function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()} // prevent close on inside click
        style={{
          background: "var(--bg-primary)",
          padding: "20px",
          borderRadius: "12px",
          width: "320px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          boxShadow: "0 5px 20px rgba(0,0,0,0.2)"
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default Modal;