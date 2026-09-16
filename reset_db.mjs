import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DIRECT_URL,
});

async function run() {
  try {
    await client.connect();
    console.log("Connected. Dropping schema...");
    await client.query('DROP SCHEMA public CASCADE;');
    console.log("Creating schema...");
    await client.query('CREATE SCHEMA public;');
    await client.query('GRANT ALL ON SCHEMA public TO postgres;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    console.log("Done.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
