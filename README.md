# Due Invoice Maker

A private, single-user web application for creating, managing, printing, and downloading professional invoices.

## Current technology stack

| Area | Technology | Purpose |
| --- | --- | --- |
| Web framework | Next.js 16 (App Router) | Pages, server components, and API routes |
| User interface | React 19 | Interactive invoice, customer, item, and company screens |
| Language | TypeScript 5.9 | Type-safe frontend and backend code |
| Styling | Custom CSS | Responsive application and US Letter invoice layouts |
| Server runtime | Node.js 22 | Authentication, database access, and PDF generation |
| Database | PostgreSQL (Neon on Vercel) | Stores company details, customers, items, tax rates, and invoices |
| Database driver | `pg` | PostgreSQL connection pooling, queries, and transactions |
| Authentication | `jose` + `bcryptjs` | Signed JWT session cookies and password-hash verification |
| PDF generation | PDFKit | Server-side downloadable US Letter invoice PDFs |
| Optional archive | Google Drive API (`googleapis`) | Uploads generated PDFs when Google Drive is configured |
| Source control | GitHub | Stores and tracks the application source code |
| Hosting | Vercel | Builds and hosts the Next.js application |

## Current features

- Single username/password login with secure, HTTP-only session cookies
- Company profile and logo
- Multiple company addresses
- Saved customers and reusable invoice items
- Per-item fixed or percentage discounts
- Optional tax rates and taxable items
- Cash and card payment tracking
- Paid, partially paid, and unpaid balances
- Invoice history with deletion confirmation
- Responsive desktop and mobile interface
- Printable invoices and server-generated PDF downloads
- Optional Google Drive PDF archiving

The printed invoice is intentionally based on the supplied `rosa.pdf` reference: logo/company information on the upper-left, invoice information on the upper-right, customer/item section, totals/payment section, and Terms & Conditions at the bottom.

## 1. Requirements

- Node.js 22.17 or newer
- A hosted PostgreSQL database (the current deployment uses Neon)
- GitHub
- Vercel
- A Google Cloud project, service account, and Drive folder only if Google Drive archiving will be used

## 2. Install

```bash
npm install
```

## 3. Configure environment

Copy `.env.example` to `.env.local`.

Generate your password hash:

```bash
npm run hash-password
```

Paste the returned hash into `APP_PASSWORD_HASH`. Set `APP_USERNAME` to the username you want to use.

For compatibility with older deployments, `APP_PASSWORD` is also supported as a plain-text fallback. `APP_PASSWORD_HASH` is preferred and takes priority when both are set.

Generate a strong `AUTH_SECRET`, for example:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Put it in `AUTH_SECRET`.

## 4. Connect the database

Set `DATABASE_URL` to a hosted PostgreSQL connection string. Vercel's Neon integration can create this variable automatically when the custom prefix is `DATABASE`.

The application creates missing tables automatically on its first authenticated request. You may also initialize them manually with:

```bash
npm run db:init
```

If your shell does not support the command above, run the SQL in `prisma/schema.sql` using your database provider's SQL editor.

## 5. Google Drive (optional)

1. Create a Google Cloud project.
2. Enable Google Drive API.
3. Create a service account.
4. Create a folder in your Google Drive.
5. Share that folder with the service account's `client_email` as Editor.
6. Copy the folder ID from the Drive URL.
7. Put the service-account JSON in `GOOGLE_SERVICE_ACCOUNT_JSON`.
8. Put the folder ID in `GOOGLE_DRIVE_FOLDER_ID`.

When configured, the app can upload generated PDFs to that folder. PDF downloading works without Google Drive.

## 6. Run locally

```bash
npm run dev
```

Open:

http://localhost:3000

## 7. PDF engine

The application uses PDFKit in the Node.js server runtime. It generates PDFs directly without Chrome, Chromium, Playwright, or a third-party conversion service.

PDF files are generated when requested and downloaded to the user's device. They are not permanently stored by Vercel. A copy is stored only when the optional Google Drive upload feature is used.

## 8. Deploy

Push the repository to GitHub and import it into Vercel.

Add all variables from `.env.local` to Vercel Project Settings → Environment Variables.

Make sure the production database is reachable from Vercel.

After deployment, test:

1. Login
2. Company profile
3. Logo
4. Addresses
5. Customer
6. Item
7. Tax rate
8. New invoice
9. PDF
10. Google Drive upload
11. Invoice history
12. Print

## Important

This is intentionally a single-user application. There is no registration or multi-user account system.

Because it is publicly hosted, the username/password protects the application and its API routes. Use a strong password and keep all secrets in environment variables.

Tax by ZIP is implemented as a user-maintained ZIP → tax-rate table. This avoids hard-coding changing US tax rates. A commercial/current tax-rate API can be added later if you want automatic jurisdiction-level tax calculation.

## Reference invoice

The supplied reference is a one-page US Letter invoice with the following structure: INVOICE and invoice number at the top-right, invoice date/terms/due date, customer name, item table with description/qty/rate/amount, subtotal/discount/total/payment/balance, and Terms & Conditions. The implementation follows that hierarchy while leaving your company/logo data configurable.
