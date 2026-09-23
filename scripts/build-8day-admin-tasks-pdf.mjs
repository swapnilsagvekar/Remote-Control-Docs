#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const contentDir  = join(projectRoot, "content");
const assetsDir   = join(projectRoot, "assets");
const outputDir   = join(projectRoot, "output");

const mdPath   = join(contentDir, "skitii-trial-admin-8day-tasks.md");
const cssPath  = join(assetsDir,  "skitii-trial-spec.css");
const htmlPath = join(outputDir,  "skitii-trial-admin-8day-tasks.html");
const pdfPath  = join(outputDir,  "Skitii_Trial_Admin_8Day_Task_List.pdf");

function extractMeta(md) {
  const meta = {};
  for (const line of md.split("\n").slice(0, 20)) {
    const m = line.match(/^\*\*(.+?):\*\*\s*(.+)/);
    if (m) meta[m[1].trim()] = m[2].trim();
  }
  return meta;
}

function transformMarkdown(md) {
  md = md.replace(/^#[^\n]+\n[\s\S]*?---\n/, "");
  return md;
}

function buildHtml(md) {
  const meta = extractMeta(md);
  const transformed = transformMarkdown(md);
  const htmlBody = marked.parse(transformed, { gfm: true, breaks: false });
  const css = readFileSync(cssPath, "utf8");

  const version  = meta["Version"]  || "1.0";
  const date     = meta["Date"]     || "August 2026";
  const author   = meta["Author"]   || "Swapnil Sagvekar";
  const customer = meta["Customer"] || "Yenepoya Hospital";
  const scope    = meta["Scope"]    || "Trial Admin Panel + Trial Backend Admin APIs";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Skitii Trials — 8-Day Task List</title>
  <style>${css}</style>
</head>
<body>

  <section class="cover">
    <div class="cover-hero">
      <div class="cover-kicker">Skitii Trials Platform</div>
      <h1>8-Day Task List</h1>
      <p class="cover-sub">
        Day-by-day delivery plan for the Trial Admin Panel (Next.js)
        wired to Skitii Trial Backend admin GraphQL.
      </p>
    </div>
      <div class="cover-meta">
        <div class="cover-meta-item"><strong>Version</strong><span>${version}</span></div>
        <div class="cover-meta-item"><strong>Date</strong><span>${date}</span></div>
        <div class="cover-meta-item"><strong>Author</strong><span>${author}</span></div>
        <div class="cover-meta-item"><strong>Customer</strong><span>${customer}</span></div>
        <div class="cover-meta-item"><strong>Scope</strong><span>${scope}</span></div>
      </div>
  </section>

  <main class="content">
    ${htmlBody}
  </main>

</body>
</html>`;
}

async function buildPdf(html) {
  writeFileSync(htmlPath, html, "utf8");

  const puppeteer = await import("puppeteer");
  const executablePath = ["/usr/bin/google-chrome", "/snap/bin/chromium", "/usr/bin/chromium-browser"]
    .find((p) => existsSync(p));
  const browser = await puppeteer.default.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0" });
    await page.emulateMediaType("print");
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", right: "16mm", bottom: "18mm", left: "16mm" },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16mm 4px;
          font-family: Inter, system-ui, sans-serif;
          font-size: 7.5px;
        ">
          <div style="display:flex;align-items:center;gap:5px;">
            <span style="
              background: linear-gradient(135deg,#07255e,#0d6ec8);
              color:#fff;
              font-weight:700;
              letter-spacing:0.1em;
              font-size:6.5px;
              padding:2px 6px;
              border-radius:4px;
            ">SKITII</span>
            <span style="color:#0c2d6b;font-weight:600;font-size:7.5px;">Trials</span>
            <span style="color:#cbd5e1;font-size:8px;margin:0 2px;">|</span>
            <span style="color:#94a3b8;font-size:7px;">8-Day Admin Task List</span>
          </div>
          <span style="color:#0d9488;font-size:7px;font-weight:500;letter-spacing:0.05em;">CONFIDENTIAL</span>
        </div>`,
      footerTemplate: `
        <div style="
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 16mm 0;
          font-family: Inter, system-ui, sans-serif;
          font-size: 7px;
          border-top: 1px solid #e2e8f0;
        ">
          <span style="color:#cbd5e1;">Swapnil Sagvekar &mdash; Yenepoya Hospital &mdash; Skitii Trials 2026</span>
          <span style="
            color:#0c2d6b;
            font-weight:600;
            font-size:7.5px;
            letter-spacing:0.04em;
          ">Page <span class="pageNumber"></span> <span style="color:#cbd5e1;">/</span> <span class="totalPages"></span></span>
        </div>`,
    });
  } finally {
    await browser.close();
  }
}

async function main() {
  mkdirSync(outputDir, { recursive: true });
  console.log("Reading markdown...");
  const md = readFileSync(mdPath, "utf8");
  console.log("Building HTML...");
  const html = buildHtml(md);
  console.log("Generating PDF...");
  await buildPdf(html);
  console.log(`Done: ${pdfPath}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
