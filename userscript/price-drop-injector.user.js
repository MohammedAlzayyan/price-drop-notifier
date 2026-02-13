// ==UserScript==
// @name         Price Drop Widget Injector
// @namespace    https://mohammed-alzayyan.dev/
// @version      0.1.0
// @description  Inject a price-drop subscription widget into Amazon and eBay product pages.
// @match        *://*/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // --- Configuration --------------------------------------------------------

  // When running the server, it should be HTTPS like ngrok instead of localhost.

  // External widget bundle (expects window.PriceDropWidget.initPriceDropWidget)
  var WIDGET_SCRIPT_URL =
    "http://localhost:3000/assets/price-drop-widget.min.js";

  // Iframe fallback (when script injection is blocked, e.g. by CSP)
  var WIDGET_IFRAME_URL = "http://localhost:3000/embed/price-drop.html";

  // LocalStorage key prefix for "already subscribed" flag
  var STORAGE_KEY_PREFIX = "pd-subscribed:";

  // Global guard to avoid double injection on the same page instance
  var INJECT_FLAG_ATTR = "data-pd-widget-attached";

  // --- Entry point ----------------------------------------------------------

  if (!isBrowserEnvironment()) return;

  if (document.documentElement.hasAttribute(INJECT_FLAG_ATTR)) {
    // Defensive: avoid duplicate injection in case userscript runs twice.
    return;
  }
  document.documentElement.setAttribute(INJECT_FLAG_ATTR, "true");

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", safeInit, { once: true });
  } else {
    safeInit();
  }

  function safeInit() {
    try {
      main();
    } catch (err) {
      // Never throw out of a userscript; just log and bail.
      console.error("PriceDropWidget userscript init failed:", err);
    }
  }

  function main() {
    var product = detectProduct();
    if (!product) {
      // Not a recognized product page for our heuristics.
      return;
    }

    if (hasAlreadySubscribed(product.url)) {
      // Respect user state and avoid showing the widget again for this product.
      return;
    }

    var containerInfo = insertWidgetContainer(product);
    if (!containerInfo || !containerInfo.root) {
      return;
    }

    // Try loading external widget bundle; fallback to iframe if blocked.
    injectWidget(product, containerInfo.root);
  }

  // --- Environment helpers --------------------------------------------------

  function isBrowserEnvironment() {
    return (
      typeof window !== "undefined" &&
      typeof document !== "undefined" &&
      typeof document.createElement === "function"
    );
  }

  // --- Product detection & extraction ---------------------------------------

  function detectProduct() {
    var host = location.hostname.toLowerCase();

    if (host.indexOf("amazon.") !== -1) {
      if (!isLikelyAmazonProductPage()) return null;
      var data = extractAmazonProduct();
      return data;
    }

    if (host.indexOf("ebay.") !== -1) {
      if (!isLikelyEbayProductPage()) return null;
      var data2 = extractEbayProduct();
      return data2;
    }

    return null;
  }

  // Amazon: combine URL hints with DOM checks for robustness.
  function isLikelyAmazonProductPage() {
    var path = location.pathname || "";
    var urlLooksLikeProduct =
      path.indexOf("/dp/") !== -1 || path.indexOf("/gp/product/") !== -1;

    // DOM heuristic: Amazon product pages usually expose #productTitle.
    var titleEl = document.getElementById("productTitle");
    var domLooksLikeProduct = !!titleEl && !!titleEl.textContent;

    return urlLooksLikeProduct || domLooksLikeProduct;
  }

  function extractAmazonProduct() {
    // Title heuristics:
    // - New Amazon layout: #productTitle
    // - Fallbacks kept conservative to avoid picking up non-product titles.
    var name = "";
    var titleEl =
      document.getElementById("productTitle") ||
      document.querySelector("#title span[id]");
    if (titleEl) {
      name = normalizeWhitespace(titleEl.textContent || "");
    }

    // Price heuristics:
    // - Primary IDs: #priceblock_ourprice / #priceblock_dealprice / #priceblock_saleprice
    // - Fallback: visible .a-offscreen price near buy box.
    var price = "";
    var priceSelectors = [
      "#priceblock_ourprice",
      "#priceblock_dealprice",
      "#priceblock_saleprice",
      "#corePrice_feature_div span.a-offscreen",
      "#tp_price_block_total_price_ww span.a-offscreen",
    ];
    for (var i = 0; i < priceSelectors.length && !price; i++) {
      var pEl = document.querySelector(priceSelectors[i]);
      if (pEl && isNodeVisible(pEl)) {
        price = normalizeWhitespace(pEl.textContent || "");
      }
    }

    // Fallback: pick first visible .a-offscreen within central column (heuristic).
    if (!price) {
      var centerCol = document.getElementById("centerCol") || document.body;
      if (centerCol) {
        var offscreenPrices = centerCol.querySelectorAll("span.a-offscreen");
        for (var j = 0; j < offscreenPrices.length; j++) {
          var candidate = offscreenPrices[j];
          if (isNodeVisible(candidate)) {
            price = normalizeWhitespace(candidate.textContent || "");
            if (price) break;
          }
        }
      }
    }

    return {
      name: name || "(Unknown product)",
      price: price || "",
      url: location.href,
      source: "amazon",
    };
  }

  // eBay: URL + DOM heuristics.
  function isLikelyEbayProductPage() {
    var path = location.pathname || "";
    var urlLooksLikeProduct = path.indexOf("/itm/") !== -1;

    // DOM heuristic: classic eBay uses #itemTitle; new layout uses h1.x-item-title__mainTitle.
    var titleEl =
      document.getElementById("itemTitle") ||
      document.querySelector("h1.x-item-title__mainTitle") ||
      document.querySelector("h1[itemprop='name']");
    var domLooksLikeProduct = !!titleEl && !!titleEl.textContent;

    return urlLooksLikeProduct || domLooksLikeProduct;
  }

  function extractEbayProduct() {
    var name = "";
    var titleEl =
      document.getElementById("itemTitle") ||
      document.querySelector("h1.x-item-title__mainTitle") ||
      document.querySelector("h1[itemprop='name']");
    if (titleEl) {
      // Classic eBay includes filler text in #itemTitle ("Details about  \u00a0").
      name = normalizeWhitespace(
        titleEl.textContent.replace(/^\s*Details about\s+/, "") || ""
      );
    }

    var price = "";
    var priceSelectors = [
      "#prcIsum",
      "#mm-saleDscPrc",
      "span[itemprop='price']",
      ".x-price-primary .x-price-whole",
      ".x-price-primary .x-price-approx__price",
    ];
    for (var i = 0; i < priceSelectors.length && !price; i++) {
      var pEl = document.querySelector(priceSelectors[i]);
      if (pEl && isNodeVisible(pEl)) {
        price = normalizeWhitespace(pEl.textContent || "");
      }
    }

    return {
      name: name || "(Unknown product)",
      price: price || "",
      url: location.href,
      source: "ebay",
    };
  }

  // --- Container insertion ---------------------------------------------------

  function insertWidgetContainer(product) {
    // We want a stable, non-scrolling-sensitive area near the product title
    // or summary. Exact selectors vary between layouts, so we use heuristics
    // with safe fallbacks.

    var parent = findPreferredMountPoint(product.source);
    if (!parent) {
      parent = document.body;
    }
    if (!parent) return null;

    var root = document.createElement("div");
    root.id = "pd-widget-root";
    root.className = "pd-widget-root";
    // Reserve vertical space to reduce layout shift before the widget renders.
    root.style.minHeight = "120px";
    root.style.marginTop = "8px";

    // Prefer inserting after the title/summary block when possible.
    if (parent.nextSibling && parent.parentNode) {
      parent.parentNode.insertBefore(root, parent.nextSibling);
    } else {
      parent.appendChild(root);
    }

    return { root: root };
  }

  function findPreferredMountPoint(source) {
    if (source === "amazon") {
      // Try to mount just under the main title / buy box area.
      var titleBlock =
        document.getElementById("titleSection") ||
        document.getElementById("centerCol") ||
        document.querySelector("#ppd") ||
        document.querySelector("#dp-container");
      if (titleBlock) return titleBlock;
    }

    if (source === "ebay") {
      // eBay product pages typically have these main content containers.
      var mainBlock =
        document.querySelector("#CenterPanel") ||
        document.querySelector("#LeftSummaryPanel") ||
        document.querySelector("#vi-frag-btf") ||
        document.querySelector("main");
      if (mainBlock) return mainBlock;
    }

    return null;
  }

  // --- Injection flow (script + iframe fallback) -----------------------------

  function injectWidget(product, mountEl) {
    // Listen for postMessage from iframe embed when subscription succeeds.
    window.addEventListener("message", onSubscribedMessage);

    loadExternalWidgetScript(
      function onScriptReady() {
        try {
          if (
            window.PriceDropWidget &&
            typeof window.PriceDropWidget.initPriceDropWidget === "function"
          ) {
            window.PriceDropWidget.initPriceDropWidget({
              name: product.name,
              price: product.price,
              url: product.url,
              mountEl: mountEl,
              onSubscribed: function () {
                markSubscribed(product.url);
              },
            });
          } else {
            injectIframeFallback(product, mountEl);
          }
        } catch (err) {
          console.error("PriceDropWidget: error initializing widget:", err);
          injectIframeFallback(product, mountEl);
        }
      },
      function onScriptFailed() {
        injectIframeFallback(product, mountEl);
      }
    );
  }

  function onSubscribedMessage(event) {
    if (
      event.data &&
      event.data.type === "price-drop-widget:subscribed" &&
      typeof event.data.url === "string"
    ) {
      markSubscribed(event.data.url);
    }
  }

  function loadExternalWidgetScript(onSuccess, onFailure) {
    var head = document.head || document.getElementsByTagName("head")[0];
    if (!head) {
      onFailure();
      return;
    }

    var script = document.createElement("script");
    script.src = WIDGET_SCRIPT_URL;
    script.async = true;

    var completed = false;

    function done(success) {
      if (completed) return;
      completed = true;
      if (success) onSuccess();
      else onFailure();
    }

    script.onload = function () {
      // In some CSP setups the script tag may load but the script body
      // is blocked from executing. We do a short delay + global check
      // to distinguish this case.
      setTimeout(function () {
        if (
          window.PriceDropWidget &&
          typeof window.PriceDropWidget.initPriceDropWidget === "function"
        ) {
          done(true);
        } else {
          done(false);
        }
      }, 50);
    };

    script.onerror = function () {
      done(false);
    };

    head.appendChild(script);

    // Extra safety timeout in case neither onload nor onerror fire.
    setTimeout(function () {
      if (!completed) {
        done(false);
      }
    }, 3000);
  }

  function injectIframeFallback(product, mountEl) {
    try {
      var iframe = document.createElement("iframe");
      iframe.loading = "lazy";
      iframe.width = "100%";
      iframe.height = "140"; // Reserve space; actual height controlled by embed page.
      iframe.style.border = "0";
      iframe.style.overflow = "hidden";

      var src =
        WIDGET_IFRAME_URL +
        "?name=" +
        encodeURIComponent(product.name) +
        "&price=" +
        encodeURIComponent(product.price || "") +
        "&url=" +
        encodeURIComponent(product.url);

      iframe.src = src;
      mountEl.textContent = ""; // Clear any previous children if any.
      mountEl.appendChild(iframe);
      // markSubscribed is called via postMessage when user submits successfully.
    } catch (err) {
      console.error("PriceDropWidget: failed to inject iframe fallback:", err);
    }
  }

  // --- LocalStorage helpers --------------------------------------------------

  function hasAlreadySubscribed(url) {
    try {
      var key = STORAGE_KEY_PREFIX + url;
      return window.localStorage.getItem(key) === "1";
    } catch (err) {
      // localStorage may be disabled; treat as not subscribed.
      return false;
    }
  }

  function markSubscribed(url) {
    try {
      var key = STORAGE_KEY_PREFIX + url;
      window.localStorage.setItem(key, "1");
    } catch (err) {
      // Ignore storage failures; they shouldn't break the page.
    }
  }

  // --- Misc helpers ----------------------------------------------------------

  function normalizeWhitespace(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function isNodeVisible(node) {
    if (!node || !(node.ownerDocument && node.ownerDocument.documentElement)) {
      return false;
    }
    var el = node;
    if (!(el instanceof HTMLElement)) {
      return false;
    }
    var style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (el.offsetWidth === 0 && el.offsetHeight === 0) return false;
    return true;
  }
})();

