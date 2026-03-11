import sqlite3
conn = sqlite3.connect("restaurant_os.db")
cur = conn.cursor()

cur.execute("PRAGMA foreign_keys = ON")
ORDER_STATUS = {
    0: "cancelled",
    1: "pending",
    2: "preparing",
    3: "completed"
}

cur.execute("""CREATE TABLE IF NOT EXISTS RESTAURANTS(
            restaurant_id INTEGER PRIMARY KEY,
            restaurant_name TEXT NOT NULL,
            restaurant_phone TEXT CHECK(length(restaurant_phone) BETWEEN 10 AND 15),
            restaurant_email TEXT UNIQUE,
            password_hash VARCHAR(255),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            is_active INTEGER DEFAULT 1 CHECK (is_active IN (0,1)),
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)""")

cur.execute("""CREATE TABLE IF NOT EXISTS CATEGORIES(
            category_id INTEGER PRIMARY KEY,
            restaurant_id INTEGER NOT NULL,
            category_name TEXT NOT NULL,
            display_order INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(restaurant_id) REFERENCES RESTAURANTS(restaurant_id) ON DELETE CASCADE,
            UNIQUE(category_name, restaurant_id))""")

cur.execute("""CREATE TABLE IF NOT EXISTS MENU_ITEMS(
            menu_item_id INTEGER PRIMARY KEY,
            restaurant_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            item_name TEXT NOT NULL,
            item_price REAL NOT NULL,
            stock INTEGER DEFAULT 0 CHECK(stock >= 0),
            low_stock_threshold INTEGER DEFAULT 5 CHECK (low_stock_threshold >= 0),
            is_active INTEGER DEFAULT 1 CHECK (is_active IN (0,1)),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(restaurant_id) REFERENCES RESTAURANTS(restaurant_id) ON DELETE CASCADE,
            FOREIGN KEY(category_id) REFERENCES CATEGORIES(category_id) ON DELETE CASCADE,
            UNIQUE(item_name, restaurant_id))""")

cur.execute("""CREATE TABLE IF NOT EXISTS CUSTOMERS(
            customer_id INTEGER PRIMARY KEY,
            restaurant_id INTEGER NOT NULL,
            customer_name TEXT NOT NULL,
            customer_phone TEXT CHECK(length(customer_phone) BETWEEN 10 AND 15),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(restaurant_id) REFERENCES RESTAURANTS(restaurant_id) ON DELETE CASCADE,
            UNIQUE(customer_phone, restaurant_id))""")

cur.execute("""CREATE TABLE IF NOT EXISTS ORDERS(
            order_id INTEGER PRIMARY KEY,
            restaurant_id INTEGER NOT NULL,
            customer_id INTEGER,
            table_number INTEGER CHECK(table_number >= 0),
            total_amount REAL DEFAULT 0 CHECK (total_amount >= 0),
            status INTEGER DEFAULT 1 CHECK(status IN (0,1,2,3)),
            payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'upi', 'card')),
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(restaurant_id) REFERENCES RESTAURANTS(restaurant_id) ON DELETE CASCADE,
            FOREIGN KEY(customer_id) REFERENCES CUSTOMERS(customer_id) ON DELETE SET NULL)""")

cur.execute("""CREATE TABLE IF NOT EXISTS ORDER_ITEMS(
            order_item_id INTEGER PRIMARY KEY,
            order_id INTEGER NOT NULL,
            menu_item_id INTEGER NOT NULL,
            item_name TEXT NOT NULL,
            quantity INTEGER NOT NULL CHECK(quantity > 0),
            price_at_order REAL NOT NULL CHECK (price_at_order >= 0),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(order_id) REFERENCES ORDERS(order_id) ON DELETE CASCADE,
            FOREIGN KEY(menu_item_id) REFERENCES MENU_ITEMS(menu_item_id),
            UNIQUE(order_id, menu_item_id))""")

cur.execute("CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON ORDERS(restaurant_id)")
cur.execute("CREATE INDEX IF NOT EXISTS idx_menu_restaurant ON MENU_ITEMS(restaurant_id)")
cur.execute("CREATE INDEX IF NOT EXISTS idx_orders_customer ON ORDERS(customer_id)")
cur.execute("CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON CATEGORIES(restaurant_id)")
cur.execute("CREATE INDEX IF NOT EXISTS idx_orderitems_order ON ORDER_ITEMS(order_id)")

conn.commit()
cur.close()
conn.close()