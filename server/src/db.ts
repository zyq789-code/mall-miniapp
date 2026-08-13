import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { seedIfEmpty } from './seed.js'

// 数据库路径：可用环境变量 DB_PATH 覆盖（Docker 持久化用），默认放 server/mall.db
const dbPath: string = process.env.DB_PATH ?? fileURLToPath(new URL('../mall.db', import.meta.url))
const db = new DatabaseSync(dbPath)

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
    specs TEXT,
    skus TEXT,
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

// products.specs/skus: multi-spec SPU/SKU columns (JSON strings). Migrate existing DBs.
const productCols = new Set(
  (db.prepare('PRAGMA table_info(products)').all() as Array<{ name: string }>).map((col) => col.name),
)
if (!productCols.has('specs')) db.exec('ALTER TABLE products ADD COLUMN specs TEXT')
if (!productCols.has('skus')) db.exec('ALTER TABLE products ADD COLUMN skus TEXT')

seedIfEmpty(db)

export default db
