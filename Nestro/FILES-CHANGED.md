# What this build changed

Everything below is either new or a full replacement. Files not listed are
untouched.

## Backend

**New models** — `order`, `address`, `coupon`, `review`.
**Rewritten models** — `user` (role, dob/gender, reset code, server cart and
wishlist), `product` (stockQty, variants, sku, ratings, text index, derived
`stock` boolean kept in step on every save).

**New controllers** — `order` (create, verify payment, my orders, cancel, admin
list/detail/status), `address`, `user` (profile, password, stats, cart/wishlist
sync), `review`, `coupon`, `dashboard`, `contact`.
**Rewritten controllers** — `auth` (admin sign-in, forgot/reset password, OTP
attempt limits, production cookie flags), `product` (edit, search, suggest,
image delete, slug generation, allowlisted toggles), `category`, `room`.

**New middleware** — `validate` (zod), `rateLimit`.
**Rewritten** — `auth` (adds `optionalAuth` and `requireAdmin`).

**New utils** — `money`, `orderNumber`, `razorpay`, `slug`.
**Rewritten** — `response` (adds 403/429, hides internals in production),
`sendEmail` (order confirmation, status change, password reset).

**New** — `src/validators/*` (five schema files), `scripts/seedAdmin.js`,
`scripts/backfill.js`, `tests/*` (26 tests), `.env.example`, `.gitignore`.

**Rewritten** — `app.js` (helmet, env-driven CORS, rate limits, JSON 404,
richer error handler), `package.json` (adds helmet, express-rate-limit, zod,
razorpay; real test script).

## Frontend

**Fixed** — `app/(user)/product/[id]/page.jsx` is now a server component reading
the real API; `ProductInfo`, `ProductGallery`, `ProductTabs`, `RelatedProducts`,
`VariantSelector`, `QuantitySelector` all follow the Mongo document shape.

**Replaced** — `app/(user)/checkout/page.jsx`: the static mockup is gone. It now
drives the cart, saved addresses, shipping, coupons and Razorpay through the
seven checkout components that were previously dead code (all rewritten to
match).

**New pages** — `order-confirmed/[id]`, `orders/[id]`, `search`,
`auth/forgot-password`, `auth/reset-password`, `admin-login`,
`admin/orders`, `admin/orders/[order_id]`, `admin/products/edit/[prod_id]`,
`admin/coupons`, `admin/customers`, `sitemap.js`, `robots.js`, `middleware.js`.

**Rewritten pages** — `admin` dashboard (real figures, revenue chart, low stock),
`admin/products`, `admin/products/add`, `admin/products/add-images/[prod_id]`,
`admin/category/add` + `edit`, `admin/room_type/add` + `edit`, `admin/layout`,
`profile`, `cart`, `wishlist`, `contact`, `(user)/layout` (metadata), `auth`.

**Rewritten components** — all of `components/user/checkout/*`,
`components/user/profile/*`, `components/user/product/*`, `layout/Navbar`,
`ui/ProductCard`, `ui/RatingStars`, `home/Newsletter`, `home/Testimonials`,
`admin/Sidebar`, `admin/Header`, `admin/ActionDropdown`.

**New components** — `layout/SearchBar`, `order/OrderStatusBadge`,
`ContactForm`, `auth/ForgotPasswordForm`, `auth/ResetPasswordForm`,
`admin/StatCard`, `admin/RevenueChart`, `admin/OrderStatusPill`,
`admin/OrderFilters`, `admin/OrderStatusControl`, `admin/ProductForm`,
`admin/TaxonomyForm`, `admin/GalleryManager`.

**Rewritten state** — `redux/slices/cartSlice` (variant-aware line keys,
selectors), `wishlistSlice`, `authSlice` (reset password, profile update),
`ReduxProvider` (merges the guest basket with the account copy on sign-in,
debounced server sync).

**Rewritten utils** — `utils/api.js` (every endpoint), `helper.js`,
`productMapper.js`; new `utils/razorpay.js`.

## Safe to delete

`src/data/products.js`, `src/data/orders.js`, `src/data/testimonials.js` — the
mock data is no longer imported anywhere. `src/data/categories.js` and
`rooms.js` are likewise unused. `components/user/auth/SocialButton.jsx` is
unused now that the non-functional Google/Apple buttons are gone.
