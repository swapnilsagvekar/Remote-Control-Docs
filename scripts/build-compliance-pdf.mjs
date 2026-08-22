#!/usr/bin/env node
/**
 * Build the EU GDPR Compliance Review PDF.
 * Usage: npm run build:compliance
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const contentDir = join(projectRoot, "content");
const assetsDir = join(projectRoot, "assets");
const outputDir = join(projectRoot, "output");

const mdPath = join(contentDir, "complience.md");
const cssPath = join(assetsDir, "compliance-review.css");
const htmlPath = join(outputDir, "eu-gdpr-compliance-review.html");
const pdfPath = join(outputDir, "eu-gdpr-compliance-review.pdf");
const AUTHOR = "Swapnil Sagvekar";

async function loadMarked() {
  const candidates = [
    join(projectRoot, "node_modules/marked/lib/marked.esm.js"),
    join(projectRoot, "../Skitii-Backend/node_modules/marked/lib/marked.esm.js"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      const mod = await import(pathToFileURL(candidate).href);
      return mod.marked ?? mod.default;
    }
  }
  throw new Error(
    "Cannot find 'marked'. Run npm install in Skitii-Docs-Generation.",
  );
}

function transformMarkdown(md) {
  let body = md;

  // Cover already has the title — drop leading H1 + meta block before first ---
  body = body.replace(
    /^# Skitii — EU GDPR Compliance Review\s*\n+(?:\*\*[^\n]+\*\*\s*\n+)*---\s*\n+/,
    "",
  );

  // Highlight layer verdicts
  body = body.replace(
    /\*\*((?:Frontend|Backend|Database|Servers) verdict:)\*\*([^\n]+)/g,
    '<p class="verdict"><strong>$1</strong>$2</p>',
  );

  // Closing disclaimer
  body += `

<div class="disclaimer">
  <strong>Note:</strong> This document is an engineering review of the current Skitii codebase and infrastructure configuration.
  It is not a formal legal opinion. Legal counsel should validate before any external GDPR compliance claims.
</div>
`;

  return body;
}

function wrapStatusCells(html) {
  return html.replace(
    /<(td)>(\s*)(Missing|Present|Partial|Yes|No|No \/ Partial|Needs confirmation|Gap for EU|Not met|Not implemented|Not documented in product repos)(\s*)<\/td>/gi,
    (_m, tag, pre, status, post) => {
      const normalized = status.trim().toLowerCase();
      let color = "#334155";
      let bg = "#f1f5f9";
      if (
        normalized === "missing" ||
        normalized === "no" ||
        normalized === "not met" ||
        normalized === "not implemented" ||
        normalized.startsWith("gap")
      ) {
        color = "#b91c1c";
        bg = "#fef2f2";
      } else if (
        normalized === "present" ||
        normalized === "yes" ||
        normalized === "partial"
      ) {
        color = normalized === "partial" ? "#b45309" : "#047857";
        bg = normalized === "partial" ? "#fff7ed" : "#ecfdf5";
      } else if (normalized.includes("needs") || normalized.includes("not documented")) {
        color = "#b45309";
        bg = "#fff7ed";
      }
      return `<${tag}>${pre}<span style="display:inline-block;padding:0.12rem 0.45rem;border-radius:4px;background:${bg};color:${color};font-size:0.84em;">${status.trim()}</span>${post}</td>`;
    },
  );
}

function buildHtml(md, marked) {
  const transformed = transformMarkdown(md);
  let htmlBody = marked.parse(transformed, { gfm: true, breaks: false });
  htmlBody = wrapStatusCells(htmlBody);

  const css = readFileSync(cssPath, "utf8");
  const publishedOn = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Skitii — EU GDPR Compliance Review</title>
  <style>${css}</style>
</head>
<body>
  <section class="cover">
    <div class="cover-hero">
      <div class="cover-kicker">Skitii Internal Compliance Review</div>
      <h1>EU GDPR<br />Compliance Review</h1>
      <p class="cover-lead">
        Engineering assessment of Skitii Product Frontend, Admin Frontend, Backend,
        Database, and AWS infrastructure for EU GDPR readiness.
      </p>
      <div class="cover-badge">Not EU GDPR compliant today</div>
    </div>
    <div class="cover-meta">
      <div><strong>Author:</strong> ${AUTHOR}</div>
      <div><strong>Audience:</strong> Product, engineering, legal</div>
      <div><strong>Scope:</strong> Frontend · Backend · Database · Servers</div>
      <div><strong>Published:</strong> ${publishedOn}</div>
    </div>
  </section>
  <main class="content">
    <div class="doc-meta">
      <div><strong>Review date:</strong> 15 July 2026</div>
      <div><strong>Focus:</strong> EU GDPR readiness</div>
      <div><strong>Systems:</strong> Product + Admin + API + MongoDB + AWS</div>
    </div>
    ${htmlBody}
  </main>
</body>
</html>`;
}

async function loadPuppeteer() {
  const candidates = [
    join(projectRoot, "node_modules/puppeteer"),
    join(projectRoot, "../Skitii-Backend/node_modules/puppeteer"),
  ];
  for (const candidate of candidates) {
    if (existsSync(join(candidate, "package.json"))) {
      const require = createRequire(join(candidate, "package.json"));
      return require(candidate);
    }
  }
  return null;
}

function printWithChrome(html) {
  writeFileSync(htmlPath, html, "utf8");
  const chrome =
    ["/usr/bin/google-chrome", "/snap/bin/chromium", "/usr/bin/chromium-browser"].find(
      (p) => existsSync(p),
    ) ?? null;
  if (!chrome) {
    throw new Error("No Chrome/Chromium found to print PDF");
  }
  execFileSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      `--print-to-pdf=${pdfPath}`,
      "--no-margins",
      pathToFileURL(htmlPath).href,
    ],
    { stdio: "inherit" },
  );
}

async function buildPdf(html) {
  writeFileSync(htmlPath, html, "utf8");

  const puppeteer = await loadPuppeteer();
  if (!puppeteer) {
    console.log("Puppeteer not installed locally; falling back to Chrome headless...");
    printWithChrome(html);
    return;
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: existsSync("/usr/bin/google-chrome")
      ? "/usr/bin/google-chrome"
      : undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.emulateMediaType("print");
    await new Promise((r) => setTimeout(r, 500));
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", right: "16mm", bottom: "22mm", left: "16mm" },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width:100%;font-size:8px;color:#64748b;padding:0 16mm;font-family:Inter,sans-serif;">
          <span>Skitii — EU GDPR Compliance Review · ${AUTHOR}</span>
        </div>`,
      footerTemplate: `
        <div style="width:100%;font-size:8px;color:#64748b;padding:0 16mm;font-family:Inter,sans-serif;display:flex;justify-content:space-between;">
          <span>Confidential — internal compliance review</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>`,
    });
  } finally {
    await browser.close();
  }
}

async function main() {
  mkdirSync(outputDir, { recursive: true });

  console.log("Building HTML...");
  const marked = await loadMarked();
  const md = readFileSync(mdPath, "utf8");
  const html = buildHtml(md, marked);

  console.log("Generating PDF...");
  await buildPdf(html);

  console.log(`Done: ${pdfPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
