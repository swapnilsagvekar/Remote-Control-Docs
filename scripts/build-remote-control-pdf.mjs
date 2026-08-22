#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const contentDir = join(projectRoot, "content", "remote-control");
const assetsDir = join(projectRoot, "assets");
const outputDir = join(projectRoot, "output");

const cssPath = join(assetsDir, "skitii-trial-spec.css");
const htmlPath = join(outputDir, "remote-control.html");
const pdfPath = join(outputDir, "Remote_Control_Master_Hosts.pdf");

const DOC_FILES = [
  "README.md",
  "01-requirements.md",
  "02-architecture.md",
  "03-build-plan.md",
  "04-agent-prompts.md",
  "05-security-and-ops.md",
];

function loadCombinedMarkdown() {
  return DOC_FILES.map((name, index) => {
    const raw = readFileSync(join(contentDir, name), "utf8").trim();
    // Demote H1 so cover owns the title; keep structure as H2+
    let md = raw.replace(/^#\s+(.+)$/m, "## $1");
    if (index > 0) {
      md = `\n\n<div class="page-break"></div>\n\n${md}`;
    }
    return md;
  }).join("\n\n");
}

function buildHtml(md) {
  const htmlBody = marked.parse(md, { gfm: true, breaks: false });
  const css = readFileSync(cssPath, "utf8");
  const extraCss = `
    .page-break { break-before: page; page-break-before: always; height: 0; margin: 0; padding: 0; }
    pre, code { white-space: pre-wrap; word-break: break-word; }
    table { font-size: 0.92em; }
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Remote Control — Master → Many Hosts</title>
  <style>${css}\n${extraCss}</style>
</head>
<body>

  <section class="cover">
    <div class="cover-hero">
      <div class="cover-kicker">Android Remote Control</div>
      <h1>Master → Many Hosts</h1>
      <p class="cover-sub">
        Requirements, architecture, build plan, agent prompts, and security/ops
        for a Kotlin Master/Host app with Magisk on Host and an always-on relay server.
      </p>
    </div>
      <div class="cover-meta">
        <div class="cover-meta-item"><strong>Version</strong><span>1.0</span></div>
        <div class="cover-meta-item"><strong>Date</strong><span>August 2026</span></div>
        <div class="cover-meta-item"><strong>Stack</strong><span>Kotlin + Magisk Host + relay server</span></div>
        <div class="cover-meta-item"><strong>Scope</strong><span>Sideload APKs · dynamic Hosts · dynamic access</span></div>
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
  const executablePath = [
    "/usr/bin/google-chrome",
    "/snap/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ].find((p) => existsSync(p));
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
            ">REMOTE</span>
            <span style="color:#0c2d6b;font-weight:600;font-size:7.5px;">Control</span>
            <span style="color:#cbd5e1;font-size:8px;margin:0 2px;">|</span>
            <span style="color:#94a3b8;font-size:7px;">Master → Hosts</span>
          </div>
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
          <span style="color:#cbd5e1;">Remote Control Spec &mdash; 2026</span>
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
  const md = loadCombinedMarkdown();
  console.log("Building HTML...");
  const html = buildHtml(md);
  console.log("Generating PDF...");
  await buildPdf(html);
  console.log(`Done: ${pdfPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
