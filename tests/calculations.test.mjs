import assert from "node:assert/strict";
import test from "node:test";
import {
  computeEngineeringCurrentLevel,
  computeProductionCurrentLevel,
  calculate,
  defaultEngineeringAnswers,
  defaultProductionAnswers,
  defaults,
  formatQuantity,
  recommendationStatus,
} from "../app/calculations.ts";

test("questionnaire scoring: engineering current level averages the 8 section averages (CALC1!B4)", () => {
  const level = computeEngineeringCurrentLevel(defaultEngineeringAnswers);
  assert.equal(level, 2.1458333333333335);

  const allTop = computeEngineeringCurrentLevel({
    q1a: 5, q1b: 5, q1c: 5,
    q2a: 5, q2b: 5, q2c: 5, q2d: 5,
    q3a: 5, q4a: 5, q5a: 5,
    q6a: 5, q6b: 5,
    q7a: 5, q7b: 5,
    q8a: 5, q8b: 5,
  });
  assert.equal(allTop, 5);

  const allBottom = computeEngineeringCurrentLevel({
    q1a: 1, q1b: 1, q1c: 1,
    q2a: 1, q2b: 1, q2c: 1, q2d: 1,
    q3a: 1, q4a: 1, q5a: 1,
    q6a: 1, q6b: 1,
    q7a: 1, q7b: 1,
    q8a: 1, q8b: 1,
  });
  assert.equal(allBottom, 1);
});

test("questionnaire scoring: production current level averages the 8 questions (CALC1!B20)", () => {
  const level = computeProductionCurrentLevel(defaultProductionAnswers);
  assert.equal(level, 1.25);

  const uniform = computeProductionCurrentLevel({
    q11: 3, q12: 3, q13: 3, q14: 3, q15: 3, q16: 3, q17: 3, q18: 3,
  });
  assert.equal(uniform, 3);
});

test("questionnaire scoring: changing an answer updates the current level", () => {
  const before = computeEngineeringCurrentLevel(defaultEngineeringAnswers);
  const after = computeEngineeringCurrentLevel({
    ...defaultEngineeringAnswers,
    q1a: 5,
  });
  assert.ok(after > before);
});

test("savings updates: report reflects input FTE/rate/time-share changes", () => {
  const zeroInput = { ...defaults };
  const zeroReport = calculate(zeroInput);
  assert.equal(zeroReport.engineeringCost, 0);
  assert.equal(zeroReport.productionCost, 0);
  assert.equal(zeroReport.engineeringSavings10, 0);

  const staffedInput = {
    ...defaults,
    engineeringFte: 2,
    engineeringRate: 75,
    engineeringTimeShare: 1,
    workingHoursPerDay: 8,
    workingDaysPerYear: 235,
    productionFte: 4,
    productionRate: 40,
    productionTimeShare: 1,
  };
  const staffedReport = calculate(staffedInput);

  const expectedEngineeringHours = 235 * 8 * 2 * 1;
  const expectedEngineeringCost = expectedEngineeringHours * 75;
  assert.equal(staffedReport.engineeringHours, expectedEngineeringHours);
  assert.equal(staffedReport.engineeringCost, expectedEngineeringCost);
  assert.equal(staffedReport.engineeringSavings10, expectedEngineeringCost * 0.1);
  assert.equal(staffedReport.engineeringSavings20, expectedEngineeringCost * 0.2);
  assert.equal(staffedReport.engineeringSavings30, expectedEngineeringCost * 0.3);

  const expectedProductionHours = 8 * 235 * 4 * 1;
  const expectedProductionCost = expectedProductionHours * 40;
  assert.equal(staffedReport.productionHours, expectedProductionHours);
  assert.equal(staffedReport.productionCost, expectedProductionCost);

  // Raising the FTE count should raise the cost-driven savings figures.
  const moreStaff = calculate({ ...staffedInput, engineeringFte: 4 });
  assert.ok(moreStaff.engineeringCost > staffedReport.engineeringCost);
  assert.ok(moreStaff.engineeringSavingPotential !== staffedReport.engineeringSavingPotential);
});

test("savings updates: report exposes the current/target levels used for the ratios", () => {
  const report = calculate(defaults);
  assert.equal(report.engineeringCurrentLevel, 2.1458333333333335);
  assert.equal(report.engineeringTargetLevel, 3.68);
  assert.equal(report.productionCurrentLevel, 1.25);
  assert.equal(report.productionTargetLevel, 3.5);
});

test("recommendation status updates: below current level is already available", () => {
  assert.equal(
    recommendationStatus(1.5, 2.15, 3.68),
    "Should already be available/implemented",
  );
});

test("recommendation status updates: above target level is a future improvement", () => {
  assert.equal(
    recommendationStatus(4.5, 2.15, 3.68),
    "Possible future improvement",
  );
});

test("recommendation status updates: between current and target is offered now", () => {
  assert.equal(
    recommendationStatus(3, 2.15, 3.68),
    "To be offered/implemented",
  );
});

test("recommendation status updates: raising the target level can flip a future improvement to offered now", () => {
  const neededFromLevel = 4;
  const currentLevel = 2.15;
  assert.equal(
    recommendationStatus(neededFromLevel, currentLevel, 3.68),
    "Possible future improvement",
  );
  assert.equal(
    recommendationStatus(neededFromLevel, currentLevel, 4.5),
    "To be offered/implemented",
  );
});

test("recommendation quantity formatting reflects FTE inputs and fixed/tbd rows", () => {
  const input = { ...defaults, engineeringFte: 3, productionFte: 5 };
  assert.equal(formatQuantity({ kind: "engineeringFte" }, input), "3.0");
  assert.equal(formatQuantity({ kind: "productionFte" }, input), "5.0");
  assert.equal(formatQuantity({ kind: "fixed", value: 4 }, input), "4");
  assert.equal(formatQuantity({ kind: "tbd" }, input), "TBD");
});
