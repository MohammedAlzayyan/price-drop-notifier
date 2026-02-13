// Demo bootstrap for strict CSP page.
// No inline scripts; this file is loaded with <script src="/assets/demo-page.js" defer></script>.

(function () {
  "use strict";

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  function init() {
    try {
      var root = document.getElementById("price-drop-widget-root");
      if (!root) return;

      var widgetGlobal = window.PriceDropWidget;
      if (
        !widgetGlobal ||
        typeof widgetGlobal.initPriceDropWidget !== "function"
      ) {
        // Widget bundle has not been loaded or failed to initialize.
        return;
      }

      var name =
        root.getAttribute("data-product-name") ||
        "Noise-Cancelling Wireless Headphones";
      var price =
        root.getAttribute("data-product-price") ||
        "$199.99";
      var url =
        root.getAttribute("data-product-url") ||
        window.location.href;

      widgetGlobal.initPriceDropWidget({
        name: name,
        price: price,
        url: url,
        mountEl: root,
      });
    } catch (err) {
      // Fail silently for demo; do not break the host page.
      // eslint-disable-next-line no-console
      console.error("CSP demo init failed", err);
    }
  }
})();

