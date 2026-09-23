#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const contentDir = join(projectRoot, "content");
const assetsDir = join(projectRoot, "assets");
const outputDir = join(projectRoot, "output");

const mdPath = join(contentDir, "skitii-trial-admin-presentation.md");
const cssPath = join(assetsDir, "skitii-trial-spec.css");
const htmlPath = join(outputDir, "skitii-trial-admin-presentation.html");
const pdfPath = join(outputDir, "Skitii_Trial_Admin_Panel_Documentation.pdf");

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
  md = md.replace(
    /!\[([^\]]*)\]\(\.\.\/assets\/([^)]+)\)/g,
    (_m, alt, rel) => {
      const abs = resolve(assetsDir, rel);
      return `![${alt}](${pathToFileURL(abs).href})`;
    },
  );
  return md;
}

function buildHtml(md) {
  const meta = extractMeta(md);
  const transformed = transformMarkdown(md);
  const htmlBody = marked.parse(transformed, { gfm: true, breaks: false });
  const css = readFileSync(cssPath, "utf8");

  const date = meta["Date"] || "September 2026";
  const author = meta["Author"] || "Swapnil Sagvekar";
  const audience = meta["Audience"] || "Team / leadership";
  const app = meta["App"] || "Skitii Trial Admin Frontend";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Skitii Trial Admin Panel — Documentation</title>
  <style>
    ${css}
    .content img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 0.9rem auto 1.2rem;
      border: 1px solid var(--border);
      border-radius: 10px;
      page-break-inside: avoid;
      break-inside: avoid;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .content h2 {
      page-break-before: auto;
      break-before: auto;
    }
  </style>
</head>
<body>

  <section class="cover">
    <div class="cover-hero">
      <div class="cover-kicker">Skitii Trials Platform</div>
      <h1>Trial Admin Panel<br />Documentation</h1>
      <p class="cover-sub">
        Overview of every module — login, setup,
        patients, sessions, statistics, and music — with real screenshots.
      </p>
    </div>
      <div class="cover-meta">
        <div class="cover-meta-item"><strong>Date</strong><span>${date}</span></div>
        <div class="cover-meta-item"><strong>Author</strong><span>${author}</span></div>
        <div class="cover-meta-item"><strong>Audience</strong><span>${audience}</span></div>
        <div class="cover-meta-item"><strong>App</strong><span>${app}</span></div>
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
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2,
    });
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0" });
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      await Promise.all(
        images.map(
          (img) =>
            img.complete && img.naturalHeight > 0
              ? Promise.resolve()
              : new Promise((resolve) => {
                  img.onload = resolve;
                  img.onerror = resolve;
                }),
        ),
      );
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
            <span style="color:#94a3b8;font-size:7px;">Admin Panel Documentation</span>
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
          <span style="color:#cbd5e1;">Swapnil Sagvekar &mdash; Skitii Trials Admin 2026</span>
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

  // Ensure cropped screenshots exist
  const prepare = join(projectRoot, "scripts", "prepare-admin-presentation-images.py");
  const crop = spawnSync("python3", [prepare], { stdio: "inherit" });
  if (crop.status !== 0) throw new Error("Screenshot crop failed");

  console.log("Reading markdown...");
  const md = readFileSync(mdPath, "utf8");
  console.log("Building HTML...");
  const html = buildHtml(md);
  console.log("Generating PDF...");
  await buildPdf(html);

  // Replace Chromium's soft embeds with high-quality JPEGs (layout unchanged)
  console.log("Sharpening embedded screenshots...");
  const sharp = spawnSync(
    "python3",
    [prepare, "--skip-crop", "--pdf", pdfPath],
    { stdio: "inherit" },
  );
  if (sharp.status !== 0) throw new Error("Screenshot sharpen step failed");

  console.log(`Done: ${pdfPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
