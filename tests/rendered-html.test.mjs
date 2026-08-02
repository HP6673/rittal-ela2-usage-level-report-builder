import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the ELA2 report builder with workbook defaults applied", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>ELA2 Usage Level Report Builder<\/title>/i);
  assert.match(html, /ELA2 Usage Level Report/i);
  assert.match(html, /Company profile/i);
  assert.match(html, /Engineering status/i);
  assert.match(html, /Production time \[%\]/i);
  assert.match(html, /Engineering questionnaire/i);
  assert.match(html, /Panel production questionnaire/i);
  assert.match(html, /Results\s*(&|&amp;)\s*savings/i);
  assert.match(html, /Recommended offering/i);
  assert.match(html, /Print \/ export report/i);
  assert.match(html, /Improvements to engineering/i);
  assert.match(html, /Improvements to production/i);
  assert.match(html, /rittal-logo\.png/);

  // Requirement #1 — the new "General information" fields must be present.
  assert.match(html, /Company name/i);
  assert.match(html, /Segment \/ industry/i);
  assert.match(html, />Options</i);
  assert.match(html, />Variants</i);
  assert.match(html, /General rating on ECAD usage/i);
  assert.match(html, /External engineering/i);
  assert.match(html, /External cabinet production/i);
  assert.match(html, />ECAD</);
  assert.match(html, />MCAD</);
  assert.match(html, /PDM\/PLM/);
  assert.match(html, />ERP</);

  // Requirement #1/#8 — workbook defaults must be applied on load, not a
  // static, misleading $0.00 total.
  assert.match(html, /\$137,813\.21/);
  assert.doesNotMatch(html, /\$0\.00/);

  // Requirement #6 — the two *editable* target-level fields must have
  // unambiguous, distinct <label> text (read-only summary displays grouped
  // under an "Engineering"/"Production" card heading are unaffected).
  assert.match(html, /Engineering target level/i);
  assert.match(html, /Production target level/i);
  assert.doesNotMatch(html, /<label[^>]*>\s*Target level\s*<\/label>/i);

  // Requirement #4 — the workbook's unanswered/unscored state must be a
  // real, selectable option (not silently omitted). The score prefix is
  // shown as its own badge, so the label text renders without "0. ".
  assert.match(html, /value="0"/);
  assert.match(html, />Select value</i);

  // Requirement #14 — quick status filters with counts. React SSR inserts
  // `<!-- -->` hydration markers between adjacent JSX text expressions, so
  // allow a little slack between the label and its count instead of
  // requiring them contiguous.
  assert.match(html, /To be offered\/implemented[\s\S]{0,40}\d+/i);
  assert.match(html, /Possible future improvement[\s\S]{0,40}\d+/i);
  assert.match(html, /Should already be available\/implemented[\s\S]{0,40}\d+/i);

  // Requirement #16 — reset/clear actions must exist.
  assert.match(html, /Reset to workbook defaults/i);
  assert.match(html, /Clear assessment/i);
});

test("keeps deployment metadata and source aligned", async () => {
  const [page, layout, calculator, packageJson, wrangler] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/Calculator.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../wrangler.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /export const metadata:\s*Metadata/);
  assert.match(page, /<Calculator \/>/);
  assert.match(layout, /title:\s*"ELA2 Usage Level Report Builder"/);
  assert.match(calculator, /src="\/rittal-logo\.png"/);
  assert.match(packageJson, /"packageManager": "pnpm@11\.9\.0"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(wrangler, /"compatibility_flags": \["nodejs_compat"\]/);
  assert.doesNotMatch(layout, /codex-preview|_sites-preview|themeColor|\bViewport\b/);
});

test("requirement #19: Calculator.tsx delegates to a component/data/lib file structure", async () => {
  const [dataFiles, libFiles, componentFiles] = await Promise.all([
    readdir(new URL("../app/data/", import.meta.url)),
    readdir(new URL("../app/lib/", import.meta.url)),
    readdir(new URL("../app/components/", import.meta.url)),
  ]);

  assert.ok(dataFiles.includes("questionnaire.ts"));
  assert.ok(dataFiles.includes("offers.ts"));
  assert.ok(libFiles.includes("calculations.ts"));
  assert.ok(componentFiles.includes("InputSection.tsx"));
  assert.ok(componentFiles.includes("QuestionnaireSection.tsx"));
  assert.ok(componentFiles.includes("Charts.tsx"));
  assert.ok(componentFiles.includes("ReportSummary.tsx"));
  assert.ok(componentFiles.includes("Recommendations.tsx"));
  assert.ok(componentFiles.includes("PrintReport.tsx"));

  const calculator = await readFile(new URL("../app/Calculator.tsx", import.meta.url), "utf8");
  assert.ok(
    calculator.split("\n").length < 420,
    "Calculator.tsx should stay a thin orchestrator, not a monolith (the original single-file version was ~1000 lines)",
  );
});

test("requirement #9/#20: fixed oversized min-widths are confined to intentionally scrollable table/chart containers", async () => {
  const componentDir = new URL("../app/components/", import.meta.url);
  const files = await readdir(componentDir);
  const fixedWidthPattern = /min-w-\[\d+px\]/g;
  // These three render their own `overflow-x-auto` wrapper (contained
  // horizontal scroll for a data-dense desktop table/chart) and are hidden
  // below their responsive breakpoint in favor of stacked cards — this is
  // the deliberate exception, not the questionnaire/input controls.
  const allowed = new Set(["Charts.tsx", "Recommendations.tsx", "ReportSummary.tsx"]);

  for (const file of files) {
    const contents = await readFile(new URL(file, componentDir), "utf8");
    const matches = contents.match(fixedWidthPattern) ?? [];

    if (allowed.has(file)) {
      assert.ok(matches.length > 0, `${file} should keep its scrollable min-width`);
    } else {
      assert.equal(
        matches.length,
        0,
        `${file} should not rely on a fixed oversized min-width (found: ${matches.join(", ")})`,
      );
    }
  }
});
