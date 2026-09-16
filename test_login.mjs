import 'dotenv/config'
import pg from 'pg'

const { Client } = pg

const client = new Client({
  connectionString: process.env.DIRECT_URL
})

async function test() {
  await client.connect()
  const res = await client.query('SELECT * FROM "public"."user" WHERE email = $1', ['deshannethmina54@gmail.com'])
  console.log(res.rows)
  await client.end()
}
test()
