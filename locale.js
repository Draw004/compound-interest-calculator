(function () {
  "use strict";

  const STORAGE_REGION = "carrowmont_region_v1";
  const STORAGE_CURRENCY = "carrowmont_currency_v1";

  // Country/region profiles control locale-aware formatting and the suggested default currency only.
  // They do not change inflation assumptions, taxes, pensions, benefits or exchange rates.
  const regions = {
    IN: { label: "India", locale: "en-IN", currency: "INR", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    US: { label: "United States", locale: "en-US", currency: "USD", contributionFrequency: "biweekly", twoWeekLabel: "biweekly" },
    CA: { label: "Canada", locale: "en-CA", currency: "CAD", contributionFrequency: "biweekly", twoWeekLabel: "biweekly" },
    GB: { label: "United Kingdom", locale: "en-GB", currency: "GBP", contributionFrequency: "monthly", twoWeekLabel: "fortnightly" },
    AU: { label: "Australia", locale: "en-AU", currency: "AUD", contributionFrequency: "biweekly", twoWeekLabel: "fortnightly" },
    AT: { label: "Austria", locale: "de-AT", currency: "EUR", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    BD: { label: "Bangladesh", locale: "en-BD", currency: "BDT", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    BE: { label: "Belgium", locale: "nl-BE", currency: "EUR", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    NZ: { label: "New Zealand", locale: "en-NZ", currency: "NZD", contributionFrequency: "biweekly", twoWeekLabel: "fortnightly" },

    CL: { label: "Chile", locale: "es-CL", currency: "CLP", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    DK: { label: "Denmark", locale: "da-DK", currency: "DKK", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    CN: { label: "China", locale: "zh-CN", currency: "CNY" },
    JP: { label: "Japan", locale: "ja-JP", currency: "JPY" },
    KR: { label: "South Korea", locale: "ko-KR", currency: "KRW" },
    SG: { label: "Singapore", locale: "en-SG", currency: "SGD" },
    AE: { label: "United Arab Emirates", locale: "en-AE", currency: "AED" },
    SA: { label: "Saudi Arabia", locale: "ar-SA", currency: "SAR" },
    OM: { label: "Oman", locale: "en-OM", currency: "OMR", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    QA: { label: "Qatar", locale: "en-QA", currency: "QAR", contributionFrequency: "monthly", twoWeekLabel: "neutral" },

    DE: { label: "Germany", locale: "de-DE", currency: "EUR" },
    FR: { label: "France", locale: "fr-FR", currency: "EUR" },
    IT: { label: "Italy", locale: "it-IT", currency: "EUR" },
    ES: { label: "Spain", locale: "es-ES", currency: "EUR" },
    FI: { label: "Finland", locale: "fi-FI", currency: "EUR", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    IE: { label: "Ireland", locale: "en-IE", currency: "EUR", contributionFrequency: "monthly", twoWeekLabel: "fortnightly" },
    NL: { label: "Netherlands", locale: "nl-NL", currency: "EUR", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    NO: { label: "Norway", locale: "nb-NO", currency: "NOK", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    PL: { label: "Poland", locale: "pl-PL", currency: "PLN", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    PT: { label: "Portugal", locale: "pt-PT", currency: "EUR", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    SE: { label: "Sweden", locale: "sv-SE", currency: "SEK", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    CH: { label: "Switzerland", locale: "de-CH", currency: "CHF" },

    BR: { label: "Brazil", locale: "pt-BR", currency: "BRL" },
    MX: { label: "Mexico", locale: "es-MX", currency: "MXN" },
    ZA: { label: "South Africa", locale: "en-ZA", currency: "ZAR" },
    ID: { label: "Indonesia", locale: "id-ID", currency: "IDR" },
    MY: { label: "Malaysia", locale: "en-MY", currency: "MYR" },
    TH: { label: "Thailand", locale: "th-TH", currency: "THB" },
    PH: { label: "Philippines", locale: "en-PH", currency: "PHP", contributionFrequency: "semimonthly", twoWeekLabel: "neutral" },
    VN: { label: "Vietnam", locale: "vi-VN", currency: "VND" },
    HK: { label: "Hong Kong", locale: "zh-HK", currency: "HKD" },
    TW: { label: "Taiwan", locale: "zh-TW", currency: "TWD" },
    RU: { label: "Russia", locale: "ru-RU", currency: "RUB" },
    TR: { label: "Türkiye", locale: "tr-TR", currency: "TRY" },

    OTHER: { label: "Other / International", locale: "en-US", currency: "USD" }
  };

  const currencies = {
    INR: { label: "Indian Rupee", symbol: "₹" },
    USD: { label: "US Dollar", symbol: "$" },
    CAD: { label: "Canadian Dollar", symbol: "C$" },
    GBP: { label: "British Pound", symbol: "£" },
    AUD: { label: "Australian Dollar", symbol: "A$" },
    NZD: { label: "New Zealand Dollar", symbol: "NZ$" },
    BDT: { label: "Bangladeshi Taka", symbol: "৳", currencyDisplay: "narrowSymbol" },
    CLP: { label: "Chilean Peso", symbol: "$" },
    DKK: { label: "Danish Krone", symbol: "kr" },
    EUR: { label: "Euro", symbol: "€" },
    CNY: { label: "Chinese Yuan", symbol: "CN¥" },
    JPY: { label: "Japanese Yen", symbol: "¥" },
    KRW: { label: "South Korean Won", symbol: "₩" },
    SGD: { label: "Singapore Dollar", symbol: "S$" },
    AED: { label: "UAE Dirham", symbol: "AED" },
    SAR: { label: "Saudi Riyal", symbol: "SAR" },
    OMR: { label: "Omani Rial", symbol: "OMR" },
    QAR: { label: "Qatari Riyal", symbol: "QAR" },
    CHF: { label: "Swiss Franc", symbol: "CHF" },
    NOK: { label: "Norwegian Krone", symbol: "kr" },
    PLN: { label: "Polish Zloty", symbol: "zł" },
    SEK: { label: "Swedish Krona", symbol: "kr" },
    BRL: { label: "Brazilian Real", symbol: "R$" },
    MXN: { label: "Mexican Peso", symbol: "MX$" },
    ZAR: { label: "South African Rand", symbol: "R" },
    IDR: { label: "Indonesian Rupiah", symbol: "Rp" },
    MYR: { label: "Malaysian Ringgit", symbol: "RM" },
    THB: { label: "Thai Baht", symbol: "฿" },
    PHP: { label: "Philippine Peso", symbol: "₱" },
    VND: { label: "Vietnamese Dong", symbol: "₫" },
    HKD: { label: "Hong Kong Dollar", symbol: "HK$" },
    TWD: { label: "New Taiwan Dollar", symbol: "NT$" },
    RUB: { label: "Russian Ruble", symbol: "₽" },
    TRY: { label: "Turkish Lira", symbol: "₺" }
  };

  function detectRegion() {
    const langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en-US"])
      .map(String);
    for (const lang of langs) {
      const upper = lang.toUpperCase().replace("_", "-");
      const parts = upper.split("-");
      const country = parts.length > 1 ? parts[parts.length - 1] : "";
      if (country === "UK") return "GB";
      if (regions[country]) return country;
    }
    return "OTHER";
  }

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  let regionCode = safeGet(STORAGE_REGION);
  if (!regions[regionCode]) regionCode = detectRegion();

  let currencyCode = safeGet(STORAGE_CURRENCY);
  if (!currencies[currencyCode]) currencyCode = regions[regionCode].currency;

  function getRegion() { return regionCode; }
  function getCurrency() { return currencyCode; }
  function getProfile() { return regions[regionCode] || regions.OTHER; }
  function getLocale() { return getProfile().locale; }

  function setRegion(code, opts = {}) {
    if (!regions[code]) return;
    regionCode = code;
    safeSet(STORAGE_REGION, regionCode);
    if (opts.syncCurrency !== false) {
      currencyCode = regions[code].currency;
      safeSet(STORAGE_CURRENCY, currencyCode);
    }
    emitChange();
  }

  function setCurrency(code) {
    if (!currencies[code]) return;
    currencyCode = code;
    safeSet(STORAGE_CURRENCY, currencyCode);
    emitChange();
  }

  function setLocale(region, currency) {
    if (!regions[region]) return;
    regionCode = region;
    currencyCode = currencies[currency] ? currency : regions[region].currency;
    safeSet(STORAGE_REGION, regionCode);
    safeSet(STORAGE_CURRENCY, currencyCode);
    emitChange();
  }

  function emitChange() {
    window.dispatchEvent(new CustomEvent("carrowmont:localechange", {
      detail: { region: regionCode, currency: currencyCode }
    }));
  }

  function formatMoney(value, options = {}) {
    const n = Number(value) || 0;
    const currency = options.currency || currencyCode;
    const locale = options.locale || getLocale();
    const maximumFractionDigits = options.maximumFractionDigits ?? 0;
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        currencyDisplay: currencies[currency]?.currencyDisplay || "symbol",
        maximumFractionDigits,
        minimumFractionDigits: options.minimumFractionDigits ?? 0
      }).format(n);
    } catch (_) {
      return `${currencies[currency]?.symbol || currency} ${Math.round(n).toLocaleString(locale)}`;
    }
  }

  function formatCompactMoney(value, options = {}) {
    const n = Number(value) || 0;
    const currency = options.currency || currencyCode;
    const locale = options.locale || getLocale();
    try {
      let formatted = new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        currencyDisplay: currencies[currency]?.currencyDisplay || "symbol",
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: options.maximumFractionDigits ?? 2,
        minimumFractionDigits: options.minimumFractionDigits ?? 0
      }).format(n);
      // Intl renders Indian compact units as e.g. “₹3Cr”. Add a small
      // readability gap while leaving other currency conventions unchanged.
      if (currency === "INR") formatted = formatted.replace(/(\d)(?=(?:Cr|L|K)\b)/g, "$1 ");
      return formatted;
    } catch (_) {
      return formatMoney(n, { currency, locale });
    }
  }

  function formatNumber(value, options = {}) {
    const n = Number(value) || 0;
    return new Intl.NumberFormat(options.locale || getLocale(), {
      maximumFractionDigits: options.maximumFractionDigits ?? 0
    }).format(n);
  }

  function currencySymbol(code = currencyCode) {
    return currencies[code]?.symbol || code;
  }

  window.CarrowmontLocale = {
    regions,
    currencies,
    getRegion,
    getCurrency,
    getProfile,
    getLocale,
    setRegion,
    setCurrency,
    setLocale,
    formatMoney,
    formatCompactMoney,
    formatNumber,
    currencySymbol
  };
})();
