export type Company = {
  id: number;
  name: string;
  phone: string;
  email: string;
  website: string;
  logo_data: string | null;
  default_tax_enabled: boolean;
  default_tax_rate: string | number;
  default_terms: string;
  invoice_prefix: string;
  next_invoice_number: number;
};

export type Address = {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  is_default: boolean;
};

export type Customer = {
  id: string;
  name: string;
  company_name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  notes: string;
};

export type Item = {
  id: string;
  name: string;
  description: string;
  default_price: string | number;
  sku: string;
  taxable: boolean;
};

export type TaxRate = {
  id: string;
  zip: string;
  rate: string | number;
  label: string;
};

export type InvoiceRecord = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  terms: string;
  customer_snapshot: Customer;
  company_snapshot: Company;
  address_snapshot: Address;
  items: any[];
  subtotal: string;
  discount: string;
  tax: string;
  tax_rate: string;
  tax_enabled: boolean;
  total: string;
  payment_made: string;
  balance_due: string;
  payment_status: string;
  payment_method: string;
  payment_date: string | null;
  notes: string;
  drive_file_id: string | null;
  drive_file_name: string | null;
};
