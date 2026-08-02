// Pure calculation logic mirrored from the ELA2 workbook (Questionnaire, Menus,
// CALC1/CALC2 and Report sheets). Kept free of JSX/React so it can be unit
// tested directly and imported by the client component.

export type EngineeringAnswers = {
  q1a: number;
  q1b: number;
  q1c: number;
  q2a: number;
  q2b: number;
  q2c: number;
  q2d: number;
  q3a: number;
  q4a: number;
  q5a: number;
  q6a: number;
  q6b: number;
  q7a: number;
  q7b: number;
  q8a: number;
  q8b: number;
};

export type ProductionAnswers = {
  q11: number;
  q12: number;
  q13: number;
  q14: number;
  q15: number;
  q16: number;
  q17: number;
  q18: number;
};

export type Inputs = {
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
  engineeringAnswers: EngineeringAnswers;
  productionAnswers: ProductionAnswers;
  engineeringTargetLevel: number;
  productionTargetLevel: number;
};

// Matches the answers currently selected in Questionnaire!C5:C34 (engineering)
// and C41:C62 (production) in the source workbook.
export const defaultEngineeringAnswers: EngineeringAnswers = {
  q1a: 1,
  q1b: 1,
  q1c: 3,
  q2a: 3,
  q2b: 1,
  q2c: 3,
  q2d: 3,
  q3a: 3,
  q4a: 1,
  q5a: 1,
  q6a: 3,
  q6b: 3,
  q7a: 3,
  q7b: 3,
  q8a: 3,
  q8b: 1,
};

export const defaultProductionAnswers: ProductionAnswers = {
  q11: 2,
  q12: 1,
  q13: 1,
  q14: 1,
  q15: 1,
  q16: 2,
  q17: 1,
  q18: 1,
};

export const defaults: Inputs = {
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
  engineeringAnswers: defaultEngineeringAnswers,
  productionAnswers: defaultProductionAnswers,
  engineeringTargetLevel: 3.68,
  productionTargetLevel: 3.5,
};

export const avg = (...values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

export const baseLevelLabels = [
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

export const yAxisTicks = [1, 0.75, 0.5, 0.25, 0];

export const levelKey = [
  ["1", "Basic - AutoCAD LT"],
  ["2", "Enhanced - ACE"],
  ["3", "Advanced - EPLAN"],
  ["4", "Automation - EPLAN eBuild"],
  ["5", "Configuration - EEC"],
] as const;

// CALC1!B4 — average of the 8 engineering section averages (E4, E9, E15,
// E18, E21, E24, E28, E32).
export function computeEngineeringCurrentLevel(answers: EngineeringAnswers) {
  const sectionAverages = [
    avg(answers.q1a, answers.q1b, answers.q1c),
    avg(answers.q2a, answers.q2b, answers.q2c, answers.q2d),
    answers.q3a,
    answers.q4a,
    answers.q5a,
    avg(answers.q6a, answers.q6b),
    avg(answers.q7a, answers.q7b),
    avg(answers.q8a, answers.q8b),
  ];

  return avg(...sectionAverages);
}

// CALC1!B20 — average of the 8 production question answers (E40, E43, E46,
// E49, E52, E55, E58, E61).
export function computeProductionCurrentLevel(answers: ProductionAnswers) {
  return avg(
    answers.q11,
    answers.q12,
    answers.q13,
    answers.q14,
    answers.q15,
    answers.q16,
    answers.q17,
    answers.q18,
  );
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

export function engineeringChartData(input: Inputs) {
  const currentLevel = computeEngineeringCurrentLevel(input.engineeringAnswers);
  const targetLevel = input.engineeringTargetLevel;

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
    hlookupApprox(currentLevel, denseStandardization),
    hlookupApprox(targetLevel, denseStandardization),
  ];
  const engineering = [
    ...sum1,
    hlookupApprox(currentLevel, denseEngineering),
    hlookupApprox(targetLevel, denseEngineering),
  ];
  const total = engineering.map((value, index) => value + standardization[index]);

  return {
    labels: [
      ...baseLevelLabels,
      number(currentLevel, 2),
      number(targetLevel, 2),
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

export function productionChartData(input: Inputs) {
  const currentLevel = computeProductionCurrentLevel(input.productionAnswers);
  const targetLevel = input.productionTargetLevel;

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
    hlookupApprox(currentLevel, denseProduction),
    hlookupApprox(targetLevel, denseProduction),
  ];
  const standardizationWithMarkers = [
    ...standardization,
    hlookupApprox(currentLevel, denseStandardization),
    hlookupApprox(targetLevel, denseStandardization),
  ];

  return {
    labels: [
      ...baseLevelLabels,
      number(currentLevel, 2),
      number(targetLevel, 2),
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

export function calculate(input: Inputs) {
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
  const engineeringCurrentLevel = computeEngineeringCurrentLevel(input.engineeringAnswers);
  const engineeringTargetLevel = input.engineeringTargetLevel;
  const productionCurrentLevel = computeProductionCurrentLevel(input.productionAnswers);
  const productionTargetLevel = input.productionTargetLevel;
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
    engineeringCurrentLevel,
    engineeringTargetLevel,
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
    productionCurrentLevel,
    productionTargetLevel,
    productionAsIsRatio,
    productionTargetRatio,
    productionDifference,
    productionSavingPotential: productionCost * productionDifference,
  };
}

export function money(value: number, currency: string) {
  return `${currency}${Math.round(value).toLocaleString()}`;
}

export function moneyWithCents(value: number, currency: string) {
  return `${currency}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function number(value: number, digits = 2) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function normalizeNumericInput(value: string) {
  if (value === "") {
    return 0;
  }

  const normalized = value
    .replace(/^0+(?=\d)/, "")
    .replace(/^(-?)0+(?=\d)/, "$1");

  return Number(normalized);
}

export type QuestionOption = { value: number; label: string };

export type QuestionDefinition<K extends string> = {
  id: K;
  prompt: string;
  options: QuestionOption[];
};

export type SectionDefinition<K extends string> = {
  number: string;
  title: string;
  questions: QuestionDefinition<K>[];
};

// Menus!D2:G7 — identical option set shared by the 4 "Delivery specifications"
// sub-questions.
const genericRequirementOptions: QuestionOption[] = [
  { value: 1, label: "Changes in requirements are processed manual." },
  { value: 2, label: "between 1 and 3" },
  { value: 3, label: "Templates and structures take into account the some variance in requirements." },
  { value: 4, label: "between 3 and 5" },
  { value: 5, label: "Automation allows to switch between different requirements." },
];

export const engineeringSections: SectionDefinition<keyof EngineeringAnswers>[] = [
  {
    number: "1.",
    title: "Order specifications",
    questions: [
      {
        id: "q1a",
        prompt: "How does the customer and order data reach the design department?",
        options: [
          { value: 1, label: "Order data and requirements are transferred unstructured and mainly in paper. Supported by various meetings." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Order data and requirements are transferred based on existing templates (checklists, templates, option and variant lists, tables, etc.)." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Order data and requirements are gathered by a system (e.g. sales configurator) and automatically transferred to the design department." },
        ],
      },
      {
        id: "q1b",
        prompt: "How is the order data and requirements handled in the design department?",
        options: [
          { value: 1, label: "The storage of order data and requirements is mainly digital but not reusable (e.g. scanned documents, sketches, PDF)." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The storage of order data and requirements is mainly digital and reusable (e.g. Excel spreadsheet and templates)." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The storage of order data and requirements is fully digital and adapted for further usage (e.g. structured documentation in PDM system)." },
        ],
      },
      {
        id: "q1c",
        prompt: "Does the order data transferred to the design department contains a sensor-actuator lists?",
        options: [
          { value: 1, label: "The design department does not receive a sensor-actuator list." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The design department receives preliminairy sensor-actuator list." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The design department receives detailed sensor-actuator lists, which can be further processed automatically." },
        ],
      },
    ],
  },
  {
    number: "2.",
    title: "Delivery specifications",
    questions: [
      { id: "q2a", prompt: "Applicable norms and standards", options: genericRequirementOptions },
      { id: "q2b", prompt: "Used languages and translation", options: genericRequirementOptions },
      { id: "q2c", prompt: "Parts selection and standardisations", options: genericRequirementOptions },
      { id: "q2d", prompt: "Documentation (Source target specification,…)", options: genericRequirementOptions },
    ],
  },
  {
    number: "3.",
    title: "Engineering",
    questions: [
      {
        id: "q3a",
        prompt: "How are new technical solutions (ETO) developed?",
        options: [
          { value: 1, label: "New technical solutions are designed in a manual process (e.g. based on sketches)." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "New technical solutions are designed in a digital process." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "New technical solutions are designed in a digital process and new design is evaluated in order to extend existing standard." },
        ],
      },
    ],
  },
  {
    number: "4.",
    title: "Design",
    questions: [
      {
        id: "q4a",
        prompt: "How are circuit diagrams created?",
        options: [
          { value: 1, label: "The circuit diagrams are created manually by placing graphical symbols or partial circuits (e.g. copy and paste)." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The circuit diagrams are created based on a central macro library with product functions and stored data tables." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The circuit diagrams are mainly generated automaticly based on a connection with a configurator." },
        ],
      },
    ],
  },
  {
    number: "5.",
    title: "Check",
    questions: [
      {
        id: "q5a",
        prompt: "How are circuit diagrams verified after creation?",
        options: [
          { value: 1, label: "The verification of the schematics is done manually by reviewing all schematics pages." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The check of the circuit diagrams is done by automated mass controls and corrections (checking page cross-references)." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The functional checks of the circuit diagrams are almost completely eliminated (e.g. generation)." },
        ],
      },
    ],
  },
  {
    number: "6.",
    title: "BOM",
    questions: [
      {
        id: "q6a",
        prompt: "Up to which level does the circuit diagram contain article information?",
        options: [
          { value: 1, label: "The circuit diagram doesn't contain article information, the BOM is created manual in a separate list." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The circuit diagram contains some article information (main parts) and is extended manually in parallel parts lists." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The circuit diagram containts full article information and a detailled and structured BOM can be exported." },
        ],
      },
      {
        id: "q6b",
        prompt: "How is the bills of materials created and processed?",
        options: [
          { value: 1, label: "The BOM is created and processed manually." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The BOM is created automatically from CAE and manually processed and transfered to the ERP system." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The BOM is created automatically from CAE and automaticlly processed and transfered to the ERP system." },
        ],
      },
    ],
  },
  {
    number: "7.",
    title: "Reports",
    questions: [
      {
        id: "q7a",
        prompt: "How complete is the electrical documentation for production?",
        options: [
          { value: 1, label: "Only the circuit diagram is supplied to production." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Terminal diagrams, assembly diagrams etc. are prepared for production." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Complete wiring lists with ready-made wires are created for production." },
        ],
      },
      {
        id: "q7b",
        prompt: "How is the production documentation generated?",
        options: [
          { value: 1, label: "The production documentation is created manually." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The production documentation is created partially automated by means of forms and templates." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The production documentation is automatically created and stored in a ERP/PDM system." },
        ],
      },
    ],
  },
  {
    number: "8.",
    title: "Cabinet design",
    questions: [
      {
        id: "q8a",
        prompt: "Which drawing & design method is used to create cabinet design and layout?",
        options: [
          { value: 1, label: "The cabinet design is carried out with sketches and without article reference." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The cabinet design is carried out graphically in 2D based on article information." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The cabinet design is carried out graphically in 3D based on article information." },
        ],
      },
      {
        id: "q8b",
        prompt: "In which detail and quality level does the customer create cabinet layout drawings?",
        options: [
          { value: 1, label: "The cabinet design contains only the dimensions (construction plan)." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The cabinet design allows automatic derivation of the NC data/programming (cut-outs, drilling, tapping)." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The cabinet design allows wiring routing (wire length calculation)." },
        ],
      },
    ],
  },
];

export const productionSections: SectionDefinition<keyof ProductionAnswers>[] = [
  {
    number: "11.",
    title: "Kitting",
    questions: [
      {
        id: "q11",
        prompt: "How do you structure your bill of materials?",
        options: [
          { value: 1, label: "No BOM available" },
          { value: 2, label: "BOM manual created" },
          { value: 3, label: "BOM created based on CAE system" },
          { value: 4, label: "BOM created based on CAE system with all panel components and accessories" },
          { value: 5, label: "BOM Per mounting location (e.g. individual BOMs for the body of the cabinet and one for the door)" },
        ],
      },
    ],
  },
  {
    number: "12.",
    title: "Panel Modification",
    questions: [
      {
        id: "q12",
        prompt: "How are holes and cutouts made to the doors and mounting panels?",
        options: [
          { value: 1, label: "Manual drilling and cutting according to each worker's own judgement" },
          { value: 2, label: "Manual drilling and cutting using dimensioned panel layouts" },
          { value: 3, label: "Manual drilling and cutting using templates from CAE software" },
          { value: 4, label: "Using NC machines; data entered manually" },
          { value: 5, label: "Using NC machines; data imported from CAE software" },
        ],
      },
    ],
  },
  {
    number: "13.",
    title: "Labeling devices",
    questions: [
      {
        id: "q13",
        prompt: "How do you create and apply the component labels?",
        options: [
          { value: 1, label: "Labels are typed in manually from the schematic and printed out" },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The Label information is exported from CAE and manually transferred to a label maker" },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The Label information is transferred automatically from the CAD/CAE to a label maker" },
        ],
      },
    ],
  },
  {
    number: "14.",
    title: "Wire fabrication",
    questions: [
      {
        id: "q14",
        prompt: "How do you fabricate the wires for your control panels?",
        options: [
          { value: 1, label: "Manual fabrication during wiring" },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Using a NC cutting and crimping machine, semi automated" },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Using a NC cutting and crimping machine, fully automated or outsourced fabrication" },
        ],
      },
    ],
  },
  {
    number: "15.",
    title: "Mechanical installation",
    questions: [
      {
        id: "q15",
        prompt: "Which method do you use to cut mounting rails, wire ducts and wire duct covers?",
        options: [
          { value: 1, label: "Manual measuring and cutting according to each worker's own judgement" },
          { value: 2, label: "Manual measuring and cutting using dimensioned panel layout" },
          { value: 3, label: "Manual cutting using cutting list from CAE Software" },
          { value: 4, label: "Measuring and cutting performed by NC machines, data entered manually" },
          { value: 5, label: "Measuring and cutting performed by NC machines with data from CAE software" },
        ],
      },
    ],
  },
  {
    number: "16.",
    title: "Devices installation",
    questions: [
      {
        id: "q16",
        prompt: "What documents do you use in the manufacturing process?",
        options: [
          { value: 1, label: "Placement according to each worker's own judgement" },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Placement according to a basic panel layout" },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Placement according to a detailed panel layout" },
        ],
      },
    ],
  },
  {
    number: "17.",
    title: "Terminal strip assembly",
    questions: [
      {
        id: "q17",
        prompt: "How do you assemble your terminal strips?",
        options: [
          { value: 1, label: "Terminals are manually identified, placed and labeled base on the schematic" },
          { value: 2, label: "Terminals are manually identified, placed and labeled base on a terminal diagram" },
          { value: 3, label: "Preassembled by the manufacturer (e.g. Phoenix Contact Clip Project) with data from CAE software" },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Terminal strips are assembled automatically using a NC machine" },
        ],
      },
    ],
  },
  {
    number: "18.",
    title: "Wiring",
    questions: [
      {
        id: "q18",
        prompt: "What documents do you use for the wiring process?",
        options: [
          { value: 1, label: "Schematic diagrams" },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Wiring / Connection lists (only source and target information)" },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Digital panel wiring tool (wire size, length, termination type, routing path, source and target)" },
        ],
      },
    ],
  },
];

export type RecommendationQuantity =
  | { kind: "fixed"; value: number }
  | { kind: "engineeringFte" }
  | { kind: "productionFte" }
  | { kind: "tbd" };

export type RecommendationItem = {
  item: string;
  type: string;
  quantity: RecommendationQuantity;
  neededFromLevel: number;
};

// "To be offered" sheet, "Improvements to engineering" table (A2:E16).
export const engineeringRecommendations: RecommendationItem[] = [
  { item: "Electric P8 Professional", type: "Software", quantity: { kind: "engineeringFte" }, neededFromLevel: 1.5 },
  { item: "Electric P8 basic training 5/8 days", type: "Training", quantity: { kind: "engineeringFte" }, neededFromLevel: 1.5 },
  { item: "IT implementation", type: "Consultancy", quantity: { kind: "fixed", value: 1 }, neededFromLevel: 1.5 },
  { item: "Setting up the EPLAN Project environment", type: "Consultancy", quantity: { kind: "fixed", value: 3 }, neededFromLevel: 1.5 },
  { item: "Product workshop Electric P8", type: "Consultancy", quantity: { kind: "fixed", value: 4 }, neededFromLevel: 2 },
  { item: "Creation of design data", type: "Consultancy", quantity: { kind: "fixed", value: 2 }, neededFromLevel: 2 },
  { item: "Macro training", type: "Training", quantity: { kind: "fixed", value: 2 }, neededFromLevel: 2.5 },
  { item: "Creation of design data", type: "Consultancy", quantity: { kind: "fixed", value: 2 }, neededFromLevel: 2.5 },
  { item: "Cogineer/eBUILD or EEC", type: "Software", quantity: { kind: "engineeringFte" }, neededFromLevel: 3 },
  { item: "Cogineer/eBUILD or EEC training", type: "Training", quantity: { kind: "engineeringFte" }, neededFromLevel: 3 },
  { item: "Automated schematic creation with eBuild / Cogineer", type: "Consultancy", quantity: { kind: "fixed", value: 4 }, neededFromLevel: 3 },
  { item: "Product structuring", type: "Consultancy", quantity: { kind: "fixed", value: 3 }, neededFromLevel: 3.5 },
  { item: "Optimizing workflows", type: "Consultancy", quantity: { kind: "fixed", value: 2 }, neededFromLevel: 4 },
  { item: "EPIS interface", type: "Software", quantity: { kind: "engineeringFte" }, neededFromLevel: 4.5 },
  { item: "EPIS requirement workshop", type: "Consultancy", quantity: { kind: "fixed", value: 3 }, neededFromLevel: 4.5 },
];

// "To be offered" sheet, "Improvements to production" table (A19:E37).
export const productionRecommendations: RecommendationItem[] = [
  { item: "Schematic derivations for production optimization", type: "Consultancy", quantity: { kind: "fixed", value: 2 }, neededFromLevel: 1.5 },
  { item: "Pro Panel Professional", type: "Software", quantity: { kind: "engineeringFte" }, neededFromLevel: 2 },
  { item: "Pro Panel Basic training 4 days", type: "Training", quantity: { kind: "engineeringFte" }, neededFromLevel: 2 },
  { item: "Setting up the EPLAN Project environment 3D", type: "Consultancy", quantity: { kind: "fixed", value: 2 }, neededFromLevel: 2 },
  { item: "Product workshop Pro Panel", type: "Consultancy", quantity: { kind: "fixed", value: 3 }, neededFromLevel: 2 },
  { item: "Creation of design data 3D", type: "Consultancy", quantity: { kind: "fixed", value: 3 }, neededFromLevel: 2 },
  { item: "Label printing machine", type: "Machine", quantity: { kind: "tbd" }, neededFromLevel: 2.5 },
  { item: "Routing & Production Elements", type: "Software", quantity: { kind: "engineeringFte" }, neededFromLevel: 3.5 },
  { item: "Wire Production Elements", type: "Software", quantity: { kind: "engineeringFte" }, neededFromLevel: 3.5 },
  { item: "EPLAN Smart Wiring", type: "Software", quantity: { kind: "productionFte" }, neededFromLevel: 3.5 },
  { item: "Semi automatic wire fabrication machine", type: "Machine", quantity: { kind: "tbd" }, neededFromLevel: 3.5 },
  { item: "Wiring training 1 day", type: "Training", quantity: { kind: "engineeringFte" }, neededFromLevel: 3.5 },
  { item: "EPLAN Pro Panel Production NC-DXF", type: "Software", quantity: { kind: "tbd" }, neededFromLevel: 4 },
  { item: "Perforex NC machine", type: "Machine", quantity: { kind: "tbd" }, neededFromLevel: 4 },
  { item: "Commissioning EPLAN interface to RSS machines", type: "Consultancy", quantity: { kind: "fixed", value: 1 }, neededFromLevel: 4 },
  { item: "Copper Design Elements", type: "Software", quantity: { kind: "engineeringFte" }, neededFromLevel: 4.5 },
  { item: "Secarex cutting machine", type: "Machine", quantity: { kind: "tbd" }, neededFromLevel: 4.5 },
  { item: "Wire Terminal wire fabrication or external supplier", type: "Machine", quantity: { kind: "tbd" }, neededFromLevel: 4.5 },
  { item: "Athex terminal strip machine", type: "Machine", quantity: { kind: "tbd" }, neededFromLevel: 5 },
];

// "To be offered" sheet status formula, e.g. D2:
// =IF(E2<CALC1!$T$3,"Should already be available/implemented",
//   IF(CALC1!$U$3<E2,"Possible future improvement","To be offered/implemented"))
export function recommendationStatus(
  neededFromLevel: number,
  currentLevel: number,
  targetLevel: number,
) {
  if (neededFromLevel < currentLevel) {
    return "Should already be available/implemented";
  }

  if (targetLevel < neededFromLevel) {
    return "Possible future improvement";
  }

  return "To be offered/implemented";
}

export function formatQuantity(quantity: RecommendationQuantity, input: Inputs) {
  switch (quantity.kind) {
    case "fixed":
      return String(quantity.value);
    case "tbd":
      return "TBD";
    case "engineeringFte":
      return number(input.engineeringFte, 1);
    case "productionFte":
      return number(input.productionFte, 1);
    default:
      return "";
  }
}
