import { DatabaseSync } from 'node:sqlite'
import { seedIfEmpty } from './seed.js'

const db = new DatabaseSync(new URL('../mall.db', import.meta.url))

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subtitle TEXT,
    category_id TEXT,
    price INTEGER,
    original_price INTEGER,
    stock INTEGER,
    sales INTEGER,
    tags TEXT,
    status TEXT DEFAULT 'on',
    cover TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_no TEXT,
    status TEXT,
    total_amount INTEGER,
    freight INTEGER,
    pay_amount INTEGER,
    address TEXT,
    items TEXT,
    coupon_deduction INTEGER,
    points_deduction INTEGER,
    create_time INTEGER,
    pay_time INTEGER,
    ship_time INTEGER,
    receive_time INTEGER
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT,
    password TEXT,
    nickname TEXT
  );
`)

// Idempotent migration: add columns introduced after the table was first created.
const orderCols = new Set(
  (db.prepare('PRAGMA table_info(orders)').all() as Array<{ name: string }>).map((col) => col.name),
)
if (!orderCols.has('ship_time')) db.exec('ALTER TABLE orders ADD COLUMN ship_time INTEGER')
if (!orderCols.has('receive_time')) db.exec('ALTER TABLE orders ADD COLUMN receive_time INTEGER')

seedIfEmpty(db)

export default db
