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
  projectsPerYear: 50,
  pagesPerProject: 100,
  engineeringTimeShare: 1,
  panelsPerYear: 100,
  productionTimeShare: 1,
  engineeringFte: 2,
  engineeringRate: 75,
  productionFte: 4,
  productionRate: 40,
  etoCurrent: 0.8,
  etoFuture: 0.3,
  workingHoursPerDay: 8,
  workingDaysPerYear: 235,
  currency: "$",
};

const engineeringCurrentLevel = 2.1458333333333335;
const engineeringTargetLevel = 3.68;
const productionCurrentLevel = 1.25;
const productionTargetLevel = 3.5;

const avg = (...values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

function interpolate(level: number, values: number[]) {
  const clamped = Math.max(1, Math.min(5, level));
  const lowerIndex = Math.floor((clamped - 1) * 2);
  const upperIndex = Math.min(values.length - 1, lowerIndex + 1);
  const lowerLevel = 1 + lowerIndex * 0.5;
  const span = 0.5;
  const ratio = (clamped - lowerLevel) / span;

  return values[lowerIndex] + (values[upperIndex] - values[lowerIndex]) * ratio;
}

function engineeringEfficiencyValues(input: Inputs) {
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

  return sum1.map((value, index) => value + sum2[index]);
}

function productionEfficiencyValues(input: Inputs) {
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

  return rows[0].map((_, index) =>
    rows.reduce((sum, row) => sum + row[index], 0),
  );
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
  const engineeringAsIsRatio = interpolate(engineeringCurrentLevel, engineeringValues);
  const engineeringTargetRatio = interpolate(engineeringTargetLevel, engineeringValues);
  const productionAsIsRatio = interpolate(productionCurrentLevel, productionValues);
  const productionTargetRatio = interpolate(productionTargetLevel, productionValues);
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

const fieldGroups = [
  {
    title: "Business output",
    fields: [
      ["projectsPerYear", "Projects / year"],
      ["pagesPerProject", "Pages / project"],
      ["engineeringTimeShare", "Time share engineering"],
      ["panelsPerYear", "Panels / year"],
      ["productionTimeShare", "Time share production"],
    ],
  },
  {
    title: "FTE profile",
    fields: [
      ["engineeringFte", "Engineering electrical FTE"],
      ["engineeringRate", "Engineering hourly rate"],
      ["productionFte", "Panel production FTE"],
      ["productionRate", "Production hourly rate"],
    ],
  },
  {
    title: "Engineering status",
    fields: [
      ["etoCurrent", "ETO rate current"],
      ["etoFuture", "ETO rate future"],
    ],
  },
  {
    title: "General",
    fields: [
      ["workingHoursPerDay", "Working hours / day"],
      ["workingDaysPerYear", "Working days / year"],
    ],
  },
] as const;

export function Calculator() {
  const [input, setInput] = useState<Inputs>(defaults);
  const report = useMemo(() => calculate(input), [input]);
  const totalSaving =
    report.engineeringSavingPotential + report.productionSavingPotential;

  function updateNumber(key: keyof Inputs, value: string) {
    setInput((current) => ({
      ...current,
      [key]: Number(value),
    }));
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#1b1f24]">
      <section className="border-b border-[#dfe3e8] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b42318]">
                Required fields
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[#111827] sm:text-4xl">
                ELA2 Usage Level Report Builder
              </h1>
              <p className="mt-3 max-w-3xl text-base text-[#58606b]">
                Enter the red cells from the General information tab, then review
                the calculated report below.
              </p>
            </div>
            <div className="rounded-md border border-[#e0e4e8] bg-[#fafafa] px-4 py-3">
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
        <div className="grid gap-4 lg:grid-cols-4">
          {fieldGroups.map((group) => (
            <div className="rounded-md border border-[#dde2e7] bg-white p-4" key={group.title}>
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#313842]">
                {group.title}
              </h2>
              <div className="mt-4 grid gap-3">
                {group.fields.map(([key, label]) => (
                  <label className="grid gap-1" key={key}>
                    <span className="text-sm font-medium text-[#4d5662]">
                      {label}
                    </span>
                    <input
                      className="h-11 rounded border border-[#e5484d] bg-[#fff5f5] px-3 text-base outline-none transition focus:border-[#b42318] focus:ring-2 focus:ring-[#fecaca]"
                      min="0"
                      step={key.includes("Rate") || key.includes("Share") || key.includes("eto") ? "0.01" : "1"}
                      type="number"
                      value={input[key]}
                      onChange={(event) => updateNumber(key, event.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="rounded-md border border-[#dde2e7] bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#313842]">
              Currency
            </h2>
            <label className="mt-4 grid gap-1">
              <span className="text-sm font-medium text-[#4d5662]">Currency symbol</span>
              <input
                className="h-11 rounded border border-[#e5484d] bg-[#fff5f5] px-3 text-base outline-none transition focus:border-[#b42318] focus:ring-2 focus:ring-[#fecaca]"
                value={input.currency}
                onChange={(event) =>
                  setInput((current) => ({
                    ...current,
                    currency: event.target.value,
                  }))
                }
              />
            </label>
            <div className="mt-5 grid gap-2 rounded bg-[#f8fafc] p-3 text-sm text-[#4d5662]">
              <p>CTO current: {number(1 - input.etoCurrent, 2)}</p>
              <p>CTO future: {number(1 - input.etoFuture, 2)}</p>
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
          <div className="rounded-md border border-[#1f2937] bg-[#111827] p-5 text-white">
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

        <div className="mt-5 overflow-hidden rounded-md border border-[#d6dce3] bg-white">
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

        <div className="mt-5 grid gap-3 rounded-md border border-[#d6dce3] bg-white p-5 md:grid-cols-5">
          {[
            ["1", "Basic - AutoCAD LT"],
            ["2", "Enhanced - ACE"],
            ["3", "Advanced - EPLAN"],
            ["4", "Automation - EPLAN eBuild"],
            ["5", "Configuration - EEC"],
          ].map(([level, label]) => (
            <div className="rounded border border-[#e2e8f0] p-3" key={level}>
              <p className="text-2xl font-semibold text-[#111827]">{level}</p>
              <p className="mt-1 text-sm text-[#56606c]">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
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
    <div className="overflow-hidden rounded-md border border-[#d6dce3] bg-white">
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
