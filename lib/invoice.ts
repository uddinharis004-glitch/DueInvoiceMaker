import { query } from "@/lib/db";
import type { Address, Company, Customer, Item } from "@/lib/types";

export async function getCompany() {
  const { rows } = await query<Company>("SELECT * FROM company WHERE id = 1");
  return rows[0];
}

export async function getAddresses() {
  const { rows } = await query<Address>(
    "SELECT * FROM addresses ORDER BY is_default DESC, name ASC",
  );
  return rows;
}

export async function getCustomers() {
  const { rows } = await query<Customer>(
    "SELECT * FROM customers ORDER BY name ASC",
  );
  return rows;
}

export async function getItems() {
  const { rows } = await query<Item>(
    "SELECT * FROM items ORDER BY name ASC",
  );
  return rows;
}

export async function getTaxRates() {
  const { rows } = await query(
    "SELECT * FROM tax_rates ORDER BY zip ASC",
  );
  return rows;
}

export async function getInvoices() {
  const { rows } = await query(
    `SELECT id, invoice_number, invoice_date, total, balance_due, payment_status,
            payment_method, customer_snapshot, drive_file_id, drive_file_name
     FROM invoices ORDER BY created_at DESC`,
  );
  return rows;
}

export async function getInvoice(id: string) {
  const { rows } = await query("SELECT * FROM invoices WHERE id = $1", [id]);
  return rows[0];
}

export async function nextInvoiceNumber(prefix: string, client: any) {
  const { rows } = await client.query(
    "SELECT next_invoice_number FROM company WHERE id = 1 FOR UPDATE",
  );
  const next = Number(rows[0]?.next_invoice_number ?? 1);
  const number = `${prefix}${String(next).padStart(6, "0")}`;

  await client.query(
    "UPDATE company SET next_invoice_number = $1, updated_at = NOW() WHERE id = 1",
    [next + 1],
  );

  return number;
}
