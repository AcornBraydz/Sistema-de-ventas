import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

const baseDir = process.env.APP_DATA_DIR || __dirname;
// Ensure directory exists
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}
const dbPath = path.join(baseDir, 'pos.db');

export let db: Database<sqlite3.Database, sqlite3.Statement>;

export const initDb = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      category TEXT DEFAULT 'Todos',
      is_bulk INTEGER DEFAULT 0,
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      cashier TEXT DEFAULT 'Cajero'
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_sku TEXT NOT NULL,
      quantity REAL NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      pin TEXT,
      role TEXT NOT NULL DEFAULT 'cashier',
      hourly_rate REAL DEFAULT 50.0
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      credit_limit REAL DEFAULT 0.0,
      current_balance REAL DEFAULT 0.0,
      status TEXT DEFAULT 'Al Día'
    );

    CREATE TABLE IF NOT EXISTS customer_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'charge' (cargo) o 'payment' (abono)
      amount REAL NOT NULL,
      concept TEXT NOT NULL,
      payment_method TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payroll_shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      hours REAL NOT NULL,
      hourly_rate REAL NOT NULL,
      total_pay REAL NOT NULL,
      notes TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payroll_advances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      reason TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payroll_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL, -- 'Efectivo' | 'Transferencia'
      reference_info TEXT,
      notes TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cash_shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      open_time INTEGER NOT NULL,
      close_time INTEGER,
      initial_fund REAL DEFAULT 0.0,
      total_sales REAL DEFAULT 0.0,
      hours_worked REAL DEFAULT 0.0,
      hourly_rate REAL DEFAULT 50.0,
      total_payout REAL DEFAULT 0.0,
      status TEXT DEFAULT 'open' -- 'open' | 'closed'
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      delivery_days TEXT,
      category TEXT,
      notes TEXT
    );
  `);

  // Migrate tables if missing columns
  try {
    await db.exec('ALTER TABLE users ADD COLUMN hourly_rate REAL DEFAULT 50.0');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE users ADD COLUMN bank_name TEXT');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE users ADD COLUMN bank_account TEXT');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE users ADD COLUMN transfer_phone TEXT');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE customer_transactions ADD COLUMN items TEXT');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE products ADD COLUMN cost REAL DEFAULT 0.0');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE products ADD COLUMN supplier_id INTEGER');
  } catch (e) {}
  try {
    await db.exec('ALTER TABLE products ADD COLUMN min_stock INTEGER DEFAULT 5');
  } catch (e) {}

  // All mock data insertion removed for production readiness

  // Categories table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);

  // Initial categories if empty
  const catCount = await db.get("SELECT COUNT(*) as count FROM categories");
  if (catCount.count === 0) {
    const defaultCats = ['Abarrotes', 'Lácteos', 'Frutas y Verduras', 'Bebidas', 'Snacks', 'Limpieza', 'Farmacia', 'Panadería'];
    for (const cat of defaultCats) {
      await db.run("INSERT OR IGNORE INTO categories (name) VALUES (?)", cat);
    }
  }

  // Insert default admin if no users REMOVED for Onboarding Wizard

  console.log('Base de datos inicializada correctamente.');
};
