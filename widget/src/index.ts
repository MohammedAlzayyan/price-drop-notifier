// Entry point for the price-drop widget.
// Pure TypeScript + DOM APIs, framework-free, embeddable on third-party sites.

import widgetStyles from "./styles.css";

type PriceDropWidgetState = "idle" | "submitting" | "success" | "error";

interface PriceDropWidgetOptions {
  name: string;
  price: string;
  url: string;

  /**
   * Optional endpoint override. Defaults to `/subscribe-price-drop`.
   */
  endpoint?: string;

  /**
   * Optional explicit mount element. When provided, the widget
   * will be appended inside this container instead of document.body.
   */
  mountEl?: HTMLElement;

  /**
   * Optional callback when subscription succeeds (API returns 200).
   * Used by userscript/embed to persist "subscribed" state.
   */
  onSubscribed?: (data: { url: string }) => void;
}

interface InternalInitOptions extends PriceDropWidgetOptions {}

interface WidgetInstance {
  root: HTMLElement;
  state: PriceDropWidgetState;
}

function isValidOptions(
  options: Partial<PriceDropWidgetOptions> | null | undefined
): options is PriceDropWidgetOptions {
  return (
    !!options &&
    typeof options.name === "string" &&
    typeof options.price === "string" &&
    typeof options.url === "string"
  );
}

function createRootContainer(): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  const host = document.createElement("div");
  host.setAttribute("data-price-drop-widget-root", "true");

  // Prefer Shadow DOM for CSS isolation when available.
  // Shadow DOM keeps the widget markup and any future styles
  // from leaking into or being affected by the host page.
  if ((host as any).attachShadow) {
    const shadow = (host as any).attachShadow({ mode: "open" }) as ShadowRoot;

    // Inject compiled CSS directly into the ShadowRoot so that
    // the widget appearance is fully isolated from the host page.
    const styleEl = document.createElement("style");
    styleEl.textContent = widgetStyles;
    shadow.appendChild(styleEl);

    const container = document.createElement("div");
    shadow.appendChild(container);
    return host;
  }

  return host;
}

function getShadowContainer(host: HTMLElement): HTMLElement {
  const shadow = (host as any).shadowRoot as ShadowRoot | undefined;
  if (shadow) {
    const existing = shadow.querySelector<HTMLElement>("[data-widget-container]");
    if (existing) return existing;
    const container = document.createElement("div");
    container.setAttribute("data-widget-container", "true");
    shadow.appendChild(container);
    return container;
  }

  return host;
}

const FETCH_TIMEOUT_MS = 10000; // 10 seconds

function renderWidget(
  container: HTMLElement,
  options: PriceDropWidgetOptions,
  endpoint: string
): WidgetInstance {
  // Clear any existing content to allow idempotent re-renders.
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const form = document.createElement("form");

  const emailLabel = document.createElement("label");
  emailLabel.textContent = "Email:";

  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.name = "email";

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Notify me";

  const statusText = document.createElement("div");

  emailLabel.appendChild(emailInput);
  form.appendChild(emailLabel);
  form.appendChild(submitButton);
  form.appendChild(statusText);

  container.appendChild(form);

  let state: PriceDropWidgetState = "idle";

  function setState(next: PriceDropWidgetState, message?: string): void {
    state = next;

    switch (next) {
      case "idle":
        submitButton.disabled = false;
        emailInput.disabled = false;
        statusText.textContent = message ?? "";
        break;
      case "submitting":
        submitButton.disabled = true;
        emailInput.disabled = true;
        statusText.textContent = message ?? "Submitting...";
        break;
      case "success":
        submitButton.disabled = true;
        emailInput.disabled = true;
        statusText.textContent =
          message ?? "You will be notified about price changes for this product.";
        break;
      case "error":
        submitButton.disabled = false;
        emailInput.disabled = false;
        statusText.textContent =
          message ?? "Something went wrong. Please try again.";
        break;
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const rawEmail = emailInput.value.trim();
    if (!rawEmail) {
      setState("error", "Please enter a valid email address.");
      return;
    }

    // Minimal, defensive email shape check without being overly strict.
    if (!rawEmail.includes("@")) {
      setState("error", "Please enter a valid email address.");
      return;
    }

    setState("submitting");

    const payload = {
      email: rawEmail,
      product: {
        name: options.name,
        price: options.price,
        url: options.url,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      FETCH_TIMEOUT_MS
    );

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let errorBody: { error?: string } = {};
      try {
        errorBody = (await response.json()) as { error?: string };
      } catch {
        // Ignore JSON parse errors
      }

      if (!response.ok) {
        const err = errorBody.error;
        if (response.status === 400 && err === "invalid_email") {
          setState("error", "Please enter a valid email address.");
          return;
        }
        if (response.status === 409 && err === "already_subscribed") {
          setState("error", "You are already subscribed to this product.");
          return;
        }
        if (response.status >= 500) {
          setState("error", "Server error. Please try again later.");
          return;
        }
        setState("error", "Unable to subscribe at the moment.");
        return;
      }

      setState("success");
      options.onSubscribed?.({ url: options.url });
    } catch (error) {
      clearTimeout(timeoutId);
      const isAbort = error instanceof Error && error.name === "AbortError";
      console.error("PriceDropWidget: network error", error);
      setState(
        "error",
        isAbort
          ? "Request timed out. Please try again."
          : "Network error. Please check your connection and try again."
      );
    }
  });

  return {
    root: container,
    state,
  };
}

function internalInitPriceDropWidget(rawOptions: InternalInitOptions): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  if (!isValidOptions(rawOptions)) {
    console.error(
      "PriceDropWidget: invalid options. Expected { name, price, url } strings."
    );
    return;
  }

  const rootHost = createRootContainer();
  if (!rootHost) {
    console.error("PriceDropWidget: unable to create root container.");
    return;
  }

  const mountTarget =
    rawOptions.mountEl || document.body || document.documentElement;
  if (!mountTarget) {
    console.error("PriceDropWidget: no suitable mount target found.");
    return;
  }

  mountTarget.appendChild(rootHost);

  const container = getShadowContainer(rootHost);

  const endpoint = rawOptions.endpoint ?? "/subscribe-price-drop";

  renderWidget(container, rawOptions, endpoint);
}

/**
 * Public initializer for the Price Drop widget.
 *
 * Example usage:
 *   PriceDropWidget.initPriceDropWidget({
 *     name: "...",
 *     price: "...",
 *     url: "..."
 *   });
 */
function initPriceDropWidget(options: PriceDropWidgetOptions): void {
  internalInitPriceDropWidget(options);
}

// UMD-style export to support:
// - IIFE global (window.PriceDropWidget)
// - CommonJS (module.exports)
// - AMD (define)
declare const module:
  | {
      exports: any;
    }
  | undefined;

declare const define:
  | ((deps: string[], factory: () => any) => void) & {
      amd?: unknown;
    }
  | undefined;

// Provide a minimal declaration so TypeScript can type-check
// the UMD global fallback without requiring Node typings.
declare const global: any;

(function (root, factory) {
  const existing =
    (root as any).PriceDropWidget && typeof (root as any).PriceDropWidget === "object"
      ? (root as any).PriceDropWidget
      : {};

  const api = factory(existing);

  if (typeof module === "object" && module && module.exports) {
    module.exports = api;
  } else if (typeof define === "function" && define && define.amd) {
    define([], function () {
      return api;
    });
  } else {
    (root as any).PriceDropWidget = api;
  }
})(
  // Use globalThis when available for broader environment support.
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
    ? window
    : typeof global !== "undefined"
    ? global
    : this,
  function (existing: any) {
    return {
      ...existing,
      initPriceDropWidget,
    };
  }
);

