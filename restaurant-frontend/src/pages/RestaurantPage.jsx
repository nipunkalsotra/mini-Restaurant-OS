import { useEffect, useMemo, useState } from "react";
import API from "../api/api";

function RestaurantPage() {
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
    const [restaurantForm, setRestaurantForm] = useState({
        restaurant_name: "",
        restaurant_phone: "",
        restaurant_email: "",
        address: "",
        tax_rate: ""
    });

    const [showCreateRestaurant, setShowCreateRestaurant] = useState(false);
    const [creatingRestaurant, setCreatingRestaurant] = useState(false);
    const [newRestaurantForm, setNewRestaurantForm] = useState({
        restaurant_name: "",
        restaurant_phone: "",
        restaurant_email: "",
        address: "",
        tax_rate: ""
    });

    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);

    const [loadingRestaurants, setLoadingRestaurants] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [savingRestaurant, setSavingRestaurant] = useState(false);

    const [newCategory, setNewCategory] = useState({
        category_name: "",
        display_order: ""
    });

    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingCategoryForm, setEditingCategoryForm] = useState({
        category_name: "",
        display_order: ""
    });

    const [newMenuItem, setNewMenuItem] = useState({
        item_name: "",
        item_price: "",
        category_id: "",
        stock: 0,
        low_stock_threshold: 5
    });

    const [editingMenuItemId, setEditingMenuItemId] = useState(null);
    const [editingMenuForm, setEditingMenuForm] = useState({
        item_name: "",
        item_price: "",
        category_id: "",
        is_active: true
    });

    const [menuSearch, setMenuSearch] = useState("");
    const [menuCategoryFilter, setMenuCategoryFilter] = useState("all");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchRestaurants();
    }, []);

    useEffect(() => {
        if (selectedRestaurantId) {
            fetchRestaurantData(selectedRestaurantId);
        }
    }, [selectedRestaurantId]);

    const fetchRestaurants = async () => {
        try {
            setLoadingRestaurants(true);
            const res = await API.get("/restaurants");
            setRestaurants(res.data);

            if (res.data.length > 0) {
                const saved = localStorage.getItem("restaurantId");
                const validSaved = res.data.find(
                    (r) => Number(r.restaurant_id) === Number(saved)
                );

                const defaultId = validSaved
                    ? validSaved.restaurant_id
                    : res.data[0].restaurant_id;

                setSelectedRestaurantId(defaultId);
                localStorage.setItem("restaurantId", defaultId);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load restaurants");
        } finally {
            setLoadingRestaurants(false);
        }
    };

    const fetchRestaurantData = async (restaurantId) => {
        try {
            setLoadingDetails(true);
            setError("");

            const [restaurantRes, categoriesRes, menuRes] = await Promise.all([
                API.get(`/restaurants/${restaurantId}`),
                API.get(`/restaurants/${restaurantId}/categories`),
                API.get("/menu_items")
            ]);

            setRestaurantForm({
                restaurant_name: restaurantRes.data.restaurant_name || "",
                restaurant_phone: restaurantRes.data.restaurant_phone || "",
                restaurant_email: restaurantRes.data.restaurant_email || "",
                address: restaurantRes.data.address || "",
                tax_rate:
                    restaurantRes.data.tax_rate === null ||
                    restaurantRes.data.tax_rate === undefined
                        ? ""
                        : restaurantRes.data.tax_rate
            });

            setCategories(categoriesRes.data || []);

            const filteredMenu = (menuRes.data || []).filter(
                (item) => Number(item.restaurant_id) === Number(restaurantId)
            );
            setMenuItems(filteredMenu);
        } catch (err) {
            console.error(err);
            setError("Failed to load restaurant settings");
        } finally {
            setLoadingDetails(false);
        }
    };

    const selectedRestaurant = useMemo(() => {
        return restaurants.find(
            (r) => Number(r.restaurant_id) === Number(selectedRestaurantId)
        );
    }, [restaurants, selectedRestaurantId]);

    const filteredMenuItems = useMemo(() => {
        return menuItems.filter((item) => {
            const matchesSearch = item.item_name
                .toLowerCase()
                .includes(menuSearch.toLowerCase());

            const matchesCategory =
                menuCategoryFilter === "all" ||
                Number(item.category_id) === Number(menuCategoryFilter);

            return matchesSearch && matchesCategory;
        });
    }, [menuItems, menuSearch, menuCategoryFilter]);

    const showSuccess = (text) => {
        setMessage(text);
        setTimeout(() => setMessage(""), 2500);
    };

    const handleRestaurantSave = async () => {
        if (!selectedRestaurantId) return;

        if (!restaurantForm.restaurant_name.trim()) {
            setError("Restaurant name is required");
            return;
        }

        if (
            restaurantForm.tax_rate !== "" &&
            Number(restaurantForm.tax_rate) < 0
        ) {
            setError("Tax rate cannot be negative");
            return;
        }

        try {
            setSavingRestaurant(true);
            setError("");

            await API.put(`/restaurants/${selectedRestaurantId}`, {
                restaurant_name: restaurantForm.restaurant_name,
                restaurant_phone: restaurantForm.restaurant_phone || null,
                restaurant_email: restaurantForm.restaurant_email || null,
                address: restaurantForm.address || null,
                tax_rate:
                    restaurantForm.tax_rate === ""
                        ? null
                        : Number(restaurantForm.tax_rate)
            });

            showSuccess("Restaurant info updated");
            await fetchRestaurants();
            await fetchRestaurantData(selectedRestaurantId);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to update restaurant");
        } finally {
            setSavingRestaurant(false);
        }
    };

    const handleCreateRestaurant = async () => {
        if (!newRestaurantForm.restaurant_name.trim()) {
            setError("Restaurant name is required");
            return;
        }

        if (
            newRestaurantForm.tax_rate !== "" &&
            Number(newRestaurantForm.tax_rate) < 0
        ) {
            setError("Tax rate cannot be negative");
            return;
        }

        try {
            setCreatingRestaurant(true);
            setError("");

            const res = await API.post("/restaurants", {
                restaurant_name: newRestaurantForm.restaurant_name,
                restaurant_phone: newRestaurantForm.restaurant_phone || null,
                restaurant_email: newRestaurantForm.restaurant_email || null,
                address: newRestaurantForm.address || null,
                tax_rate:
                    newRestaurantForm.tax_rate === ""
                        ? 0
                        : Number(newRestaurantForm.tax_rate)
            });

            const createdRestaurantId = res.data.restaurant_id;

            showSuccess("Restaurant created successfully");

            setNewRestaurantForm({
                restaurant_name: "",
                restaurant_phone: "",
                restaurant_email: "",
                address: "",
                tax_rate: ""
            });

            setShowCreateRestaurant(false);

            await fetchRestaurants();

            if (createdRestaurantId) {
                setSelectedRestaurantId(createdRestaurantId);
                localStorage.setItem("restaurantId", createdRestaurantId);
                await fetchRestaurantData(createdRestaurantId);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to create restaurant");
        } finally {
            setCreatingRestaurant(false);
        }
    };

    const handleCreateCategory = async () => {
        if (!selectedRestaurantId || !newCategory.category_name.trim()) {
            alert("Category name is required");
            return;
        }

        try {
            await API.post("/categories", {
                restaurant_id: Number(selectedRestaurantId),
                category_name: newCategory.category_name,
                display_order: newCategory.display_order
                    ? Number(newCategory.display_order)
                    : null
            });

            setNewCategory({ category_name: "", display_order: "" });
            showSuccess("Category added");
            fetchRestaurantData(selectedRestaurantId);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to create category");
        }
    };

    const startEditCategory = (category) => {
        setEditingCategoryId(category.category_id);
        setEditingCategoryForm({
            category_name: category.category_name || "",
            display_order: category.display_order ?? ""
        });
    };

    const handleUpdateCategory = async (categoryId) => {
        try {
            await API.put(`/categories/${categoryId}`, {
                category_name: editingCategoryForm.category_name,
                display_order:
                    editingCategoryForm.display_order === ""
                        ? null
                        : Number(editingCategoryForm.display_order)
            });

            setEditingCategoryId(null);
            setEditingCategoryForm({ category_name: "", display_order: "" });
            showSuccess("Category updated");
            fetchRestaurantData(selectedRestaurantId);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to update category");
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        const linkedItems = menuItems.filter(
            (item) => Number(item.category_id) === Number(categoryId)
        );

        if (linkedItems.length > 0) {
            alert("Cannot delete category with existing menu items.");
            return;
        }

        if (!window.confirm("Delete this category?")) return;

        try {
            await API.delete(`/categories/${categoryId}`);
            showSuccess("Category deleted");
            fetchRestaurantData(selectedRestaurantId);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to delete category");
        }
    };

    const handleCreateMenuItem = async () => {
        if (
            !selectedRestaurantId ||
            !newMenuItem.item_name.trim() ||
            !newMenuItem.item_price ||
            !newMenuItem.category_id
        ) {
            alert("Item name, price and category are required");
            return;
        }

        try {
            await API.post("/menu_items", {
                restaurant_id: Number(selectedRestaurantId),
                category_id: Number(newMenuItem.category_id),
                item_name: newMenuItem.item_name,
                item_price: Number(newMenuItem.item_price),
                stock: Number(newMenuItem.stock || 0),
                low_stock_threshold: Number(newMenuItem.low_stock_threshold || 5)
            });

            setNewMenuItem({
                item_name: "",
                item_price: "",
                category_id: "",
                stock: 0,
                low_stock_threshold: 5
            });

            showSuccess("Menu item added");
            fetchRestaurantData(selectedRestaurantId);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to create menu item");
        }
    };

    const startEditMenuItem = (item) => {
        setEditingMenuItemId(item.menu_item_id);
        setEditingMenuForm({
            item_name: item.item_name || "",
            item_price: item.item_price ?? "",
            category_id: item.category_id ?? "",
            is_active: item.is_active
        });
    };

    const handleUpdateMenuItem = async (menuItemId) => {
        try {
            await API.put(`/menu_items/${menuItemId}`, {
                item_name: editingMenuForm.item_name,
                item_price: Number(editingMenuForm.item_price),
                category_id: Number(editingMenuForm.category_id),
                is_active: editingMenuForm.is_active
            });

            setEditingMenuItemId(null);
            setEditingMenuForm({
                item_name: "",
                item_price: "",
                category_id: "",
                is_active: true
            });

            showSuccess("Menu item updated");
            fetchRestaurantData(selectedRestaurantId);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to update menu item");
        }
    };

    const toggleItemActive = async (item) => {
        const nextActive = !item.is_active;

        setMenuItems((prev) =>
            prev.map((menuItem) =>
                menuItem.menu_item_id === item.menu_item_id
                    ? { ...menuItem, is_active: nextActive }
                    : menuItem
            )
        );

        try {
            await API.put(`/menu_items/${item.menu_item_id}`, {
                is_active: nextActive
            });

            showSuccess(`Item ${nextActive ? "activated" : "deactivated"}`);
        } catch (err) {
            console.error(err);

            setMenuItems((prev) =>
                prev.map((menuItem) =>
                    menuItem.menu_item_id === item.menu_item_id
                        ? { ...menuItem, is_active: item.is_active }
                        : menuItem
                )
            );

            setError("Failed to update item status");
        }
    };

    const handleDeleteMenuItem = async (menuItemId) => {
        if (!window.confirm("Delete this menu item?")) return;

        try {
            await API.delete(`/menu_items/${menuItemId}`);
            showSuccess("Menu item deleted");
            fetchRestaurantData(selectedRestaurantId);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to delete menu item");
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f7f8fa",
                padding: "24px"
            }}
        >
            <div
                style={{
                    background: "#fff",
                    borderRadius: "18px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                    marginBottom: "20px"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        gap: "16px",
                        flexWrap: "wrap"
                    }}
                >
                    <div>
                        <h1 style={{ margin: 0, fontSize: "30px" }}>⚙️ Restaurant Settings</h1>
                        <p style={{ margin: "8px 0 0", color: "#666" }}>
                            Manage restaurant details, categories, menu items, and prices.
                        </p>
                    </div>

                    {selectedRestaurant && (
                        <div style={highlightCardStyle}>
                            <div style={{ fontSize: "13px", color: "#666" }}>Current Restaurant</div>
                            <div style={{ fontWeight: 700, fontSize: "18px" }}>
                                {selectedRestaurant.restaurant_name}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: "18px" }}>
                    {loadingRestaurants ? (
                        <p>Loading restaurants...</p>
                    ) : (
                        <select
                            value={selectedRestaurantId || ""}
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                setSelectedRestaurantId(id);
                                localStorage.setItem("restaurantId", id);
                            }}
                            style={inputStyle}
                        >
                            <option value="">Select Restaurant</option>
                            {restaurants.map((r) => (
                                <option key={r.restaurant_id} value={r.restaurant_id}>
                                    {r.restaurant_name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div style={{ marginTop: "14px" }}>
                    <button
                        onClick={() => setShowCreateRestaurant((prev) => !prev)}
                        style={blueButtonStyle}
                    >
                        {showCreateRestaurant ? "Close New Restaurant Form" : "➕ Create New Restaurant"}
                    </button>
                </div>

                {showCreateRestaurant && (
                    <div style={{ ...subCardStyle, marginTop: "16px" }}>
                        <h2 style={sectionTitleStyle}>➕ Create New Restaurant</h2>

                        <input
                            type="text"
                            placeholder="Restaurant Name"
                            value={newRestaurantForm.restaurant_name}
                            onChange={(e) =>
                                setNewRestaurantForm((prev) => ({
                                    ...prev,
                                    restaurant_name: e.target.value
                                }))
                            }
                            style={inputStyle}
                        />

                        <input
                            type="text"
                            placeholder="Phone"
                            value={newRestaurantForm.restaurant_phone}
                            onChange={(e) =>
                                setNewRestaurantForm((prev) => ({
                                    ...prev,
                                    restaurant_phone: e.target.value
                                }))
                            }
                            style={inputStyle}
                        />

                        <input
                            type="email"
                            placeholder="Email"
                            value={newRestaurantForm.restaurant_email}
                            onChange={(e) =>
                                setNewRestaurantForm((prev) => ({
                                    ...prev,
                                    restaurant_email: e.target.value
                                }))
                            }
                            style={inputStyle}
                        />

                        <textarea
                            placeholder="Address"
                            value={newRestaurantForm.address}
                            onChange={(e) =>
                                setNewRestaurantForm((prev) => ({
                                    ...prev,
                                    address: e.target.value
                                }))
                            }
                            style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                        />

                        <input
                            type="number"
                            placeholder="Tax Rate %"
                            value={newRestaurantForm.tax_rate}
                            onChange={(e) =>
                                setNewRestaurantForm((prev) => ({
                                    ...prev,
                                    tax_rate: e.target.value
                                }))
                            }
                            style={inputStyle}
                        />

                        <button
                            onClick={handleCreateRestaurant}
                            disabled={creatingRestaurant}
                            style={primaryButtonStyle}
                        >
                            {creatingRestaurant ? "Creating..." : "Create Restaurant"}
                        </button>
                    </div>
                )}
            </div>

            {message && <div style={successStyle}>{message}</div>}
            {error && <div style={errorStyle}>{error}</div>}

            {!selectedRestaurantId ? (
                <div style={emptyCardStyle}>Select a restaurant to manage settings.</div>
            ) : loadingDetails ? (
                <div style={emptyCardStyle}>Loading restaurant details...</div>
            ) : (
                <>
                    <div style={gridStyle}>
                        <div style={cardStyle}>
                            <h2 style={sectionTitleStyle}>🏪 Restaurant Info</h2>

                            <input
                                type="text"
                                placeholder="Restaurant Name"
                                value={restaurantForm.restaurant_name}
                                onChange={(e) =>
                                    setRestaurantForm((prev) => ({
                                        ...prev,
                                        restaurant_name: e.target.value
                                    }))
                                }
                                style={inputStyle}
                            />

                            <input
                                type="text"
                                placeholder="Phone"
                                value={restaurantForm.restaurant_phone}
                                onChange={(e) =>
                                    setRestaurantForm((prev) => ({
                                        ...prev,
                                        restaurant_phone: e.target.value
                                    }))
                                }
                                style={inputStyle}
                            />

                            <input
                                type="email"
                                placeholder="Email"
                                value={restaurantForm.restaurant_email}
                                onChange={(e) =>
                                    setRestaurantForm((prev) => ({
                                        ...prev,
                                        restaurant_email: e.target.value
                                    }))
                                }
                                style={inputStyle}
                            />

                            <textarea
                                placeholder="Address"
                                value={restaurantForm.address}
                                onChange={(e) =>
                                    setRestaurantForm((prev) => ({
                                        ...prev,
                                        address: e.target.value
                                    }))
                                }
                                style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                            />

                            <input
                                type="number"
                                placeholder="Tax Rate %"
                                value={restaurantForm.tax_rate}
                                onChange={(e) =>
                                    setRestaurantForm((prev) => ({
                                        ...prev,
                                        tax_rate: e.target.value
                                    }))
                                }
                                style={inputStyle}
                            />

                            <p style={{ marginTop: "8px", color: "#666", fontSize: "13px" }}>
                                This tax rate will be used for billing for this restaurant.
                            </p>

                            <button
                                onClick={handleRestaurantSave}
                                disabled={savingRestaurant}
                                style={primaryButtonStyle}
                            >
                                {savingRestaurant ? "Saving..." : "Save Restaurant Info"}
                            </button>
                        </div>

                        <div style={cardStyle}>
                            <h2 style={sectionTitleStyle}>📂 Categories</h2>

                            <div style={subCardStyle}>
                                <h3 style={subTitleStyle}>Add Category</h3>
                                <input
                                    type="text"
                                    placeholder="Category Name"
                                    value={newCategory.category_name}
                                    onChange={(e) =>
                                        setNewCategory((prev) => ({
                                            ...prev,
                                            category_name: e.target.value
                                        }))
                                    }
                                    style={inputStyle}
                                />
                                <input
                                    type="number"
                                    placeholder="Display Order"
                                    value={newCategory.display_order}
                                    onChange={(e) =>
                                        setNewCategory((prev) => ({
                                            ...prev,
                                            display_order: e.target.value
                                        }))
                                    }
                                    style={inputStyle}
                                />
                                <button onClick={handleCreateCategory} style={primaryButtonStyle}>
                                    Add Category
                                </button>
                            </div>

                            <div style={{ marginTop: "16px" }}>
                                {categories.length === 0 ? (
                                    <p style={{ color: "#777" }}>No categories yet.</p>
                                ) : (
                                    categories.map((cat) => (
                                        <div key={cat.category_id} style={listItemStyle}>
                                            {editingCategoryId === cat.category_id ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={editingCategoryForm.category_name}
                                                        onChange={(e) =>
                                                            setEditingCategoryForm((prev) => ({
                                                                ...prev,
                                                                category_name: e.target.value
                                                            }))
                                                        }
                                                        style={inputStyle}
                                                    />
                                                    <input
                                                        type="number"
                                                        value={editingCategoryForm.display_order}
                                                        onChange={(e) =>
                                                            setEditingCategoryForm((prev) => ({
                                                                ...prev,
                                                                display_order: e.target.value
                                                            }))
                                                        }
                                                        style={inputStyle}
                                                    />
                                                    <div style={buttonRowStyle}>
                                                        <button
                                                            onClick={() => handleUpdateCategory(cat.category_id)}
                                                            style={smallPrimaryButtonStyle}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingCategoryId(null)}
                                                            style={smallSecondaryButtonStyle}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        gap: "10px",
                                                        flexWrap: "wrap"
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontWeight: 700 }}>{cat.category_name}</div>
                                                        <div style={{ color: "#666", fontSize: "13px" }}>
                                                            Display Order: {cat.display_order ?? "-"}
                                                        </div>
                                                    </div>

                                                    <div style={buttonRowStyle}>
                                                        <button
                                                            onClick={() => startEditCategory(cat)}
                                                            style={smallSecondaryButtonStyle}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCategory(cat.category_id)}
                                                            style={smallDangerButtonStyle}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ ...cardStyle, marginTop: "20px" }}>
                        <h2 style={sectionTitleStyle}>🍽️ Menu Management</h2>

                        <div style={subCardStyle}>
                            <h3 style={subTitleStyle}>Add Menu Item</h3>

                            <div style={formGridStyle}>
                                <input
                                    type="text"
                                    placeholder="Item Name"
                                    value={newMenuItem.item_name}
                                    onChange={(e) =>
                                        setNewMenuItem((prev) => ({
                                            ...prev,
                                            item_name: e.target.value
                                        }))
                                    }
                                    style={inputStyle}
                                />

                                <input
                                    type="number"
                                    placeholder="Item Price"
                                    value={newMenuItem.item_price}
                                    onChange={(e) =>
                                        setNewMenuItem((prev) => ({
                                            ...prev,
                                            item_price: e.target.value
                                        }))
                                    }
                                    style={inputStyle}
                                />

                                <select
                                    value={newMenuItem.category_id}
                                    onChange={(e) =>
                                        setNewMenuItem((prev) => ({
                                            ...prev,
                                            category_id: e.target.value
                                        }))
                                    }
                                    style={inputStyle}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.category_id} value={cat.category_id}>
                                            {cat.category_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button onClick={handleCreateMenuItem} style={primaryButtonStyle}>
                                Add Menu Item
                            </button>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 220px",
                                gap: "12px",
                                marginTop: "18px"
                            }}
                        >
                            <input
                                type="text"
                                placeholder="Search menu item..."
                                value={menuSearch}
                                onChange={(e) => setMenuSearch(e.target.value)}
                                style={inputStyle}
                            />

                            <select
                                value={menuCategoryFilter}
                                onChange={(e) => setMenuCategoryFilter(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="all">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat.category_id} value={cat.category_id}>
                                        {cat.category_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div
                            style={{
                                marginTop: "18px",
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                                gap: "16px"
                            }}
                        >
                            {filteredMenuItems.length === 0 ? (
                                <div style={emptyCardStyle}>No menu items found.</div>
                            ) : (
                                filteredMenuItems.map((item) => {
                                    const categoryName =
                                        categories.find(
                                            (cat) => Number(cat.category_id) === Number(item.category_id)
                                        )?.category_name || "Unknown";

                                    return (
                                        <div
                                            key={item.menu_item_id}
                                            style={{
                                                ...menuCardStyle,
                                                opacity: item.is_active ? 1 : 0.72,
                                                border: item.is_active
                                                    ? "1px solid #eef1f5"
                                                    : "1px solid #ffd6d6"
                                            }}
                                        >
                                            {editingMenuItemId === item.menu_item_id ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={editingMenuForm.item_name}
                                                        onChange={(e) =>
                                                            setEditingMenuForm((prev) => ({
                                                                ...prev,
                                                                item_name: e.target.value
                                                            }))
                                                        }
                                                        style={inputStyle}
                                                    />

                                                    <input
                                                        type="number"
                                                        value={editingMenuForm.item_price}
                                                        onChange={(e) =>
                                                            setEditingMenuForm((prev) => ({
                                                                ...prev,
                                                                item_price: e.target.value
                                                            }))
                                                        }
                                                        style={inputStyle}
                                                    />

                                                    <select
                                                        value={editingMenuForm.category_id}
                                                        onChange={(e) =>
                                                            setEditingMenuForm((prev) => ({
                                                                ...prev,
                                                                category_id: e.target.value
                                                            }))
                                                        }
                                                        style={inputStyle}
                                                    >
                                                        {categories.map((cat) => (
                                                            <option key={cat.category_id} value={cat.category_id}>
                                                                {cat.category_name}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <label
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "8px",
                                                            marginTop: "10px",
                                                            color: "#444",
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={editingMenuForm.is_active}
                                                            onChange={(e) =>
                                                                setEditingMenuForm((prev) => ({
                                                                    ...prev,
                                                                    is_active: e.target.checked
                                                                }))
                                                            }
                                                        />
                                                        Active
                                                    </label>

                                                    <div style={buttonRowStyle}>
                                                        <button
                                                            onClick={() => handleUpdateMenuItem(item.menu_item_id)}
                                                            style={smallPrimaryButtonStyle}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingMenuItemId(null)}
                                                            style={smallSecondaryButtonStyle}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "start",
                                                            gap: "10px"
                                                        }}
                                                    >
                                                        <div>
                                                            <h3 style={{ margin: 0 }}>{item.item_name}</h3>
                                                            <p style={{ margin: "6px 0 0", color: "#666" }}>
                                                                {categoryName}
                                                            </p>
                                                        </div>

                                                        <label
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "8px",
                                                                background: item.is_active ? "#eaf9f0" : "#fff0f0",
                                                                color: item.is_active ? "#1e874b" : "#c0392b",
                                                                padding: "6px 10px",
                                                                borderRadius: "999px",
                                                                fontWeight: 700,
                                                                fontSize: "12px",
                                                                cursor: "pointer",
                                                                userSelect: "none"
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={item.is_active}
                                                                onChange={() => toggleItemActive(item)}
                                                                style={{ cursor: "pointer" }}
                                                            />
                                                            {item.is_active ? "Active" : "Inactive"}
                                                        </label>
                                                    </div>

                                                    <div
                                                        style={{
                                                            fontSize: "24px",
                                                            fontWeight: 700,
                                                            marginTop: "12px"
                                                        }}
                                                    >
                                                        ₹{item.item_price}
                                                    </div>

                                                    <div style={{ color: "#666", fontSize: "13px" }}>
                                                        Item ID: #{item.menu_item_id}
                                                    </div>

                                                    {!item.is_active && (
                                                        <div
                                                            style={{
                                                                marginTop: "10px",
                                                                fontSize: "13px",
                                                                color: "#c0392b",
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            Hidden from active menu
                                                        </div>
                                                    )}

                                                    <div style={{ ...buttonRowStyle, marginTop: "12px" }}>
                                                        <button
                                                            onClick={() => startEditMenuItem(item)}
                                                            style={smallSecondaryButtonStyle}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteMenuItem(item.menu_item_id)}
                                                            style={smallDangerButtonStyle}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

const gridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px"
};

const cardStyle = {
    background: "#fff",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)"
};

const subCardStyle = {
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: "14px",
    padding: "16px"
};

const menuCardStyle = {
    background: "#fafbfc",
    borderRadius: "16px",
    padding: "16px"
};

const highlightCardStyle = {
    background: "#f8faff",
    padding: "12px 16px",
    borderRadius: "14px",
    border: "1px solid #e8eefc",
    minWidth: "220px"
};

const emptyCardStyle = {
    background: "#fff",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
    color: "#666"
};

const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #d7dce5",
    background: "#fff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    marginTop: "10px"
};

const sectionTitleStyle = {
    marginTop: 0,
    marginBottom: "14px"
};

const subTitleStyle = {
    marginTop: 0,
    marginBottom: "10px",
    fontSize: "16px"
};

const primaryButtonStyle = {
    marginTop: "12px",
    padding: "12px 14px",
    width: "100%",
    border: "none",
    borderRadius: "10px",
    background: "#2ecc71",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer"
};

const blueButtonStyle = {
    padding: "10px 14px",
    border: "none",
    borderRadius: "10px",
    background: "#3498db",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer"
};

const smallPrimaryButtonStyle = {
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#2ecc71",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer"
};

const smallSecondaryButtonStyle = {
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#ecf0f1",
    color: "#333",
    fontWeight: "bold",
    cursor: "pointer"
};

const smallDangerButtonStyle = {
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#e74c3c",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer"
};

const buttonRowStyle = {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
};

const listItemStyle = {
    background: "#fafbfc",
    border: "1px solid #eef1f5",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "12px"
};

const formGridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "12px"
};

const successStyle = {
    background: "#eaf9f0",
    color: "#1e874b",
    border: "1px solid #cdeedb",
    padding: "12px 14px",
    borderRadius: "12px",
    marginBottom: "16px"
};

const errorStyle = {
    background: "#fff0f0",
    color: "#c0392b",
    border: "1px solid #f3c4c4",
    padding: "12px 14px",
    borderRadius: "12px",
    marginBottom: "16px"
};

export default RestaurantPage;