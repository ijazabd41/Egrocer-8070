# Performance optimizations (Coop Discounts website)

This document describes performance-related changes introduced in API build **8.9**. All optimizations preserve existing API contracts and business logic; only transport and rendering efficiency were improved.

## Client-side API layer (`js/api-cache.js` + `js/api.js`)

| Technique | Behavior | Expected impact |
|-----------|----------|-----------------|
| **GET response cache** | In-memory cache with optional `sessionStorage` for catalog data (TTL 3–15 min by endpoint). | Faster repeat visits to home, shop, and category navigation; fewer Odoo round-trips. |
| **Request deduplication** | Parallel identical GETs share one in-flight promise. | Home page `Promise.all` + layout category load no longer duplicate `/api/bcd-website-category`. |
| **No cache on sensitive paths** | Orders, cart lines, invoices, loyalty, contacts, auth, payments, rider — TTL **0**. | Checkout, cart sync, and account data stay fresh. |
| **Mutation invalidation** | Order/contact/loyalty writes clear related cache prefixes. | Prevents stale cart/order views after updates. |
| **Prefetch** | `API.prefetch()` / `API.prefetchCatalog()` warm cache on idle. | Shop and home feel snappier on second screen. |
| **Login/logout** | `Cache.clearAll()` on login and logout. | No cross-user catalog leakage. |

**Debug:** `API.cacheStats()` in the browser console returns hit/miss counts.

**Disable cache (troubleshooting):** load pages without `api-cache.js` or call `API.clearApiCache()` before testing.

## Proxy server (`proxy/server.js`)

| Technique | Behavior | Expected impact |
|-----------|----------|-----------------|
| **Image buffer cache** | Up to 180 Odoo image responses cached in memory for 24h. | Repeat product/category images load faster; less load on Odoo. |
| **Cache-Control headers** | `public, max-age=86400` on images. | Browser/CDN can cache images when deployed behind HTTPS. |

Response header `X-Cache: HIT|MISS` indicates proxy image cache status.

## UI layer (`js/app.js`, `js/layout.js`, `shop.html`)

| Technique | Behavior | Expected impact |
|-----------|----------|-----------------|
| **Product card HTML memoization** | `buildCard()` caches HTML by product id, price, stock, cart qty. | Faster grid re-renders when paging or filtering. |
| **Batched `tick()`** | Cart badge/qty DOM updates coalesced per animation frame. | Smoother UI when changing quantities quickly. |
| **Lazy images** | `loading="lazy"` + `decoding="async"` on product cards. | Less main-thread and bandwidth work on long pages. |
| **Hero LCP** | First slider image `fetchPriority="high"`, others lazy. | Faster largest-contentful-paint on home. |
| **Shop page prefetch** | Next product page prefetched on idle after load. | “Next page” feels instant when cache is warm. |

## What was intentionally not changed

- No changes to Odoo endpoints, cart sync logic, payment confirmation, or order state machines.
- No virtualized lists (product grids are paginated at 16 items; DOM size stays bounded).
- No bundler/code-splitting (static multi-page app; adding a build step would be a larger migration).

## Critical flows — regression checklist

After deploying, verify manually:

1. **Auth** — Sign in, sign out, register; session persists; header menu correct.
2. **Home** — Slider, categories, deal sections, product grid load.
3. **Shop** — Filters, pagination, search, category sidebar.
4. **Product** — Detail, related products, add to cart.
5. **Cart / checkout** — Qty changes sync to Odoo; delivery, payment, loyalty code.
6. **Orders** — Track order, account dashboard, invoices.
7. **Admin / rider** — If used, smoke-test list screens.

If checkout shows stale totals, run `API.clearApiCache()` once; report if issue persists (should not happen for order endpoints).

## Version alignment

Include on every page:

```html
<script src="js/api-cache.js?v=1"></script>
<script src="js/api.js?v=8.9"></script>
<script src="js/app.js?v=8.9"></script>
```

Bump `?v=` when changing cached scripts to bust browser cache.
