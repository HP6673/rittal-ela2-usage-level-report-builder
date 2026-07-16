"use client";

import { useMemo, useState } from "react";

type Inputs = {
  projectsPerYear: number;
  pagesPerProject: number;
  engineeringTimeShare: number;
  panelsPerYear: number;
  productionTimeShare: number;
  engineeringFte: number;
  engineeringRate: number;
  productionFte: number;
  productionRate: number;
  etoCurrent: number;
  etoFuture: number;
  workingHoursPerDay: number;
  workingDaysPerYear: number;
  currency: string;
};

const defaults: Inputs = {
  projectsPerYear: 0,
  pagesPerProject: 0,
  engineeringTimeShare: 0,
  panelsPerYear: 0,
  productionTimeShare: 0,
  engineeringFte: 0,
  engineeringRate: 0,
  productionFte: 0,
  productionRate: 0,
  etoCurrent: 0,
  etoFuture: 0,
  workingHoursPerDay: 0,
  workingDaysPerYear: 0,
  currency: "$",
};

const engineeringCurrentLevel = 2.1458333333333335;
const engineeringTargetLevel = 3.68;
const productionCurrentLevel = 1.25;
const productionTargetLevel = 3.5;

const avg = (...values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const baseLevelLabels = [
  "1",
  "1.5",
  "2",
  "2.5",
  "3",
  "3.5",
  "4",
  "4.5",
  "5",
];

const yAxisTicks = [1, 0.75, 0.5, 0.25, 0];

function interpolate(level: number, values: number[]) {
  const clamped = Math.max(1, Math.min(5, level));
  const lowerIndex = Math.floor((clamped - 1) * 2);
  const upperIndex = Math.min(values.length - 1, lowerIndex + 1);
  const lowerLevel = 1 + lowerIndex * 0.5;
  const span = 0.5;
  const ratio = (clamped - lowerLevel) / span;

  return values[lowerIndex] + (values[upperIndex] - values[lowerIndex]) * ratio;
}

function buildCalc2Lookup(baseValues: number[]) {
  const denseValues: number[] = [];

  for (let index = 0; index < baseValues.length - 1; index += 1) {
    const end = baseValues[index + 1];
    let current = baseValues[index];

    denseValues.push(current);

    for (let step = 1; step <= 4; step += 1) {
      current = (current + end) / 2;
      denseValues.push(current);
    }
  }

  denseValues.push(baseValues[baseValues.length - 1]);
  return denseValues;
}

function hlookupApprox(level: number, denseValues: number[]) {
  const clamped = Math.max(1, Math.min(5, level));
  const lookupLevel = Math.floor((clamped + 0.0000001) * 10) / 10;
  const index = Math.round((lookupLevel - 1) * 10);

  return denseValues[Math.max(0, Math.min(denseValues.length - 1, index))];
}

function engineeringChartData(input: Inputs) {
  const k5 = 0.05;
  const k6 = 0.03;
  const k9 = 0.05;
  const k10 = 0.05;
  const k11 = 0.05;
  const k12 = 0.05;
  const k7 = (1 - (k5 + k6 + k9 + k10 + k11 + k12)) * input.etoCurrent * 0.75;
  const s7 =
    input.etoCurrent === 0 ? 0 : k7 * (input.etoFuture / input.etoCurrent);
  const o7 = k7;
  const q7 = avg(o7, s7);

  const k8 = 1 - (k5 + k6 + k7 + k9 + k10 + k11 + k12);
  const l8 = k8 * 0.9;
  const m8 = l8 * 0.8;
  const o8 = m8 * 0.5;
  const q8 = o8 * 0.4;
  const s8 = q8 * 0.2;

  const rows = [
    [k5, k5, k5, k5, k5, k5, k5, avg(k5, k5 * 0.8), k5 * 0.8],
    [k6, k6, k6, k6, k6, k6, k6, avg(k6, k6 * 0.8), k6 * 0.8],
    [k7, k7, k7, k7, o7, avg(o7, q7), q7, avg(q7, s7), s7],
    [k8, l8, m8, avg(m8, o8), o8, avg(o8, q8), q8, avg(q8, s8), s8],
    [k9, avg(k9, k9 * 0.5), k9 * 0.5, avg(k9 * 0.5, k9 * 0.3), k9 * 0.3, k9 * 0.3, k9 * 0.3, k9 * 0.3, k9 * 0.3],
    [k10, avg(k10, k10 * 0.5), k10 * 0.5, avg(k10 * 0.5, 0), 0, 0, 0, 0, 0],
    [k11, avg(k11, k11 * 0.5), k11 * 0.5, avg(k11 * 0.5, k11 * 0.25), k11 * 0.25, avg(k11 * 0.25, 0), 0, 0, 0],
    [k12, k12, k12, avg(k12, k12 * 0.5), k12 * 0.5, avg(k12 * 0.5, k12 * 0.4), k12 * 0.4, avg(k12 * 0.4, k12 * 0.32), k12 * 0.32],
  ];

  const sum1 = rows[0].map((_, index) =>
    rows.reduce((sum, row) => sum + row[index], 0),
  );
  const sum2 = [0, 0.03, 0.04, 0.05, 0.07, 0.07, 0.08, 0.09, 0.1];
  const totalBase = sum1.map((value, index) => value + sum2[index]);
  const denseEngineering = buildCalc2Lookup(sum1);
  const denseStandardization = buildCalc2Lookup(sum2);
  const denseTotal = buildCalc2Lookup(totalBase);
  const standardization = [
    ...sum2,
    hlookupApprox(engineeringCurrentLevel, denseStandardization),
    hlookupApprox(engineeringTargetLevel, denseStandardization),
  ];
  const engineering = [
    ...sum1,
    hlookupApprox(engineeringCurrentLevel, denseEngineering),
    hlookupApprox(engineeringTargetLevel, denseEngineering),
  ];
  const total = engineering.map((value, index) => value + standardization[index]);

  return {
    labels: [
      ...baseLevelLabels,
      number(engineeringCurrentLevel, 2),
      number(engineeringTargetLevel, 2),
    ],
    primaryLabel: "Engineering",
    secondaryLabel: "Standardization",
    primary: engineering,
    secondary: standardization,
    total,
    denseTotal,
  };
}

function engineeringEfficiencyValues(input: Inputs) {
  return engineeringChartData(input).denseTotal;
}

function productionChartData(input: Inputs) {
  const staticRows = [
    [0.018, 0.01575, 0.0135, 0.01125, 0.009, 0.009, 0.009, 0.009, 0.009],
    [0.092, 0.087, 0.082, 0.077, 0.072, 0.0435, 0.015, 0.015, 0.015],
    [0.12, 0.105, 0.09, 0.075, 0.06, 0.06, 0.06, 0.06, 0.06],
    [0.225, 0.2025, 0.18, 0.1575, 0.135, 0.111, 0.087, 0.039, 0.039],
    [0.026, 0.02425, 0.0225, 0.02075, 0.019, 0.01675, 0.0145, 0.01225, 0.01],
    [0.022, 0.0215, 0.021, 0.0205, 0.02, 0.02, 0.02, 0.02, 0.02],
    [0.135, 0.12075, 0.1065, 0.09225, 0.078, 0.078, 0.078, 0.0485, 0.019],
    [0.272, 0.26525, 0.2585, 0.25175, 0.245, 0.24125, 0.2375, 0.23375, 0.23],
    [0.072, 0.07025, 0.0685, 0.06675, 0.065, 0.06375, 0.0625, 0.06125, 0.06],
    [0.018, 0.018, 0.018, 0.018, 0.018, 0.018, 0.018, 0.018, 0.018],
  ];
  const rateRatio =
    input.productionRate === 0 ? 0 : input.engineeringRate / input.productionRate;
  const article3d = [
    0,
    0.02 * rateRatio,
    0.02 * rateRatio,
    avg(0.02 * rateRatio, 0.03 * rateRatio),
    0.03 * rateRatio,
    0.03 * rateRatio,
    0.03 * rateRatio,
    0.03 * rateRatio,
    0.03 * rateRatio,
  ];
  const cabinetDesign = [
    0,
    0,
    0.005 * rateRatio,
    avg(0.005 * rateRatio, 0.02 * rateRatio),
    0.02 * rateRatio,
    avg(0.02 * rateRatio, 0.03 * rateRatio),
    0.03 * rateRatio,
    avg(0.03 * rateRatio, 0.035 * rateRatio),
    0.035 * rateRatio,
  ];
  const rows = [...staticRows, article3d, cabinetDesign];

  const production = staticRows[0].map((_, index) =>
    staticRows.reduce((sum, row) => sum + row[index], 0),
  );
  const standardization = article3d.map((value, index) => value + cabinetDesign[index]);
  const totalLevelValues = production.map(
    (value, index) => value + standardization[index],
  );
  const denseProduction = buildCalc2Lookup(production);
  const denseStandardization = buildCalc2Lookup(standardization);
  const denseTotal = buildCalc2Lookup(totalLevelValues);
  const productionWithMarkers = [
    ...production,
    hlookupApprox(productionCurrentLevel, denseProduction),
    hlookupApprox(productionTargetLevel, denseProduction),
  ];
  const standardizationWithMarkers = [
    ...standardization,
    hlookupApprox(productionCurrentLevel, denseStandardization),
    hlookupApprox(productionTargetLevel, denseStandardization),
  ];

  return {
    labels: [
      ...baseLevelLabels,
      number(productionCurrentLevel, 2),
      number(productionTargetLevel, 2),
    ],
    primaryLabel: "Production",
    secondaryLabel: "Standardization",
    primary: productionWithMarkers,
    secondary: standardizationWithMarkers,
    total: productionWithMarkers.map(
      (value, index) => value + standardizationWithMarkers[index],
    ),
    denseTotal,
  };
}

function productionEfficiencyValues(input: Inputs) {
  return productionChartData(input).denseTotal;
}

function calculate(input: Inputs) {
  const totalPages = input.projectsPerYear * input.pagesPerProject;
  const engineeringHours =
    input.workingDaysPerYear *
    input.workingHoursPerDay *
    input.engineeringFte *
    input.engineeringTimeShare;
  const engineeringCost = engineeringHours * input.engineeringRate;
  const productionHours =
    input.workingHoursPerDay *
    input.workingDaysPerYear *
    input.productionFte *
    input.productionTimeShare;
  const productionCost = productionHours * input.productionRate;

  const engineeringValues = engineeringEfficiencyValues(input);
  const productionValues = productionEfficiencyValues(input);
  const engineeringAsIsRatio = hlookupApprox(engineeringCurrentLevel, engineeringValues);
  const engineeringTargetRatio = hlookupApprox(engineeringTargetLevel, engineeringValues);
  const productionAsIsRatio = hlookupApprox(productionCurrentLevel, productionValues);
  const productionTargetRatio = hlookupApprox(productionTargetLevel, productionValues);
  const engineeringDifference = engineeringAsIsRatio - engineeringTargetRatio;
  const productionDifference = productionAsIsRatio - productionTargetRatio;

  return {
    totalPages,
    engineeringHours,
    engineeringCost,
    timePerPage: totalPages ? engineeringHours / totalPages : 0,
    engineeringSavings10: engineeringCost * 0.1,
    engineeringSavings20: engineeringCost * 0.2,
    engineeringSavings30: engineeringCost * 0.3,
    engineeringAsIsRatio,
    engineeringTargetRatio,
    engineeringDifference,
    engineeringSavingPotential: engineeringCost * engineeringDifference,
    totalPanels: input.panelsPerYear,
    productionHours,
    productionCost,
    timePerPanel: input.panelsPerYear ? productionHours / input.panelsPerYear : 0,
    productionSavings10: productionCost * 0.1,
    productionSavings20: productionCost * 0.2,
    productionSavings30: productionCost * 0.3,
    productionAsIsRatio,
    productionTargetRatio,
    productionDifference,
    productionSavingPotential: productionCost * productionDifference,
  };
}

function money(value: number, currency: string) {
  return `${currency}${Math.round(value).toLocaleString()}`;
}

function number(value: number, digits = 2) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function normalizeNumericInput(value: string) {
  if (value === "") {
    return 0;
  }

  const normalized = value
    .replace(/^0+(?=\d)/, "")
    .replace(/^(-?)0+(?=\d)/, "$1");

  return Number(normalized);
}

function formatFaqAnswer(answer: string) {
  const answerWithoutNumber = answer.replace(/^\d+\.\s*/, "").trim();
  return /[.!?]$/.test(answerWithoutNumber)
    ? answerWithoutNumber
    : `${answerWithoutNumber}.`;
}

const percentFields: Array<keyof Inputs> = [
  "engineeringTimeShare",
  "productionTimeShare",
  "etoCurrent",
  "etoFuture",
];

const questionnaireFaq = [
  {
    section: "Engineering Level Assessment",
    items: [
      ["Order specifications", "How does the customer and order data reach the design department?", "1. Order data and requirements are transferred unstructured and mainly in paper. Supported by various meetings."],
      ["Order specifications", "How is the order data and requirements handled in the design department?", "1. The storage of order data and requirements is mainly digital but not reusable."],
      ["Order specifications", "Does the order data transferred to the design department contains a sensor-actuator lists?", "3. The design department receives preliminairy sensor-actuator list."],
      ["Delivery specifications", "Applicable norms and standards", "3. Templates and structures take into account the some variance in requirements."],
      ["Delivery specifications", "Used languages and translation", "1. Changes in requirements are processed manual."],
      ["Delivery specifications", "Parts selection and standardisations", "3. Templates and structures take into account the some variance in requirements."],
      ["Delivery specifications", "Documentation (Source target specification,...)", "3. Templates and structures take into account the some variance in requirements."],
      ["Engineering", "How are new technical solutions (ETO) developed?", "3. New technical solutions are designed in a digital process."],
      ["Design", "How are circuit diagrams created?", "1. The circuit diagrams are created manually by placing graphical symbols or partial circuits."],
      ["Check", "How are circuit diagrams verified after creation?", "1. The verification of the schematics is done manually by reviewing all schematics pages."],
      ["BOM", "Up to which level does the circuit diagram contain article information?", "3. The circuit diagram contains some article information (main parts) and is extended manually in parallel parts lists."],
      ["BOM", "How is the bills of materials created and processed?", "3. The BOM is created automatically from CAE and manually processed and transfered to the ERP system."],
      ["Reports", "How complete is the electrical documentation for production?", "3. Terminal diagrams, assembly diagrams etc. are prepared for production."],
      ["Reports", "How is the production documentation generated?", "3. The production documentation is created partially automated by means of forms and templates."],
      ["Cabinet design", "Which drawing & design method is used to create cabinet design and layout?", "3. The cabinet design is carried out graphically in 2D based on article information."],
      ["Cabinet design", "In which detail and quality level does the customer create cabinet layout drawings?", "1. The cabinet design contains only the dimensions (construction plan)."],
    ],
  },
  {
    section: "Panel Production Level Assessment",
    items: [
      ["Kitting", "How do you structure your bill of materials?", "2. BOM manual created"],
      ["Panel Modification", "How are holes and cutouts made to the doors and mounting panels?", "1. Manual drilling and cutting according to each worker's own judgement"],
      ["Labeling devices", "How do you create and apply the component labels?", "1. Labels are typed in manually from the schematic and printed out"],
      ["Wire fabrication", "How do you fabricate the wires for your control panels?", "1. Manual fabrication during wiring"],
      ["Mechanical installation", "Which method do you use to cut mounting rails, wire ducts and wire duct covers?", "1. Manual measuring and cutting according to each worker's own judgement"],
      ["Devices installation", "What documents do you use in the manufacturing process?", "2. between 1 and 3"],
      ["Terminal strip assembly", "How do you assemble your terminal strips?", "1. Terminals are manually identified, placed and labeled base on the schematic"],
      ["Wiring", "What documents do you use for the wiring process?", "1. Schematic diagrams"],
    ],
  },
] as const;

export function Calculator() {
  const [input, setInput] = useState<Inputs>(defaults);
  const report = useMemo(() => calculate(input), [input]);
  const engineeringChart = useMemo(() => engineeringChartData(input), [input]);
  const productionChart = useMemo(() => productionChartData(input), [input]);
  const totalSaving =
    report.engineeringSavingPotential + report.productionSavingPotential;

  function updateNumber(key: keyof Inputs, value: string) {
    const nextValue = normalizeNumericInput(value);

    setInput((current) => ({
      ...current,
      [key]: Number.isFinite(nextValue)
        ? percentFields.includes(key)
          ? nextValue / 100
          : nextValue
        : current[key],
    }));
  }

  function displayValue(key: keyof Inputs) {
    const value = input[key];

    if (typeof value === "number" && percentFields.includes(key)) {
      return String(value * 100);
    }

    return String(value);
  }

  const inputClass =
    "h-11 rounded border border-[#cbd5e1] bg-white px-3 text-base shadow-inner outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]";

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#1b1f24]">
      <section className="border-b border-[#dfe3e8] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-4">
              <img
                alt="Rittal"
                className="h-16 w-44 rounded bg-white object-cover object-center shadow-[0_8px_18px_rgba(15,23,42,0.12)]"
                src="/rittal-logo.png"
              />
              <h1 className="text-3xl font-semibold tracking-normal text-[#111827] sm:text-4xl">
                ELA2 Usage Level Report Builder
              </h1>
            </div>
            <div className="rounded-md border border-[#e0e4e8] bg-[#fafafa] px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#68707c]">
                Total saving potential
              </p>
              <p className="mt-1 text-3xl font-semibold text-[#111827]">
                {money(totalSaving, input.currency)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-md border border-[#dde2e7] bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#313842]">
              Company profile
            </h2>
            <div className="mt-4 grid gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                  Engineering status
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="ETO rate current"
                    suffix="%"
                    value={displayValue("etoCurrent")}
                    onChange={(value) => updateNumber("etoCurrent", value)}
                  />
                  <Field
                    label="ETO rate future"
                    suffix="%"
                    value={displayValue("etoFuture")}
                    onChange={(value) => updateNumber("etoFuture", value)}
                  />
                </div>
                <div className="mt-3 grid gap-2 rounded bg-[#f8fafc] p-3 text-sm text-[#4d5662]">
                  <p>CTO current: {number((1 - input.etoCurrent) * 100, 0)}%</p>
                  <p>CTO future: {number((1 - input.etoFuture) * 100, 0)}%</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                  General
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Working hours / day"
                    value={displayValue("workingHoursPerDay")}
                    onChange={(value) => updateNumber("workingHoursPerDay", value)}
                  />
                  <Field
                    label="Working days / year"
                    value={displayValue("workingDaysPerYear")}
                    onChange={(value) => updateNumber("workingDaysPerYear", value)}
                  />
                </div>
              </div>

              <label className="grid gap-1">
                <span className="text-sm font-medium text-[#4d5662]">
                  Currency
                </span>
                <input
                  className={inputClass}
                  maxLength={4}
                  value={input.currency}
                  onChange={(event) =>
                    setInput((current) => ({
                      ...current,
                      currency: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </div>

          <div className="rounded-md border border-[#dde2e7] bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#313842]">
              FTE profile
            </h2>
            <div className="mt-4 grid gap-3">
              <Field
                label="Engineering electrical FTE"
                value={displayValue("engineeringFte")}
                onChange={(value) => updateNumber("engineeringFte", value)}
              />
              <Field
                label="Engineering hourly rate"
                value={displayValue("engineeringRate")}
                onChange={(value) => updateNumber("engineeringRate", value)}
              />
              <Field
                label="Panel production FTE"
                value={displayValue("productionFte")}
                onChange={(value) => updateNumber("productionFte", value)}
              />
              <Field
                label="Production hourly rate"
                value={displayValue("productionRate")}
                onChange={(value) => updateNumber("productionRate", value)}
              />
            </div>
          </div>

          <div className="rounded-md border border-[#dde2e7] bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#313842]">
              Business output
            </h2>
            <div className="mt-4 grid gap-3">
              <Field
                label="Projects / year"
                value={displayValue("projectsPerYear")}
                onChange={(value) => updateNumber("projectsPerYear", value)}
              />
              <Field
                label="Pages / project"
                value={displayValue("pagesPerProject")}
                onChange={(value) => updateNumber("pagesPerProject", value)}
              />
              <Field
                label="Time share engineering"
                suffix="%"
                value={displayValue("engineeringTimeShare")}
                onChange={(value) => updateNumber("engineeringTimeShare", value)}
              />
              <Field
                label="Panels / year"
                value={displayValue("panelsPerYear")}
                onChange={(value) => updateNumber("panelsPerYear", value)}
              />
              <Field
                label="Time share production"
                suffix="%"
                value={displayValue("productionTimeShare")}
                onChange={(value) => updateNumber("productionTimeShare", value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8">
        <div className="grid gap-5 xl:grid-cols-[1fr_1fr_0.7fr]">
          <ReportPanel
            title="Engineering Level Assessment"
            rows={[
              ["Total pages per year", report.totalPages.toLocaleString()],
              ["Engineering hours per year", number(report.engineeringHours, 0)],
              ["Engineering costs per year", money(report.engineeringCost, input.currency)],
              ["Time per page", `${number(report.timePerPage, 3)} h`],
              ["Saving potential ratio 10%", money(report.engineeringSavings10, input.currency)],
              ["Saving potential ratio 20%", money(report.engineeringSavings20, input.currency)],
              ["Saving potential ratio 30%", money(report.engineeringSavings30, input.currency)],
            ]}
          />
          <ReportPanel
            title="Panel Production Level Assessment"
            rows={[
              ["Total panels per year", report.totalPanels.toLocaleString()],
              ["Production hours per year", number(report.productionHours, 0)],
              ["Production costs per year", money(report.productionCost, input.currency)],
              ["Time per panel", `${number(report.timePerPanel, 3)} h`],
              ["Saving potential ratio 10%", money(report.productionSavings10, input.currency)],
              ["Saving potential ratio 20%", money(report.productionSavings20, input.currency)],
              ["Saving potential ratio 30%", money(report.productionSavings30, input.currency)],
            ]}
          />
          <div className="rounded-md border border-[#1f2937] bg-[#111827] p-5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#cbd5e1]">
              Total
            </p>
            <p className="mt-2 text-4xl font-semibold">
              {money(totalSaving, input.currency)}
            </p>
            <p className="mt-3 text-sm text-[#d8dee8]">
              Engineering and production saving potential combined.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <WorkbookChart title="Engineering time [%]" data={engineeringChart} />
          <WorkbookChart title="Production time [%]" data={productionChart} />
        </div>

        <div className="mt-5 overflow-hidden rounded-md border border-[#d6dce3] bg-white shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
          <div className="grid bg-[#28323f] text-sm font-semibold text-white md:grid-cols-2">
            <div className="border-b border-white/20 p-4 md:border-b-0 md:border-r">
              Result
            </div>
            <div className="p-4">Efficiency Detail</div>
          </div>
          <div className="grid md:grid-cols-2">
            <EfficiencyTable
              title="Engineering"
              rows={[
                ["As Is Efficiency Level", number(engineeringCurrentLevel, 2), number(report.engineeringAsIsRatio, 3)],
                ["Target Efficiency Level", number(engineeringTargetLevel, 2), number(report.engineeringTargetRatio, 3)],
                ["Difference", "", number(report.engineeringDifference, 3)],
                ["Saving potential engineering", money(report.engineeringSavingPotential, input.currency), ""],
              ]}
            />
            <EfficiencyTable
              title="Panel production"
              rows={[
                ["As Is Efficiency Level", number(productionCurrentLevel, 2), number(report.productionAsIsRatio, 3)],
                ["Target Efficiency Level", number(productionTargetLevel, 2), number(report.productionTargetRatio, 3)],
                ["Difference", "", number(report.productionDifference, 3)],
                ["Saving potential production", money(report.productionSavingPotential, input.currency), ""],
              ]}
            />
          </div>
        </div>

        <ReportPageTable report={report} currency={input.currency} />

        <div className="mt-5 grid gap-3 rounded-md border border-[#d6dce3] bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)] md:grid-cols-5">
          {[
            ["1", "Basic - AutoCAD LT"],
            ["2", "Enhanced - ACE"],
            ["3", "Advanced - EPLAN"],
            ["4", "Automation - EPLAN eBuild"],
            ["5", "Configuration - EEC"],
          ].map(([level, label]) => (
            <div
              className="rounded border border-[#e2e8f0] bg-white p-3 shadow-[0_8px_18px_rgba(15,23,42,0.05)]"
              key={level}
            >
              <p className="text-2xl font-semibold text-[#111827]">{level}</p>
              <p className="mt-1 text-sm text-[#56606c]">{label}</p>
            </div>
          ))}
        </div>

        <QuestionnaireFaq />
      </section>
    </main>
  );
}

function Field({
  label,
  onChange,
  suffix,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  suffix?: string;
  value: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-[#4d5662]">{label}</span>
      <span className="relative block">
        <input
          className={`h-11 w-full rounded border border-[#cbd5e1] bg-white px-3 text-base shadow-inner outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe] ${
            suffix ? "pr-9" : ""
          }`}
          inputMode="decimal"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-[#64748b]">
            {suffix}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function ReportPanel({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="overflow-hidden rounded-md border border-[#d6dce3] bg-white shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
      <h2 className="bg-[#eef2f6] px-4 py-3 text-base font-semibold text-[#111827]">
        {title}
      </h2>
      <div className="divide-y divide-[#edf0f3]">
        {rows.map(([label, value]) => (
          <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3" key={label}>
            <span className="text-sm text-[#52606d]">{label}</span>
            <span className="text-sm font-semibold text-[#111827]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionnaireFaq() {
  return (
    <section className="mt-5 rounded-md border border-[#d6dce3] bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
      <h2 className="text-xl font-semibold text-[#111827]">
        FAQ
      </h2>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {questionnaireFaq.map((group) => (
          <div key={group.section}>
            <h3 className="rounded bg-[#28323f] px-4 py-3 text-sm font-semibold text-white">
              {group.section}
            </h3>
            <div className="mt-3 grid gap-2">
              {group.items.map(([, question, answer]) => (
                <details
                  className="rounded border border-[#d6dce3] bg-[#fbfcfe] p-3"
                  key={question}
                >
                  <summary className="cursor-pointer text-sm font-semibold text-[#111827]">
                    {question}
                  </summary>
                  <p className="mt-2 text-sm leading-6 text-[#4d5662]">
                    {formatFaqAnswer(answer)}
                  </p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EfficiencyTable({
  title,
  rows,
}: {
  title: string;
  rows: [string, string, string][];
}) {
  return (
    <div className="border-t border-[#d6dce3] md:border-r md:border-t-0">
      <h3 className="border-b border-[#d6dce3] bg-[#f8fafc] px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#313842]">
        {title}
      </h3>
      <div className="divide-y divide-[#edf0f3]">
        {rows.map(([label, value, ratio]) => (
          <div className="grid grid-cols-[1fr_90px_90px] gap-3 px-4 py-3" key={label}>
            <span className="text-sm text-[#52606d]">{label}</span>
            <span className="text-right text-sm font-semibold text-[#111827]">
              {value}
            </span>
            <span className="text-right text-sm font-semibold text-[#111827]">
              {ratio}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkbookChart({
  title,
  data,
}: {
  title: string;
  data: {
    labels: string[];
    primaryLabel: string;
    secondaryLabel: string;
    primary: number[];
    secondary: number[];
    total: number[];
    denseTotal: number[];
  };
}) {
  const [tooltip, setTooltip] = useState<{
    label: string;
    primary: number;
    secondary: number;
    total: number;
    x: number;
    y: number;
  } | null>(null);
  const max = Math.max(...data.total, 1);

  return (
    <div
      className="rounded-md border border-[#d6dce3] bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)]"
      onMouseLeave={() => setTooltip(null)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#111827]">{title}</h2>
        <div className="flex items-center gap-4 text-xs font-medium text-[#52606d]">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-[#2563eb]" />
            {data.primaryLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-[#f59e0b]" />
            {data.secondaryLabel}
          </span>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-[42px_1fr] gap-3">
        <div className="relative h-72">
          {yAxisTicks.map((tick) => (
            <span
              className="absolute right-0 translate-y-1/2 text-xs tabular-nums text-[#52606d]"
              key={tick}
              style={{ bottom: `${tick * 100}%` }}
            >
              {Math.round(tick * 100)}%
            </span>
          ))}
        </div>
        <div className="h-72 overflow-x-auto overflow-y-visible">
          <div className="relative h-full min-w-[680px] border-l border-b border-[#d7dde5] px-3 pb-8">
            {yAxisTicks.map((tick) => (
              <span
                className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-[#e2e8f0]"
                key={tick}
                style={{ bottom: `calc(${tick * 100}% + 2rem)` }}
              />
            ))}
            <div className="relative z-10 flex h-full items-end gap-3">
              {data.labels.map((label, index) => {
                const total = data.total[index];
                const barHeight = (total / max) * 100;
                const primaryHeight =
                  total === 0 ? 0 : (data.primary[index] / total) * 100;
                const secondaryHeight =
                  total === 0 ? 0 : (data.secondary[index] / total) * 100;

                return (
                  <div
                    className="relative flex h-full flex-1 flex-col justify-end"
                    key={label}
                    onMouseMove={(event) =>
                      setTooltip({
                        label,
                        primary: data.primary[index],
                        secondary: data.secondary[index],
                        total,
                        x: event.clientX,
                        y: event.clientY,
                      })
                    }
                  >
                    <div className="flex h-[88%] items-end">
                      <div
                        className="mx-auto flex w-full max-w-9 flex-col justify-end overflow-hidden rounded-t-sm bg-[#e5e7eb]"
                        style={{ height: `${barHeight}%` }}
                      >
                        <div
                          className="bg-[#f59e0b]"
                          style={{ height: `${secondaryHeight}%` }}
                        />
                        <div
                          className="bg-[#2563eb]"
                          style={{ height: `${primaryHeight}%` }}
                        />
                      </div>
                    </div>
                    <span className="absolute -bottom-7 left-1/2 w-12 -translate-x-1/2 text-center text-xs text-[#52606d]">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {tooltip ? (
        <div
          className="fixed z-[9999] min-w-56 rounded-md border border-[#111827] bg-white p-3 text-sm shadow-[0_20px_55px_rgba(15,23,42,0.28)]"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, calc(-100% - 16px))",
          }}
        >
          <p className="font-semibold text-[#111827]">Level {tooltip.label}</p>
          <div className="mt-2 grid gap-1 text-[#4d5662]">
            <p>
              {data.primaryLabel}:{" "}
              <span className="font-semibold text-[#111827]">
                {number(tooltip.primary * 100, 1)}%
              </span>
            </p>
            <p>
              {data.secondaryLabel}:{" "}
              <span className="font-semibold text-[#111827]">
                {number(tooltip.secondary * 100, 1)}%
              </span>
            </p>
            <p>
              Total:{" "}
              <span className="font-semibold text-[#111827]">
                {number(tooltip.total * 100, 1)}%
              </span>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReportPageTable({
  report,
  currency,
}: {
  report: ReturnType<typeof calculate>;
  currency: string;
}) {
  return (
    <div className="mt-5 rounded-md border border-[#d6dce3] bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#52606d]">
          Report tab information
        </p>
        <h2 className="mt-1 text-xl font-semibold text-[#111827]">
          Complete Report Page
        </h2>
      </div>

      <div className="mt-5 overflow-auto rounded border border-[#d6dce3]">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#52606d]">
            <tr>
              <th className="border-r border-[#d6dce3] px-3 py-3">Engineering Level Assessment</th>
              <th className="border-r border-[#d6dce3] px-3 py-3">Value</th>
              <th className="border-r border-[#d6dce3] px-3 py-3">Panel Production Level Assessment</th>
              <th className="border-r border-[#d6dce3] px-3 py-3">Value</th>
              <th className="px-3 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "Total pages per year",
                report.totalPages.toLocaleString(),
                "Total panels per year",
                report.totalPanels.toLocaleString(),
                "",
              ],
              [
                "Engineering hours per year",
                number(report.engineeringHours, 0),
                "Production hours per year",
                number(report.productionHours, 0),
                "",
              ],
              [
                "Engineering costs per year",
                money(report.engineeringCost, currency),
                "Production costs per year",
                money(report.productionCost, currency),
                "",
              ],
              [
                "Time per page",
                `${number(report.timePerPage, 3)} h`,
                "Time per panel",
                `${number(report.timePerPanel, 3)} h`,
                "",
              ],
              [
                "Saving potential ratio 10%",
                money(report.engineeringSavings10, currency),
                "Saving potential ratio 10%",
                money(report.productionSavings10, currency),
                "",
              ],
              [
                "Saving potential ratio 20%",
                money(report.engineeringSavings20, currency),
                "Saving potential ratio 20%",
                money(report.productionSavings20, currency),
                "",
              ],
              [
                "Saving potential ratio 30%",
                money(report.engineeringSavings30, currency),
                "Saving potential ratio 30%",
                money(report.productionSavings30, currency),
                "",
              ],
              [
                "As Is Efficiency Level",
                `${number(engineeringCurrentLevel, 2)} / ${number(report.engineeringAsIsRatio, 3)}`,
                "As Is Efficiency Level",
                `${number(productionCurrentLevel, 2)} / ${number(report.productionAsIsRatio, 3)}`,
                "",
              ],
              [
                "Target Efficiency Level",
                `${number(engineeringTargetLevel, 2)} / ${number(report.engineeringTargetRatio, 3)}`,
                "Target Efficiency Level",
                `${number(productionTargetLevel, 2)} / ${number(report.productionTargetRatio, 3)}`,
                "",
              ],
              [
                "Difference",
                number(report.engineeringDifference, 3),
                "Difference",
                number(report.productionDifference, 3),
                "",
              ],
              [
                "Saving potential engineering",
                money(report.engineeringSavingPotential, currency),
                "Saving potential production",
                money(report.productionSavingPotential, currency),
                money(
                  report.engineeringSavingPotential + report.productionSavingPotential,
                  currency,
                ),
              ],
            ].map((row) => (
              <tr className="border-b border-[#edf0f3]" key={row.join("-")}>
                {row.map((value, index) => (
                  <td
                    className={`border-r border-[#edf0f3] px-3 py-3 align-top ${
                      index % 2 === 1 || index === 4
                        ? "font-semibold text-[#111827]"
                        : "text-[#52606d]"
                    }`}
                    key={`${row[0]}-${index}`}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
