"use client";

import { useMemo, useState } from "react";
import {
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
  type QuestionOption,
  type RecommendationItem,
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

export function Calculator() {
  const [input, setInput] = useState<Inputs>(defaults);
  const report = useMemo(() => calculate(input), [input]);
  const engineeringChart = useMemo(() => engineeringChartData(input), [input]);
  const productionChart = useMemo(() => productionChartData(input), [input]);
  const totalSaving =
    report.engineeringSavingPotential + report.productionSavingPotential;

  function updateNumber(key: NumericInputKey, value: string) {
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
    <main className="min-h-screen bg-[#f6f7f9] text-[#1b1f24]">
      <section className="border-b border-[#dfe3e8] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-4">
              <img
                alt="Rittal"
                className="h-20 w-32 object-contain sm:w-40"
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
                {moneyWithCents(totalSaving, input.currency)}
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
                  className="h-11 rounded border border-[#cbd5e1] bg-white px-3 text-base shadow-inner outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
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
    <section className="mt-5 rounded-md border border-[#d6dce3] bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
      <h2 className="text-xl font-semibold text-[#111827]">
        Usage Level Questionnaire
      </h2>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <QuestionnaireGroup
          title="Engineering Level Assessment"
          sections={engineeringSections}
          answers={input.engineeringAnswers}
          currentLevel={engineeringCurrentLevel}
          targetLevel={input.engineeringTargetLevel}
          onAnswerChange={onEngineeringAnswerChange}
          onTargetChange={onEngineeringTargetChange}
        />
        <QuestionnaireGroup
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
  title,
  sections,
  answers,
  currentLevel,
  targetLevel,
  onAnswerChange,
  onTargetChange,
}: {
  title: string;
  sections: SectionDefinition<K>[];
  answers: Record<K, number>;
  currentLevel: number;
  targetLevel: number;
  onAnswerChange: (id: K, value: number) => void;
  onTargetChange: (value: string) => void;
}) {
  return (
    <div>
      <h3 className="rounded bg-[#28323f] px-4 py-3 text-sm font-semibold text-white">
        {title}
      </h3>
      <div className="mt-3 grid grid-cols-2 gap-3 rounded border border-[#d6dce3] bg-[#f8fafc] p-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
            Current level
          </p>
          <p className="mt-1 text-lg font-semibold text-[#111827]">
            {number(currentLevel, 2)}
          </p>
        </div>
        <Field
          label="Target level"
          value={String(targetLevel)}
          onChange={onTargetChange}
        />
      </div>
      <div className="mt-3 grid gap-3">
        {sections.map((section) => (
          <div
            className="rounded border border-[#d6dce3] bg-[#fbfcfe] p-3"
            key={section.number}
          >
            <p className="text-sm font-semibold text-[#111827]">
              {section.number} {section.title}
            </p>
            <div className="mt-2 grid gap-2">
              {section.questions.map((question) => (
                <label className="grid gap-1" key={question.id}>
                  <span className="text-sm text-[#4d5662]">
                    {question.prompt}
                  </span>
                  <select
                    className="h-10 rounded border border-[#cbd5e1] bg-white px-2 text-sm outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
                    value={answers[question.id]}
                    onChange={(event) =>
                      onAnswerChange(question.id, Number(event.target.value))
                    }
                  >
                    {question.options.map((option: QuestionOption) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function statusClass(status: string) {
  if (status === "To be offered/implemented") {
    return "text-[#166534]";
  }

  if (status === "Possible future improvement") {
    return "text-[#92400e]";
  }

  return "text-[#52606d]";
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
    <section className="mt-5 rounded-md border border-[#d6dce3] bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
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
    <div>
      <h3 className="rounded bg-[#28323f] px-4 py-3 text-sm font-semibold text-white">
        {title}
      </h3>
      <div className="mt-3 overflow-auto rounded border border-[#d6dce3]">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#52606d]">
            <tr>
              <th className="border-r border-[#d6dce3] px-3 py-2">Item</th>
              <th className="border-r border-[#d6dce3] px-3 py-2">Type</th>
              <th className="border-r border-[#d6dce3] px-3 py-2">Quantity</th>
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
                  <td className={`px-3 py-2 font-semibold ${statusClass(status)}`}>
                    {status}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
  const [axisTooltip, setAxisTooltip] = useState<{
    level: string;
    label: string;
    x: number;
    y: number;
  } | null>(null);
  const max = Math.max(...data.total, 1);

  return (
    <div
      className="rounded-md border border-[#d6dce3] bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)]"
      onMouseLeave={() => {
        setTooltip(null);
        setAxisTooltip(null);
      }}
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
                          label,
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
                          className="bg-[#f59e0b]"
                          style={{ height: `${secondaryHeight}%` }}
                        />
                        <div
                          className="bg-[#2563eb]"
                          style={{ height: `${primaryHeight}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={`absolute -bottom-7 left-1/2 w-12 -translate-x-1/2 text-center text-xs text-[#52606d] ${
                        levelDescription ? "cursor-help font-semibold" : ""
                      }`}
                      onMouseMove={(event) => {
                        if (!levelDescription) {
                          return;
                        }

                        event.stopPropagation();
                        setTooltip(null);
                        setAxisTooltip({
                          level: label,
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
      {axisTooltip ? (
        <div
          className="fixed z-[9999] min-w-56 rounded-md border border-[#111827] bg-white p-3 text-sm shadow-[0_20px_55px_rgba(15,23,42,0.28)]"
          style={{
            left: axisTooltip.x,
            top: axisTooltip.y,
            transform: "translate(-50%, calc(-100% - 16px))",
          }}
        >
          <p className="font-semibold text-[#111827]">Level {axisTooltip.level}</p>
          <p className="mt-2 text-[#4d5662]">{axisTooltip.label}</p>
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
      <div className="overflow-auto rounded border border-[#d6dce3]">
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
                `${number(report.engineeringCurrentLevel, 2)} / ${number(report.engineeringAsIsRatio * 100, 1)}%`,
                "As Is Efficiency Level",
                `${number(report.productionCurrentLevel, 2)} / ${number(report.productionAsIsRatio * 100, 1)}%`,
                "",
              ],
              [
                "Target Efficiency Level",
                `${number(report.engineeringTargetLevel, 2)} / ${number(report.engineeringTargetRatio * 100, 1)}%`,
                "Target Efficiency Level",
                `${number(report.productionTargetLevel, 2)} / ${number(report.productionTargetRatio * 100, 1)}%`,
                "",
              ],
              [
                "Difference",
                `${number(report.engineeringDifference * 100, 1)}%`,
                "Difference",
                `${number(report.productionDifference * 100, 1)}%`,
                "",
              ],
              [
                "Saving potential engineering",
                money(report.engineeringSavingPotential, currency),
                "Saving potential production",
                money(report.productionSavingPotential, currency),
                moneyWithCents(
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
