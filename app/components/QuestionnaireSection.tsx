"use client";

import { number } from "../lib/calculations.ts";
import type {
  EngineeringAnswers,
  ProductionAnswers,
  QuestionDefinition,
  SectionDefinition,
} from "../data/questionnaire.ts";
import { engineeringSections, productionSections } from "../data/questionnaire.ts";
import { Field, SectionCard } from "./ui.tsx";

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
              className={`flex min-w-0 cursor-pointer items-start gap-2 rounded border px-2 py-1.5 text-sm transition focus-within:ring-2 focus-within:ring-[#c8102e]/40 ${
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
                aria-hidden="true"
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

function QuestionnaireGroup<K extends string>({
  groupId,
  targetError,
  targetLabel,
  sections,
  answers,
  currentLevel,
  targetLevel,
  onAnswerChange,
  onTargetChange,
}: {
  groupId: string;
  targetError?: string;
  targetLabel: string;
  sections: SectionDefinition<K>[];
  answers: Record<K, number>;
  currentLevel: number;
  targetLevel: number;
  onAnswerChange: (id: K, value: number) => void;
  onTargetChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0">
      <div className="grid grid-cols-1 gap-3 rounded border border-[#d6dce3] bg-[#f8fafc] p-3 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
            Current level (calculated)
          </p>
          <p className="mt-1 text-2xl font-semibold text-[#111827]">
            {number(currentLevel, 2)}
          </p>
        </div>
        <Field
          error={targetError}
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

export function EngineeringQuestionnaireSection({
  answers,
  currentLevel,
  targetLevel,
  targetError,
  onAnswerChange,
  onTargetChange,
}: {
  answers: EngineeringAnswers;
  currentLevel: number;
  targetLevel: number;
  targetError?: string;
  onAnswerChange: (id: keyof EngineeringAnswers, value: number) => void;
  onTargetChange: (value: string) => void;
}) {
  return (
    <SectionCard
      description="Answer each question with the option that best matches this customer today. Every answer shows its 0–5 score; the current level below recalculates live (matches workbook CALC1!B4)."
      id="step-2"
      step={2}
      title="Engineering questionnaire"
    >
      <QuestionnaireGroup
        answers={answers}
        currentLevel={currentLevel}
        groupId="engineering"
        onAnswerChange={onAnswerChange}
        onTargetChange={onTargetChange}
        sections={engineeringSections}
        targetError={targetError}
        targetLabel="Engineering target level"
        targetLevel={targetLevel}
      />
    </SectionCard>
  );
}

export function ProductionQuestionnaireSection({
  answers,
  currentLevel,
  targetLevel,
  targetError,
  onAnswerChange,
  onTargetChange,
}: {
  answers: ProductionAnswers;
  currentLevel: number;
  targetLevel: number;
  targetError?: string;
  onAnswerChange: (id: keyof ProductionAnswers, value: number) => void;
  onTargetChange: (value: string) => void;
}) {
  return (
    <SectionCard
      description="Answer each question with the option that best matches this customer today. Every answer shows its 0–5 score; the current level below recalculates live (matches workbook CALC1!B20)."
      id="step-3"
      step={3}
      title="Panel production questionnaire"
    >
      <QuestionnaireGroup
        answers={answers}
        currentLevel={currentLevel}
        groupId="production"
        onAnswerChange={onAnswerChange}
        onTargetChange={onTargetChange}
        sections={productionSections}
        targetError={targetError}
        targetLabel="Production target level"
        targetLevel={targetLevel}
      />
    </SectionCard>
  );
}
