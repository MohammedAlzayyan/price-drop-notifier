# Price-Drop Notifier — Development Notes

This document describes design decisions, trade-offs, and where the userscript works or fails on Amazon and eBay.

---

## Where the Userscript Works

### Amazon

- **URL patterns**: `https://www.amazon.*/dp/*`, `https://www.amazon.*/gp/product/*`, `https://smile.amazon.*/*`
- **Product detection**: Uses `#productTitle`, URL path `/dp/` or `/gp/product/`
- **Price extraction**: `#priceblock_ourprice`, `#priceblock_dealprice`, `#priceblock_saleprice`, `#corePrice_feature_div span.a-offscreen`, `.a-offscreen` in `#centerCol`
- **Notes**: Amazon frequently changes DOM structure. If selectors break, the widget may show with "(Unknown product)" or empty price. User can still submit.

### eBay

- **URL patterns**: `https://www.ebay.*/itm/*`
- **Product detection**: Uses `#itemTitle`, `h1.x-item-title__mainTitle`, `h1[itemprop='name']`
- **Price extraction**: `#prcIsum`, `#mm-saleDscPrc`, `span[itemprop='price']`, `.x-price-primary .x-price-whole`
- **Notes**: Classic vs. new eBay layouts use different selectors. Heuristics handle both when possible.

---

## Where It May Fail

- **CSP blocking**: Some sites block inline scripts or external script loading. Fallback: iframe embed (`/embed/price-drop.html?name=...&price=...&url=...`).
- **Mixed content**: Amazon/eBay use HTTPS. If the widget URL is `http://localhost:3000`, browsers may block mixed content. Use HTTPS or a tunnel (e.g. ngrok) for testing.
- **DOM changes**: Amazon and eBay update layouts often. Selectors may break; fallbacks help but are not guaranteed.
- **localStorage**: If disabled or full, "already subscribed" state won’t persist; the widget may show again on revisit.

---

## CSS Collision Example (Amazon/eBay)

**Problem**: Host pages inject global CSS (box-sizing, margins, fonts) that can affect the widget.

**Fix**: The widget uses **Shadow DOM**. Styles are injected into the ShadowRoot so host CSS does not leak in. Class names are prefixed (`pd-widget-*`) for extra isolation.

---

## markSubscribed Logic

`markSubscribed(product.url)` is called **only when the API returns 200** (success). The userscript passes an `onSubscribed` callback to the widget; when the user submits and the API succeeds, the widget calls it. For the iframe embed, the embed page uses `postMessage` to notify the parent, which then calls `markSubscribed`.

---

## Trade-offs & Next Steps

- **ESM output**: Widget currently outputs IIFE only. ESM can be added for bundler consumers.
- **Bundle size**: Target ≤ 12 KB gzipped; verify with `gzip -c assets/price-drop-widget.min.js | wc -c`.
- **Additional sites**: AliExpress, Noon, etc. can be added with site-specific selectors in `detectProduct()`.
