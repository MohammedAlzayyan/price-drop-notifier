"use strict";var __PriceDropWidgetBundle=(()=>{var w=`/* All styles are scoped under .pd-widget-root to avoid selector collisions.\r
   In Shadow DOM, these rules are further isolated from host-page CSS. */\r
\r
   .pd-widget-root {\r
    /* Reserve vertical space to reduce layout shift on injection */\r
    min-height: 120px;\r
  \r
    /* Use CSS variables with fallbacks so host can theme if desired */\r
    --pd-accent: var(--pd-accent, #2563eb);\r
    --pd-bg: var(--pd-bg, #ffffff);\r
  \r
    box-sizing: border-box;\r
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\r
    font-size: 14px;\r
    line-height: 1.4;\r
    color: #111827;\r
  }\r
  \r
  /* Reset potentially dangerous inherited styles inside the widget */\r
  .pd-widget-root,\r
  .pd-widget-root * {\r
    box-sizing: border-box;\r
    margin: 0;\r
    padding: 0;\r
    border: 0;\r
    background: none;\r
    font: inherit;\r
    color: inherit;\r
    text-decoration: none;\r
    list-style: none;\r
  }\r
  \r
  /* Container layout */\r
  .pd-widget-root {\r
    display: block;\r
  }\r
  \r
  .pd-widget {\r
    width: 100%;\r
    max-width: 360px;\r
    background-color: var(--pd-bg);\r
    border-radius: 8px;\r
    border: 1px solid rgba(15, 23, 42, 0.12);\r
    padding: 12px 14px;\r
    display: flex;\r
    flex-direction: column;\r
    gap: 8px;\r
  }\r
  \r
  /* Responsive behavior for narrow containers */\r
  @media (max-width: 420px) {\r
    .pd-widget {\r
      max-width: 100%;\r
      padding: 10px 12px;\r
    }\r
  }\r
  \r
  /* Form layout */\r
  .pd-widget__form {\r
    display: flex;\r
    flex-direction: column;\r
    gap: 8px;\r
  }\r
  \r
  .pd-widget__field {\r
    display: flex;\r
    flex-direction: column;\r
    gap: 4px;\r
  }\r
  \r
  /* Labels */\r
  .pd-widget__label {\r
    font-size: 12px;\r
    color: #4b5563;\r
  }\r
  \r
  /* Inputs */\r
  .pd-widget__input {\r
    appearance: none;\r
    -webkit-appearance: none;\r
    width: 100%;\r
    padding: 6px 8px;\r
    border-radius: 4px;\r
    border: 1px solid rgba(148, 163, 184, 0.9);\r
    background-color: #f9fafb;\r
    color: #111827;\r
    outline: none;\r
    transition: border-color 120ms ease-out, box-shadow 120ms ease-out,\r
      background-color 120ms ease-out;\r
  }\r
  \r
  .pd-widget__input:focus {\r
    border-color: var(--pd-accent);\r
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--pd-accent) 75%, transparent);\r
    background-color: #ffffff;\r
  }\r
  \r
  .pd-widget__input:disabled {\r
    opacity: 0.6;\r
    cursor: not-allowed;\r
  }\r
  \r
  /* Button */\r
  .pd-widget__actions {\r
    display: flex;\r
    justify-content: flex-end;\r
  }\r
  \r
  .pd-widget__button {\r
    appearance: none;\r
    -webkit-appearance: none;\r
    padding: 6px 12px;\r
    border-radius: 999px;\r
    border: 1px solid transparent;\r
    background-color: var(--pd-accent);\r
    color: #ffffff;\r
    font-weight: 500;\r
    font-size: 13px;\r
    cursor: pointer;\r
    white-space: nowrap;\r
    display: inline-flex;\r
    align-items: center;\r
    justify-content: center;\r
    transition: background-color 120ms ease-out, transform 80ms ease-out,\r
      box-shadow 120ms ease-out, opacity 80ms ease-out;\r
  }\r
  \r
  .pd-widget__button:hover:not(:disabled) {\r
    background-color: color-mix(in srgb, var(--pd-accent) 85%, #000 15%);\r
    box-shadow: 0 8px 16px rgba(15, 23, 42, 0.25);\r
  }\r
  \r
  .pd-widget__button:active:not(:disabled) {\r
    transform: translateY(1px) scale(0.98);\r
    box-shadow: 0 3px 8px rgba(15, 23, 42, 0.3);\r
  }\r
  \r
  .pd-widget__button:disabled {\r
    opacity: 0.6;\r
    cursor: default;\r
    box-shadow: none;\r
  }\r
  \r
  /* Status text */\r
  .pd-widget__status {\r
    min-height: 18px; /* reserves space even with empty messages */\r
    font-size: 12px;\r
    color: #4b5563;\r
  }\r
  \r
  /* Success / error visual states */\r
  .pd-widget--success .pd-widget__status {\r
    color: #15803d;\r
  }\r
  \r
  .pd-widget--error .pd-widget__status {\r
    color: #b91c1c;\r
  }\r
  \r
  /* Subtle success / error animations (CSS only) */\r
  @keyframes pd-status-success-pulse {\r
    0% {\r
      background-color: rgba(22, 163, 74, 0);\r
    }\r
    25% {\r
      background-color: rgba(22, 163, 74, 0.12);\r
    }\r
    100% {\r
      background-color: rgba(22, 163, 74, 0);\r
    }\r
  }\r
  \r
  @keyframes pd-status-error-shake {\r
    0%,\r
    100% {\r
      transform: translateX(0);\r
    }\r
    20% {\r
      transform: translateX(-2px);\r
    }\r
    40% {\r
      transform: translateX(2px);\r
    }\r
    60% {\r
      transform: translateX(-1px);\r
    }\r
    80% {\r
      transform: translateX(1px);\r
    }\r
  }\r
  \r
  .pd-widget--success .pd-widget__status {\r
    animation: pd-status-success-pulse 900ms ease-out 1;\r
  }\r
  \r
  .pd-widget--error .pd-widget__status {\r
    animation: pd-status-error-shake 260ms ease-out 1;\r
  }\r
  \r
  /* Submitting state hint */\r
  .pd-widget--submitting .pd-widget__button {\r
    cursor: progress;\r
  }`;function y(e){return!!e&&typeof e.name=="string"&&typeof e.price=="string"&&typeof e.url=="string"}function _(){if(typeof document>"u")return null;let e=document.createElement("div");if(e.setAttribute("data-price-drop-widget-root","true"),e.attachShadow){let t=e.attachShadow({mode:"open"}),o=document.createElement("style");o.textContent=w,t.appendChild(o);let r=document.createElement("div");return t.appendChild(r),e}return e}function v(e){let t=e.shadowRoot;if(t){let o=t.querySelector("[data-widget-container]");if(o)return o;let r=document.createElement("div");return r.setAttribute("data-widget-container","true"),t.appendChild(r),r}return e}var S=1e4;function k(e,t,o){for(;e.firstChild;)e.removeChild(e.firstChild);let r=document.createElement("form"),c=document.createElement("label");c.textContent="Email:";let a=document.createElement("input");a.type="email",a.name="email";let s=document.createElement("button");s.type="submit",s.textContent="Notify me";let l=document.createElement("div");c.appendChild(a),r.appendChild(c),r.appendChild(s),r.appendChild(l),e.appendChild(r);let g="idle";function n(p,d){switch(g=p,p){case"idle":s.disabled=!1,a.disabled=!1,l.textContent=d??"";break;case"submitting":s.disabled=!0,a.disabled=!0,l.textContent=d??"Submitting...";break;case"success":s.disabled=!0,a.disabled=!0,l.textContent=d??"You will be notified about price changes for this product.";break;case"error":s.disabled=!1,a.disabled=!1,l.textContent=d??"Something went wrong. Please try again.";break}}return r.addEventListener("submit",async p=>{p.preventDefault();let d=a.value.trim();if(!d){n("error","Please enter a valid email address.");return}if(!d.includes("@")){n("error","Please enter a valid email address.");return}n("submitting");let h={email:d,product:{name:t.name,price:t.price,url:t.url}},f=new AbortController,m=setTimeout(()=>f.abort(),S);try{let i=await fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(h),signal:f.signal});clearTimeout(m);let u={};try{u=await i.json()}catch{}if(!i.ok){let b=u.error;if(i.status===400&&b==="invalid_email"){n("error","Please enter a valid email address.");return}if(i.status===409&&b==="already_subscribed"){n("error","You are already subscribed to this product.");return}if(i.status>=500){n("error","Server error. Please try again later.");return}n("error","Unable to subscribe at the moment.");return}n("success"),t.onSubscribed?.({url:t.url})}catch(i){clearTimeout(m);let u=i instanceof Error&&i.name==="AbortError";console.error("PriceDropWidget: network error",i),n("error",u?"Request timed out. Please try again.":"Network error. Please check your connection and try again.")}}),{root:e,state:g}}function P(e){if(typeof window>"u"||typeof document>"u")return;if(!y(e)){console.error("PriceDropWidget: invalid options. Expected { name, price, url } strings.");return}let t=_();if(!t){console.error("PriceDropWidget: unable to create root container.");return}let o=e.mountEl||document.body||document.documentElement;if(!o){console.error("PriceDropWidget: no suitable mount target found.");return}o.appendChild(t);let r=v(t),c=e.endpoint??"/subscribe-price-drop";k(r,e,c)}function C(e){P(e)}(function(e,t){let o=e.PriceDropWidget&&typeof e.PriceDropWidget=="object"?e.PriceDropWidget:{},r=t(o);typeof module=="object"&&module&&module.exports?module.exports=r:typeof define=="function"&&define&&define.amd?define([],function(){return r}):e.PriceDropWidget=r})(typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:void 0,function(e){return{...e,initPriceDropWidget:C}});})();
//# sourceMappingURL=widget.js.map
