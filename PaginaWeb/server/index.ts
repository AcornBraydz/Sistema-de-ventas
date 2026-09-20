import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { machineIdSync } from 'node-machine-id';
import { db, initDb } from './database';
import { createClient } from '@supabase/supabase-js';
import { tunnelmole } from 'tunnelmole';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mgqruqktnhxqhbdwcxsa.supabase.co';
const SUPABASE_PUB_KEY = process.env.SUPABASE_PUB_KEY || 'sb_publishable_v630AvI8O-s2SOuozNpgEQ_x5ltXDCI';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUB_KEY);


const SECRET_KEY = process.env.JWT_SECRET || 'H3r1t4g3_S3cr3t_M4st3r_K3y_2026';
const localMachineId = machineIdSync();

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

const baseDir = process.env.APP_DATA_DIR || __dirname;

// Setup uploads folder
const uploadsDir = path.join(baseDir, 'uploads', 'productos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Setup logos folder
const logosDir = path.join(baseDir, 'uploads', 'logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

// Serve static images
app.use('/uploads', express.static(path.join(baseDir, 'uploads')));

// Serve frontend so remote access (localtunnel) works
let frontendPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(path.join(frontendPath, 'index.html'))) {
  frontendPath = path.join(__dirname, '..', '..', 'dist');
}
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const sku = req.body.sku ? req.body.sku.replace(/\s+/g, '_') : 'image';
    const ext = path.extname(file.originalname);
    cb(null, `${sku}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, logosDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  }
});
const uploadLogo = multer({ storage: logoStorage });

// Initialize DB and start server
initDb().then(() => {
  // GET /api/products
  app.get('/api/products', async (req, res) => {
    try {
      const products = await db.all(`
        SELECT p.*, s.name as supplier_name 
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ORDER BY p.name ASC
      `);
      const formattedProducts = products.map(p => ({
        ...p,
        isBulk: p.is_bulk === 1
      }));
      res.json(formattedProducts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error fetching products' });
    }
  });

  // POST /api/products (with image upload support, cost, min_stock, supplier_id)
  app.post('/api/products', upload.single('image'), async (req, res) => {
    try {
      const { sku, name, price, cost, stock, category, is_bulk, min_stock, supplier_id } = req.body;
      let imageUrl = null;
      
      if (req.file) {
        imageUrl = `/uploads/productos/${req.file.filename}`;
      }

      const result = await db.run(`
        INSERT INTO products (sku, name, price, cost, stock, category, is_bulk, min_stock, supplier_id, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        sku, 
        name, 
        parseFloat(price) || 0, 
        parseFloat(cost) || 0,
        parseInt(stock) || 0, 
        category || 'Todos', 
        is_bulk === 'true' || is_bulk === 1 ? 1 : 0,
        parseInt(min_stock) || 5,
        supplier_id ? parseInt(supplier_id) : null,
        imageUrl
      ]);

      res.status(201).json({ success: true, id: result.lastID });
    } catch (error: any) {
      console.error(error);
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'El código o SKU ya está registrado con otro producto' });
      }
      res.status(500).json({ error: 'Error creating product' });
    }
  });

  // Categories API
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await db.all('SELECT * FROM categories ORDER BY name ASC');
      res.json(categories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error fetching categories' });
    }
  });

  app.post('/api/categories', async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
      const result = await db.run('INSERT INTO categories (name) VALUES (?)', name.trim());
      res.status(201).json({ id: result.lastID, name: name.trim() });
    } catch (error: any) {
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'La categoría ya existe' });
      }
      res.status(500).json({ error: 'Error creating category' });
    }
  });

  app.put('/api/categories/:id', async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
      
      const oldCat = await db.get('SELECT name FROM categories WHERE id = ?', req.params.id);
      if (!oldCat) return res.status(404).json({ error: 'Category not found' });

      await db.run('UPDATE categories SET name = ? WHERE id = ?', name.trim(), req.params.id);
      // Update all products that had the old category
      await db.run('UPDATE products SET category = ? WHERE category = ?', name.trim(), oldCat.name);

      res.json({ success: true, name: name.trim() });
    } catch (error: any) {
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'El nombre de categoría ya está en uso' });
      }
      res.status(500).json({ error: 'Error updating category' });
    }
  });

  app.delete('/api/categories/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM categories WHERE id = ?', req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting category' });
    }
  });

  // PUT /api/products/:sku (Update product)
  app.put('/api/products/:sku', upload.single('image'), async (req, res) => {
    try {
      const { name, price, cost, stock, category, is_bulk, min_stock, supplier_id } = req.body;
      const sku = req.params.sku;
      let updateImageQuery = '';
      const params: any[] = [
        name,
        parseFloat(price) || 0,
        parseFloat(cost) || 0,
        parseInt(stock) || 0,
        category || 'Todos',
        is_bulk === 'true' || is_bulk === 1 ? 1 : 0,
        parseInt(min_stock) || 5,
        supplier_id ? parseInt(supplier_id) : null
      ];

      if (req.file) {
        updateImageQuery = ', image_url = ?';
        params.push(`/uploads/productos/${req.file.filename}`);
      }
      params.push(sku);

      await db.run(`
        UPDATE products 
        SET name = ?, price = ?, cost = ?, stock = ?, category = ?, is_bulk = ?, min_stock = ?, supplier_id = ? ${updateImageQuery}
        WHERE sku = ?
      `, params);

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error updating product' });
    }
  });

  // PATCH /api/products/:sku/stock (Quick stock adjustment)
  app.patch('/api/products/:sku/stock', async (req, res) => {
    const { stock, reason } = req.body;
    try {
      const newStock = parseFloat(stock);
      if (isNaN(newStock) || newStock < 0) {
        return res.status(400).json({ error: 'Stock inválido' });
      }
      await db.run('UPDATE products SET stock = ? WHERE sku = ?', newStock, req.params.sku);
      res.json({ success: true, stock: newStock });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error actualizando stock' });
    }
  });

  // DELETE /api/products/:sku
  app.delete('/api/products/:sku', async (req, res) => {
    try {
      await db.run('DELETE FROM products WHERE sku = ?', req.params.sku);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error deleting product' });
    }
  });

  // ==========================================
  // LICENSE MIDDLEWARE & ENDPOINTS
  // ==========================================
  
  let cachedLicenseStatus = false;
  let lastLicenseCheckTime = 0;
  const LICENSE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

  async function verifyLicenseOnline(token: string, machineId: string): Promise<boolean> {
    const now = Date.now();
    if (cachedLicenseStatus && (now - lastLicenseCheckTime < LICENSE_CACHE_TTL_MS)) {
      return true;
    }

    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('token', token)
        .eq('machine_id', machineId)
        .single();

      if (error || !data) {
        cachedLicenseStatus = false;
        return false;
      }

      const expiresAt = new Date(data.expires_at).getTime();
      if (expiresAt < now || data.status !== 'ACTIVE') {
        cachedLicenseStatus = false;
        return false;
      }

      cachedLicenseStatus = true;
      lastLicenseCheckTime = now;
      return true;
    } catch (err) {
      cachedLicenseStatus = false; 
      return false;
    }
  }

  app.get('/api/license/status', async (req, res) => {
    try {
      const row = await db.get('SELECT value FROM settings WHERE key = ?', 'license_key');
      if (!row || !row.value) {
        return res.json({ valid: false, reason: 'missing' });
      }
      
      const isValid = await verifyLicenseOnline(row.value, localMachineId);
      if (isValid) {
        const decoded = jwt.verify(row.value, SECRET_KEY) as any;
        return res.json({ 
          valid: true,
          createdAt: decoded.createdAt,
          expiresAt: decoded.exp * 1000,
          token: row.value
        });
      } else {
        return res.json({ valid: false, reason: 'expired_or_invalid_online' });
      }
    } catch (err) {
      return res.json({ valid: false, reason: 'error_checking' });
    }
  });

  app.post('/api/license/activate', async (req, res) => {
    try {
      const { license_key } = req.body;
      if (!license_key) return res.status(400).json({ error: 'Falta la licencia' });
      
      const isValid = await verifyLicenseOnline(license_key, localMachineId);
      if (!isValid) {
        return res.status(400).json({ error: 'Licencia no válida o no encontrada en el servidor' });
      }
      
      await db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', 'license_key', license_key);
      
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: 'Error al verificar la licencia online' });
    }
  });

  // License Validation Middleware
  const openRoutes = ['/api/license/status', '/api/license/activate', '/api/system/status', '/api/system/setup', '/api/system/machine-id', '/api/upload-logo', '/api/auth/login'];
  
  app.use(async (req, res, next) => {
    if (req.method === 'OPTIONS') return next();
    if (openRoutes.includes(req.path) || req.path.startsWith('/uploads')) {
      return next();
    }
    
    try {
      const row = await db.get('SELECT value FROM settings WHERE key = ?', 'license_key');
      if (!row || !row.value) {
        return res.status(402).json({ error: 'License Required' });
      }
      
      const isValid = await verifyLicenseOnline(row.value, localMachineId);
      if (!isValid) {
        return res.status(402).json({ error: 'License Expired or Invalid (Online Check Failed)' });
      }
      
      next();
    } catch (err) {
      return res.status(402).json({ error: 'License Verification Error' });
    }
  });

  // ==========================================
  // SYSTEM STATUS & ONBOARDING SETUP
  // ==========================================

  app.get('/api/system/machine-id', (req, res) => {
    res.json({ machineId: localMachineId });
  });

  app.get('/api/system/status', async (req, res) => {
    try {
      const userCount = await db.get('SELECT COUNT(*) as count FROM users');
      res.json({ requireSetup: userCount.count === 0 });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error checking system status' });
    }
  });

  app.post('/api/upload-logo', uploadLogo.single('logo'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No logo file provided' });
    }
    const url = `/uploads/logos/${req.file.filename}`;
    res.json({ url });
  });

  app.post('/api/system/setup', async (req, res) => {
    try {
      const { store_name, store_logo, admin_name, admin_username, admin_password, admin_pin } = req.body;
      
      if (store_name) {
        await db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', 'branch_name', store_name);
      }
      if (store_logo) {
        await db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', 'store_logo', store_logo);
      }

      const userCount = await db.get('SELECT COUNT(*) as count FROM users');
      if (userCount.count === 0) {
        const hashedPassword = await bcrypt.hash(admin_password, 10);
        await db.run(
          'INSERT INTO users (name, username, password, pin, role) VALUES (?, ?, ?, ?, ?)',
          admin_name, admin_username, hashedPassword, admin_pin, 'admin'
        );
      }

      res.json({ success: true, message: 'Setup completed successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error during system setup' });
    }
  });

  // ==========================================
  // SUPPLIERS API (GESTIÓN DE PROVEEDORES)
  // ==========================================

  // GET /api/suppliers
  app.get('/api/suppliers', async (req, res) => {
    try {
      const suppliers = await db.all(`
        SELECT s.*, COUNT(p.id) as product_count
        FROM suppliers s
        LEFT JOIN products p ON p.supplier_id = s.id
        GROUP BY s.id
        ORDER BY s.name ASC
      `);
      res.json(suppliers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error fetching suppliers' });
    }
  });

  // POST /api/suppliers
  app.post('/api/suppliers', async (req, res) => {
    const { name, contact_person, phone, email, delivery_days, category, notes } = req.body;
    try {
      if (!name) {
        return res.status(400).json({ error: 'El nombre del proveedor es obligatorio' });
      }
      const result = await db.run(`
        INSERT INTO suppliers (name, contact_person, phone, email, delivery_days, category, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [name, contact_person || '', phone || '', email || '', delivery_days || 'LUN • VIE', category || 'General', notes || '']);

      res.status(201).json({ success: true, id: result.lastID });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error creating supplier' });
    }
  });

  // PUT /api/suppliers/:id
  app.put('/api/suppliers/:id', async (req, res) => {
    const { name, contact_person, phone, email, delivery_days, category, notes } = req.body;
    try {
      await db.run(`
        UPDATE suppliers
        SET name = ?, contact_person = ?, phone = ?, email = ?, delivery_days = ?, category = ?, notes = ?
        WHERE id = ?
      `, [name, contact_person, phone, email, delivery_days, category, notes, req.params.id]);

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error updating supplier' });
    }
  });

  // DELETE /api/suppliers/:id
  app.delete('/api/suppliers/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM suppliers WHERE id = ?', req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error deleting supplier' });
    }
  });

  // POST /api/sales (Process payment and deduct stock)
  app.post('/api/sales', async (req, res) => {
    const { method, total, items, cashier = 'Cajero' } = req.body;
    
    try {
      await db.run('BEGIN TRANSACTION');
      
      // 1. Insert into sales table
      const saleResult = await db.run(
        'INSERT INTO sales (timestamp, total, payment_method, cashier) VALUES (?, ?, ?, ?)',
        Date.now(), total, method, cashier
      );
      const saleId = saleResult.lastID;

      // 2. Insert items and deduct stock
      for (const item of items) {
        await db.run(
          'INSERT INTO sale_items (sale_id, product_sku, quantity, price) VALUES (?, ?, ?, ?)',
          saleId, item.sku, item.quantity, item.price
        );
        
        // Deduct stock from products table
        await db.run(
          'UPDATE products SET stock = stock - ? WHERE sku = ?',
          item.quantity, item.sku
        );
      }

      await db.run('COMMIT');
      res.status(201).json({ success: true, saleId });
    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Error processing sale:', error);
      res.status(500).json({ error: 'Error processing sale' });
    }
  });

  // GET ALL SALES
  app.get('/api/sales', async (req, res) => {
    try {
      const sales = await db.all('SELECT * FROM sales ORDER BY timestamp DESC LIMIT 100');
      
      // Para cada venta, podemos adjuntar los items si fuera necesario, pero el historial 
      // principal solo necesita el total, metodo, cajero y fecha.
      res.json(sales);
    } catch (error) {
      console.error('Error fetching sales:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // GET A SPECIFIC SALE WITH ITEMS
  app.get('/api/sales/:id', async (req, res) => {
    try {
      const sale = await db.get('SELECT * FROM sales WHERE id = ?', req.params.id);
      if (!sale) {
        return res.status(404).json({ error: 'Venta no encontrada' });
      }
      const items = await db.all(`
        SELECT si.*, COALESCE(p.name, si.product_sku) as name, p.is_bulk
        FROM sale_items si
        LEFT JOIN products p ON si.product_sku = p.sku
        WHERE si.sale_id = ?
      `, req.params.id);
      res.json({ ...sale, items });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching sale details' });
    }
  });

  // USERS AND AUTH API

  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await db.get('SELECT id, name, username, role, pin, password as stored_password FROM users WHERE username = ?', username);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Transparent migration: detect if stored password is bcrypt hash or plain text
      const isBcryptHash = user.stored_password && user.stored_password.startsWith('$2');
      let passwordMatch = false;

      if (isBcryptHash) {
        passwordMatch = await bcrypt.compare(password, user.stored_password);
      } else {
        // Legacy plain-text comparison — migrate to bcrypt on successful login
        passwordMatch = password === user.stored_password;
        if (passwordMatch) {
          const hashedPassword = await bcrypt.hash(password, 10);
          await db.run('UPDATE users SET password = ? WHERE id = ?', hashedPassword, user.id);
        }
      }

      if (passwordMatch) {
        const { stored_password, ...safeUser } = user;
        res.json({ success: true, user: safeUser });
      } else {
        res.status(401).json({ error: 'Credenciales inválidas' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error del servidor' });
    }
  });

  app.get('/api/users', async (req, res) => {
    try {
      const users = await db.all('SELECT id, name, username, role, pin, COALESCE(hourly_rate, 50.0) as hourly_rate, bank_name, bank_account, transfer_phone FROM users');
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching users' });
    }
  });

  app.post('/api/users', async (req, res) => {
    const { name, username, password, pin, role, bank_name, bank_account, transfer_phone } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await db.run(
        'INSERT INTO users (name, username, password, pin, role, bank_name, bank_account, transfer_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        name, username, hashedPassword, pin, role || 'cashier', bank_name || null, bank_account || null, transfer_phone || null
      );
      res.status(201).json({ success: true, id: result.lastID });
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: 'El nombre de usuario ya existe' });
      } else {
        res.status(500).json({ error: 'Error creando usuario' });
      }
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    const { name, username, password, pin, role, bank_name, bank_account, transfer_phone } = req.body;
    try {
      const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
      if (hashedPassword) {
        await db.run(
          'UPDATE users SET name = ?, username = ?, password = ?, pin = ?, role = ?, bank_name = ?, bank_account = ?, transfer_phone = ? WHERE id = ?',
          name, username, hashedPassword, pin, role, bank_name || null, bank_account || null, transfer_phone || null, req.params.id
        );
      } else {
        await db.run(
          'UPDATE users SET name = ?, username = ?, pin = ?, role = ?, bank_name = ?, bank_account = ?, transfer_phone = ? WHERE id = ?',
          name, username, pin, role, bank_name || null, bank_account || null, transfer_phone || null, req.params.id
        );
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Error actualizando usuario' });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM users WHERE id = ?', req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Error eliminando usuario' });
    }
  });

  // ==========================================
  // CUSTOMERS & RECEIVABLES (CUENTAS POR COBRAR)
  // ==========================================

  // GET /api/customers (list all customers with last payment info)
  app.get('/api/customers', async (req, res) => {
    try {
      const customers = await db.all(`
        SELECT 
          c.*,
          (
            SELECT json_object(
              'amount', t.amount,
              'timestamp', t.timestamp,
              'payment_method', t.payment_method
            )
            FROM customer_transactions t 
            WHERE t.customer_id = c.id AND t.type = 'payment'
            ORDER BY t.timestamp DESC 
            LIMIT 1
          ) as last_payment_json
        FROM customers c
        ORDER BY c.current_balance DESC
      `);

      const formatted = customers.map(c => {
        let lastPayment = null;
        if (c.last_payment_json) {
          try {
            lastPayment = JSON.parse(c.last_payment_json);
          } catch (e) {}
        }
        return {
          ...c,
          last_payment: lastPayment
        };
      });

      res.json(formatted);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error fetching customers' });
    }
  });

  // GET /api/customers/:id (customer detail with full transaction history)
  app.get('/api/customers/:id', async (req, res) => {
    const { id } = req.params;
    try {
      let customer;
      if (isNaN(Number(id))) {
        customer = await db.get('SELECT * FROM customers WHERE code = ?', id);
      } else {
        customer = await db.get('SELECT * FROM customers WHERE id = ? OR code = ?', id, id);
      }

      if (!customer) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      const transactions = await db.all(
        'SELECT * FROM customer_transactions WHERE customer_id = ? ORDER BY timestamp DESC',
        customer.id
      );

      const formattedTransactions = transactions.map(t => {
        let parsedItems = null;
        if (t.items) {
          try {
            parsedItems = typeof t.items === 'string' ? JSON.parse(t.items) : t.items;
          } catch (e) {}
        }
        return { ...t, items: parsedItems };
      });

      res.json({
        ...customer,
        transactions: formattedTransactions
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error fetching customer detail' });
    }
  });

  // POST /api/customers (create new debtor)
  app.post('/api/customers', async (req, res) => {
    const { name, email, phone, credit_limit, initial_balance } = req.body;
    try {
      const limit = parseFloat(credit_limit);
      const balance = parseFloat(initial_balance) || 0.0;

      if (isNaN(limit) || limit <= 0) {
        return res.status(400).json({ error: 'El límite de crédito debe ser un número mayor a 0.' });
      }

      // Regla estricta: El saldo pendiente no puede superar el límite de crédito
      if (balance > limit) {
        return res.status(400).json({ 
          error: `El saldo pendiente ($${balance.toFixed(2)}) no puede ser mayor al límite de crédito ($${limit.toFixed(2)}).` 
        });
      }

      const codeRow = await db.get('SELECT COUNT(*) as count FROM customers');
      const nextNum = (codeRow?.count || 0) + 1001;
      const code = `CLI-${nextNum}`;
      const percentUsed = limit > 0 ? Math.min(100, Math.round((balance / limit) * 100)) : 0;
      let status = `${percentUsed}% usado`;
      if (balance <= 0) status = '0% (Al Día)';
      else if (balance >= limit) status = '100% (Límite Tope)';

      const result = await db.run(
        'INSERT INTO customers (code, name, email, phone, credit_limit, current_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        code, name, email || '', phone || '', limit, balance, status
      );

      const customerId = result.lastID;

      if (balance > 0) {
        await db.run(
          'INSERT INTO customer_transactions (customer_id, type, amount, concept, payment_method, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
          customerId, 'charge', balance, 'Saldo Inicial / Venta', null, Date.now()
        );
      }

      res.status(201).json({ success: true, id: customerId, code });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error creando cliente' });
    }
  });

  // DELETE /api/customers/clear-all (clean fictitious records)
  app.delete('/api/customers/clear-all', async (req, res) => {
    try {
      await db.run('DELETE FROM customer_transactions');
      await db.run('DELETE FROM customers');
      res.json({ success: true, message: 'Todos los clientes ficticios fueron eliminados correctamente.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error eliminando registros de clientes' });
    }
  });

  // DELETE /api/customers/:id (delete single customer and transactions with password)
  app.delete('/api/customers/:id', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    try {
      if (!password) {
        return res.status(400).json({ error: 'La contraseña de login es requerida para eliminar un cliente.' });
      }

      // Verify password against stored bcrypt hashes
      const allUsers = await db.all('SELECT id, name, role, password as stored_password FROM users');
      let matchedUser: any = null;

      for (const u of allUsers) {
        if (!u.stored_password) continue;
        const isBcryptHash = u.stored_password.startsWith('$2');
        let isMatch = false;

        if (isBcryptHash) {
          isMatch = await bcrypt.compare(password, u.stored_password);
        } else {
          // Legacy plain-text fallback
          isMatch = password === u.stored_password;
        }

        if (isMatch) {
          matchedUser = u;
          break;
        }
      }

      if (!matchedUser) {
        return res.status(401).json({ error: 'Contraseña de login incorrecta.' });
      }

      let customer;
      if (isNaN(Number(id))) {
        customer = await db.get('SELECT * FROM customers WHERE code = ?', id);
      } else {
        customer = await db.get('SELECT * FROM customers WHERE id = ? OR code = ?', id, id);
      }

      if (!customer) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      await db.run('DELETE FROM customer_transactions WHERE customer_id = ?', customer.id);
      await db.run('DELETE FROM customers WHERE id = ?', customer.id);

      res.json({ 
        success: true, 
        message: `Cliente ${customer.name} (${customer.code}) eliminado correctamente por ${matchedUser.name}.` 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error eliminando cliente' });
    }
  });

  // PUT /api/customers/:id (update customer details and custom credit limit)
  app.put('/api/customers/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, credit_limit } = req.body;
    try {
      let customer;
      if (isNaN(Number(id))) {
        customer = await db.get('SELECT * FROM customers WHERE code = ?', id);
      } else {
        customer = await db.get('SELECT * FROM customers WHERE id = ? OR code = ?', id, id);
      }

      if (!customer) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      const newLimit = parseFloat(credit_limit);
      if (isNaN(newLimit) || newLimit <= 0) {
        return res.status(400).json({ error: 'El límite de crédito debe ser mayor a 0.' });
      }

      // Regla estricta: El límite no puede reducirse por debajo del saldo pendiente actual
      if (customer.current_balance > newLimit) {
        return res.status(400).json({ 
          error: `El nuevo límite ($${newLimit.toFixed(2)}) no puede ser menor al saldo pendiente actual ($${customer.current_balance.toFixed(2)}).` 
        });
      }

      const percentUsed = newLimit > 0 ? Math.min(100, Math.round((customer.current_balance / newLimit) * 100)) : 0;
      let status = `${percentUsed}% usado`;
      if (customer.current_balance <= 0) status = '0% (Al Día)';
      else if (customer.current_balance >= newLimit) status = '100% (Límite Tope)';

      await db.run(
        'UPDATE customers SET name = ?, email = ?, phone = ?, credit_limit = ?, status = ? WHERE id = ?',
        name || customer.name, email ?? customer.email, phone ?? customer.phone, newLimit, status, customer.id
      );

      res.json({ success: true, newLimit, status });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error actualizando cliente' });
    }
  });

  // POST /api/customers/:id/payments (register payment / abono)
  app.post('/api/customers/:id/payments', async (req, res) => {
    const { id } = req.params;
    const { amount, payment_method, concept } = req.body;
    try {
      let customer;
      if (isNaN(Number(id))) {
        customer = await db.get('SELECT * FROM customers WHERE code = ?', id);
      } else {
        customer = await db.get('SELECT * FROM customers WHERE id = ? OR code = ?', id, id);
      }

      if (!customer) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      const abono = parseFloat(amount);
      if (!abono || abono <= 0) {
        return res.status(400).json({ error: 'Monto inválido' });
      }

      const newBalance = Math.max(0, customer.current_balance - abono);
      const percentUsed = customer.credit_limit > 0 ? Math.min(100, Math.round((newBalance / customer.credit_limit) * 100)) : 0;
      let status = `${percentUsed}% usado`;
      if (newBalance <= 0) status = '0% (Al Día)';
      else if (newBalance >= customer.credit_limit) status = '100% (Límite Tope)';

      await db.run(
        'UPDATE customers SET current_balance = ?, status = ? WHERE id = ?',
        newBalance, status, customer.id
      );

      const txResult = await db.run(
        'INSERT INTO customer_transactions (customer_id, type, amount, concept, payment_method, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        customer.id, 'payment', abono, concept || 'Abono a Cuenta', payment_method || 'Efectivo', Date.now()
      );

      res.status(201).json({
        success: true,
        transactionId: txResult.lastID,
        newBalance,
        status
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error procesando abono' });
    }
  });

  // POST /api/customers/:id/charges (register credit charge / fiado)
  app.post('/api/customers/:id/charges', async (req, res) => {
    const { id } = req.params;
    const { amount, concept, items } = req.body;
    try {
      let customer;
      if (isNaN(Number(id))) {
        customer = await db.get('SELECT * FROM customers WHERE code = ?', id);
      } else {
        customer = await db.get('SELECT * FROM customers WHERE id = ? OR code = ?', id, id);
      }

      if (!customer) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      const cargo = parseFloat(amount);
      if (!cargo || cargo <= 0) {
        return res.status(400).json({ error: 'Monto inválido' });
      }

      // Regla estricta: El saldo pendiente no puede superar el límite de crédito
      if (customer.current_balance + cargo > customer.credit_limit) {
        const disponible = Math.max(0, customer.credit_limit - customer.current_balance);
        return res.status(400).json({ 
          error: `Operación denegada: El saldo pendiente superaría el límite de crédito ($${customer.credit_limit.toFixed(2)}). Crédito disponible restante: $${disponible.toFixed(2)}.` 
        });
      }

      const newBalance = customer.current_balance + cargo;
      const percentUsed = customer.credit_limit > 0 ? Math.min(100, Math.round((newBalance / customer.credit_limit) * 100)) : 0;
      let status = `${percentUsed}% usado`;
      if (newBalance <= 0) status = '0% (Al Día)';
      else if (newBalance >= customer.credit_limit) status = '100% (Límite Tope)';

      await db.run(
        'UPDATE customers SET current_balance = ?, status = ? WHERE id = ?',
        newBalance, status, customer.id
      );

      const itemsStr = items && Array.isArray(items) && items.length > 0 ? JSON.stringify(items) : null;

      const txResult = await db.run(
        'INSERT INTO customer_transactions (customer_id, type, amount, concept, payment_method, timestamp, items) VALUES (?, ?, ?, ?, ?, ?, ?)',
        customer.id, 'charge', cargo, concept || 'Compra a Crédito', null, Date.now(), itemsStr
      );

      res.status(201).json({
        success: true,
        transactionId: txResult.lastID,
        newBalance,
        status
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error registrando cargo' });
    }
  });

  // ==========================================
  // SETTINGS (CONFIGURACIÓN DEL SISTEMA)
  // ==========================================

  app.get('/api/settings', async (req, res) => {
    try {
      const rows = await db.all('SELECT key, value FROM settings');
      const settings: Record<string, any> = {};
      for (const row of rows) {
        try {
          settings[row.key] = JSON.parse(row.value);
        } catch {
          settings[row.key] = row.value;
        }
      }
      res.json(settings);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error obteniendo configuraciones' });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      const settings = req.body;
      for (const [key, value] of Object.entries(settings)) {
        const valStr = typeof value === 'string' ? value : JSON.stringify(value);
        await db.run(
          'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
          key, valStr
        );
      }
      res.json({ success: true, message: 'Configuraciones guardadas y aplicadas con éxito' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error guardando configuraciones' });
    }
  });

  // ==========================================
  // PAYROLL & SHIFTS (GESTIÓN DE NÓMINA Y HORAS)
  // ==========================================

  // GET /api/payroll/summary (Full payroll breakdown per employee)
  app.get('/api/payroll/summary', async (req, res) => {
    try {
      const users = await db.all('SELECT id, name, username, role, pin, COALESCE(hourly_rate, 50.0) as hourly_rate, bank_name, bank_account, transfer_phone FROM users');
      const shifts = await db.all('SELECT * FROM payroll_shifts ORDER BY timestamp DESC');
      const advances = await db.all('SELECT * FROM payroll_advances ORDER BY timestamp DESC');
      const payments = await db.all('SELECT * FROM payroll_payments ORDER BY timestamp DESC');

      const summary = users.map(u => {
        const userShifts = shifts.filter(s => s.user_id === u.id);
        const userAdvances = advances.filter(a => a.user_id === u.id);
        const userPayments = payments.filter(p => p.user_id === u.id);

        const totalHours = userShifts.reduce((sum, s) => sum + (s.hours || 0), 0);
        const totalEarned = userShifts.reduce((sum, s) => sum + (s.total_pay || 0), 0);
        const totalAdvances = userAdvances.reduce((sum, a) => sum + (a.amount || 0), 0);
        const totalPaid = userPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const netPay = Math.max(0, totalEarned - totalAdvances - totalPaid);

        return {
          ...u,
          total_hours: totalHours,
          total_earned: totalEarned,
          total_advances: totalAdvances,
          total_paid: totalPaid,
          net_pay: netPay,
          shifts: userShifts,
          advances: userAdvances,
          payments: userPayments
        };
      });

      res.json(summary);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error obteniendo nómina' });
    }
  });

  // POST /api/payroll/shifts (Register shift / hours worked)
  app.post('/api/payroll/shifts', async (req, res) => {
    const { user_id, date, hours, hourly_rate, notes } = req.body;
    try {
      const user = await db.get('SELECT id, hourly_rate FROM users WHERE id = ?', user_id);
      if (!user) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }

      const hrs = parseFloat(hours);
      if (isNaN(hrs) || hrs <= 0) {
        return res.status(400).json({ error: 'Horas trabajadas deben ser mayores a 0' });
      }

      const rate = parseFloat(hourly_rate) || user.hourly_rate || 50.0;
      const totalPay = hrs * rate;
      const shiftDate = date || new Date().toISOString().split('T')[0];

      const result = await db.run(
        'INSERT INTO payroll_shifts (user_id, date, hours, hourly_rate, total_pay, notes, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
        user.id, shiftDate, hrs, rate, totalPay, notes || 'Turno / Cobertura de horas', Date.now()
      );

      res.status(201).json({
        success: true,
        id: result.lastID,
        hours: hrs,
        hourly_rate: rate,
        total_pay: totalPay
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error registrando horas de turno' });
    }
  });

  // POST /api/payroll/advances (Register cash advance / vale)
  app.post('/api/payroll/advances', async (req, res) => {
    const { user_id, date, amount, reason } = req.body;
    try {
      const user = await db.get('SELECT id FROM users WHERE id = ?', user_id);
      if (!user) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }

      const val = parseFloat(amount);
      if (isNaN(val) || val <= 0) {
        return res.status(400).json({ error: 'Monto de adelanto inválido' });
      }

      const advanceDate = date || new Date().toISOString().split('T')[0];

      const result = await db.run(
        'INSERT INTO payroll_advances (user_id, date, amount, reason, timestamp) VALUES (?, ?, ?, ?, ?)',
        user.id, advanceDate, val, reason || 'Adelanto de efectivo / Vale', Date.now()
      );

      res.status(201).json({
        success: true,
        id: result.lastID,
        amount: val
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error registrando adelanto' });
    }
  });

  // POST /api/payroll/payments (Register payroll liquidation / salary payment)
  app.post('/api/payroll/payments', async (req, res) => {
    const { user_id, amount, payment_method, reference_info, notes } = req.body;
    try {
      const user = await db.get('SELECT id, name, bank_name, bank_account FROM users WHERE id = ?', user_id);
      if (!user) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }

      const val = parseFloat(amount);
      if (isNaN(val) || val <= 0) {
        return res.status(400).json({ error: 'Monto de pago inválido' });
      }

      const method = payment_method || 'Efectivo';
      const ref = reference_info || (method === 'Transferencia' ? `${user.bank_name || ''} - ${user.bank_account || ''}` : 'Pago en efectivo en mostrador');

      const result = await db.run(
        'INSERT INTO payroll_payments (user_id, amount, payment_method, reference_info, notes, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        user.id, val, method, ref, notes || 'Liquidación de Nómina', Date.now()
      );

      res.status(201).json({
        success: true,
        id: result.lastID,
        amount: val,
        payment_method: method
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error registrando pago de nómina' });
    }
  });

  // PUT /api/users/:id/rate (Update employee hourly rate)
  app.put('/api/users/:id/rate', async (req, res) => {
    const { id } = req.params;
    const { hourly_rate } = req.body;
    try {
      const rate = parseFloat(hourly_rate);
      if (isNaN(rate) || rate <= 0) {
        return res.status(400).json({ error: 'Tarifa por hora inválida' });
      }

      await db.run('UPDATE users SET hourly_rate = ? WHERE id = ?', rate, id);
      res.json({ success: true, hourly_rate: rate });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error actualizando tarifa' });
    }
  });

  // ==========================================
  // CASH SHIFTS & CLOCK IN/OUT (CHECADOR DE CAJA)
  // ==========================================

  // GET /api/cash-shifts (Get history of cash shifts with real hours)
  app.get('/api/cash-shifts', async (req, res) => {
    try {
      const shifts = await db.all('SELECT * FROM cash_shifts ORDER BY open_time DESC LIMIT 50');
      res.json(shifts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error obteniendo turnos de caja' });
    }
  });

  // GET /api/cash-shifts/active (Get currently active cash shift with user hourly rate)
  app.get('/api/cash-shifts/active', async (req, res) => {
    try {
      const activeShift = await db.get('SELECT * FROM cash_shifts WHERE status = ? ORDER BY open_time DESC LIMIT 1', 'open');
      if (!activeShift) {
        return res.json({ active: false, shift: null });
      }
      let hourlyRate = 50.0;
      let userName = activeShift.user_name || 'Cajero';
      if (activeShift.user_id) {
        const user = await db.get('SELECT hourly_rate, name, username FROM users WHERE id = ?', activeShift.user_id);
        if (user?.hourly_rate) hourlyRate = user.hourly_rate;
        if (user?.name) userName = user.name;
      }
      res.json({
        active: true,
        shift: {
          ...activeShift,
          user_name: userName,
          hourly_rate: hourlyRate
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error obteniendo turno activo' });
    }
  });

  // POST /api/cash-shifts/open (Clock in: Apertura de Caja)
  app.post('/api/cash-shifts/open', async (req, res) => {
    const { user_name, user_id, initial_fund } = req.body;
    try {
      let finalUserId = user_id;
      let finalUserName = user_name || 'Cajero';

      if (!finalUserId && user_name) {
        const user = await db.get('SELECT id FROM users WHERE name = ? OR username = ?', user_name, user_name);
        if (user) finalUserId = user.id;
      }

      const result = await db.run(
        'INSERT INTO cash_shifts (user_id, user_name, open_time, initial_fund, status) VALUES (?, ?, ?, ?, ?)',
        finalUserId || null, finalUserName, Date.now(), parseFloat(initial_fund) || 2000.0, 'open'
      );

      res.status(201).json({
        success: true,
        shift_id: result.lastID,
        open_time: Date.now(),
        message: 'Apertura de caja registrada como hora de entrada'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error registrando apertura' });
    }
  });

  // POST /api/cash-shifts/close (Clock out: Cierre de Turno)
  app.post('/api/cash-shifts/close', async (req, res) => {
    const { user_name, total_sales } = req.body;
    try {
      // Find open shift
      const openShift = await db.get('SELECT * FROM cash_shifts WHERE status = ? ORDER BY open_time DESC LIMIT 1', 'open');
      
      const closeTime = Date.now();
      let hoursWorked = 0;
      let totalPayout = 0;
      let hourlyRate = 50.0;

      if (openShift) {
        const diffMs = closeTime - openShift.open_time;
        // Convert to hours (e.g. 5.25 hrs). Minimum 0.1 hrs for immediate test
        hoursWorked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
        if (hoursWorked < 0.1) hoursWorked = 0.1;

        if (openShift.user_id) {
          const user = await db.get('SELECT hourly_rate FROM users WHERE id = ?', openShift.user_id);
          if (user?.hourly_rate) hourlyRate = user.hourly_rate;
        }

        totalPayout = parseFloat((hoursWorked * hourlyRate).toFixed(2));

        await db.run(
          'UPDATE cash_shifts SET close_time = ?, hours_worked = ?, hourly_rate = ?, total_payout = ?, total_sales = ?, status = ? WHERE id = ?',
          closeTime, hoursWorked, hourlyRate, totalPayout, parseFloat(total_sales) || 0.0, 'closed', openShift.id
        );

        // Auto register to payroll_shifts if we know the user_id
        if (openShift.user_id) {
          const openDate = new Date(openShift.open_time);
          const closeDate = new Date(closeTime);
          const note = `Turno caja automático (${openDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} a ${closeDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`;
          
          await db.run(
            'INSERT INTO payroll_shifts (user_id, date, hours, hourly_rate, total_pay, notes, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
            openShift.user_id, openDate.toISOString().split('T')[0], hoursWorked, hourlyRate, totalPayout, note, Date.now()
          );
        }
      }

      res.json({
        success: true,
        hours_worked: hoursWorked,
        hourly_rate: hourlyRate,
        total_payout: totalPayout,
        message: 'Cierre de turno registrado como hora de salida y nómina calculada'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error registrando cierre' });
    }
  });

  let publicTunnelUrl = '';
  
  const setupTunnel = async (port: number) => {
    try {
      // tunnelmole is used to avoid localtunnel's anti-phishing warning page
      const url = await tunnelmole({ port });
      publicTunnelUrl = url;
      console.log(`Túnel público activo: ${url}`);
    } catch (err) {
      console.error('Error al inicializar el túnel público:', err);
    }
  };

  app.get('/api/system/public-link', (req, res) => {
    res.json({ url: publicTunnelUrl });
  });

  // Catch-all for SPA routing (must be before listen and after APIs)
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next();
    }
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });

  const PORT = parseInt(process.env.PORT || '3001', 10);
  const server = app.listen(PORT, () => {
    console.log(`Servidor local corriendo en http://localhost:${PORT}`);
    setupTunnel(PORT);
  });
  
  // Graceful shutdown to prevent EADDRINUSE zombies
  const shutdown = () => {
    console.log('Cerrando servidor y túnel...');
    server.close(() => {
      process.exit(0);
    });
    // Force exit if server takes too long to close
    setTimeout(() => process.exit(0), 1500);
  };
  
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  
  // Also listen for parent process disconnection (when started via fork in Windows)
  process.on('disconnect', () => {
    shutdown();
  });

}).catch(err => {
  console.error("Error al iniciar DB:", err);
});
