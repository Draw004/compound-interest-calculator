(function () {
  "use strict";

  const CLOUDFLARE_ANALYTICS_TOKEN = "713a819bf0244b9fb4245554a6f20ee2";

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

  window.CarrowmontAnalytics = Object.freeze({
    provider: "cloudflare-aggregate",
    track() {}
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadCloudflareAnalytics, { once: true });
  } else {
    loadCloudflareAnalytics();
  }
})();
