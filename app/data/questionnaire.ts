// Questionnaire structure and scoring mirrored from the ELA2 workbook's
// `Questionnaire` and `Menus` sheets. Pure data/types — no React, no
// formatting — so it can be unit tested and reused by any UI.

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

// Fully "0. Select value" — used by the "Clear assessment" action.
export const blankEngineeringAnswers: EngineeringAnswers = {
  q1a: 0,
  q1b: 0,
  q1c: 0,
  q2a: 0,
  q2b: 0,
  q2c: 0,
  q2d: 0,
  q3a: 0,
  q4a: 0,
  q5a: 0,
  q6a: 0,
  q6b: 0,
  q7a: 0,
  q7b: 0,
  q8a: 0,
  q8b: 0,
};

export const blankProductionAnswers: ProductionAnswers = {
  q11: 0,
  q12: 0,
  q13: 0,
  q14: 0,
  q15: 0,
  q16: 0,
  q17: 0,
  q18: 0,
};

export const avg = (...values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

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

// Menus!A2:Y2 — every question list starts with this placeholder before an
// answer has been chosen. A score of 0 is a valid, real "unanswered" state
// (it lowers the section/current-level average, same as the workbook).
const unselectedOption: QuestionOption = { value: 0, label: "0. Select value" };

function withUnselected(options: QuestionOption[]): QuestionOption[] {
  return [unselectedOption, ...options];
}

// Menus!D2:G7 — identical option set shared by the 4 "Delivery specifications"
// sub-questions.
const genericRequirementOptions: QuestionOption[] = withUnselected([
  { value: 1, label: "Changes in requirements are processed manual." },
  { value: 2, label: "between 1 and 3" },
  { value: 3, label: "Templates and structures take into account the some variance in requirements." },
  { value: 4, label: "between 3 and 5" },
  { value: 5, label: "Automation allows to switch between different requirements." },
]);

export const engineeringSections: SectionDefinition<keyof EngineeringAnswers>[] = [
  {
    number: "1.",
    title: "Order specifications",
    questions: [
      {
        id: "q1a",
        prompt: "How does the customer and order data reach the design department?",
        options: withUnselected([
          { value: 1, label: "Order data and requirements are transferred unstructured and mainly in paper. Supported by various meetings." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Order data and requirements are transferred based on existing templates (checklists, templates, option and variant lists, tables, etc.)." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Order data and requirements are gathered by a system (e.g. sales configurator) and automatically transferred to the design department." },
        ]),
      },
      {
        id: "q1b",
        prompt: "How is the order data and requirements handled in the design department?",
        options: withUnselected([
          { value: 1, label: "The storage of order data and requirements is mainly digital but not reusable (e.g. scanned documents, sketches, PDF)." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The storage of order data and requirements is mainly digital and reusable (e.g. Excel spreadsheet and templates)." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The storage of order data and requirements is fully digital and adapted for further usage (e.g. structured documentation in PDM system)." },
        ]),
      },
      {
        id: "q1c",
        prompt: "Does the order data transferred to the design department contain a sensor-actuator list?",
        options: withUnselected([
          { value: 1, label: "The design department does not receive a sensor-actuator list." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The design department receives preliminary sensor-actuator list." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The design department receives detailed sensor-actuator lists, which can be further processed automatically." },
        ]),
      },
    ],
  },
  {
    number: "2.",
    title: "Delivery specifications",
    questions: [
      { id: "q2a", prompt: "Applicable norms and standards", options: genericRequirementOptions },
      { id: "q2b", prompt: "Used languages and translation", options: genericRequirementOptions },
      { id: "q2c", prompt: "Parts selection and standardisation", options: genericRequirementOptions },
      { id: "q2d", prompt: "Documentation (source/target specification, etc.)", options: genericRequirementOptions },
    ],
  },
  {
    number: "3.",
    title: "Engineering",
    questions: [
      {
        id: "q3a",
        prompt: "How are new technical solutions (ETO) developed?",
        options: withUnselected([
          { value: 1, label: "New technical solutions are designed in a manual process (e.g. based on sketches)." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "New technical solutions are designed in a digital process." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "New technical solutions are designed in a digital process and new design is evaluated in order to extend existing standard." },
        ]),
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
        options: withUnselected([
          { value: 1, label: "The circuit diagrams are created manually by placing graphical symbols or partial circuits (e.g. copy and paste)." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The circuit diagrams are created based on a central macro library with product functions and stored data tables." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The circuit diagrams are mainly generated automatically based on a connection with a configurator." },
        ]),
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
        options: withUnselected([
          { value: 1, label: "The verification of the schematics is done manually by reviewing all schematics pages." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The check of the circuit diagrams is done by automated mass controls and corrections (checking page cross-references)." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The functional checks of the circuit diagrams are almost completely eliminated (e.g. generation)." },
        ]),
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
        options: withUnselected([
          { value: 1, label: "The circuit diagram doesn't contain article information, the BOM is created manual in a separate list." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The circuit diagram contains some article information (main parts) and is extended manually in parallel parts lists." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The circuit diagram contains full article information and a detailed and structured BOM can be exported." },
        ]),
      },
      {
        id: "q6b",
        prompt: "How is the bill of materials created and processed?",
        options: withUnselected([
          { value: 1, label: "The BOM is created and processed manually." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The BOM is created automatically from CAE and manually processed and transferred to the ERP system." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The BOM is created automatically from CAE and automaticlly processed and transferred to the ERP system." },
        ]),
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
        options: withUnselected([
          { value: 1, label: "Only the circuit diagram is supplied to production." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Terminal diagrams, assembly diagrams etc. are prepared for production." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Complete wiring lists with ready-made wires are created for production." },
        ]),
      },
      {
        id: "q7b",
        prompt: "How is the production documentation generated?",
        options: withUnselected([
          { value: 1, label: "The production documentation is created manually." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The production documentation is created partially automated by means of forms and templates." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The production documentation is automatically created and stored in a ERP/PDM system." },
        ]),
      },
    ],
  },
  {
    number: "8.",
    title: "Cabinet design",
    questions: [
      {
        id: "q8a",
        prompt: "Which drawing & design method is used to create the cabinet design and layout?",
        options: withUnselected([
          { value: 1, label: "The cabinet design is carried out with sketches and without article reference." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The cabinet design is carried out graphically in 2D based on article information." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The cabinet design is carried out graphically in 3D based on article information." },
        ]),
      },
      {
        id: "q8b",
        prompt: "In which detail and quality level does the customer create cabinet layout drawings?",
        options: withUnselected([
          { value: 1, label: "The cabinet design contains only the dimensions (construction plan)." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The cabinet design allows automatic derivation of the NC data/programming (cut-outs, drilling, tapping)." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The cabinet design allows wiring routing (wire length calculation)." },
        ]),
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
        options: withUnselected([
          { value: 1, label: "No BOM available" },
          { value: 2, label: "BOM manual created" },
          { value: 3, label: "BOM created based on CAE system" },
          { value: 4, label: "BOM created based on CAE system with all panel components and accessories" },
          { value: 5, label: "BOM per mounting location (e.g. individual BOMs for the body of the cabinet and one for the door)" },
        ]),
      },
    ],
  },
  {
    number: "12.",
    title: "Panel modification",
    questions: [
      {
        id: "q12",
        prompt: "How are holes and cutouts made to the doors and mounting panels?",
        options: withUnselected([
          { value: 1, label: "Manual drilling and cutting according to each worker's own judgement" },
          { value: 2, label: "Manual drilling and cutting using dimensioned panel layouts" },
          { value: 3, label: "Manual drilling and cutting using templates from CAE software" },
          { value: 4, label: "Using NC machines; data entered manually" },
          { value: 5, label: "Using NC machines; data imported from CAE software" },
        ]),
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
        options: withUnselected([
          { value: 1, label: "Labels are typed in manually from the schematic and printed out" },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The label information is exported from CAE and manually transferred to a label maker" },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The label information is transferred automatically from the CAD/CAE to a label maker" },
        ]),
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
        options: withUnselected([
          { value: 1, label: "Manual fabrication during wiring" },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Using a NC cutting and crimping machine, semi automated" },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Using a NC cutting and crimping machine, fully automated or outsourced fabrication" },
        ]),
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
        options: withUnselected([
          { value: 1, label: "Manual measuring and cutting according to each worker's own judgement" },
          { value: 2, label: "Manual measuring and cutting using dimensioned panel layout" },
          { value: 3, label: "Manual cutting using cutting list from CAE software" },
          { value: 4, label: "Measuring and cutting performed by NC machines, data entered manually" },
          { value: 5, label: "Measuring and cutting performed by NC machines with data from CAE software" },
        ]),
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
        options: withUnselected([
          { value: 1, label: "Placement according to each worker's own judgement" },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Placement according to a basic panel layout" },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Placement according to a detailed panel layout" },
        ]),
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
        options: withUnselected([
          { value: 1, label: "Terminals are manually identified, placed and labeled based on the schematic" },
          { value: 2, label: "Terminals are manually identified, placed and labeled based on a terminal diagram" },
          { value: 3, label: "Preassembled by the manufacturer (e.g. Phoenix Contact Clip Project) with data from CAE software" },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Terminal strips are assembled automatically using a NC machine" },
        ]),
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
        options: withUnselected([
          { value: 1, label: "Schematic diagrams" },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Wiring / connection lists (only source and target information)" },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Digital panel wiring tool (wire size, length, termination type, routing path, source and target)" },
        ]),
      },
    ],
  },
];
