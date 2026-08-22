#!/usr/bin/env node
/**
 * Build the Music Ranking Guide PDF.
 * Usage: npm run build
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const contentDir = join(projectRoot, "content");
const assetsDir = join(projectRoot, "assets");
const outputDir = join(projectRoot, "output");

const mdPath = join(contentDir, "music-ranking-guide.md");
const cssPath = join(assetsDir, "music-ranking-guide.css");
const mmdPart1Path = join(assetsDir, "music-ranking-flow-part1.mmd");
const mmdPart2Path = join(assetsDir, "music-ranking-flow-part2.mmd");
const pngPart1Path = join(outputDir, "music-ranking-flow-part1.png");
const pngPart2Path = join(outputDir, "music-ranking-flow-part2.png");
const htmlPath = join(outputDir, "music-ranking-guide.html");
const pdfPath = join(outputDir, "music-ranking-guide.pdf");
const puppeteerConfigPath = join(assetsDir, "puppeteer-config.json");
const resizeScriptPath = join(assetsDir, "resize-diagram.py");
const AUTHOR = "Swapnil Sagvekar";

function renderMermaidPng(inputPath, outputPath, maxH = 800) {
  execSync(
    `npx --yes @mermaid-js/mermaid-cli@11.4.0 -i "${inputPath}" -o "${outputPath}" -b white -w 520 -s 3 -p "${puppeteerConfigPath}"`,
    { stdio: "inherit", cwd: projectRoot },
  );
  resizeDiagramPng(outputPath, 500, maxH);
}

function resizeDiagramPng(outputPath, targetW = 500, maxH = 800) {
  execSync(`python3 "${resizeScriptPath}" "${outputPath}" ${targetW} ${maxH}`, {
    stdio: "inherit",
    cwd: projectRoot,
  });
}

function loadDiagramDataUri(outputPath) {
  const png = readFileSync(outputPath);
  return `data:image/png;base64,${png.toString("base64")}`;
}

function buildDiagramSection(part1Uri, part2Uri) {
  return `<section class="diagram-section">
  <h2 class="diagram-section-title">10. Simple Diagram — Decision Flow</h2>
  <p class="diagram-intro">The flow is split into two charts for readability: category selection, then track ranking.</p>
  <h3 class="diagram-part-title">10.1 Category selection</h3>
  <div class="diagram">
    <img src="${part1Uri}" alt="Music category selection flow" />
  </div>
  <h3 class="diagram-part-title">10.2 Track ranking and playback</h3>
  <div class="diagram">
    <img src="${part2Uri}" alt="Music track ranking flow" />
  </div>
</section>`;
}

function transformMarkdown(md) {
  let body = md;

  body = body.replace(
    /^# Skitii Music System — Plain-Language Guide\s*\n+This document explains[\s\S]*?---\s*\n+/,
    "",
  );

  body = body.replace(
    /## 10\. Simple Diagram — Decision Flow\s*\n+```mermaid[\s\S]*?```/,
    "<!-- DIAGRAM_SECTION_PLACEHOLDER -->",
  );

  body = body.replace(
    /\*\*Q: ([^*]+)\*\*\s*\nA: ([^\n]+)/g,
    '<div class="faq-item"><p class="faq-q">Q: $1</p><p>A: $2</p></div>',
  );

  return body;
}

function buildHtml(md) {
  const transformed = transformMarkdown(md);
  let htmlBody = marked.parse(transformed, { gfm: true, breaks: false });
  const diagramSection = buildDiagramSection(
    loadDiagramDataUri(pngPart1Path),
    loadDiagramDataUri(pngPart2Path),
  );
  htmlBody = htmlBody.replace("<!-- DIAGRAM_SECTION_PLACEHOLDER -->", diagramSection);

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
  <title>Skitii Music System — Plain-Language Guide</title>
  <style>${css}</style>
</head>
<body>
  <section class="cover">
    <div class="cover-hero">
      <div class="cover-kicker">Skitii Product Documentation</div>
      <h1>Music Ranking &amp;<br />Category Guide</h1>
      <p class="cover-lead">
        How Skitii chooses music categories, ranks tracks, learns from each session,
        and personalizes playback for every patient.
      </p>
    </div>
    <div class="cover-meta">
      <div><strong>Author:</strong> ${AUTHOR}</div>
      <div><strong>Audience:</strong> Clinicians, product, support, and non-technical stakeholders</div>
      <div><strong>Published:</strong> ${publishedOn}</div>
    </div>
  </section>
  <main class="content summary-box">
    ${htmlBody}
  </main>
</body>
</html>`;
}

async function buildPdf(html) {
  writeFileSync(htmlPath, html, "utf8");

  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });
    await page.emulateMediaType("print");
    await page.waitForFunction(() => {
      const images = document.querySelectorAll(".diagram img");
      return (
        images.length >= 2 &&
        [...images].every(
          (img) => img instanceof HTMLImageElement && img.complete && img.naturalHeight > 0,
        )
      );
    });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", right: "16mm", bottom: "22mm", left: "16mm" },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width:100%;font-size:8px;color:#64748b;padding:0 16mm;font-family:Inter,sans-serif;">
          <span>Skitii — Music Ranking Guide · ${AUTHOR}</span>
        </div>`,
      footerTemplate: `
        <div style="width:100%;font-size:8px;color:#64748b;padding:0 16mm;font-family:Inter,sans-serif;display:flex;justify-content:space-between;">
          <span>Confidential — internal product documentation</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>`,
    });
  } finally {
    await browser.close();
  }
}

async function main() {
  mkdirSync(outputDir, { recursive: true });

  console.log("Rendering Mermaid diagrams...");
  renderMermaidPng(mmdPart1Path, pngPart1Path, 820);
  renderMermaidPng(mmdPart2Path, pngPart2Path, 900);

  console.log("Building HTML...");
  const md = readFileSync(mdPath, "utf8");
  const html = buildHtml(md);

  console.log("Generating PDF...");
  await buildPdf(html);

  console.log(`Done: ${pdfPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
