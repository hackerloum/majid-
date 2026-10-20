# VICOBA

A simple record book for village savings groups (VICOBA) in Tanzania. Swahili is the default language. One login owns one group, and Row Level Security keeps each group on its own data. Money is stored as whole Tanzanian shillings.

SMS, USSD, and offline mode are not part of this version.

## What you need

- Node.js 20 or newer
- A free [Supabase](https://supabase.com) project

## 1. Create the Supabase project

1. Create a new project in Supabase.
2. Open **Authentication → Sign In / Providers → Email**.
3. Turn **Confirm email** off. If it stays on, a new user cannot enter the app until they open the email link.
4. Open **SQL Editor**, paste the whole file `supabase/schema.sql`, and run it once.

That file creates `groups`, `members`, `contributions`, `loans`, `repayments`, `fines`, `transactions`, and `activity_logs`. It also turns on Row Level Security and the functions that record money.

Signing up creates the group automatically from the group name on the form.

## 2. Connect the app

In Supabase, open **Project Settings → API** and copy the project URL and the `anon` public key.

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Put your values in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Use the anon key, not the service role key.

## 3. Run the app

```bash
npm install
npm run dev
```

Open http://localhost:3000, choose **Jisajili**, enter the group name, email, and a password of at least 6 characters.

The **SW / EN** button in the header switches language and remembers the choice on that phone.

## How the money works

- A contribution, loan, repayment, fine, or profit payout writes a row in its own table and a row in `transactions`. Reports read `transactions`.
- Loan interest is a flat percentage of the principal: `interest = round(principal × percent / 100)`, and `total to repay = principal + interest`.
- A repayment cannot be larger than the remaining balance. The balance is `total to repay − repayments`. At zero, the loan is marked paid. Principal is counted as repaid before interest.
- “Has not contributed” means an active member with no contribution in the selected month. Months use the Africa/Dar es Salaam calendar.
- Profit for the open cycle is interest collected since the last share-out, plus fines since that share-out. Each member who contributed in the cycle gets their contributions back, plus `their contributions ÷ all contributions × profit`. Leftover shillings from rounding go to the member who saved the most.
- Confirming a share-out does not delete history. The next cycle starts after that moment.
- The share-out page warns when loans are still active. It does not block the payout.
- **Chapisha / Pakua PDF** opens the browser print dialog. Choose **Save as PDF** there.

## 4. Host on Vercel

The GitHub repo is https://github.com/hackerloum/majid-

1. Open [vercel.com/new](https://vercel.com/new) and import that repository.
2. Framework stays **Next.js**. Root directory stays `.`
3. Add these Environment Variables for **Production**, **Preview**, and **Development**:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   Use the same values as `.env.local`. Use the publishable / anon key, not the secret key.
4. Deploy. Copy the production URL, for example `https://majid.vercel.app`.
5. In Supabase, open **Authentication → URL Configuration** and set:

   - **Site URL** to the Vercel production URL
   - **Redirect URLs** to:
     - `https://YOUR-APP.vercel.app/auth/callback`
     - `https://YOUR-APP.vercel.app/**`
     - `http://localhost:3000/auth/callback`

Keep **Confirm email** off unless you want people to open a mail link before they can enter.

Every later push to `main` will rebuild production. Pull requests get preview URLs.

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

