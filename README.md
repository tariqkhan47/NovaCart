# NovaCart

An e-commerce store built with Next.js 16, MongoDB and Tailwind CSS v4.
Electronics, fashion, home decor and accessories, with Cash on Delivery
checkout and an admin dashboard.

The app lives in [`client/`](client/). The repository root is not a workspace —
it only exists for historical reasons.

## Running locally

```bash
cd client
npm install
npm run dev
```

Create `client/.env.local` with:

```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=a-long-random-string
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

### First-time setup

```bash
cd client

# Add four starter products (safe to re-run)
node scripts/seed-products.mjs

# Sign up on the website first, then promote yourself:
node scripts/make-admin.mjs you@example.com
```

There is deliberately no way to create an admin from the browser.

## Deploying to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import
   `tariqkhan47/NovaCart`.
2. **Set Root Directory to `client`.** This is the step people miss — the
   Next.js app is not at the repository root, and the build fails without it.
3. Add both environment variables under Settings → Environment Variables:
   - `MONGODB_URI`
   - `JWT_SECRET`

   `.env.local` is git-ignored, so these are *not* in the repository. The app
   will not start without them.
4. In MongoDB Atlas → Network Access, allow Vercel to connect. Vercel's build
   and serverless functions do not have fixed IPs, so this means allowing
   `0.0.0.0/0`. Keep the database user password strong, since that becomes the
   only thing protecting the database.
5. Deploy. Every push to `main` redeploys automatically.

## Notes on how things work

- **Sessions** are signed JWTs in an `httpOnly` cookie, so page scripts cannot
  read or forge them. See [`client/lib/session.ts`](client/lib/session.ts).
- **Admin** is the `role` field on the user document, not a password in the
  frontend.
- **Authorisation is enforced in the API routes**
  ([`client/lib/auth.ts`](client/lib/auth.ts)). `client/proxy.ts` only hides
  the admin pages — a caller can hit the API without ever loading a page, so
  the route handlers are what actually matter.
- **Order totals are calculated on the server** from database prices. The
  browser sends only product ids and quantities.
- **Stock** is claimed with a conditional atomic update and rolled back if any
  line item fails, so the shop cannot oversell.

## Known limitations

- Cash on Delivery only. No online payment is wired up.
- Product images are URLs typed in by the admin; there is no upload.
- Reviews on `/reviews` are local component state and are not saved anywhere.
