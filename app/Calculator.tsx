"use client";

import { useMemo, useState } from "react";
import {
  buildReportRows,
  calculate,
  defaults,
  engineeringChartData,
  engineeringRecommendations,
  engineeringSections,
  formatQuantity,
  levelKey,
  money,
  moneyWithCents,
  normalizeNumericInput,
  number,
  productionChartData,
  productionRecommendations,
  productionSections,
  recommendationStatus,
  yAxisTicks,
  type EngineeringAnswers,
  type Inputs,
  type ProductionAnswers,
  type QuestionDefinition,
  type RecommendationItem,
  type ReportRow,
  type SectionDefinition,
} from "./calculations";

type NumericInputKey = {
  [K in keyof Inputs]: Inputs[K] extends number ? K : never;
}[keyof Inputs];

const percentFields: NumericInputKey[] = [
  "engineeringTimeShare",
  "productionTimeShare",
  "etoCurrent",
  "etoFuture",
];

// Validation ranges for requirement #6: percentages 0-100, target/current
// levels 1-5, and every other numeric business input non-negative.
const fieldConstraints: Partial<Record<NumericInputKey, { min?: number; max?: number }>> = {
  projectsPerYear: { min: 0 },
  pagesPerProject: { min: 0 },
  panelsPerYear: { min: 0 },
  engineeringFte: { min: 0 },
  engineeringRate: { min: 0 },
  productionFte: { min: 0 },
  productionRate: { min: 0 },
  workingHoursPerDay: { min: 0 },
  workingDaysPerYear: { min: 0 },
  engineeringTimeShare: { min: 0, max: 100 },
  productionTimeShare: { min: 0, max: 100 },
  etoCurrent: { min: 0, max: 100 },
  etoFuture: { min: 0, max: 100 },
  engineeringTargetLevel: { min: 1, max: 5 },
  productionTargetLevel: { min: 1, max: 5 },
};

// Rittal-style chart accents (red/gray) instead of generic blue/orange.
const chartColors = {
  primary: "#C8102E",
  secondary: "#94A3B8",
};

export function Calculator() {
  const [input, setInput] = useState<Inputs>(defaults);
  const report = useMemo(() => calculate(input), [input]);
  const engineeringChart = useMemo(() => engineeringChartData(input), [input]);
  const productionChart = useMemo(() => productionChartData(input), [input]);
  const totalSaving =
    report.engineeringSavingPotential + report.productionSavingPotential;

  function updateNumber(key: NumericInputKey, value: string) {
    const parsed = normalizeNumericInput(value);

    if (!Number.isFinite(parsed)) {
      return;
    }

    const constraint = fieldConstraints[key];
    let raw = parsed;

    // Skip clamping while the field is empty so clearing it to retype a
    // value doesn't get instantly snapped back to the minimum.
    if (constraint && value !== "") {
      if (constraint.min !== undefined) {
        raw = Math.max(constraint.min, raw);
      }

      if (constraint.max !== undefined) {
        raw = Math.min(constraint.max, raw);
      }
    }

    const nextValue = percentFields.includes(key) ? raw / 100 : raw;

    setInput((current) => ({
      ...current,
      [key]: nextValue,
    }));
  }

  function displayValue(key: NumericInputKey) {
    const value = input[key];
    return percentFields.includes(key) ? String(value * 100) : String(value);
  }

  function updateEngineeringAnswer(id: keyof EngineeringAnswers, value: number) {
    setInput((current) => ({
      ...current,
      engineeringAnswers: { ...current.engineeringAnswers, [id]: value },
    }));
  }

  function updateProductionAnswer(id: keyof ProductionAnswers, value: number) {
    setInput((current) => ({
      ...current,
      productionAnswers: { ...current.productionAnswers, [id]: value },
    }));
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f7f9] text-[#1b1f24] print:bg-white">
      <section className="border-b border-[#dfe3e8] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] print:shadow-none">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <img
                alt="Rittal"
                className="h-14 w-24 shrink-0 object-contain sm:h-20 sm:w-32 lg:w-40"
                src="/rittal-logo.png"
              />
              <h1 className="min-w-0 text-2xl font-semibold tracking-normal text-[#111827] sm:text-3xl lg:text-4xl">
                ELA2 Usage Level Report Builder
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-md border border-[#e0e4e8] bg-[#fafafa] px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.08)] print:shadow-none">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#68707c]">
                  Total saving potential
                </p>
                <p className="mt-1 text-2xl font-semibold text-[#111827] sm:text-3xl">
                  {moneyWithCents(totalSaving, input.currency)}
                </p>
              </div>
              <button
                className="h-11 shrink-0 rounded-md bg-[#c8102e] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(200,16,46,0.25)] transition hover:bg-[#a80d26] print:hidden"
                onClick={() => window.print()}
                type="button"
              >
                Print / Export report
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="min-w-0 rounded-md border border-[#dde2e7] bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)] print:shadow-none">
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
                    hint="0–100%"
                    label="ETO rate current"
                    suffix="%"
                    value={displayValue("etoCurrent")}
                    onChange={(value) => updateNumber("etoCurrent", value)}
                  />
                  <Field
                    hint="0–100%"
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
                  className="h-11 w-full max-w-full rounded border border-[#cbd5e1] bg-white px-3 text-base shadow-inner outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe] print:border-none print:shadow-none"
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

          <div className="min-w-0 rounded-md border border-[#dde2e7] bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)] print:shadow-none">
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

          <div className="min-w-0 rounded-md border border-[#dde2e7] bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)] print:shadow-none">
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
                hint="0–100%"
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
                hint="0–100%"
                label="Time share production"
                suffix="%"
                value={displayValue("productionTimeShare")}
                onChange={(value) => updateNumber("productionTimeShare", value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          <WorkbookChart title="Engineering time [%]" data={engineeringChart} />
          <WorkbookChart title="Production time [%]" data={productionChart} />
        </div>

        <ReportPageTable report={report} currency={input.currency} />

        <Questionnaire
          input={input}
          engineeringCurrentLevel={report.engineeringCurrentLevel}
          productionCurrentLevel={report.productionCurrentLevel}
          onEngineeringAnswerChange={updateEngineeringAnswer}
          onProductionAnswerChange={updateProductionAnswer}
          onEngineeringTargetChange={(value) =>
            updateNumber("engineeringTargetLevel", value)
          }
          onProductionTargetChange={(value) =>
            updateNumber("productionTargetLevel", value)
          }
        />

        <Recommendations
          input={input}
          engineeringCurrentLevel={report.engineeringCurrentLevel}
          engineeringTargetLevel={report.engineeringTargetLevel}
          productionCurrentLevel={report.productionCurrentLevel}
          productionTargetLevel={report.productionTargetLevel}
        />
      </section>
    </main>
  );
}

function Field({
  hint,
  label,
  onChange,
  suffix,
  value,
}: {
  hint?: string;
  label: string;
  onChange: (value: string) => void;
  suffix?: string;
  value: string;
}) {
  return (
    <label className="grid min-w-0 gap-1">
      <span className="flex items-baseline justify-between gap-2 text-sm font-medium text-[#4d5662]">
        {label}
        {hint ? (
          <span className="text-xs font-normal text-[#94a3b8]">{hint}</span>
        ) : null}
      </span>
      <span className="relative block min-w-0">
        <input
          className={`h-11 w-full max-w-full rounded border border-[#cbd5e1] bg-white px-3 text-base shadow-inner outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe] print:border-none print:shadow-none ${
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

function Questionnaire({
  input,
  engineeringCurrentLevel,
  productionCurrentLevel,
  onEngineeringAnswerChange,
  onProductionAnswerChange,
  onEngineeringTargetChange,
  onProductionTargetChange,
}: {
  input: Inputs;
  engineeringCurrentLevel: number;
  productionCurrentLevel: number;
  onEngineeringAnswerChange: (id: keyof EngineeringAnswers, value: number) => void;
  onProductionAnswerChange: (id: keyof ProductionAnswers, value: number) => void;
  onEngineeringTargetChange: (value: string) => void;
  onProductionTargetChange: (value: string) => void;
}) {
  return (
    <section className="mt-5 rounded-md border border-[#d6dce3] bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)] print:hidden sm:p-5">
      <h2 className="text-xl font-semibold text-[#111827]">
        Usage Level Questionnaire
      </h2>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <QuestionnaireGroup
          groupId="engineering"
          targetLabel="Engineering target level"
          title="Engineering Level Assessment"
          sections={engineeringSections}
          answers={input.engineeringAnswers}
          currentLevel={engineeringCurrentLevel}
          targetLevel={input.engineeringTargetLevel}
          onAnswerChange={onEngineeringAnswerChange}
          onTargetChange={onEngineeringTargetChange}
        />
        <QuestionnaireGroup
          groupId="production"
          targetLabel="Production target level"
          title="Panel Production Level Assessment"
          sections={productionSections}
          answers={input.productionAnswers}
          currentLevel={productionCurrentLevel}
          targetLevel={input.productionTargetLevel}
          onAnswerChange={onProductionAnswerChange}
          onTargetChange={onProductionTargetChange}
        />
      </div>
    </section>
  );
}

function QuestionnaireGroup<K extends string>({
  groupId,
  targetLabel,
  title,
  sections,
  answers,
  currentLevel,
  targetLevel,
  onAnswerChange,
  onTargetChange,
}: {
  groupId: string;
  targetLabel: string;
  title: string;
  sections: SectionDefinition<K>[];
  answers: Record<K, number>;
  currentLevel: number;
  targetLevel: number;
  onAnswerChange: (id: K, value: number) => void;
  onTargetChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0">
      <h3 className="rounded bg-[#28323f] px-4 py-3 text-sm font-semibold text-white">
        {title}
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-3 rounded border border-[#d6dce3] bg-[#f8fafc] p-3 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
            Current level (calculated)
          </p>
          <p className="mt-1 text-lg font-semibold text-[#111827]">
            {number(currentLevel, 2)}
          </p>
        </div>
        <Field
          hint="1–5"
          label={targetLabel}
          value={String(targetLevel)}
          onChange={onTargetChange}
        />
      </div>
      <div className="mt-3 grid gap-3">
        {sections.map((section) => (
          <div
            className="min-w-0 rounded border border-[#d6dce3] bg-[#fbfcfe] p-3"
            key={section.number}
          >
            <p className="text-sm font-semibold text-[#111827]">
              {section.number} {section.title}
            </p>
            <div className="mt-2 grid gap-2">
              {section.questions.map((question) => (
                <AnswerOptionList
                  groupId={groupId}
                  key={question.id}
                  onChange={(value) => onAnswerChange(question.id, value)}
                  question={question}
                  selectedValue={answers[question.id]}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnswerOptionList<K extends string>({
  groupId,
  question,
  selectedValue,
  onChange,
}: {
  groupId: string;
  question: QuestionDefinition<K>;
  selectedValue: number;
  onChange: (value: number) => void;
}) {
  const name = `${groupId}-${String(question.id)}`;

  return (
    <fieldset className="min-w-0 rounded border border-[#e2e8f0] bg-white p-2">
      <legend className="px-1 text-sm font-medium text-[#33404c]">
        {question.prompt}
      </legend>
      <div className="mt-1 grid gap-1.5">
        {question.options.map((option) => {
          const selected = selectedValue === option.value;
          const text = option.label.replace(/^\d+\.\s*/, "");

          return (
            <label
              className={`flex min-w-0 cursor-pointer items-start gap-2 rounded border px-2 py-1.5 text-sm transition ${
                selected
                  ? "border-[#c8102e] bg-[#fdeef0]"
                  : "border-[#e2e8f0] bg-white hover:bg-[#f8fafc]"
              }`}
              key={option.value}
            >
              <input
                checked={selected}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#c8102e]"
                name={name}
                onChange={() => onChange(option.value)}
                type="radio"
                value={option.value}
              />
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  selected
                    ? "bg-[#c8102e] text-white"
                    : "bg-[#e2e8f0] text-[#52606d]"
                }`}
              >
                {option.value}
              </span>
              <span className="min-w-0 flex-1 whitespace-normal break-words text-[#33404c]">
                {text}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "To be offered/implemented"
      ? "border-[#bbf0cd] bg-[#e7f6ec] text-[#166534]"
      : status === "Possible future improvement"
        ? "border-[#fde3b8] bg-[#fef3e2] text-[#92400e]"
        : "border-[#dbe1e7] bg-[#eef1f4] text-[#52606d]";

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {status}
    </span>
  );
}

function Recommendations({
  input,
  engineeringCurrentLevel,
  engineeringTargetLevel,
  productionCurrentLevel,
  productionTargetLevel,
}: {
  input: Inputs;
  engineeringCurrentLevel: number;
  engineeringTargetLevel: number;
  productionCurrentLevel: number;
  productionTargetLevel: number;
}) {
  return (
    <section className="mt-5 break-inside-avoid rounded-md border border-[#d6dce3] bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)] print:shadow-none sm:p-5">
      <h2 className="text-xl font-semibold text-[#111827]">To be offered</h2>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <RecommendationTable
          title="Improvements to engineering"
          rows={engineeringRecommendations}
          currentLevel={engineeringCurrentLevel}
          targetLevel={engineeringTargetLevel}
          input={input}
        />
        <RecommendationTable
          title="Improvements to production"
          rows={productionRecommendations}
          currentLevel={productionCurrentLevel}
          targetLevel={productionTargetLevel}
          input={input}
        />
      </div>
    </section>
  );
}

function RecommendationTable({
  title,
  rows,
  currentLevel,
  targetLevel,
  input,
}: {
  title: string;
  rows: RecommendationItem[];
  currentLevel: number;
  targetLevel: number;
  input: Inputs;
}) {
  return (
    <div className="min-w-0">
      <h3 className="rounded bg-[#28323f] px-4 py-3 text-sm font-semibold text-white">
        {title}
      </h3>

      {/* Desktop / tablet: full table. */}
      <div className="mt-3 hidden overflow-x-auto rounded border border-[#d6dce3] sm:block">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#52606d]">
            <tr>
              <th className="border-r border-[#d6dce3] px-3 py-2">Item</th>
              <th className="border-r border-[#d6dce3] px-3 py-2">Type</th>
              <th className="border-r border-[#d6dce3] px-3 py-2">Qty</th>
              <th className="border-r border-[#d6dce3] px-3 py-2">
                Needed from level
              </th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const status = recommendationStatus(
                row.neededFromLevel,
                currentLevel,
                targetLevel,
              );

              return (
                <tr className="border-b border-[#edf0f3]" key={`${row.item}-${index}`}>
                  <td className="border-r border-[#edf0f3] px-3 py-2 text-[#52606d]">
                    {row.item}
                  </td>
                  <td className="border-r border-[#edf0f3] px-3 py-2 text-[#52606d]">
                    {row.type}
                  </td>
                  <td className="border-r border-[#edf0f3] px-3 py-2 text-[#52606d]">
                    {formatQuantity(row.quantity, input)}
                  </td>
                  <td className="border-r border-[#edf0f3] px-3 py-2 text-[#52606d]">
                    {number(row.neededFromLevel, 2)}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards instead of a wide table. */}
      <div className="mt-3 grid gap-2 sm:hidden">
        {rows.map((row, index) => {
          const status = recommendationStatus(
            row.neededFromLevel,
            currentLevel,
            targetLevel,
          );

          return (
            <div
              className="min-w-0 rounded border border-[#d6dce3] bg-[#fbfcfe] p-3"
              key={`${row.item}-${index}`}
            >
              <p className="text-sm font-semibold text-[#111827]">{row.item}</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[#52606d]">
                <dt className="text-[#94a3b8]">Type</dt>
                <dd>{row.type}</dd>
                <dt className="text-[#94a3b8]">Quantity</dt>
                <dd>{formatQuantity(row.quantity, input)}</dd>
                <dt className="text-[#94a3b8]">Needed from level</dt>
                <dd>{number(row.neededFromLevel, 2)}</dd>
              </dl>
              <div className="mt-2">
                <StatusBadge status={status} />
              </div>
            </div>
          );
        })}
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
    currentLevel: number;
    targetLevel: number;
    primaryLabel: string;
    secondaryLabel: string;
    primary: number[];
    secondary: number[];
    total: number[];
    denseTotal: number[];
  };
}) {
  const [tooltip, setTooltip] = useState<{
    heading: string;
    primary: number;
    secondary: number;
    total: number;
    x: number;
    y: number;
  } | null>(null);
  const [axisTooltip, setAxisTooltip] = useState<{
    label: string;
    x: number;
    y: number;
  } | null>(null);
  const max = Math.max(...data.total, 1);

  return (
    <div
      className="min-w-0 rounded-md border border-[#d6dce3] bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)] print:break-inside-avoid print:shadow-none sm:p-5"
      onMouseLeave={() => {
        setTooltip(null);
        setAxisTooltip(null);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#111827]">{title}</h2>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#52606d]">
          <span className="inline-flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: chartColors.primary }}
            />
            {data.primaryLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: chartColors.secondary }}
            />
            {data.secondaryLabel}
          </span>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-[34px_1fr] gap-2 sm:grid-cols-[42px_1fr] sm:gap-3">
        <div className="relative h-64 sm:h-72">
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
        <div className="h-64 overflow-x-auto overflow-y-visible sm:h-72">
          <div className="relative h-full min-w-[560px] border-l border-b border-[#d7dde5] px-2 pb-8 sm:min-w-[680px] sm:px-3">
            {yAxisTicks.map((tick) => (
              <span
                className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-[#e2e8f0]"
                key={tick}
                style={{ bottom: `calc(${tick * 100}% + 2rem)` }}
              />
            ))}
            <div className="relative z-10 flex h-full items-end gap-2 sm:gap-3">
              {data.labels.map((label, index) => {
                const total = data.total[index];
                const barHeight = (total / max) * 100;
                const primaryHeight =
                  total === 0 ? 0 : (data.primary[index] / total) * 100;
                const secondaryHeight =
                  total === 0 ? 0 : (data.secondary[index] / total) * 100;
                const isMarker = label === "As-is" || label === "Target";
                const levelDescription = levelKey.find(
                  ([level]) => level === label,
                )?.[1];

                return (
                  <div
                    className="relative flex h-full flex-1 flex-col justify-end"
                    key={label}
                  >
                    <div
                      className="flex h-[88%] items-end"
                      onMouseMove={(event) => {
                        setAxisTooltip(null);
                        setTooltip({
                          heading:
                            label === "As-is"
                              ? `As-is (level ${number(data.currentLevel, 2)})`
                              : label === "Target"
                                ? `Target (level ${number(data.targetLevel, 2)})`
                                : `Level ${label}`,
                          primary: data.primary[index],
                          secondary: data.secondary[index],
                          total,
                          x: event.clientX,
                          y: event.clientY,
                        });
                      }}
                    >
                      <div
                        className="mx-auto flex w-full max-w-9 flex-col justify-end overflow-hidden rounded-t-sm bg-[#e5e7eb]"
                        style={{ height: `${barHeight}%` }}
                      >
                        <div
                          style={{
                            height: `${secondaryHeight}%`,
                            backgroundColor: chartColors.secondary,
                          }}
                        />
                        <div
                          style={{
                            height: `${primaryHeight}%`,
                            backgroundColor: chartColors.primary,
                          }}
                        />
                      </div>
                    </div>
                    <span
                      className={`absolute -bottom-7 left-1/2 w-14 -translate-x-1/2 text-center text-[10px] text-[#52606d] sm:w-16 sm:text-xs ${
                        isMarker || levelDescription
                          ? "cursor-help font-semibold text-[#111827]"
                          : ""
                      }`}
                      onMouseMove={(event) => {
                        if (!levelDescription) {
                          return;
                        }

                        event.stopPropagation();
                        setTooltip(null);
                        setAxisTooltip({
                          label: levelDescription,
                          x: event.clientX,
                          y: event.clientY,
                        });
                      }}
                      onMouseLeave={() => setAxisTooltip(null)}
                    >
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
          className="fixed z-[9999] min-w-56 max-w-[calc(100vw-2rem)] rounded-md border border-[#111827] bg-white p-3 text-sm shadow-[0_20px_55px_rgba(15,23,42,0.28)]"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, calc(-100% - 16px))",
          }}
        >
          <p className="font-semibold text-[#111827]">{tooltip.heading}</p>
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
      {axisTooltip ? (
        <div
          className="fixed z-[9999] min-w-56 max-w-[calc(100vw-2rem)] rounded-md border border-[#111827] bg-white p-3 text-sm shadow-[0_20px_55px_rgba(15,23,42,0.28)]"
          style={{
            left: axisTooltip.x,
            top: axisTooltip.y,
            transform: "translate(-50%, calc(-100% - 16px))",
          }}
        >
          <p className="text-[#4d5662]">{axisTooltip.label}</p>
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
  const rows: ReportRow[] = buildReportRows(report, currency);

  return (
    <div className="mt-5 break-inside-avoid rounded-md border border-[#d6dce3] bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)] print:shadow-none sm:p-5">
      {/* Desktop / tablet: full 5-column table. */}
      <div className="hidden overflow-x-auto rounded border border-[#d6dce3] md:block">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
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
            {rows.map((row) => (
              <tr className="border-b border-[#edf0f3]" key={row.label}>
                <td className="border-r border-[#edf0f3] px-3 py-3 align-top text-[#52606d]">
                  {row.label}
                </td>
                <td className="border-r border-[#edf0f3] px-3 py-3 align-top font-semibold text-[#111827]">
                  {row.engineeringValue}
                </td>
                <td className="border-r border-[#edf0f3] px-3 py-3 align-top text-[#52606d]">
                  {row.productionLabel}
                </td>
                <td className="border-r border-[#edf0f3] px-3 py-3 align-top font-semibold text-[#111827]">
                  {row.productionValue}
                </td>
                <td className="px-3 py-3 align-top font-semibold text-[#111827]">
                  {row.total ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards instead of a 5-column table. */}
      <div className="grid gap-2 md:hidden">
        {rows.map((row) => (
          <div
            className="min-w-0 rounded border border-[#d6dce3] bg-[#fbfcfe] p-3"
            key={row.label}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-[#52606d]">{row.label}</span>
              <span className="text-sm font-semibold text-[#111827]">
                {row.engineeringValue}
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="text-xs text-[#52606d]">
                {row.productionLabel}
              </span>
              <span className="text-sm font-semibold text-[#111827]">
                {row.productionValue}
              </span>
            </div>
            {row.total ? (
              <div className="mt-1 flex items-baseline justify-between gap-2 border-t border-[#edf0f3] pt-1">
                <span className="text-xs text-[#52606d]">Total</span>
                <span className="text-sm font-semibold text-[#111827]">
                  {row.total}
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
