#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const contentDir = join(projectRoot, "content");
const assetsDir = join(projectRoot, "assets");
const outputDir = join(projectRoot, "output");

const mdPath = join(contentDir, "skitii-problem-statement-hi.md");
const cssPath = join(assetsDir, "skitii-trial-spec.css");
const htmlPath = join(outputDir, "skitii-problem-statement-hi.html");
const pdfPath = join(outputDir, "Skitii_Problem_Statement_Hindi.pdf");

const HINDI_FONT_CSS = `
@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap");
body, .content, .cover, .cover-meta, h1, h2, h3, h4, p, li, td, th, blockquote {
  font-family: "Noto Sans Devanagari", "Inter", system-ui, sans-serif !important;
}
`;

function extractMeta(md) {
  const meta = {};
  for (const line of md.split("\n").slice(0, 20)) {
    const m = line.match(/^\*\*(.+?):\*\*\s*(.+)/);
    if (m) meta[m[1].trim()] = m[2].trim();
  }
  return meta;
}

function transformMarkdown(md) {
  return md.replace(/^#[^\n]+\n[\s\S]*?---\n/, "");
}

function buildHtml(md) {
  const meta = extractMeta(md);
  const htmlBody = marked.parse(transformMarkdown(md), {
    gfm: true,
    breaks: false,
  });
  const css = readFileSync(cssPath, "utf8");

  const version = meta["Version"] || "1.0";
  const date = meta["Date"] || "अगस्त 2026";
  const author = meta["Author"] || "Swapnil Sagvekar";
  const audience = meta["Audience"] || "इंजीनियरिंग टीम, प्रोडक्ट, ऑनबोर्डिंग";
  const scope = meta["Scope"] || "Skitii क्यों है";

  return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8" />
  <title>Skitii — समस्या विवरण</title>
  <style>${css}${HINDI_FONT_CSS}</style>
</head>
<body>

  <section class="cover">
    <div class="cover-hero">
      <div class="cover-kicker">Skitii टीम ऑनबोर्डिंग</div>
      <h1>समस्या विवरण<br />और हम क्यों मौजूद हैं</h1>
      <p class="cover-sub">
        Skitii क्यों है, किसके लिए है, देखभाल में क्या बदलाव आता है,
        और हमारा प्लेटफ़ॉर्म किस लिए है।
      </p>
    </div>
      <div class="cover-meta">
        <div class="cover-meta-item"><strong>संस्करण</strong><span>${version}</span></div>
        <div class="cover-meta-item"><strong>दिनांक</strong><span>${date}</span></div>
        <div class="cover-meta-item"><strong>लेखक</strong><span>${author}</span></div>
        <div class="cover-meta-item"><strong>दर्शक</strong><span>${audience}</span></div>
        <div class="cover-meta-item"><strong>व्याप्ति</strong><span>${scope}</span></div>
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
  ].find((p) => existsSync(p));
  const browser = await puppeteer.default.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href, {
      waitUntil: "networkidle0",
    });
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
          font-family: 'Noto Sans Devanagari', Inter, system-ui, sans-serif;
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
            <span style="color:#0c2d6b;font-weight:600;font-size:7.5px;">टीम</span>
            <span style="color:#cbd5e1;font-size:8px;margin:0 2px;">|</span>
            <span style="color:#94a3b8;font-size:7px;">समस्या विवरण</span>
          </div>
          <span style="color:#0d9488;font-size:7px;font-weight:500;letter-spacing:0.05em;">आंतरिक</span>
        </div>`,
      footerTemplate: `
        <div style="
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 16mm 0;
          font-family: 'Noto Sans Devanagari', Inter, system-ui, sans-serif;
          font-size: 7px;
          border-top: 1px solid #e2e8f0;
        ">
          <span style="color:#cbd5e1;">Swapnil Sagvekar &mdash; Skitii समस्या विवरण &mdash; 2026</span>
          <span style="
            color:#0c2d6b;
            font-weight:600;
            font-size:7.5px;
            letter-spacing:0.04em;
          ">पृष्ठ <span class="pageNumber"></span> <span style="color:#cbd5e1;">/</span> <span class="totalPages"></span></span>
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
