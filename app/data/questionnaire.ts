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

export const engineeringSections: SectionDefinition<keyof EngineeringAnswers>[] = [
  {
    number: "1.",
    title: "Order specifications",
    questions: [
      {
        id: "q1a",
        prompt: "A new order has just been won. What does engineering normally receive before they can start designing?",
        options: withUnselected([
          { value: 1, label: "Emails, meeting notes, marked-up drawings, PDFs and verbal information from different people." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "A standard checklist or template with the major requirements and options." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Structured order / configuration information flows directly into engineering." },
        ]),
      },
      {
        id: "q1b",
        prompt: "Once engineering receives the project requirements, how easy is it to reuse that information during the design?",
        options: withUnselected([
          { value: 1, label: "Engineers mostly read PDFs / notes and re-enter what they need." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Key information is stored in reusable spreadsheets / templates." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Requirements are structured and can drive downstream engineering automatically." },
        ]),
      },
      {
        id: "q1c",
        prompt: "Before design begins, how complete is the device / I-O information engineering receives?",
        options: withUnselected([
          { value: 1, label: "Engineering has to identify most sensors, actuators and I-O during design." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "A preliminary device / I-O list is available." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "A detailed, structured list is ready to be used by engineering systems." },
        ]),
      },
    ],
  },
  {
    number: "2.",
    title: "Delivery specifications",
    questions: [
      {
        id: "q2a",
        prompt: "A customer requires a different electrical standard or regional requirement. What normally happens?",
        options: withUnselected([
          { value: 1, label: "Engineers manually review and change the design." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Standard templates cover some common requirements." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Approved rules / automation switch the design to the required standard." },
        ]),
      },
      {
        id: "q2b",
        prompt: "The same machine or panel is sold into another country and the documentation must change language. How is that handled?",
        options: withUnselected([
          { value: 1, label: "Text is translated and edited manually." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Templates / translation tables handle common content." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Language-specific documentation is generated from structured data." },
        ]),
      },
      {
        id: "q2c",
        prompt: "An engineer needs a breaker, contactor, PLC card, VFD or other device. How do they select it and get it into the design?",
        options: withUnselected([
          { value: 1, label: "Search catalogs / websites and manually build the device data." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Select from an internal standardized parts library." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Approved product rules and structured device data drive selection." },
        ]),
      },
      {
        id: "q2d",
        prompt: "A customer requires different deliverables, tags, source/target details or report formats. How is that handled?",
        options: withUnselected([
          { value: 1, label: "Someone manually modifies the project / reports." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Standard templates cover common customer variations." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Structured rules automatically generate the required deliverables." },
        ]),
      },
    ],
  },
  {
    number: "3.",
    title: "Engineering",
    questions: [
      {
        id: "q3a",
        prompt: "Think about the last project that required a genuinely new technical solution. How did the engineer build it?",
        options: withUnselected([
          { value: 1, label: "Start from sketches / previous jobs and engineer it manually." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Design it digitally using company standards and reusable content." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Design it digitally, then convert the new solution into a reusable company standard." },
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
        prompt: "A new project comes in that is similar to something your team has built before. How does the electrical designer typically get started?",
        options: withUnselected([
          { value: 1, label: "Blank project or copy/paste pages and circuits from old jobs." },
          { value: 2, label: "Find the closest old project and manually modify most of it." },
          { value: 3, label: "Build from approved macros, circuits, templates and device data." },
          { value: 4, label: "Configure most of the design from predefined options / rules." },
          { value: 5, label: "A configurator or automated process generates most of the design." },
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
        prompt: "Your engineer says the electrical design is finished. What happens before it is released to production?",
        options: withUnselected([
          { value: 1, label: "Someone manually reviews the drawings page-by-page." },
          { value: 2, label: "Manual review using experience / checklists." },
          { value: 3, label: "Software catches some issues, but a detailed manual review is still required." },
          { value: 4, label: "Most common electrical / documentation errors are identified automatically." },
          { value: 5, label: "The engineering process prevents or automatically identifies most common errors before release." },
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
        prompt: "Engineering releases a project and purchasing needs the BOM. How complete is the information coming directly from the electrical design?",
        options: withUnselected([
          { value: 1, label: "Purchasing / engineering builds the BOM separately." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "The design contains the main parts, but someone still adds / corrects information." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "The design contains complete structured device data and can produce a detailed BOM." },
        ]),
      },
      {
        id: "q6b",
        prompt: "Once the BOM is generated, what normally happens before purchasing / ERP can use it?",
        options: withUnselected([
          { value: 1, label: "Someone creates and processes it manually." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Most of it is generated, but someone cleans it up and transfers it manually." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "It is generated and transferred automatically with little or no re-entry." },
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
        prompt: "A panel builder receives the job from engineering tomorrow morning. What information will they have to build it?",
        options: withUnselected([
          { value: 1, label: "Primarily the schematic." },
          { value: 2, label: "Schematic plus some additional drawings / instructions." },
          { value: 3, label: "Schematic, terminal information, panel layout and supporting reports." },
          { value: 4, label: "Detailed connections, devices, layouts and manufacturing information." },
          { value: 5, label: "Build-ready digital information such as wiring data, lengths / routing, terminal data and machine-ready manufacturing data." },
        ]),
      },
      {
        id: "q7b",
        prompt: "When the design changes, what happens to the terminal diagrams, wiring lists, BOMs, labels and other production reports?",
        options: withUnselected([
          { value: 1, label: "Someone manually updates / recreates them." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Most reports are generated from the design, but some manual work remains." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Updated documentation is generated and stored / distributed automatically." },
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
        prompt: "Your engineer needs to determine where everything will fit inside the enclosure. How is that normally done?",
        options: withUnselected([
          { value: 1, label: "Experience, dimensions and sketches." },
          { value: 2, label: "Basic 2D layout using approximate / manual dimensions." },
          { value: 3, label: "Detailed 2D layout using actual device information." },
          { value: 4, label: "3D digital layout using actual devices and enclosure geometry." },
          { value: 5, label: "Detailed 3D layout also drives downstream manufacturing information." },
        ]),
      },
      {
        id: "q8b",
        prompt: "Once the panel layout is created, what can that design information be used for?",
        options: withUnselected([
          { value: 1, label: "Primarily dimensions / construction reference." },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "It can create manufacturing data such as drilling, cutouts or NC programming." },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "It can also support routing, wire lengths and other production-ready information." },
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
        prompt: "The shop is ready to pull and stage parts for a panel. What kind of BOM do they receive?",
        options: withUnselected([
          { value: 1, label: "There is no reliable BOM; parts are identified from drawings or experience" },
          { value: 2, label: "Someone manually creates a BOM for the build" },
          { value: 3, label: "The BOM is generated from the electrical design" },
          { value: 4, label: "The generated BOM includes the full set of panel components and accessories" },
          { value: 5, label: "The BOM is organized by where parts will be installed, making kitting and staging easier" },
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
        prompt: "A technician is ready to drill and cut the enclosure or mounting plate. How do they know exactly where each hole and cutout goes?",
        options: withUnselected([
          { value: 1, label: "They measure and lay it out themselves based on drawings and experience" },
          { value: 2, label: "They work from a dimensioned panel layout" },
          { value: 3, label: "Engineering provides drilling / cutout templates or manufacturing drawings" },
          { value: 4, label: "An NC machine is used, but someone manually enters the coordinates / data" },
          { value: 5, label: "Manufacturing data flows directly from engineering to the NC machine" },
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
        prompt: "When it is time to label devices, terminals and components, how does the label information get from engineering to the printer?",
        options: withUnselected([
          { value: 1, label: "Someone reads the drawing and types the labels manually" },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Label data is exported from engineering, then manually imported / transferred into the label software" },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Label data flows directly from the engineering system to the label printer with little or no re-entry" },
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
        prompt: "When a panel builder needs the next wire, how is that wire cut, stripped, terminated and identified?",
        options: withUnselected([
          { value: 1, label: "The technician measures and fabricates each wire manually while wiring" },
          { value: 2, label: "between 1 and 3" },
          { value: 3, label: "Wire data is used with a cutting / crimping machine, but some setup or handling is still manual" },
          { value: 4, label: "between 3 and 5" },
          { value: 5, label: "Complete wire data drives automated fabrication, or ready-to-install wires are supplied from an automated / outsourced process" },
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
        prompt: "A technician is preparing DIN rail and wire duct for a panel. How do they determine each cut length?",
        options: withUnselected([
          { value: 1, label: "They measure the panel and determine each cut themselves" },
          { value: 2, label: "They work from dimensions shown on the panel layout" },
          { value: 3, label: "Engineering provides a cut list with the required lengths" },
          { value: 4, label: "A machine performs the cuts, but someone manually enters the data" },
          { value: 5, label: "Cut data flows directly from engineering to the cutting machine" },
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
        prompt: "When someone starts mounting devices in the enclosure, what do they use to know exactly where each component goes?",
        options: withUnselected([
          { value: 1, label: "The assembler relies heavily on experience and interprets the schematic / available information" },
          { value: 2, label: "A basic drawing gives general placement, but the assembler still makes many layout decisions" },
          { value: 3, label: "A panel layout shows where major components should be installed" },
          { value: 4, label: "A detailed layout includes accurate devices, dimensions and mounting information" },
          { value: 5, label: "Production receives a detailed build-ready layout that minimizes interpretation on the shop floor" },
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
        prompt: "The technician is ready to build a terminal strip. How do they know which terminals to use, the order, and how each one should be labeled?",
        options: withUnselected([
          { value: 1, label: "They work through the schematic and manually identify, place and label each terminal" },
          { value: 2, label: "They work from a dedicated terminal diagram but still assemble and label manually" },
          { value: 3, label: "Structured engineering data can be sent to a supplier to preassemble the terminal strip" },
          { value: 4, label: "Much of the preparation is automated, with limited manual assembly remaining" },
          { value: 5, label: "Terminal-strip data directly drives an automated assembly process" },
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
        prompt: "When the electrician is wiring the panel, what information do they have for each connection?",
        options: withUnselected([
          { value: 1, label: "They trace the schematic to determine each connection" },
          { value: 2, label: "They use the schematic plus some supplemental wiring information" },
          { value: 3, label: "A connection list identifies the source and target for each wire" },
          { value: 4, label: "Wiring data also includes details such as wire size, color or termination information" },
          { value: 5, label: "A digital wiring workflow provides source, target, wire properties, length / routing and step-by-step build information" },
        ]),
      },
    ],
  },
];
