(function () {
  "use strict";

  const CLOUDFLARE_ANALYTICS_TOKEN = "713a819bf0244b9fb4245554a6f20ee2";
  const ANALYTICS_MEASUREMENT_ID = "G-C3D0G5C7F0";
  const ANALYTICS_CONSENT_KEY = "carrowmont_analytics_consent_v1";
  const scriptEl = document.currentScript;
  const TOOL_ID = scriptEl?.dataset?.carrowmontTool || "carrowmont_tool";
  const TRACK_TOOL_OPEN = scriptEl?.dataset?.trackToolOpen !== "false";
  const ALLOWED_EVENT_PARAMS = Object.freeze({
    tool_open: [],
    report_generate: [],
    copy_summary: [],
    country_change: ["selected_region", "selected_currency"],
    calculator_mode_change: ["mode"]
  });

  let analyticsLoaded = false;
  let toolOpenSent = false;
  let memoryConsent = null;

  function analyticsPageLocation() {
    return `${window.location.origin}${window.location.pathname}`;
  }

  function analyticsReferrer() {
    if (!document.referrer) return "";
    try {
      const url = new URL(document.referrer);
      return `${url.origin}${url.pathname}`;
    } catch (_) {
      return "";
    }
  }

  function loadCloudflareAnalytics() {
    if (document.querySelector('script[data-carrowmont-cloudflare="true"]')) return;

    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://static.cloudflareinsights.com/beacon.min.js";
    script.referrerPolicy = "origin";
    script.setAttribute("data-cf-beacon", JSON.stringify({ token: CLOUDFLARE_ANALYTICS_TOKEN }));
    script.dataset.carrowmontCloudflare = "true";
    (document.body || document.head || document.documentElement).appendChild(script);
  }

  function getAnalyticsConsent() {
    try {
      const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
      if (value === "granted" || value === "denied") return value;
    } catch (_) {
      // Fall back to the in-memory choice below.
    }
    return memoryConsent;
  }

  function setAnalyticsConsent(value) {
    memoryConsent = value === "granted" || value === "denied" ? value : null;
    try {
      if (memoryConsent) window.localStorage.setItem(ANALYTICS_CONSENT_KEY, memoryConsent);
    } catch (_) {
      // If storage is unavailable, the choice remains effective for this page.
    }
  }

  function disableAnalytics() {
    window[`ga-disable-${ANALYTICS_MEASUREMENT_ID}`] = true;

    document.cookie.split(";").forEach((entry) => {
      const name = entry.split("=")[0].trim();
      if (!name.startsWith("_ga")) return;
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.carrowmont.com; SameSite=Lax`;
    });
  }

  function cleanEventParams(eventName, params) {
    const allowed = ALLOWED_EVENT_PARAMS[eventName];
    if (!allowed) return null;
    const clean = { tool_id: TOOL_ID };
    for (const key of allowed) {
      if (!Object.prototype.hasOwnProperty.call(params || {}, key)) continue;
      clean[key] = String(params[key] ?? "").slice(0, key === "mode" ? 32 : 24);
    }
    return clean;
  }

  function track(eventName, params) {
    if (getAnalyticsConsent() !== "granted" || typeof window.gtag !== "function") return;
    const clean = cleanEventParams(eventName, params);
    if (!clean) return;
    window.gtag("event", eventName, clean);
  }

  function sendToolOpen() {
    if (!TRACK_TOOL_OPEN || toolOpenSent) return;
    toolOpenSent = true;
    track("tool_open");
  }

  function loadAnalytics() {
    if (analyticsLoaded || document.querySelector('script[data-carrowmont-ga4="true"]')) {
      analyticsLoaded = true;
      sendToolOpen();
      return;
    }

    window[`ga-disable-${ANALYTICS_MEASUREMENT_ID}`] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    window.gtag("js", new Date());
    window.gtag("config", ANALYTICS_MEASUREMENT_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: analyticsPageLocation(),
      page_referrer: analyticsReferrer()
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ANALYTICS_MEASUREMENT_ID)}`;
    script.referrerPolicy = "origin";
    script.dataset.carrowmontGa4 = "true";
    document.head.appendChild(script);
    analyticsLoaded = true;
    sendToolOpen();
  }

  function ensureAnalyticsConsentStyles() {
    if (document.getElementById("carrowmontAnalyticsConsentStyles")) return;

    const style = document.createElement("style");
    style.id = "carrowmontAnalyticsConsentStyles";
    style.textContent = `
      .cm-analytics-consent {
        position: fixed;
        left: 12px;
        right: 12px;
        bottom: 12px;
        z-index: 10000;
        max-width: 820px;
        margin: 0 auto;
        padding: 14px 16px;
        border: 1px solid #cfe1df;
        border-radius: 14px;
        background: #ffffff;
        box-shadow: 0 10px 28px rgba(10, 37, 61, 0.14);
        color: #17314f;
        font-family: inherit;
      }
      .cm-analytics-consent__inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .cm-analytics-consent__copy { min-width: 0; }
      .cm-analytics-consent__copy strong {
        display: block;
        margin-bottom: 4px;
        color: #0b2d4f;
      }
      .cm-analytics-consent__copy p {
        margin: 0;
        line-height: 1.45;
        color: #566f8f;
        font-size: 0.94em;
      }
      .cm-analytics-consent__copy a {
        color: #007d75;
        font-weight: 700;
      }
      .cm-analytics-consent__actions {
        display: flex;
        flex: 0 0 auto;
        gap: 8px;
      }
      .cm-analytics-consent__button {
        appearance: none;
        border: 1px solid #0e827a;
        border-radius: 10px;
        padding: 9px 12px;
        min-height: 42px;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }
      .cm-analytics-consent__button--accept {
        background: #0e827a;
        color: #ffffff;
      }
      .cm-analytics-consent__button--decline {
        background: #ffffff;
        color: #0e827a;
      }
      @media (max-width: 760px) {
        .cm-analytics-consent {
          left: 8px;
          right: 8px;
          bottom: 8px;
          padding: 13px;
          border-radius: 12px;
        }
        .cm-analytics-consent__inner { display: block; }
        .cm-analytics-consent__actions {
          margin-top: 12px;
          width: 100%;
          flex-wrap: wrap;
        }
        .cm-analytics-consent__button { flex: 1 1 210px; }
      }
    `;
    document.head.appendChild(style);
  }

  function hideAnalyticsConsent() {
    document.getElementById("carrowmontAnalyticsConsent")?.remove();
  }

  function showAnalyticsConsent() {
    hideAnalyticsConsent();
    ensureAnalyticsConsentStyles();

    const banner = document.createElement("section");
    banner.id = "carrowmontAnalyticsConsent";
    banner.className = "cm-analytics-consent";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Optional analytics choice");
    banner.innerHTML = `
      <div class="cm-analytics-consent__inner">
        <div class="cm-analytics-consent__copy">
          <strong>Your calculator numbers stay private from analytics</strong>
          <p>Financial values you enter in Carrowmont calculators are not included in analytics. Optional Google Analytics loads only if you allow it. You can use every calculator without Google Analytics. <a href="/privacy.html">Privacy details</a></p>
        </div>
        <div class="cm-analytics-consent__actions">
          <button type="button" class="cm-analytics-consent__button cm-analytics-consent__button--decline" data-analytics-choice="denied">Continue without Google Analytics</button>
          <button type="button" class="cm-analytics-consent__button cm-analytics-consent__button--accept" data-analytics-choice="granted">Allow Google Analytics</button>
        </div>
      </div>
    `;

    banner.querySelectorAll("[data-analytics-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        const choice = button.getAttribute("data-analytics-choice");
        setAnalyticsConsent(choice);
        hideAnalyticsConsent();
        if (choice === "granted") {
          loadAnalytics();
        } else {
          disableAnalytics();
        }
      });
    });

    document.body.appendChild(banner);
  }

  function attachUsageEvents() {
    const reportButton = document.getElementById("reportBtn") || document.getElementById("printReportBtn") || document.getElementById("printBtn");
    const copyButton = document.getElementById("copyBtn") || document.getElementById("copySummaryBtn");
    const localeDoneButton = document.getElementById("localeDone") || document.getElementById("localeDoneBtn");

    reportButton?.addEventListener("click", () => track("report_generate"));
    copyButton?.addEventListener("click", () => track("copy_summary"));

    localeDoneButton?.addEventListener("click", () => {
      const region = document.getElementById("regionSelect")?.value || "";
      const currency = document.getElementById("currencySelect")?.value || "";
      track("country_change", {
        selected_region: region,
        selected_currency: currency
      });
    });

    document.querySelectorAll(".mode-tab[data-mode], .mode-button[data-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.getAttribute("data-mode") || "";
        track("calculator_mode_change", { mode });
      });
    });
  }

  function initializeAnalyticsConsent() {
    const consent = getAnalyticsConsent();
    if (consent === "granted") {
      loadAnalytics();
    } else if (consent === "denied") {
      disableAnalytics();
    } else {
      showAnalyticsConsent();
    }
  }

  function initialize() {
    loadCloudflareAnalytics();
    attachUsageEvents();
    initializeAnalyticsConsent();
  }

  window.CarrowmontAnalytics = window.CarrowmontAnalytics || {};
  Object.assign(window.CarrowmontAnalytics, {
    measurementId: ANALYTICS_MEASUREMENT_ID,
    getConsent: getAnalyticsConsent,
    showSettings: showAnalyticsConsent,
    track: track,
    toolId: TOOL_ID
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
