# Luno — Admin Panel & Live Store Setup

Turn the demo storefront into a real store with an admin panel, live product
management, and order tracking. Takes ~15 minutes. Free.

Until you finish these steps the site keeps running on built-in demo data,
and `admin.html` shows a "not connected" notice.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → sign up (free) → **New project**.
2. Pick a name (e.g. `lunowear`), a strong database password, and a region near
   your customers. Wait ~1 minute for it to provision.

## 2. Create the database

1. In the Supabase dashboard open **SQL Editor** → **New query**.
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
3. Done — this creates all tables, security rules, image storage, and imports
   the current demo catalog so the store isn't empty.

## 3. Create your admin account

1. Dashboard → **Authentication** → **Users** → **Add user** → **Create new user**.
   Use your email + a strong password, and tick **Auto Confirm User**.
2. Back in **SQL Editor**, run (with your email):

```sql
insert into admins (user_id, email)
select id, email from auth.users where email = 'you@example.com';
```

Repeat both steps for each staff member who needs admin access.
To revoke someone: `delete from admins where email = 'person@example.com';`
(also delete/disable their user under Authentication).

## 3b. Customer accounts (migration 2)

In **SQL Editor**, run the contents of
[`supabase/schema2-accounts.sql`](supabase/schema2-accounts.sql) once.
This adds customer profiles, saved carts/wishlists, and links orders to
accounts (customers see their order history on the Account page).

**Google login (optional):** Dashboard → **Authentication** →
**Sign In / Providers** → **Google** → enable it and paste a Client ID +
Secret from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
(create an OAuth 2.0 Client, authorized redirect URI =
`https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`). Until enabled, the
"Continue with Google" button shows an error. Google sign-in also requires the
site to be opened over http(s) — `node server.mjs` locally, not a `file://` path.

## 4. Connect the website

1. Dashboard → **Settings** → **API Keys**: copy the **Project URL** and the
   **anon / public** key.
2. Paste both into [`assets/js/supabase-config.js`](assets/js/supabase-config.js).

That's it. Open `admin.html`, sign in, and manage everything:

| Tab | What you can do |
| --- | --- |
| Products | Add/edit/delete products — name, price, sale price, description, sizes, colors, photos (upload), badge, hide/show, sold out |
| Categories | Add, rename, delete categories — they appear on the site automatically |
| Orders | See every order with customer details, change status (pending → confirmed → shipped → delivered / cancelled) |

Customers check their order on `track.html` with their order number + email.

## Security — the rules that keep you safe

- **Never** put the `service_role` key in any file in this project. Only the
  **anon** key belongs in `supabase-config.js` — it is public by design.
- All permissions are enforced by **Row Level Security on Supabase's servers**.
  Editing the site's JavaScript cannot bypass it: only accounts listed in the
  `admins` table can change products, categories, orders, or upload images.
- Order prices are computed **server-side** from the database — a tampered
  cart cannot change what an order costs.
- Customers can only look up an order with **both** the order number and the
  email used — orders can't be browsed or guessed.
- Use strong, unique passwords for admin accounts. In Supabase you can also
  enable MFA (Authentication → Providers) and leaked-password protection.
- Host the site on HTTPS (GitHub Pages, Netlify, Vercel, Cloudflare Pages —
  all free and automatic).

## Optional next steps

- **Backups**: Supabase Pro has daily backups; on the free tier, occasionally
  export via Database → Backups or `pg_dump`.
- **Spam protection**: if fake orders become a problem, enable Supabase
  [Attack Protection / CAPTCHA] and we can wire it into checkout.
- **Emails**: order-confirmation emails can be added later with a Supabase
  Edge Function + Resend (free tier).
