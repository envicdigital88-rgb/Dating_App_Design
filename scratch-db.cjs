require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(async () => {
  try {
    const res = await client.query("UPDATE \"user\" SET role = 'admin' WHERE email = 'envicdigital88@gmail.com'");
    console.log("Updated role to admin:", res.rowCount);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
});
