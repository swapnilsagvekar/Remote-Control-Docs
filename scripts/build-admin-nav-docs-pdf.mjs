#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execSync } from "node:child_process";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const contentDir = join(projectRoot, "content");
const assetsDir = join(projectRoot, "assets");
const navAssetsDir = join(assetsDir, "admin-nav");
const outputDir = join(projectRoot, "output");

const mdPath = join(contentDir, "skitii-admin-unified-nav-user-management.md");
const cssPath = join(assetsDir, "skitii-trial-spec.css");
const htmlPath = join(outputDir, "skitii-admin-unified-nav-user-management.html");
const pdfPath = join(outputDir, "Skitii_Admin_Unified_Nav_User_Management.pdf");
const puppeteerConfigPath = join(assetsDir, "puppeteer-config.json");
const resizeScriptPath = join(assetsDir, "resize-diagram.py");

const MERMAID_DIAGRAMS = [
  { mmd: "01-unified-sidebar-ia.mmd", png: "01-unified-sidebar-ia.png", width: 640 },
  { mmd: "02-auth-cross-domain-flow.mmd", png: "02-auth-cross-domain-flow.png", width: 700 },
  { mmd: "03-rbac-database-architecture.mmd", png: "03-rbac-database-architecture.png", width: 720 },
  { mmd: "04-trial-sidebar-slim.mmd", png: "04-trial-sidebar-slim.png", width: 640 },
  { mmd: "05-permission-filter-flow.mmd", png: "05-permission-filter-flow.png", width: 560 },
  { mmd: "06-role-module-access.mmd", png: "06-role-module-access.png", width: 640 },
  { mmd: "07-future-roles-scale.mmd", png: "07-future-roles-scale.png", width: 620 },
  { mmd: "08-database-er.mmd", png: "08-database-er.png", width: 720 },
];

const WIREFRAMES = [
  { html: "wireframe-full-sidebar.html", png: "unified-sidebar-full.png" },
  { html: "wireframe-trial-app.html", png: "unified-sidebar-trial-app.png" },
  { html: "wireframe-trial-operator.html", png: "unified-sidebar-trial-operator.png" },
];

function renderMermaidPng(inputPath, outputPath, width = 640) {
  execSync(
    `npx --yes @mermaid-js/mermaid-cli@11.4.0 -i "${inputPath}" -o "${outputPath}" -b white -w ${width} -s 2 -p "${puppeteerConfigPath}"`,
    { stdio: "inherit", cwd: projectRoot },
  );
  if (existsSync(resizeScriptPath)) {
    execSync(`python3 "${resizeScriptPath}" "${outputPath}" ${Math.min(width, 680)} 900`, {
      stdio: "inherit",
      cwd: projectRoot,
    });
  }
}

async function renderWireframePng(browser, htmlFile, pngFile) {
  const htmlAbs = join(navAssetsDir, htmlFile);
  const pngAbs = join(navAssetsDir, pngFile);
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 720, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(htmlAbs).href, { waitUntil: "networkidle0" });
  const el = await page.$("#capture");
  if (!el) throw new Error(`#capture not found in ${htmlFile}`);
  await el.screenshot({ path: pngAbs, type: "png" });
  await page.close();
  console.log(`  Wireframe PNG: ${pngFile}`);
}

async function renderAllAssets() {
  mkdirSync(navAssetsDir, { recursive: true });
  console.log("Rendering Mermaid diagrams...");
  for (const { mmd, png, width } of MERMAID_DIAGRAMS) {
    const inPath = join(navAssetsDir, mmd);
    const outPath = join(navAssetsDir, png);
    renderMermaidPng(inPath, outPath, width);
    console.log(`  ${png}`);
  }

  console.log("Rendering sidebar wireframes...");
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
    for (const { html, png } of WIREFRAMES) {
      await renderWireframePng(browser, html, png);
    }
  } finally {
    await browser.close();
  }
}

function extractMeta(md) {
  const meta = {};
  for (const line of md.split("\n").slice(0, 25)) {
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
  const audience = meta["Audience"] || "Engineering / product / leadership";
  const status = meta["Status"] || "Design target";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Skitii Admin — Unified Navigation & User Management</title>
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
    }
  </style>
</head>
<body>

  <section class="cover">
    <div class="cover-hero">
      <div class="cover-kicker">Skitii Admin Platform</div>
      <h1>Unified Navigation &amp; User Management</h1>
      <p class="cover-sub">
        One database-driven sidebar across Product and Trial Admin,
        role-based access, and cross-domain login.
      </p>
    </div>
      <div class="cover-meta">
        <div class="cover-meta-item"><strong>Date</strong><span>${date}</span></div>
        <div class="cover-meta-item"><strong>Author</strong><span>${author}</span></div>
        <div class="cover-meta-item"><strong>Audience</strong><span>${audience}</span></div>
        <div class="cover-meta-item"><strong>Status</strong><span>${status}</span></div>
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
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      await Promise.all(
        images.map(
          (img) =>
            img.complete
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
            <span style="color:#0c2d6b;font-weight:600;font-size:7.5px;">Admin</span>
            <span style="color:#cbd5e1;font-size:8px;margin:0 2px;">|</span>
            <span style="color:#94a3b8;font-size:7px;">Unified Nav &amp; User Management</span>
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
          <span style="color:#cbd5e1;">Swapnil Sagvekar &mdash; Skitii Admin 2026</span>
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
  await renderAllAssets();
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
