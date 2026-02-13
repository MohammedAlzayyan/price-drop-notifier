# Price-Drop Notifier

Embeddable widget + Tampermonkey userscript + Express API for subscribing to price-drop notifications on Amazon and eBay product pages.

---

## Summary

| Component | Description |
|-----------|-------------|
| **Widget** | JS widget (Shadow DOM) with email form; POSTs to API |
| **Userscript** | Injects widget on Amazon/eBay, extracts product name, price, URL |
| **Backend** | `POST /subscribe-price-drop`, serves `/assets/price-drop-widget.min.js` and `/embed/price-drop.html` |

---

## Project Structure

```
project-root/
├── widget/           # Widget source (TypeScript)
├── userscript/       # Tampermonkey script
├── server/           # Express app
├── embed/            # Iframe fallback page
├── demo/             # csp-demo.html
└── assets/           # Widget bundle (built)
```

---

## How to Build & Run

### Prerequisites

- Node.js 18+
- npm
- [Tampermonkey](https://www.tampermonkey.net/)
- [ngrok](https://ngrok.com/) — required for using the widget on Amazon/eBay (HTTPS)

### Step 1: Build

```bash
npm run build
```

Builds the widget and server.

### Step 2: Start the server

```bash
npm start
```

Server runs on `http://localhost:3000`.

### Step 3: ngrok tunnel (for Amazon/eBay)

Amazon and eBay use HTTPS; loading HTTP resources causes Mixed Content errors. Use ngrok:

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g. `https://xxxx-xx-xx-xx-xx.ngrok-free.app`).

### Step 4: Update userscript URLs

In `userscript/price-drop-injector.user.js`, set:

```javascript
var WIDGET_SCRIPT_URL = "https://YOUR-NGROK-URL/assets/price-drop-widget.min.js";
var WIDGET_IFRAME_URL = "https://YOUR-NGROK-URL/embed/price-drop.html";
```

Replace `YOUR-NGROK-URL` with your ngrok HTTPS domain.

### Step 5: Tampermonkey

1. Install Tampermonkey.
2. Create a new userscript and paste the contents of `userscript/price-drop-injector.user.js`.
3. Save and enable.

### Step 6: Test

- **Demo (local):** `http://localhost:3000/demo/csp-demo.html`
- **Amazon/eBay:** Visit any product page; the widget should appear and accept subscriptions.

---

## API

### POST /subscribe-price-drop

**Request (JSON or form-encoded):**

```json
{
  "email": "user@example.com",
  "product": {
    "name": "Product Title",
    "price": "USD 129.99",
    "url": "https://..."
  }
}
```

**Responses:**

| Status | Response |
|--------|----------|
| 200 | `{ ok: true }` — Success |
| 400 | `{ ok: false, error: "invalid_email" }` |
| 409 | `{ ok: false, error: "already_subscribed" }` |
| 5xx | `{ ok: false, error: "server_error" }` |

---

## Embed Options

**Script embed:**

```javascript
PriceDropWidget.initPriceDropWidget({
  name: "Product Name",
  price: "$99.99",
  url: "https://example.com/product"
});
```

**Iframe fallback:**

```
/embed/price-drop.html?name=Product&price=$99.99&url=https://...
```

---

## CORS Notes

The server sets `Access-Control-Allow-Origin: *`. For production, restrict to allowed origins.

---

## Optional: Remove Unused Files

These files are not used by the app and can be deleted:

| File | Reason |
|------|--------|
| `demo/index.html` | Demo uses `csp-demo.html` only |
| `server/express-shim.d.ts` | Redundant with `@types/express` |
| `widget/dist/.gitkeep` | Placeholder only; safe to remove |

---

## Author

Mohammed Alzayyan
