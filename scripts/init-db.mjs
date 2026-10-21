import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Error: DATABASE_URL no está definida en las variables de entorno.');
  process.exit(1);
}

async function main() {
  console.log('Connecting to Neon...');
  const sql = neon(databaseUrl);

  console.log('Creating transactions table...');
  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      hash VARCHAR(66) NOT NULL UNIQUE,
      account VARCHAR(42) NOT NULL,
      chain_id BIGINT NOT NULL,
      tx_type VARCHAR(32) NOT NULL,
      vault_name VARCHAR(128),
      amount VARCHAR(64) NOT NULL,
      symbol VARCHAR(16) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_tx_account_chain ON transactions(account, chain_id);
  `;

  const rows = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`;
  console.log('Tables in public schema:', rows);
  console.log('Success! Neon is ready.');
}

main().catch(err => {
  console.error('Error connecting to Neon:', err);
  process.exit(1);
});
