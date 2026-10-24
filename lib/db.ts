import { randomUUID } from "node:crypto";
import { Pool, type QueryResultRow } from "pg";
import { DataType, newDb } from "pg-mem";
import { DATABASE_SCHEMA } from "@/lib/schema";

declare global {
  // eslint-disable-next-line no-var
  var __invoicePool: Pool | undefined;
  var __invoiceSchemaReady: Promise<void> | undefined;
}

const databaseUrl = process.env.DATABASE_URL;
const useLocalPreviewDatabase = process.env.LOCAL_PREVIEW_DATABASE === "true";

if (!databaseUrl && !useLocalPreviewDatabase) {
  throw new Error("DATABASE_URL is not configured. Connect a PostgreSQL database in Vercel and redeploy.");
}

function createPool() {
  if (useLocalPreviewDatabase) {
    const database = newDb();
    database.registerExtension("pgcrypto", (schema) => {
      schema.registerFunction({
        name: "gen_random_uuid",
        returns: DataType.uuid,
        implementation: randomUUID,
        impure: true,
      });
    });

    const adapter = database.adapters.createPg();
    return new adapter.Pool() as unknown as Pool;
  }

  return new Pool({
    connectionString: databaseUrl,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    ssl: databaseUrl!.includes("localhost") || databaseUrl!.includes("127.0.0.1")
      ? false
      : { rejectUnauthorized: false },
  });
}

const pool =
  global.__invoicePool ??
  createPool();

if (process.env.NODE_ENV !== "production") global.__invoicePool = pool;

async function ensureSchema() {
  const initialize = async () => {
    await pool.query(DATABASE_SCHEMA);
  };

  if (process.env.NODE_ENV === "production") {
    global.__invoiceSchemaReady ??= initialize();
    await global.__invoiceSchemaReady;
    return;
  }

  global.__invoiceSchemaReady ??= initialize();
  await global.__invoiceSchemaReady;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  await ensureSchema();
  return pool.query<T>(text, params);
}

export async function transaction<T>(fn: (client: import("pg").PoolClient) => Promise<T>) {
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
