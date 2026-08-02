import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("server-renders the ELA2 report builder", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>ELA2 Usage Level Report Builder<\/title>/i);
  assert.match(html, /ELA2 Usage Level Report/i);
  assert.match(html, /Company Profile/i);
  assert.match(html, /Engineering Status/i);
  assert.match(html, /Production time \[%\]/i);
  assert.match(html, /Usage Level Questionnaire/i);
  assert.match(html, /Engineering Level Assessment/i);
  assert.match(html, /Panel Production Level Assessment/i);
  assert.match(html, />To be offered</i);
  assert.match(html, /Improvements to engineering/i);
  assert.match(html, /Improvements to production/i);
  assert.match(html, /rittal-logo\.png/);

  // Requirement #1/#11: workbook defaults must be applied on load, not a
  // static, misleading $0.00 total.
  assert.match(html, /\$137,813\.21/);
  assert.doesNotMatch(html, /\$0\.00/);
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
