(() => {
  'use strict';

  const COMPOUNDING = Object.freeze({
    annual: 1,
    semiannual: 2,
    quarterly: 4,
    monthly: 12,
    daily: 365
  });

  const CONTRIBUTION_FREQUENCIES = Object.freeze({
    weekly: 52,
    biweekly: 26,
    semimonthly: 24,
    fourweekly: 13,
    monthly: 12,
    quarterly: 4,
    annual: 1
  });

  const LIMITS = Object.freeze({
    principal: [0, 1_000_000_000],
    annualRate: [-20, 50],
    years: [1, 60],
    contribution: [0, 100_000_000],
    inflation: [0, 30]
  });

  const finite = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function normalize(input = {}) {
    const compoundingKey = COMPOUNDING[input.compounding] ? input.compounding : 'monthly';
    const contributionFrequency = CONTRIBUTION_FREQUENCIES[input.contributionFrequency] ? input.contributionFrequency : 'monthly';
    const timing = input.contributionTiming === 'beginning' ? 'beginning' : 'end';
    return {
      principal: finite(input.principal),
      annualRate: finite(input.annualRate),
      years: finite(input.years),
      compounding: compoundingKey,
      contributionEnabled: Boolean(input.contributionEnabled),
      contribution: finite(input.contribution),
      contributionFrequency,
      contributionTiming: timing,
      inflationEnabled: Boolean(input.inflationEnabled),
      inflation: finite(input.inflation)
    };
  }

  function validate(raw) {
    const s = normalize(raw);
    const errors = [];
    const inRange = (name, value, range, label) => {
      if (value < range[0] || value > range[1]) errors.push(`${label} must be between ${range[0]} and ${range[1]}.`);
    };
    inRange('principal', s.principal, LIMITS.principal, 'Starting amount');
    inRange('annualRate', s.annualRate, LIMITS.annualRate, 'Annual rate');
    inRange('years', s.years, LIMITS.years, 'Time horizon');
    if (!Number.isInteger(s.years)) errors.push('Time horizon must be a whole number of years in this version.');
    if (s.contributionEnabled) inRange('contribution', s.contribution, LIMITS.contribution, 'Regular contribution');
    if (s.inflationEnabled) inRange('inflation', s.inflation, LIMITS.inflation, 'Inflation rate');
    const n = COMPOUNDING[s.compounding];
    const j = s.annualRate / 100;
    if (1 + j / n <= 0) errors.push('The annual rate is too low for the selected compounding frequency.');
    return { state: s, valid: errors.length === 0, errors };
  }

  function effectiveAnnualRate(annualRatePct, periodsPerYear) {
    const j = annualRatePct / 100;
    return Math.pow(1 + j / periodsPerYear, periodsPerYear) - 1;
  }

  function contributionFutureValue(amount, periodsPerYear, years, ear, timing = 'end') {
    if (!(amount > 0)) return 0;
    const totalPeriods = periodsPerYear * years;
    const g = Math.pow(1 + ear, 1 / periodsPerYear) - 1;
    let fv;
    if (Math.abs(g) < 1e-12) fv = amount * totalPeriods;
    else fv = amount * ((Math.pow(1 + g, totalPeriods) - 1) / g);
    if (timing === 'beginning') fv *= (1 + g);
    return fv;
  }

  function simpleContributionFutureValue(amount, periodsPerYear, years, annualRateDecimal, timing = 'end') {
    if (!(amount > 0)) return 0;
    const N = periodsPerYear * years;
    let total = 0;
    if (timing === 'beginning') {
      for (let k = 0; k < N; k += 1) {
        const remainingYears = years - (k / periodsPerYear);
        total += amount * (1 + annualRateDecimal * remainingYears);
      }
    } else {
      for (let k = 1; k <= N; k += 1) {
        const remainingYears = years - (k / periodsPerYear);
        total += amount * (1 + annualRateDecimal * remainingYears);
      }
    }
    return total;
  }

  function valuesAtYears(s, years) {
    const n = COMPOUNDING[s.compounding];
    const m = CONTRIBUTION_FREQUENCIES[s.contributionFrequency];
    const j = s.annualRate / 100;
    const ear = effectiveAnnualRate(s.annualRate, n);
    const principalValue = s.principal * Math.pow(1 + j / n, n * years);
    const contributionValue = s.contributionEnabled
      ? contributionFutureValue(s.contribution, m, years, ear, s.contributionTiming)
      : 0;
    const recurringContributed = s.contributionEnabled ? s.contribution * m * years : 0;
    const totalContributed = s.principal + recurringContributed;
    const endingValue = principalValue + contributionValue;
    const growth = endingValue - totalContributed;
    const realValue = s.inflationEnabled
      ? endingValue / Math.pow(1 + s.inflation / 100, years)
      : null;
    return { year: years, principalValue, contributionValue, recurringContributed, totalContributed, endingValue, growth, realValue };
  }

  function annualSeries(s) {
    const rows = [];
    for (let y = 0; y <= s.years; y += 1) rows.push(valuesAtYears(s, y));
    return rows;
  }

  function calculate(raw) {
    const check = validate(raw);
    if (!check.valid) return { ok: false, errors: check.errors, state: check.state };
    const s = check.state;
    const n = COMPOUNDING[s.compounding];
    const m = CONTRIBUTION_FREQUENCIES[s.contributionFrequency];
    const j = s.annualRate / 100;
    const ear = effectiveAnnualRate(s.annualRate, n);
    const end = valuesAtYears(s, s.years);
    const simplePrincipal = s.principal * (1 + j * s.years);
    const simpleContrib = s.contributionEnabled
      ? simpleContributionFutureValue(s.contribution, m, s.years, j, s.contributionTiming)
      : 0;
    const simpleEndingValue = simplePrincipal + simpleContrib;
    const series = annualSeries(s);
    return {
      ok: true,
      state: s,
      compoundingPeriods: n,
      contributionPeriods: m,
      effectiveAnnualRate: ear,
      endingValue: end.endingValue,
      startingPrincipal: s.principal,
      recurringContributed: end.recurringContributed,
      totalContributed: end.totalContributed,
      growth: end.growth,
      simpleEndingValue,
      compoundVsSimpleDifference: end.endingValue - simpleEndingValue,
      realEndingValue: end.realValue,
      series
    };
  }

  window.CarrowmontCompoundCore = {
    COMPOUNDING,
    CONTRIBUTION_FREQUENCIES,
    LIMITS,
    normalize,
    validate,
    effectiveAnnualRate,
    contributionFutureValue,
    simpleContributionFutureValue,
    valuesAtYears,
    annualSeries,
    calculate,
    clamp
  };
})();
