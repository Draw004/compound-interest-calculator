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


    // GLOBAL2: additional major and developing economies. Formatting/default-currency profiles only.
    AR: { label: "Argentina", locale: "es-AR", currency: "ARS", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    IL: { label: "Israel", locale: "en-IL", currency: "ILS", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    CO: { label: "Colombia", locale: "es-CO", currency: "COP", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    RO: { label: "Romania", locale: "ro-RO", currency: "RON", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    PK: { label: "Pakistan", locale: "en-PK", currency: "PKR", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    CZ: { label: "Czechia", locale: "cs-CZ", currency: "CZK", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    EG: { label: "Egypt", locale: "en-EG", currency: "EGP", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    PE: { label: "Peru", locale: "es-PE", currency: "PEN", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    KZ: { label: "Kazakhstan", locale: "en-KZ", currency: "KZT", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    NG: { label: "Nigeria", locale: "en-NG", currency: "NGN", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    GR: { label: "Greece", locale: "el-GR", currency: "EUR", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    MA: { label: "Morocco", locale: "en-MA", currency: "MAD", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    KW: { label: "Kuwait", locale: "en-KW", currency: "KWD", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    UZ: { label: "Uzbekistan", locale: "en-UZ", currency: "UZS", contributionFrequency: "monthly", twoWeekLabel: "neutral" },
    KE: { label: "Kenya", locale: "en-KE", currency: "KES", contributionFrequency: "monthly", twoWeekLabel: "neutral" },

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

    // GLOBAL2: currencies for the additional country profiles.
    ARS: { label: "Argentine Peso", symbol: "$" },
    ILS: { label: "Israeli New Shekel", symbol: "₪" },
    COP: { label: "Colombian Peso", symbol: "$" },
    RON: { label: "Romanian Leu", symbol: "lei" },
    PKR: { label: "Pakistani Rupee", symbol: "₨" },
    CZK: { label: "Czech Koruna", symbol: "Kč" },
    EGP: { label: "Egyptian Pound", symbol: "E£" },
    PEN: { label: "Peruvian Sol", symbol: "S/" },
    KZT: { label: "Kazakhstani Tenge", symbol: "₸" },
    NGN: { label: "Nigerian Naira", symbol: "₦" },
    MAD: { label: "Moroccan Dirham", symbol: "MAD" },
    KWD: { label: "Kuwaiti Dinar", symbol: "KWD" },
    UZS: { label: "Uzbekistani Som", symbol: "UZS" },
    KES: { label: "Kenyan Shilling", symbol: "KSh" },
    TRY: { label: "Turkish Lira", symbol: "₺" }
  };

  function detectRegionFromTimezone() {
    let tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (_) {}
    if (!tz) return "";

    const exact = {
      "Asia/Kolkata":"IN", "Asia/Calcutta":"IN",
      "Pacific/Auckland":"NZ", "Pacific/Chatham":"NZ",
      "Europe/London":"GB", "Europe/Dublin":"IE",
      "Europe/Vienna":"AT", "Europe/Brussels":"BE", "Europe/Copenhagen":"DK", "Europe/Helsinki":"FI",
      "Europe/Paris":"FR", "Europe/Berlin":"DE", "Europe/Busingen":"DE", "Europe/Rome":"IT", "Europe/Madrid":"ES",
      "Atlantic/Canary":"ES", "Africa/Ceuta":"ES", "Europe/Amsterdam":"NL", "Europe/Oslo":"NO", "Europe/Warsaw":"PL",
      "Europe/Lisbon":"PT", "Atlantic/Madeira":"PT", "Atlantic/Azores":"PT", "Europe/Stockholm":"SE", "Europe/Zurich":"CH",
      "Asia/Dhaka":"BD", "America/Santiago":"CL", "America/Punta_Arenas":"CL", "Pacific/Easter":"CL",
      "Asia/Shanghai":"CN", "Asia/Urumqi":"CN", "Asia/Tokyo":"JP", "Asia/Seoul":"KR", "Asia/Singapore":"SG",
      "Asia/Dubai":"AE", "Asia/Riyadh":"SA", "Asia/Muscat":"OM", "Asia/Qatar":"QA",
      // GLOBAL2 additional country/timezone mappings.
      "America/Argentina/Buenos_Aires":"AR", "America/Argentina/Catamarca":"AR", "America/Argentina/Cordoba":"AR",
      "America/Argentina/Jujuy":"AR", "America/Argentina/La_Rioja":"AR", "America/Argentina/Mendoza":"AR",
      "America/Argentina/Rio_Gallegos":"AR", "America/Argentina/Salta":"AR", "America/Argentina/San_Juan":"AR",
      "America/Argentina/San_Luis":"AR", "America/Argentina/Tucuman":"AR", "America/Argentina/Ushuaia":"AR",
      "Asia/Jerusalem":"IL", "America/Bogota":"CO", "Europe/Bucharest":"RO", "Asia/Karachi":"PK",
      "Europe/Prague":"CZ", "Africa/Cairo":"EG", "America/Lima":"PE",
      "Asia/Almaty":"KZ", "Asia/Aqtau":"KZ", "Asia/Aqtobe":"KZ", "Asia/Atyrau":"KZ", "Asia/Oral":"KZ", "Asia/Qostanay":"KZ", "Asia/Qyzylorda":"KZ",
      "Africa/Lagos":"NG", "Europe/Athens":"GR", "Africa/Casablanca":"MA", "Asia/Kuwait":"KW",
      "Asia/Tashkent":"UZ", "Asia/Samarkand":"UZ", "Africa/Nairobi":"KE",
      "America/Toronto":"CA", "America/Vancouver":"CA", "America/Edmonton":"CA", "America/Winnipeg":"CA",
      "America/Halifax":"CA", "America/St_Johns":"CA", "America/Moncton":"CA", "America/Regina":"CA",
      "America/Whitehorse":"CA", "America/Iqaluit":"CA",
      "America/New_York":"US", "America/Chicago":"US", "America/Denver":"US", "America/Los_Angeles":"US",
      "America/Phoenix":"US", "America/Anchorage":"US", "America/Adak":"US", "Pacific/Honolulu":"US",
      "America/Detroit":"US", "America/Boise":"US", "America/Juneau":"US", "America/Sitka":"US", "America/Yakutat":"US",
      "America/Sao_Paulo":"BR", "America/Manaus":"BR", "America/Recife":"BR", "America/Fortaleza":"BR", "America/Belem":"BR",
      "America/Bahia":"BR", "America/Cuiaba":"BR", "America/Campo_Grande":"BR", "America/Rio_Branco":"BR", "America/Noronha":"BR",
      "America/Mexico_City":"MX", "America/Cancun":"MX", "America/Chihuahua":"MX", "America/Hermosillo":"MX",
      "America/Monterrey":"MX", "America/Mazatlan":"MX", "America/Tijuana":"MX", "America/Matamoros":"MX", "America/Ojinaga":"MX",
      "Africa/Johannesburg":"ZA", "Asia/Jakarta":"ID", "Asia/Makassar":"ID", "Asia/Jayapura":"ID", "Asia/Pontianak":"ID",
      "Asia/Kuala_Lumpur":"MY", "Asia/Kuching":"MY", "Asia/Bangkok":"TH", "Asia/Manila":"PH", "Asia/Ho_Chi_Minh":"VN",
      "Asia/Hong_Kong":"HK", "Asia/Taipei":"TW", "Europe/Istanbul":"TR",
      "Europe/Moscow":"RU", "Europe/Kaliningrad":"RU", "Europe/Samara":"RU", "Asia/Yekaterinburg":"RU", "Asia/Omsk":"RU",
      "Asia/Novosibirsk":"RU", "Asia/Krasnoyarsk":"RU", "Asia/Irkutsk":"RU", "Asia/Chita":"RU", "Asia/Yakutsk":"RU",
      "Asia/Khandyga":"RU", "Asia/Vladivostok":"RU", "Asia/Ust-Nera":"RU", "Asia/Magadan":"RU", "Asia/Sakhalin":"RU",
      "Asia/Srednekolymsk":"RU", "Asia/Kamchatka":"RU", "Asia/Anadyr":"RU"
    };
    if (exact[tz] && regions[exact[tz]]) return exact[tz];
    if (tz.startsWith("Australia/") && regions.AU) return "AU";
    if (tz.startsWith("America/Indiana/") || tz.startsWith("America/Kentucky/")) return regions.US ? "US" : "";
    return "";
  }

  function detectRegion() {
    // Privacy-first first-visit inference: prefer the device timezone because it
    // usually follows the visitor's current country even when browser language is en-US.
    const timezoneRegion = detectRegionFromTimezone();
    if (timezoneRegion) return timezoneRegion;

    const langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en-US"]).map(String);
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

  const storedRegion = safeGet(STORAGE_REGION);
  const storedCurrency = safeGet(STORAGE_CURRENCY);
  const hasStoredRegion = !!regions[storedRegion];
  const hasStoredCurrency = !!currencies[storedCurrency];

  // A previously applied region is an explicit user preference and wins over
  // automatic first-visit inference. Currency overrides are only trusted when
  // they belong to a saved region, preventing orphaned storage from creating
  // combinations such as New Zealand + stale USD by accident.
  let regionCode = hasStoredRegion ? storedRegion : detectRegion();
  let currencyCode = hasStoredRegion && hasStoredCurrency ? storedCurrency : regions[regionCode].currency;

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
/* Carrowmont compact footer gateways - RETIRE1 */
(() => {
  'use strict';
  const L = window.CarrowmontLocale;
  if (!L) return;
  function housingLabel(region) {
    if (region === 'IN' || region === 'AU' || region === 'NZ') return 'Home Loan';
    if (region === 'US' || region === 'CA' || region === 'GB' || region === 'IE') return 'Mortgage';
    return 'Mortgage & Home Loan';
  }
  function syncCompactFooter() {
    const region = L.getRegion?.() || 'OTHER';
    const investment = region === 'IN' ? 'SIP Calculator' : 'Recurring Investment Calculator';
    document.querySelectorAll('.site-footer .footer-col').forEach(col => {
      const heading = col.querySelector(':scope > strong');
      if (!heading || heading.textContent.trim() !== 'Tools') return;
      col.dataset.cmCompactTools = '1';
      col.replaceChildren(heading);
      const links = [
        ['/tools.html','All financial tools','footer-all-tools'],
        ['/sip-calculator/',investment,'footer-investment-link'],
        ['/retirement-calculator/','Retirement Planner','footer-retirement-link'],
        ['/mortgage-payoff-calculator/',housingLabel(region),'footer-housing-gateway'],
        ['/budget-cash-flow-planner/','Budget & Cash Flow Planner','footer-budget-link']
      ];
      links.forEach(([href,label,className]) => {
        const a=document.createElement('a');a.href=href;a.textContent=label;a.className=className;
        col.appendChild(a);
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncCompactFooter, { once:true });
  else syncCompactFooter();
  window.addEventListener('carrowmont:localechange', syncCompactFooter);
  window.CarrowmontCompactFooter = { sync: syncCompactFooter };
})();

