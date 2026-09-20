const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Environment variables (move to .env for production)
const SECRET_KEY = process.env.JWT_SECRET || 'H3r1t4g3_S3cr3t_M4st3r_K3y_2026';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mgqruqktnhxqhbdwcxsa.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET /api/licenses
app.get('/api/licenses', async (req, res) => {
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/licenses
app.post('/api/licenses', async (req, res) => {
  const { client_name, months, machine_id } = req.body;
  
  if (!client_name || !months || !machine_id) {
    return res.status(400).json({ error: 'Faltan datos (el Código de Máquina es obligatorio)' });
  }

  const m = parseInt(months);
  const expDate = new Date();
  expDate.setMonth(expDate.getMonth() + m);

  const payload = {
    tier: 'premium',
    client: client_name,
    machineId: machine_id,
    createdAt: Date.now(),
    exp: Math.floor(expDate.getTime() / 1000)
  };

  const token = jwt.sign(payload, SECRET_KEY);

  const { data, error } = await supabase
    .from('licenses')
    .insert([
      {
        client_name,
        months: m,
        expires_at: expDate.toISOString(),
        token,
        machine_id
      }
    ])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data[0].id, token });
});

// DELETE /api/licenses/:id (Revocar/Eliminar visualmente)
app.delete('/api/licenses/:id', async (req, res) => {
  const { error } = await supabase
    .from('licenses')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🔒 HERITAGE MASTER CONTROL ACTIVADO (SUPABASE)`);
  console.log(`========================================`);
  console.log(`Panel de Control: http://localhost:${PORT}`);
});
