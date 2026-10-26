export type CustomerChoice = {
  id: string;
  name: string;
  company_name?: string;
  phone?: string;
  email?: string;
};

export const RECENT_CUSTOMER_LIMIT = 4;

export function filterCustomerChoices<T extends CustomerChoice>(customers: T[], query: string, limit: number) {
  const normalizedQuery = query.trim().toLowerCase();
  const matches = normalizedQuery
    ? customers.filter((customer) => (
      `${customer.name} ${customer.company_name ?? ""} ${customer.email ?? ""} ${customer.phone ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery)
    ))
    : customers;

  return matches.slice(0, limit);
}
