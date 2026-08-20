// Logs into ProgressBook (NEOnet-hosted ParentAccess) and writes a clean
// summary of grades + missing assignments to data/grades.json for the PWA's
// Grades tab to read. Credentials come from env vars only — never hardcode
// or log them.
//
// Required env vars:
//   PROGRESSBOOK_URL       e.g. https://ca.neonet.org/auth/login?signin=...
//   PROGRESSBOOK_USERNAME
//   PROGRESSBOOK_PASSWORD
//
// Extraction below is a placeholder: the login form matches what's on
// screen (labeled "Username" / "Password" fields, "Sign In" button), but
// the gradebook page layout after login hasn't been confirmed yet. Until
// extractGrades() is filled in with real selectors, every run dumps a
// screenshot + HTML snapshot of the post-login page to debug/ so those
// selectors can be written from a real page instead of guesswork.

import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";

const URL = process.env.PROGRESSBOOK_URL;
const USERNAME = process.env.PROGRESSBOOK_USERNAME;
const PASSWORD = process.env.PROGRESSBOOK_PASSWORD;

if (!URL || !USERNAME || !PASSWORD) {
  console.error("Missing PROGRESSBOOK_URL / PROGRESSBOOK_USERNAME / PROGRESSBOOK_PASSWORD env vars.");
  process.exit(1);
}

async function login(page) {
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Username").fill(USERNAME);
  await page.getByLabel("Password").fill(PASSWORD);
  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.getByRole("button", { name: "Sign In" }).click(),
  ]);
}

// TODO: replace with real selectors once the gradebook page structure is known.
async function extractGrades(page) {
  return { updatedAt: new Date().toISOString(), student: null, courses: [] };
}

async function dumpDebugSnapshot(page) {
  await mkdir("debug", { recursive: true });
  await page.screenshot({ path: "debug/post-login.png", fullPage: true });
  await writeFile("debug/post-login.html", await page.content());
  console.log(`Dumped debug snapshot for ${page.url()}`);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await login(page);
    await dumpDebugSnapshot(page);

    const grades = await extractGrades(page);
    await mkdir("data", { recursive: true });
    await writeFile("data/grades.json", JSON.stringify(grades, null, 2));
    console.log(`Wrote data/grades.json (${grades.courses.length} courses).`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
