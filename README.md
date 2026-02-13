# Price-Drop Notifier

Embeddable widget, Tampermonkey userscript, and Express API for subscribing to price-drop notifications on Amazon and eBay product pages.

---

## Overview

This project provides:

- **Embeddable widget**: A small JS widget that renders an inline email form ("Email me if this product gets cheaper") and POSTs to the API.
- **Userscript (Tampermonkey)**: Injects the widget onto Amazon and eBay product pages, extracting product name, price, and URL.
- **Express backend**: API at `POST /subscribe-price-drop`, serves widget bundle at `/assets/price-drop-widget.min.js`, and embed page at `/embed/price-drop.html`.

---

## Project Structure

```
project-root/
├── widget/           # Widget source (TypeScript)
│   ├── src/
│   └── dist/
├── userscript/
│   └── price-drop-injector.user.js
├── server/           # Express app
├── embed/
│   └── price-drop.html   # Iframe fallback page
├── demo/
│   └── csp-demo.html     # CSP-strict demo page
├── assets/           # Widget bundle, demo CSS/JS (built by widget)
├── README.md
└── NOTES.md
```

---

## How to Build & Run

### Prerequisites

- Node.js 18+
- npm

### 1. Build everything

```bash
npm run build
```

This builds the widget (copies to `assets/price-drop-widget.min.js`) and the server.

### 2. Start the server

```bash
npm start
```

Server runs on `http://localhost:3000`.

### 3. Demo page

Open: `http://localhost:3000/demo/csp-demo.html`

### 4. Userscript (Tampermonkey)

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Create a new userscript and paste the contents of `userscript/price-drop-injector.user.js`.
3. Ensure the server is running at `http://localhost:3000`.
4. Visit an Amazon or eBay product page — the widget should appear.

---

## API

### POST /subscribe-price-drop

Accepts JSON or form-encoded body:

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

- `200` — `{ ok: true }` — Success
- `400` — `{ ok: false, error: "invalid_email" }` — Invalid email
- `409` — `{ ok: false, error: "already_subscribed" }` — Already subscribed
- `5xx` — `{ ok: false, error: "server_error" }` — Server error

---

## Embed Options

### Script embed

Load the widget and call:

```javascript
PriceDropWidget.initPriceDropWidget({
  name: "Product Name",
  price: "$99.99",
  url: "https://example.com/product"
});
```

### Iframe fallback

```
/embed/price-drop.html?name=Product&price=$99.99&url=https://...
```

---

## CORS Notes

The server sets `Access-Control-Allow-Origin: *` for cross-origin requests. For production, restrict this to your allowed origins.

---

## Author

Mohammed Alzayyan
