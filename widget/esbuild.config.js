// Minimal esbuild config for the widget bundle
// Outputs: IIFE (UMD-like) in dist/, copies to assets/price-drop-widget.min.js
import esbuild from "esbuild";
import { copyFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const assetsDir = join(projectRoot, "assets");

const shared = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  minify: true,
  sourcemap: process.env.NODE_ENV !== "production",
  loader: { ".css": "text" },
};

async function build() {
  // IIFE/UMD for script embed
  await esbuild.build({
    ...shared,
    outfile: "dist/widget.js",
    format: "iife",
    // Use a non-conflicting global name so that the
    // internal UMD wrapper can safely attach
    // `window.PriceDropWidget` without being overwritten.
    globalName: "__PriceDropWidgetBundle",
  });

  // Copy IIFE to assets for server to serve
  mkdirSync(assetsDir, { recursive: true });
  copyFileSync(
    join(__dirname, "dist", "widget.js"),
    join(assetsDir, "price-drop-widget.min.js"),
  );

  console.log(
    "Widget built: dist/widget.js -> assets/price-drop-widget.min.js",
  );
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
