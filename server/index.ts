import express, { Request, Response, NextFunction } from "express";
import path from "path";

const app = express();
const port = process.env.PORT || 3000;

// Resolve project root from compiled dist directory.
// When running from server/dist, this points two levels up:
//   server/dist -> server -> project root
const projectRoot = path.resolve(__dirname, "..", "..");
const assetsDir = path.join(projectRoot, "assets");
const embedDir = path.join(projectRoot, "embed");
const demoDir = path.join(projectRoot, "demo");

// --- Middleware -------------------------------------------------------------

// CORS: allow cross-origin requests from Amazon, eBay, and same origin.
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// Basic request logging with latency measurement.
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", () => {
    const latency = Date.now() - start;
    const method = req.method;
    const path = req.path;
    const status = res.statusCode;
    // Production-style concise log line
    console.log(`${method} ${path} ${status} ${latency}ms`);
  });

  next();
});

// Parse JSON and form-encoded bodies.
app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);

// Serve static assets for the widget bundle and related files.
// Example: GET /assets/price-drop-widget.min.js
app.use(
  "/assets",
  express.static(assetsDir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".js")) {
        // Long-lived caching for static JS assets.
        res.setHeader(
          "Cache-Control",
          "public, max-age=31536000, immutable"
        );
        res.type("application/javascript; charset=utf-8");
      }
    },
  })
);

// Serve the iframe embed page explicitly to ensure correct headers.
app.get("/embed/price-drop.html", (_req: Request, res: Response) => {
  const filePath = path.join(embedDir, "price-drop.html");
  res.type("text/html; charset=utf-8");
  res.sendFile(filePath);
});

// Serve demo pages (CSP demo, etc.)
app.use("/demo", express.static(demoDir));

// --- Health check -----------------------------------------------------------

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// --- Subscribe endpoint -----------------------------------------------------

app.post(
  "/subscribe-price-drop",
  async (req: Request, res: Response): Promise<void> => {
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim() : "";

    if (!isValidEmail(email)) {
      // Validation failure: always return 400 invalid_email.
      await simulateLatency();
      res.status(400).json({ ok: false, error: "invalid_email" });
      return;
    }

    // For valid email, randomly simulate different backend outcomes.
    const outcome = chooseRandomOutcome();

    await simulateLatency();

    switch (outcome) {
      case "ok": {
        res.status(200).json({ ok: true });
        break;
      }
      case "already_subscribed": {
        res.status(409).json({ ok: false, error: "already_subscribed" });
        break;
      }
      case "server_error":
      default: {
        res.status(500).json({ ok: false, error: "server_error" });
        break;
      }
    }
  }
);

// --- Helpers ----------------------------------------------------------------

function isValidEmail(email: string): boolean {
  if (!email) return false;
  // Reasonably permissive email pattern; avoids over-validating while catching obvious issues.
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

async function simulateLatency(): Promise<void> {
  const min = 800;
  const max = 2800;
  const delay = min + Math.floor(Math.random() * (max - min + 1));

  await new Promise<void>((resolve) => setTimeout(resolve, delay));
}

type Outcome = "ok" | "already_subscribed" | "server_error";

function chooseRandomOutcome(): Outcome {
  const r = Math.random();
  // Simple distribution; can be tuned to your liking.
  if (r < 0.6) return "ok"; // 60% success
  if (r < 0.8) return "already_subscribed"; // 20% conflict
  return "server_error"; // 20% server error
}

// --- Startup ----------------------------------------------------------------

app.listen(port, () => {
  console.log(`Price-drop server listening on port ${port}`);
});
