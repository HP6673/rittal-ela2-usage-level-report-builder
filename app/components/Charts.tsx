"use client";

import { useState } from "react";
import { number, type ChartData } from "../lib/calculations.ts";

export function WorkbookChart({
  title,
  data,
}: {
  title: string;
  data: ChartData;
}) {
  const [tooltip, setTooltip] = useState<{
    heading: string;
    category: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const asIsTotal = data.categories.reduce((sum, category) => sum + category.asIs, 0);
  const targetTotal = data.categories.reduce((sum, category) => sum + category.target, 0);
  const axisMax = Math.max(1, Math.ceil(Math.max(asIsTotal, targetTotal, 0.1) * 10) / 10);
  const axisTicks = Array.from({ length: 6 }, (_, index) => (axisMax / 5) * index);

  const bars = [
    { label: "As-is", key: "asIs" as const, total: asIsTotal },
    { label: "Target", key: "target" as const, total: targetTotal },
  ];

  return (
    <div
      className="min-w-0 rounded-md border border-[#d6dce3] bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)] print:break-inside-avoid print:shadow-none sm:p-5"
      onMouseLeave={() => setTooltip(null)}
    >
      <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
      <p className="mt-2 text-xs text-[#94a3b8]">
        Share of time by work item — from the ELA2 CALC1 table — for this customer's
        calculated As-is (level {number(data.currentLevel, 2)}) and Target (level{" "}
        {number(data.targetLevel, 2)}) levels.
      </p>

      <div
        aria-label={`${title}: horizontal bar chart comparing the As-is and Target time breakdown by work item`}
        className="mt-5 min-w-0 overflow-x-auto"
        role="img"
      >
        <div className="min-w-[480px]">
          <div className="ml-[64px] flex justify-between text-[10px] tabular-nums text-[#94a3b8] sm:ml-[76px]">
            {axisTicks.map((tick, index) => (
              <span key={index}>{Math.round(tick * 100)}%</span>
            ))}
          </div>
          <div className="mt-1 grid gap-3">
            {bars.map((bar) => (
              <div className="flex items-center gap-2 sm:gap-3" key={bar.label}>
                <span className="w-[60px] shrink-0 text-xs font-semibold text-[#111827] sm:w-[72px]">
                  {bar.label}
                </span>
                <div className="relative h-7 w-full overflow-hidden rounded-sm bg-[#eef1f4]">
                  <div
                    className="flex h-full"
                    style={{ width: `${(bar.total / axisMax) * 100}%` }}
                  >
                    {data.categories.map((category) => {
                      const value = category[bar.key];

                      if (value <= 0) {
                        return null;
                      }

                      return (
                        <div
                          aria-label={`${bar.label} — ${category.label}: ${number(value * 100, 1)}%`}
                          className="h-full focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
                          key={category.label}
                          onBlur={() => setTooltip(null)}
                          onFocus={(event) => {
                            const rect = event.currentTarget.getBoundingClientRect();
                            setTooltip({
                              heading: bar.label,
                              category: category.label,
                              value,
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                            });
                          }}
                          onMouseMove={(event) =>
                            setTooltip({
                              heading: bar.label,
                              category: category.label,
                              value,
                              x: event.clientX,
                              y: event.clientY,
                            })
                          }
                          style={{
                            width: `${(value / bar.total) * 100}%`,
                            backgroundColor: category.color,
                          }}
                          tabIndex={0}
                        />
                      );
                    })}
                  </div>
                </div>
                <span className="w-12 shrink-0 text-right text-xs font-semibold text-[#111827]">
                  {number(bar.total * 100, 0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-[#4d5662] sm:grid-cols-4">
        {data.categories.map((category) => (
          <span className="inline-flex items-center gap-1.5" key={category.label}>
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: category.color }}
            />
            {category.label}
          </span>
        ))}
      </div>

      {/* Screen-reader / print text alternative for the bar chart above. */}
      <div className="sr-only">
        <table>
          <caption>{title} — data table</caption>
          <thead>
            <tr>
              <th scope="col">Work item</th>
              <th scope="col">As-is</th>
              <th scope="col">Target</th>
            </tr>
          </thead>
          <tbody>
            {data.categories.map((category) => (
              <tr key={category.label}>
                <th scope="row">{category.label}</th>
                <td>{number(category.asIs * 100, 1)}%</td>
                <td>{number(category.target * 100, 1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tooltip ? (
        <div
          className="fixed z-[9999] min-w-56 max-w-[calc(100vw-2rem)] rounded-md border border-[#111827] bg-white p-3 text-sm shadow-[0_20px_55px_rgba(15,23,42,0.28)]"
          role="status"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, calc(-100% - 16px))",
          }}
        >
          <p className="font-semibold text-[#111827]">
            {tooltip.heading} — {tooltip.category}
          </p>
          <p className="mt-1 text-[#4d5662]">
            <span className="font-semibold text-[#111827]">
              {number(tooltip.value * 100, 1)}%
            </span>{" "}
            of total time
          </p>
        </div>
      ) : null}
    </div>
  );
}
