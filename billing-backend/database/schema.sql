-- schema.sql
-- Schema for Billing Application (SQLite / MySQL-compatible)

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL
);

-- Bills Table
CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    total_amount REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Bill Items Table
CREATE TABLE IF NOT EXISTS bill_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    total REAL NOT NULL,
    FOREIGN KEY (bill_id) REFERENCES bills (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
);

-- Sample Data (20 products)
INSERT INTO
    products (name, price, stock)
VALUES ('Notebook', 40, 500),
    ('Pen (Blue)', 10, 1000),
    ('Pen (Black)', 12, 950),
    ('Pencil Box', 25, 600),
    ('Marker', 30, 450),
    ('Eraser', 5, 800),
    ('Sharpener', 8, 700),
    ('Highlighter', 20, 400),
    ('Drawing Book', 45, 300),
    ('Color Pencils', 60, 500),
    ('Stapler', 55, 220),
    ('Stapler Pins Pack', 15, 600),
    (
        'A4 Paper 500 Sheets',
        320,
        350
    ),
    ('White Board Marker', 25, 650),
    ('Glue Stick', 18, 720),
    ('Scissors', 50, 300),
    ('Geometry Box', 80, 480),
    ('Sticky Notes', 30, 900),
    (
        'Calculator (Basic)',
        150,
        260
    ),
    ('Desk Organizer', 150, 200);