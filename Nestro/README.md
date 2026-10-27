# Nestro

Furniture storefront and admin panel. Next.js 16 (App Router, React 19, Tailwind 4)
on the front, Express 5 + Mongoose 9 on the back, Cloudinary for media and
Razorpay for payments.

---

## First run

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then fill it in — see the notes in the file
npm run migrate           # only if you already have data from before this build
npm run seed:admin -- you@yourdomain.com "a-strong-password" Rakesh
npm run dev
```

`npm run seed:admin` is the **only** way to create an admin. There is no public
route that can grant the role.

`npm run migrate` is safe to run more than once. It gives existing products a
real `stockQty` (previously stock was a boolean), fills in missing slugs, and
sets `role: "user"` on accounts created before roles existed.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Storefront on `http://localhost:3000`, admin on `http://localhost:3000/admin`
(you will be sent to `/admin-login` first).

### 3. Tests

```bash
cd backend && npm test
```

Fourteen unit tests run anywhere. Twelve integration tests exercise the whole
buying path — signup, ordering, stock, payment verification — and need a
MongoDB. They start an in-memory one automatically (it downloads a `mongod`
binary the first time), or you can point them at your own:

```bash
MONGODB_TEST_URI=mongodb://127.0.0.1:27017/nestro_test npm test
```

Without a database they skip with a clear reason rather than failing.

---

## Environment

Everything is driven by env vars — no hostnames or keys are hardcoded.

**backend/.env** (see `.env.example` for the full annotated list)

| Key | Notes |
| --- | --- |
| `NODE_ENV` | `production` switches auth cookies to `Secure` + `SameSite=None` and hides internal error text |
| `CORS_ORIGINS` | Comma-separated. Must list every origin the storefront and admin run on |
| `DATABASE_URL` | MongoDB connection string |
| `JWT_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CLOUD_NAME` / `API_KEY` / `API_SECRET` | Cloudinary |
| `EMAIL_USER` / `EMAIL_PASS` | Gmail address + **app password**, not your account password |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Leave blank to run Cash on Delivery only |
| `RAZORPAY_WEBHOOK_SECRET` | Separate from the checkout secret |

**frontend/.env.local**

| Key | Notes |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Must end with a trailing slash |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, Open Graph |
| `NEXT_PUBLIC_RAZORPAY_ENABLED` | `false` hides online payment in checkout |

---

## How money works

The client sends **intent only** — which products, which options, how many,
which coupon, which shipping method. Every rupee is recomputed on the server
from the live catalogue in `POST /api/order/create`. A tampered price in the
request body changes nothing.

An online payment is only real once `POST /api/order/verify-payment` has
recomputed the HMAC signature with `RAZORPAY_KEY_SECRET`. The browser's success
callback is never trusted on its own. Stock is decremented behind an
`stockCommitted` flag, so a replayed callback or a double-clicked confirm cannot
take the same units twice.

Coupons are validated against the subtotal they were priced for. If the cart
changes underneath an applied coupon, it silently stops applying — the displayed
discount and the charged one can never disagree.

---

## Access control

- `verifyToken` — signed-in shopper. Orders, addresses, profile, reviews.
- `requireAdmin` — re-reads the role **from the database** on every request, so
  revoking an admin takes effect immediately rather than at token expiry.
- `middleware.js` redirects `/admin/*` to `/admin-login` when no session cookie
  is present. That is convenience only; the API is the real boundary.

Every catalogue write — create, edit, delete, status toggles, image upload —
requires an admin. Reads are public.

---

## Layout

```
backend/
  app.js                  helmet, CORS from env, rate limits, routers, error handler
  scripts/                seedAdmin.js, backfill.js
  src/
    models/               user, product, category, room, order, address, coupon, review
    controllers/          one per resource
    routers/              one per resource
    middleware/           auth (verifyToken / optionalAuth / requireAdmin), validate, rateLimit, multer
    validators/           zod schemas — every write route validates before it reaches a controller
    utils/                money, orderNumber, razorpay, sendEmail, slug, response
  tests/                  unit + integration

frontend/
  middleware.js           /admin route guard
  src/
    app/(user)/           storefront
    app/(admin)/admin/    admin panel
    app/admin-login/      staff sign-in, outside the panel shell
    components/user/      storefront components
    components/admin/     panel components
    redux/                cart, wishlist, auth — merged with the server copy on sign-in
    utils/                api.js (every endpoint), helper.js, productMapper.js, razorpay.js
```

---

## Notes for going live

1. Set `NODE_ENV=production` on the API, or auth cookies will not be `Secure`
   and cross-site sign-in will fail.
2. Put the API behind HTTPS. `trust proxy` is already on so rate limiting sees
   real client IPs.
3. Add your production origins to `CORS_ORIGINS`.
4. Point the Razorpay dashboard's webhook at your API and set
   `RAZORPAY_WEBHOOK_SECRET`.
5. `git init` if you have not already — the project was not under version
   control before this build.
