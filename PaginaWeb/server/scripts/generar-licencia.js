const jwt = require('jsonwebtoken');

// Read secret key from environment variable, fallback for development
const SECRET_KEY = process.env.JWT_SECRET || 'H3r1t4g3_S3cr3t_M4st3r_K3y_2026'; 

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("========================================");
console.log("🛠️ GENERADOR DE LICENCIAS HERITAGE POS 🛠️");
console.log("========================================");
console.log("Duraciones disponibles:");
console.log("1 = 1 Mes");
console.log("3 = 3 Meses");
console.log("6 = 6 Meses");
console.log("12 = 1 Año");

readline.question('Ingresa el número de meses para esta licencia (ej. 3): ', (monthsInput) => {
  const months = parseInt(monthsInput);
  
  if (isNaN(months) || months <= 0) {
    console.error("❌ Error: Número de meses inválido.");
    readline.close();
    return;
  }

  // Calculate expiration date
  const expDate = new Date();
  expDate.setMonth(expDate.getMonth() + months);
  
  // Create payload
  const payload = {
    tier: 'premium',
    createdAt: Date.now(),
    // exp must be in seconds for standard JWT expiration handling
    exp: Math.floor(expDate.getTime() / 1000), 
  };

  // Sign token
  const token = jwt.sign(payload, SECRET_KEY);

  console.log("\n✅ LICENCIA GENERADA CON ÉXITO");
  console.log("Válida hasta:", expDate.toLocaleString());
  console.log("\nEntrega esta clave al cliente:\n");
  console.log(token);
  console.log("\n========================================\n");

  readline.close();
});
