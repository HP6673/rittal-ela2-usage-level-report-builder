"use client";

import {
  engineeringRecommendations,
  formatQuantity,
  productionRecommendations,
  recommendationStatus,
} from "../data/offers.ts";
import { money, moneyWithCents, number, type Inputs, type Report } from "../lib/calculations.ts";
import { SectionCard, StatusBadge } from "./ui.tsx";

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[#edf0f3] py-1 text-sm last:border-b-0">
      <dt className="text-[#64748b]">{label}</dt>
      <dd className="font-semibold text-[#111827]">{value}</dd>
    </div>
  );
}

export function PrintReportSection({
  input,
  report,
  onPrint,
}: {
  input: Inputs;
  report: Report;
  onPrint: () => void;
}) {
  const generatedAt = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const totalSaving =
    report.engineeringSavingPotential + report.productionSavingPotential;

  const engineeringOffers = engineeringRecommendations.map((row) => ({
    ...row,
    status: recommendationStatus(
      row.neededFromLevel,
      report.engineeringCurrentLevel,
      report.engineeringTargetLevel,
    ),
  }));
  const productionOffers = productionRecommendations.map((row) => ({
    ...row,
    status: recommendationStatus(
      row.neededFromLevel,
      report.productionCurrentLevel,
      report.productionTargetLevel,
    ),
  }));

  return (
    <SectionCard
      actions={
        <button
          className="h-10 rounded-md bg-[#c8102e] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(200,16,46,0.25)] transition hover:bg-[#a80d26]"
          onClick={onPrint}
          type="button"
        >
          Print / export report
        </button>
      }
      description="A clean, print-ready summary of the customer's inputs, usage levels, savings, and recommended offering. Use the browser's Print dialog to save as PDF."
      id="step-6"
      step={6}
      title="Print / export report"
    >
      <div
        className="rounded border border-[#d6dce3] bg-white p-4 print:border-none print:p-0 sm:p-6"
        id="print-report"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
          <div className="flex items-center gap-4">
            <img alt="Rittal" className="h-12 w-20 object-contain" src="/rittal-logo.png" />
            <div>
              <p className="text-lg font-semibold text-[#111827]">
                {input.companyName || "Customer name not set"}
              </p>
              <p className="text-sm text-[#64748b]">
                {input.segmentIndustry || "Segment/industry not set"}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-[#94a3b8]">
            <p>ELA2 Usage Level Report</p>
            <p>Generated {generatedAt}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
              Business inputs
            </h4>
            <dl className="mt-2">
              <SummaryRow label="Options" value={input.options} />
              <SummaryRow label="Variants" value={input.variants} />
              <SummaryRow label="General rating on ECAD usage" value={input.ecadUsageRating} />
              <SummaryRow label="External engineering" value={input.externalEngineering} />
              <SummaryRow
                label="External cabinet production"
                value={input.externalCabinetProduction}
              />
              <SummaryRow label="ECAD" value={input.ecadTool} />
              <SummaryRow label="MCAD" value={input.mcadTool} />
              <SummaryRow label="PDM/PLM" value={input.pdmTool} />
              <SummaryRow label="ERP" value={input.erpTool} />
              <SummaryRow
                label="Engineering FTE / rate"
                value={`${number(input.engineeringFte, 1)} FTE @ ${money(input.engineeringRate, input.currency)}/h`}
              />
              <SummaryRow
                label="Production FTE / rate"
                value={`${number(input.productionFte, 1)} FTE @ ${money(input.productionRate, input.currency)}/h`}
              />
              <SummaryRow
                label="Projects / pages per year"
                value={`${input.projectsPerYear.toLocaleString()} projects × ${input.pagesPerProject.toLocaleString()} pages`}
              />
              <SummaryRow
                label="Panels per year"
                value={input.panelsPerYear.toLocaleString()}
              />
            </dl>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
              Usage levels &amp; savings
            </h4>
            <dl className="mt-2">
              <SummaryRow
                label="Engineering as-is / target"
                value={`${number(report.engineeringCurrentLevel, 2)} (${number(report.engineeringAsIsRatio * 100, 1)}%) → ${number(report.engineeringTargetLevel, 2)} (${number(report.engineeringTargetRatio * 100, 1)}%)`}
              />
              <SummaryRow
                label="Production as-is / target"
                value={`${number(report.productionCurrentLevel, 2)} (${number(report.productionAsIsRatio * 100, 1)}%) → ${number(report.productionTargetLevel, 2)} (${number(report.productionTargetRatio * 100, 1)}%)`}
              />
              <SummaryRow
                label="Engineering saving potential"
                value={money(report.engineeringSavingPotential, input.currency)}
              />
              <SummaryRow
                label="Production saving potential"
                value={money(report.productionSavingPotential, input.currency)}
              />
            </dl>
            <div className="mt-3 rounded border border-[#c8102e]/30 bg-[#fdeef0] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#a80d26]">
                Total saving potential
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#111827]">
                {moneyWithCents(totalSaving, input.currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <PrintOfferList input={input} rows={engineeringOffers} title="Recommended: engineering" />
          <PrintOfferList input={input} rows={productionOffers} title="Recommended: production" />
        </div>
      </div>
    </SectionCard>
  );
}

function PrintOfferList({
  title,
  rows,
  input,
}: {
  title: string;
  rows: {
    item: string;
    type: string;
    quantity: { kind: "fixed"; value: number } | { kind: "engineeringFte" } | { kind: "productionFte" } | { kind: "tbd" };
    neededFromLevel: number;
    status: string;
  }[];
  input: Inputs;
}) {
  return (
    <div className="print:break-inside-avoid">
      <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
        {title}
      </h4>
      <ul className="mt-2 grid gap-1.5">
        {rows.map((row, index) => (
          <li
            className="flex flex-wrap items-center justify-between gap-2 border-b border-[#edf0f3] py-1 text-sm last:border-b-0"
            key={`${row.item}-${index}`}
          >
            <span className="min-w-0 text-[#33404c]">
              {row.item}{" "}
              <span className="text-xs text-[#94a3b8]">
                ({row.type}, qty {formatQuantity(row.quantity, input)}, needed
                from {number(row.neededFromLevel, 2)})
              </span>
            </span>
            <StatusBadge status={row.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
