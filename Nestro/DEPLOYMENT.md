# Taking Nestro live

Three pieces have to be online, and they are deployed separately:

| Piece | What it is | Where it goes |
|---|---|---|
| `frontend/` | Next.js 16 storefront + admin panel | Vercel |
| `backend/` | Express 5 API | Render (or Railway / Fly) |
| database | MongoDB | MongoDB Atlas |

Deploy in that order bottom-up: **database → backend → frontend**. Each one
needs the address of the one below it.

---

## 1. Database — MongoDB Atlas

1. Create a free **M0** cluster at <https://cloud.mongodb.com> (pick the Mumbai
   region — `ap-south-1` — so queries from an Indian host stay fast).
2. **Database Access** → add a user with a password. Save both.
3. **Network Access** → add `0.0.0.0/0`. Render's outbound IP is not fixed, so
   an allowlist of one address will start failing without warning.
4. Copy the connection string and append the database name:

   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/nestro?retryWrites=true&w=majority
   ```

### Moving the local data up

Products, categories and rooms are worth carrying over. Orders and test users
are not.

```bash
# From the machine that has the local database
mongodump --uri="mongodb://127.0.0.1:27017/nestro" \
  --collection=products --collection=categories --collection=rooms \
  --out=./dump

mongorestore --uri="<your atlas connection string>" ./dump/nestro
```

Then seed one admin account against the live database:

```bash
cd backend
DATABASE_URL="<atlas connection string>" npm run seed:admin
```

---

## 2. Backend — Render

**New → Web Service**, connect the repo, and set:

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Build command | `npm install` |
| Start command | `npm start` |
| Instance type | Free to try; **Starter ($7/mo) for a real shop** |

> The free instance sleeps after 15 minutes idle and takes ~50 seconds to wake.
> A customer hitting a cold store usually leaves. Free is fine while testing.

### Environment variables

```
NODE_ENV=production
PORT=10000
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
DATABASE_URL=<atlas connection string>

JWT_SECRET=<64+ random characters — generate a NEW one, never reuse the local>
JWT_EXPIRES_IN=7d
OTP_EXPIRY_MINUTES=10

CLOUD_NAME=djyxspcg6
API_KEY=<cloudinary api key>
API_SECRET=<cloudinary api secret>

EMAIL_USER=<gmail address>
EMAIL_PASS=<16-character Gmail app password>
CONTACT_INBOX=<where enquiries should land>

RAZORPAY_KEY_ID=<rzp_live_... for real money, rzp_test_... to rehearse>
RAZORPAY_KEY_SECRET=<matching secret>
RAZORPAY_WEBHOOK_SECRET=<the secret you type into the Razorpay dashboard>

MIGRATE_DEFAULT_STOCK=10
REPORT_TIMEZONE=Asia/Kolkata
```

Generate the JWT secret with:

```bash
node -e 'console.log(require("crypto").randomBytes(48).toString("base64url"))'
```

**`CORS_ORIGINS` must list the exact frontend URL, with `https://` and no
trailing slash.** Get it wrong and every browser request is refused while curl
still works — which is a confusing afternoon.

Once deployed, check `https://your-api.onrender.com/` returns
`{"success":true,"message":"Server is healthy"}`.

---

## 3. Frontend — Vercel

**Add New → Project**, import the repo, and set **Root Directory** to
`frontend`. Vercel detects Next.js on its own.

### Environment variables

```
NEXT_PUBLIC_API_BASE_URL=https://your-api.onrender.com/api/
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_RAZORPAY_ENABLED=true
```

Two things to get right:

- `NEXT_PUBLIC_API_BASE_URL` **must end in a trailing slash**. Axios joins paths
  straight onto it, so without it every call goes to the wrong path.
- `NEXT_PUBLIC_SITE_URL` is used for canonical URLs, the sitemap and Open Graph
  tags. A wrong value here quietly hurts search results.

These are baked in at build time, so after changing one you have to
**redeploy**, not just restart.

---

## 4. Razorpay

1. Complete KYC in the Razorpay dashboard and switch the account to **Live**.
2. **Settings → API Keys → Generate Live Key.** The secret is shown once.
3. Put the live key and secret into Render, and redeploy.
4. **Settings → Webhooks → Add New Webhook**:
   - URL: `https://your-api.onrender.com/api/order/webhook`
   - Secret: the same string you set as `RAZORPAY_WEBHOOK_SECRET`
   - Active events: `payment.captured` and `payment.failed`

The webhook is what confirms an order when a shopper pays and closes the tab
before the browser can report back. Without it those orders sit unpaid until
someone chases them.

Test the live setup with a ₹1 product and a real card, then refund it from the
dashboard.

---

## 5. Email

Gmail needs an **app password**, not your account password:

1. Turn on 2-Step Verification on the Google account.
2. <https://myaccount.google.com/apppasswords> → create one → copy the 16
   characters.
3. Set `EMAIL_USER`, `EMAIL_PASS` and `CONTACT_INBOX` on Render.

Gmail sends about 500 messages a day. Past that, or once "nestro.in" should
appear as the sender instead of a gmail address, move to Resend, Brevo or Amazon
SES — only `backend/src/utils/sendEmail.js` changes.

Until this is configured, mail is written to `backend/.mail-outbox/` in
development and silently dropped in production, and the admin dashboard says so.

---

## 6. Domain

- **Vercel** → Project → Settings → Domains → add `your-domain.com`, then point
  the registrar's nameservers or add the CNAME Vercel shows.
- Optional: give the API a subdomain (`api.your-domain.com`) in Render →
  Settings → Custom Domain. Update `NEXT_PUBLIC_API_BASE_URL` and
  `CORS_ORIGINS` to match, and redeploy both.

HTTPS is issued automatically on both. Do not skip it — the login cookie is
`Secure; SameSite=None` in production and a browser will refuse it over plain
HTTP, so nobody would be able to sign in.

---

## Go-live checklist

Run through this on the live site before telling anyone about it.

- [ ] `https://your-api.onrender.com/` returns the healthy JSON
- [ ] Storefront loads and shows real products
- [ ] Sign up → OTP email arrives → verify → sign in
- [ ] Add to cart → refresh the page → cart survives
- [ ] Place a **COD** order → confirmation email arrives → it appears in
      `/admin/orders` → stock went down
- [ ] Place a **Razorpay** order with a real card → order shows `paid` →
      it appears in `/admin/transactions`
- [ ] Close the tab mid-payment on purpose → the order shows unpaid with a
      **Pay** button on `/orders/<id>` → paying there works
- [ ] Cancel an order → stock returns → a refund row appears in the ledger
- [ ] Mark an order delivered → request a return → mark it returned → stock
      returns and the ledger shows the refund
- [ ] Admin dashboard shows **no red or amber warnings**
- [ ] Contact form submits and lands in `/admin/enquiries`
- [ ] Admin panel is unreachable when signed out
- [ ] `https://your-domain.com/sitemap.xml` and `/robots.txt` both load

---

## After it is live

**Backups.** Atlas M0 has no automatic backups. Either upgrade to M10, or run
`mongodump` on a schedule and keep the output somewhere else. Losing the orders
collection means losing the business's records.

**Uptime.** Put the API health URL into a free monitor (UptimeRobot, Better
Stack). On Render's free tier a 5-minute ping also stops the instance sleeping.

**Errors.** Add Sentry to both apps — roughly ten minutes of work, and it is the
difference between hearing about a broken checkout from a monitor and hearing
about it from a customer.

**Secrets.** `backend/.env` is gitignored and must stay that way. If a key ever
lands in a commit, rotate it at the provider rather than deleting the commit.

---

## Rough monthly cost

| | Free | Production |
|---|---|---|
| Vercel | ₹0 (Hobby) | ₹0 — Hobby is enough for a small store |
| Render | ₹0, sleeps when idle | ~₹600 (Starter, always on) |
| MongoDB Atlas | ₹0 (M0, 512 MB) | ~₹800 (M10, with backups) |
| Cloudinary | ₹0 (25 credits/mo) | ₹0 until traffic grows |
| Domain | — | ~₹800/year |
| Razorpay | — | 2% per transaction |

Start entirely free, move Render to Starter the day you take a real order, and
move Atlas to M10 once losing the data would actually hurt.

---

## Local development

```bash
# Terminal 1
cd backend && npm run dev      # http://localhost:5001

# Terminal 2
cd frontend && npm run dev     # http://localhost:3000
```

Port 5000 is taken by macOS AirPlay Receiver, which is why the API runs on 5001.
`frontend/.env.local` must point at the same port.

```bash
cd backend && npm test         # 28 tests, runs against an in-memory MongoDB
cd frontend && npm run build   # catches anything that only breaks in production
```

Run both before every deploy.
