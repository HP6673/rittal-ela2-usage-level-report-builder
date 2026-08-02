"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  blankEngineeringAnswers,
  blankProductionAnswers,
  type EngineeringAnswers,
  type ProductionAnswers,
} from "./data/questionnaire.ts";
import {
  calculate,
  clampField,
  defaults,
  engineeringChartData,
  fieldConstraints,
  moneyWithCents,
  normalizeNumericInput,
  percentFields,
  productionChartData,
  type Inputs,
  type NumericInputKey,
} from "./lib/calculations.ts";
import { InputSection } from "./components/InputSection.tsx";
import {
  EngineeringQuestionnaireSection,
  ProductionQuestionnaireSection,
} from "./components/QuestionnaireSection.tsx";
import { ReportSummarySection } from "./components/ReportSummary.tsx";
import { RecommendationsSection } from "./components/Recommendations.tsx";
import { PrintReportSection } from "./components/PrintReport.tsx";

const STORAGE_KEY = "rittal-ela2-report-builder:v1";

const steps = [
  { id: "step-1", label: "Inputs" },
  { id: "step-2", label: "Engineering" },
  { id: "step-3", label: "Production" },
  { id: "step-4", label: "Results" },
  { id: "step-5", label: "Offering" },
  { id: "step-6", label: "Export" },
];

function describeConstraint(key: NumericInputKey) {
  const constraint = fieldConstraints[key];

  if (!constraint) {
    return "";
  }

  if (constraint.min !== undefined && constraint.max !== undefined) {
    return `between ${constraint.min} and ${constraint.max}`;
  }

  if (constraint.min !== undefined) {
    return `at least ${constraint.min}`;
  }

  if (constraint.max !== undefined) {
    return `at most ${constraint.max}`;
  }

  return "";
}

export function Calculator() {
  const [input, setInput] = useState<Inputs>(defaults);
  const [fieldNotice, setFieldNotice] = useState<{ key: keyof Inputs; message: string } | null>(
    null,
  );
  const [activeStep, setActiveStep] = useState("step-1");
  const loadedRef = useRef(false);

  // Requirement #16 — restore a returning visitor's entries. Deliberately a
  // post-hydration effect (not a lazy useState initializer): the server has
  // no localStorage, so reading it during render would mismatch the SSR
  // markup. First load always renders the workbook defaults, matching the
  // "$137,813.21 on first load" acceptance check.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Inputs>;

        setInput((current) => ({
          ...current,
          ...parsed,
          engineeringAnswers: {
            ...current.engineeringAnswers,
            ...parsed.engineeringAnswers,
          },
          productionAnswers: {
            ...current.productionAnswers,
            ...parsed.productionAnswers,
          },
        }));
      }
    } catch {
      // Corrupt or blocked storage — fall back to defaults silently.
    }

    loadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!loadedRef.current) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
    } catch {
      // Storage full/blocked — persistence is a convenience, not required.
    }
  }, [input]);

  useEffect(() => {
    const sections = steps
      .map((step) => document.getElementById(step.id))
      .filter((section): section is HTMLElement => section !== null);

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          setActiveStep(visible[0].target.id);
        }
      },
      { rootMargin: "-112px 0px -70% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const report = useMemo(() => calculate(input), [input]);
  const engineeringChart = useMemo(() => engineeringChartData(input), [input]);
  const productionChart = useMemo(() => productionChartData(input), [input]);
  const totalSaving =
    report.engineeringSavingPotential + report.productionSavingPotential;

  function updateNumber(key: NumericInputKey, rawValue: string) {
    const parsed = normalizeNumericInput(rawValue);

    if (!Number.isFinite(parsed)) {
      return;
    }

    // An empty field is a deliberate, visible "0" — not a silently
    // misleading stale value (requirement #7).
    if (rawValue === "") {
      setInput((current) => ({ ...current, [key]: 0 }));
      setFieldNotice(null);
      return;
    }

    const { value: clamped, clamped: wasClamped } = clampField(key, parsed);

    setFieldNotice(
      wasClamped
        ? { key, message: `Adjusted to stay ${describeConstraint(key)}.` }
        : null,
    );

    const nextValue = percentFields.includes(key) ? clamped / 100 : clamped;

    setInput((current) => ({
      ...current,
      [key]: nextValue,
    }));
  }

  function displayValue(key: NumericInputKey) {
    const value = input[key];
    return percentFields.includes(key) ? String(value * 100) : String(value);
  }

  function fieldError(key: keyof Inputs): string | undefined {
    return fieldNotice?.key === key ? fieldNotice.message : undefined;
  }

  function updateText(key: keyof Inputs, value: string) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function updateCurrency(value: string) {
    if (value.trim() === "") {
      setFieldNotice({
        key: "currency",
        message: "Currency can't be empty — keeping the previous value.",
      });
      return;
    }

    setFieldNotice(null);
    setInput((current) => ({ ...current, currency: value.slice(0, 4) }));
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

  function resetToDefaults() {
    setInput(defaults);
    setFieldNotice(null);
  }

  function clearAssessment() {
    setInput((current) => ({
      ...current,
      engineeringAnswers: blankEngineeringAnswers,
      productionAnswers: blankProductionAnswers,
    }));
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f7f9] text-[#1b1f24] print:bg-white">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#111827] focus:shadow-lg"
        href="#step-1"
      >
        Skip to report builder
      </a>

      <header className="border-b border-[#dfe3e8] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] print:hidden">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <img
                alt="Rittal"
                className="h-14 w-24 shrink-0 object-contain sm:h-20 sm:w-32 lg:w-40"
                src="/rittal-logo.png"
              />
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-normal text-[#111827] sm:text-3xl lg:text-4xl">
                  ELA2 Usage Level Report Builder
                </h1>
                {input.companyName ? (
                  <p className="mt-1 truncate text-sm text-[#64748b]">
                    {input.companyName}
                    {input.segmentIndustry ? ` · ${input.segmentIndustry}` : ""}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-md border border-[#e0e4e8] bg-[#fafafa] px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#68707c]">
                  Total saving potential
                </p>
                <p className="mt-1 text-2xl font-semibold text-[#111827] sm:text-3xl">
                  {moneyWithCents(totalSaving, input.currency)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <button
                  className="h-10 rounded-md border border-[#d6dce3] bg-white px-3 text-xs font-semibold text-[#4d5662] transition hover:bg-[#f8fafc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8102e]"
                  onClick={clearAssessment}
                  type="button"
                >
                  Clear assessment
                </button>
                <button
                  className="h-10 rounded-md border border-[#d6dce3] bg-white px-3 text-xs font-semibold text-[#4d5662] transition hover:bg-[#f8fafc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8102e]"
                  onClick={resetToDefaults}
                  type="button"
                >
                  Reset to workbook defaults
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav
        aria-label="Report sections"
        className="sticky top-0 z-40 border-b border-[#dfe3e8] bg-white/95 backdrop-blur print:hidden"
      >
        <div className="mx-auto flex max-w-7xl gap-1.5 overflow-x-auto px-4 py-2 sm:px-8">
          {steps.map((step, index) => {
            const active = activeStep === step.id;

            return (
              <a
                aria-current={active ? "step" : undefined}
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8102e] ${
                  active
                    ? "bg-[#c8102e] text-white"
                    : "bg-[#f1f3f5] text-[#4d5662] hover:bg-[#e5e7eb]"
                }`}
                href={`#${step.id}`}
                key={step.id}
              >
                {index + 1}. {step.label}
              </a>
            );
          })}
        </div>
      </nav>

      {fieldNotice ? (
        <div
          aria-live="polite"
          className="mx-auto max-w-7xl px-4 pt-4 sm:px-8 print:hidden"
          role="status"
        >
          <p className="rounded-md border border-[#fde3b8] bg-[#fef3e2] px-4 py-2 text-sm text-[#92400e]">
            {fieldNotice.message}
          </p>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-8 print:gap-0 print:px-0 print:py-0">
        <InputSection
          displayValue={displayValue}
          fieldError={fieldError}
          input={input}
          onCurrencyChange={updateCurrency}
          onNumberChange={updateNumber}
          onTextChange={updateText}
        />

        <EngineeringQuestionnaireSection
          answers={input.engineeringAnswers}
          currentLevel={report.engineeringCurrentLevel}
          onAnswerChange={updateEngineeringAnswer}
          onTargetChange={(value) => updateNumber("engineeringTargetLevel", value)}
          targetError={fieldError("engineeringTargetLevel")}
          targetLevel={input.engineeringTargetLevel}
        />

        <ProductionQuestionnaireSection
          answers={input.productionAnswers}
          currentLevel={report.productionCurrentLevel}
          onAnswerChange={updateProductionAnswer}
          onTargetChange={(value) => updateNumber("productionTargetLevel", value)}
          targetError={fieldError("productionTargetLevel")}
          targetLevel={input.productionTargetLevel}
        />

        <ReportSummarySection
          currency={input.currency}
          engineeringChart={engineeringChart}
          productionChart={productionChart}
          report={report}
        />

        <RecommendationsSection
          engineeringCurrentLevel={report.engineeringCurrentLevel}
          engineeringTargetLevel={report.engineeringTargetLevel}
          input={input}
          productionCurrentLevel={report.productionCurrentLevel}
          productionTargetLevel={report.productionTargetLevel}
        />

        <PrintReportSection input={input} onPrint={() => window.print()} report={report} />
      </div>
    </main>
  );
}
