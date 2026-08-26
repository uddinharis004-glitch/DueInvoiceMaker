# Private Invoice Maker

A single-user invoice application built for a private company:

- Next.js + React
- PostgreSQL
- HTML/CSS invoice template
- Playwright + Chromium PDF generation
- Google Drive PDF archive
- Single username/password login
- US Letter (8.5 x 11) invoice format
- Saved company profile, multiple addresses, customers, reusable items, tax rates, invoices and payment status

The printed invoice is intentionally based on the supplied `rosa.pdf` reference: logo/company information on the upper-left, invoice information on the upper-right, customer/item section, totals/payment section, and Terms & Conditions at the bottom.

## 1. Requirements

- Node.js 20.19+ recommended
- PostgreSQL
- Google Cloud project with Google Drive API enabled
- A Google service account
- A Google Drive folder shared with the service account
- GitHub
- Vercel

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

Paste the returned hash into `APP_PASSWORD_HASH`.

Generate a strong `AUTH_SECRET`, for example:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Put it in `AUTH_SECRET`.

## 4. Create the database

Create a PostgreSQL database, then run:

```bash
npm run db:init
```

If your shell does not support the command above, run the SQL in `prisma/schema.sql` using your database provider's SQL editor.

## 5. Google Drive

1. Create a Google Cloud project.
2. Enable Google Drive API.
3. Create a service account.
4. Create a folder in your Google Drive.
5. Share that folder with the service account's `client_email` as Editor.
6. Copy the folder ID from the Drive URL.
7. Put the service-account JSON in `GOOGLE_SERVICE_ACCOUNT_JSON`.
8. Put the folder ID in `GOOGLE_DRIVE_FOLDER_ID`.

The app uploads generated PDFs to that folder.

## 6. Run locally

```bash
npm run dev
```

Open:

http://localhost:3000

## 7. PDF engine

Local development uses your installed Chrome/Chromium if `CHROME_EXECUTABLE_PATH` is set.

If it is not set, the app attempts to use the Playwright-installed Chromium path.

Install a local Playwright browser if needed:

```bash
npx playwright install chromium
```

For Vercel/serverless, the app uses `@sparticuz/chromium` with `playwright-core`.

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
