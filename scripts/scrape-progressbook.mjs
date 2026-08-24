// Logs into ProgressBook (NEOnet-hosted ParentAccess) and writes a clean
// summary of grades + missing assignments to data/grades.json for the PWA's
// Grades tab to read. Credentials come from env vars only — never hardcode
// or log them.
//
// Required env vars:
//   PROGRESSBOOK_URL       the stable ParentAccess entry point, e.g. https://pa.neonet.org/
//                          NOT a one-time ?signin=... link copied from a browser session —
//                          that token is bound to the session that minted it and fails with
//                          a generic SSO error when hit cold from a fresh browser context.
//   PROGRESSBOOK_USERNAME
//   PROGRESSBOOK_PASSWORD
//
// Login redirects from the ca.neonet.org auth gateway to the actual
// ProgressBook app (pa.neonet.org for NEOnet districts) — the app origin is
// read from the post-login URL rather than hardcoded, so this keeps working
// if that changes.
//
// Grade extraction is verified against a real Grades page (course name,
// teacher, current-quarter grade). Missing-assignment extraction is
// best-effort and UNVERIFIED: the district's data for this school year only
// started a couple days ago, so every course currently shows 0 assignment
// details — there's nothing real to test the "Missing" parsing against yet.
// Once assignments start showing up (check the Grades tab or a course's
// "see all details" page), confirm missingAssignments actually populates
// and adjust the selectors in extractCourseDetails() if not.

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
  const response = await page.goto(URL, { waitUntil: "domcontentloaded" });
  console.log(`Loaded ${page.url()} (status ${response?.status()})`);
  await page.getByLabel("Username").fill(USERNAME);
  await page.getByLabel("Password").fill(PASSWORD);
  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.getByRole("button", { name: "Sign In" }).click(),
  ]);
}

// Pulls the currently active quarter's key (e.g. "Q1") from the heading like
// "Q1 (Aug 18 - Oct 16)" shown above the grades table.
async function currentQuarterKey(page) {
  const heading = page.getByText(/^Q[1-4] \(.*\)$/).first();
  const text = await heading.textContent();
  return text.trim().slice(0, 2);
}

// Reads the Teacher/Email + per-quarter grade table inside an expanded
// course row and returns { teacher, grade }.
async function extractCourseSummary(row, quarterKey) {
  const teacherText = await row.getByText(/^Teacher:/).first().textContent().catch(() => null);
  const teacher = teacherText ? teacherText.replace(/^Teacher:\s*/, "").trim() : null;

  const quarterTable = row.locator("table").last();
  const headerCells = await quarterTable.locator("tr").first().locator("th, td").allTextContents();
  const valueCells = await quarterTable.locator("tr").nth(1).locator("th, td").allTextContents();
  const idx = headerCells.findIndex((h) => h.trim().startsWith(quarterKey));
  const rawGrade = idx >= 0 ? valueCells[idx]?.trim() : null;
  const grade = rawGrade && rawGrade.toLowerCase() !== "n/a" ? rawGrade : null;

  return { teacher, grade };
}

// Best-effort: opens a course's "see all details" page and looks for any
// assignment row flagged "Missing". Unverified against real data — see the
// file header comment.
async function extractMissingAssignments(page, detailHref) {
  const detailPage = await page.context().newPage();
  try {
    await detailPage.goto(detailHref, { waitUntil: "networkidle" });
    const missingRows = detailPage.getByText(/missing/i);
    const count = await missingRows.count();
    const results = [];
    for (let i = 0; i < count; i++) {
      const row = missingRows.nth(i).locator("xpath=ancestor::tr[1]");
      const cells = await row.locator("td, th").allTextContents().catch(() => []);
      const name = cells[0]?.trim();
      if (name) results.push({ name, dueDate: cells.find((c) => /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(c)) ?? null });
    }
    return results;
  } catch {
    return [];
  } finally {
    await detailPage.close();
  }
}

async function extractGrades(page) {
  const origin = new URL(page.url()).origin;
  await page.goto(`${origin}/Student/Grades`, { waitUntil: "networkidle" });

  const quarterKey = await currentQuarterKey(page);
  const courseLinks = page.getByRole("link", { name: /- Section:/ });
  const courseCount = await courseLinks.count();

  const courses = [];
  for (let i = 0; i < courseCount; i++) {
    const link = courseLinks.nth(i);
    const fullName = (await link.textContent()).trim();
    const name = fullName.split(" - Section:")[0].trim();

    const row = link.locator("xpath=ancestor::tr[1]");
    // Expand the row if it isn't already, so Teacher/Email/quarter grades render.
    const isExpanded = await row.locator("table").count() > 0;
    if (!isExpanded) {
      await row.locator("a, button").first().click().catch(() => {});
      await page.waitForTimeout(300);
    }

    const { teacher, grade } = await extractCourseSummary(row, quarterKey).catch(() => ({ teacher: null, grade: null }));

    const detailLink = row.getByRole("link", { name: /see all details/i });
    const detailHref = await detailLink.getAttribute("href").catch(() => null);
    const missingAssignments = detailHref
      ? await extractMissingAssignments(page, new URL(detailHref, origin).toString())
      : [];

    courses.push({ name, teacher, grade, missingAssignments });
  }

  return { updatedAt: new Date().toISOString(), student: null, courses };
}

async function dumpDebugSnapshot(page) {
  await mkdir("debug", { recursive: true });
  await page.screenshot({ path: "debug/grades-page.png", fullPage: true });
  await writeFile("debug/grades-page.html", await page.content());
  console.log(`Dumped debug snapshot for ${page.url()}`);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await login(page);

    const grades = await extractGrades(page);
    await dumpDebugSnapshot(page);

    await mkdir("data", { recursive: true });
    await writeFile("data/grades.json", JSON.stringify(grades, null, 2));
    console.log(`Wrote data/grades.json (${grades.courses.length} courses).`);
  } catch (err) {
    // Always capture what the page actually showed, even (especially) on
    // failure — otherwise a CI failure gives no way to see what broke.
    console.error(`Failed at ${page.url()}`);
    await dumpDebugSnapshot(page).catch((snapshotErr) => {
      console.error("Also failed to capture debug snapshot:", snapshotErr);
    });
    throw err;
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
