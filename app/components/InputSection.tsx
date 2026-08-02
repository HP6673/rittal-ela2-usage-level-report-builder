"use client";

import type { Inputs, NumericInputKey } from "../lib/calculations.ts";
import { number } from "../lib/calculations.ts";
import { Field, SectionCard } from "./ui.tsx";

export function InputSection({
  input,
  onNumberChange,
  onTextChange,
  onCurrencyChange,
  displayValue,
  fieldError,
}: {
  input: Inputs;
  onNumberChange: (key: NumericInputKey, value: string) => void;
  onTextChange: (key: keyof Inputs, value: string) => void;
  onCurrencyChange: (value: string) => void;
  displayValue: (key: NumericInputKey) => string;
  fieldError: (key: NumericInputKey) => string | undefined;
}) {
  return (
    <SectionCard
      description="Customer, project, and business figures used throughout the report. Defaults match the ELA2 workbook's General information sheet — edit anything for this customer."
      id="step-1"
      step={1}
      title="Customer & business inputs"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-md border border-[#e2e8f0] bg-[#fbfcfe] p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#313842]">
            Company profile
          </h3>
          <div className="mt-4 grid gap-3">
            <Field
              inputMode="text"
              label="Company name"
              value={input.companyName}
              onChange={(value) => onTextChange("companyName", value)}
            />
            <Field
              inputMode="text"
              label="Segment / industry"
              value={input.segmentIndustry}
              onChange={(value) => onTextChange("segmentIndustry", value)}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                inputMode="text"
                label="Options"
                value={input.options}
                onChange={(value) => onTextChange("options", value)}
              />
              <Field
                inputMode="text"
                label="Variants"
                value={input.variants}
                onChange={(value) => onTextChange("variants", value)}
              />
            </div>
            <Field
              inputMode="text"
              label="General rating on ECAD usage"
              value={input.ecadUsageRating}
              onChange={(value) => onTextChange("ecadUsageRating", value)}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                inputMode="text"
                label="External engineering"
                value={input.externalEngineering}
                onChange={(value) => onTextChange("externalEngineering", value)}
              />
              <Field
                inputMode="text"
                label="External cabinet production"
                value={input.externalCabinetProduction}
                onChange={(value) => onTextChange("externalCabinetProduction", value)}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                Software tools
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  inputMode="text"
                  label="ECAD"
                  value={input.ecadTool}
                  onChange={(value) => onTextChange("ecadTool", value)}
                />
                <Field
                  inputMode="text"
                  label="MCAD"
                  value={input.mcadTool}
                  onChange={(value) => onTextChange("mcadTool", value)}
                />
                <Field
                  inputMode="text"
                  label="PDM/PLM"
                  value={input.pdmTool}
                  onChange={(value) => onTextChange("pdmTool", value)}
                />
                <Field
                  inputMode="text"
                  label="ERP"
                  value={input.erpTool}
                  onChange={(value) => onTextChange("erpTool", value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-4">
          <div className="min-w-0 rounded-md border border-[#e2e8f0] bg-[#fbfcfe] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#313842]">
              Engineering status &amp; schedule
            </h3>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  error={fieldError("etoCurrent")}
                  hint="0–100%"
                  label="ETO rate current"
                  suffix="%"
                  value={displayValue("etoCurrent")}
                  onChange={(value) => onNumberChange("etoCurrent", value)}
                />
                <Field
                  error={fieldError("etoFuture")}
                  hint="0–100%"
                  label="ETO rate future"
                  suffix="%"
                  value={displayValue("etoFuture")}
                  onChange={(value) => onNumberChange("etoFuture", value)}
                />
              </div>
              <div className="grid gap-2 rounded bg-[#f8fafc] p-3 text-sm text-[#4d5662]">
                <p>CTO current: {number((1 - input.etoCurrent) * 100, 0)}%</p>
                <p>CTO future: {number((1 - input.etoFuture) * 100, 0)}%</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  error={fieldError("workingHoursPerDay")}
                  label="Working hours / day"
                  value={displayValue("workingHoursPerDay")}
                  onChange={(value) => onNumberChange("workingHoursPerDay", value)}
                />
                <Field
                  error={fieldError("workingDaysPerYear")}
                  label="Working days / year"
                  value={displayValue("workingDaysPerYear")}
                  onChange={(value) => onNumberChange("workingDaysPerYear", value)}
                />
              </div>
              <Field
                hint="Max 4 characters"
                inputMode="text"
                label="Currency"
                maxLength={4}
                value={input.currency}
                onChange={onCurrencyChange}
              />
            </div>
          </div>

          <div className="min-w-0 rounded-md border border-[#e2e8f0] bg-[#fbfcfe] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#313842]">
              FTE profile
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field
                error={fieldError("engineeringFte")}
                label="Engineering electrical FTE"
                value={displayValue("engineeringFte")}
                onChange={(value) => onNumberChange("engineeringFte", value)}
              />
              <Field
                error={fieldError("engineeringRate")}
                label="Engineering hourly rate"
                value={displayValue("engineeringRate")}
                onChange={(value) => onNumberChange("engineeringRate", value)}
              />
              <Field
                error={fieldError("productionFte")}
                label="Panel production FTE"
                value={displayValue("productionFte")}
                onChange={(value) => onNumberChange("productionFte", value)}
              />
              <Field
                error={fieldError("productionRate")}
                label="Production hourly rate"
                value={displayValue("productionRate")}
                onChange={(value) => onNumberChange("productionRate", value)}
              />
            </div>
          </div>

          <div className="min-w-0 rounded-md border border-[#e2e8f0] bg-[#fbfcfe] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#313842]">
              Business output
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field
                error={fieldError("projectsPerYear")}
                label="Projects / year"
                value={displayValue("projectsPerYear")}
                onChange={(value) => onNumberChange("projectsPerYear", value)}
              />
              <Field
                error={fieldError("pagesPerProject")}
                label="Pages / project"
                value={displayValue("pagesPerProject")}
                onChange={(value) => onNumberChange("pagesPerProject", value)}
              />
              <Field
                error={fieldError("engineeringTimeShare")}
                hint="0–100%"
                label="Time share engineering"
                suffix="%"
                value={displayValue("engineeringTimeShare")}
                onChange={(value) => onNumberChange("engineeringTimeShare", value)}
              />
              <Field
                error={fieldError("panelsPerYear")}
                label="Panels / year"
                value={displayValue("panelsPerYear")}
                onChange={(value) => onNumberChange("panelsPerYear", value)}
              />
              <Field
                error={fieldError("productionTimeShare")}
                hint="0–100%"
                label="Time share production"
                suffix="%"
                value={displayValue("productionTimeShare")}
                onChange={(value) => onNumberChange("productionTimeShare", value)}
              />
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
