#!/usr/bin/env node
/**
 * Visual + functional design audit.
 *
 * Boots the dev server, walks every route at iPhone 14 Pro and desktop
 * viewports, screenshots each state into .audit/, and verifies the keyboard
 * answer flow end-to-end (highlighted key pitch === accepted answer), which
 * guards against the key-misalignment regression.
 *
 * Usage: node scripts/audit-design.mjs [--url http://localhost:3000]
 */
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import puppeteer from "puppeteer";

const OUT = ".audit";
const argUrl = process.argv.indexOf("--url");
const BASE = argUrl > -1 ? process.argv[argUrl + 1] : null;
const PORT = 3210;

const VIEWPORTS = {
  iphone: { width: 390, height: 844, deviceScaleFactor: 2, hasTouch: true, isMobile: true },
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(url) {
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await sleep(1000);
  }
  throw new Error(`Server at ${url} never became ready`);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  let server = null;
  let base = BASE;
  if (!base) {
    base = `http://localhost:${PORT}`;
    server = spawn("npx", ["next", "dev", "-p", String(PORT)], { stdio: "ignore", detached: true });
  }
  await waitForServer(base);

  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const failures = [];

  try {
    for (const [device, viewport] of Object.entries(VIEWPORTS)) {
      const page = await browser.newPage();
      await page.setViewport(viewport);
      page.on("console", (msg) => {
        if (msg.type() === "error") failures.push(`[console:${device}] ${msg.text()}`);
      });
      page.on("pageerror", (err) => failures.push(`[pageerror:${device}] ${err.message}`));

      const shoot = async (name) => {
        await sleep(700);
        await page.screenshot({ path: `${OUT}/${device}-${name}.png` });
        console.log(`  shot ${device}-${name}`);
      };

      console.log(`\n== ${device} ==`);

      await page.goto(`${base}/`, { waitUntil: "networkidle0" });
      await shoot("dashboard");

      // -- keyboard identify: answer correctly using the highlighted key --
      await page.goto(`${base}/drill/keyboard-notes`, { waitUntil: "networkidle0" });
      await page.waitForSelector("[data-highlighted]");
      await shoot("keyboard-identify");

      const flow = await page.evaluate(() => {
        const key = document.querySelector("[data-highlighted]");
        return { pitch: key?.getAttribute("data-key-pitch") };
      });
      const labelMap = {
        C: "C", D: "D", E: "E", F: "F", G: "G", A: "A", B: "B",
        "C#": "C#/Db", "D#": "D#/Eb", "F#": "F#/Gb", "G#": "G#/Ab", "A#": "A#/Bb",
      };
      await page.evaluate((label) => {
        const buttons = [...document.querySelectorAll("[data-answer-choice]")];
        const target = buttons.find((button) => button.textContent.replace(/\s+/g, "") === label.replace("/", "").replace("#", "♯").replace(/([A-G])b/, "$1♭"));
        target?.click();
      }, labelMap[flow.pitch]);
      await sleep(400);
      const verdictOk = await page.evaluate(() => document.body.innerText.includes("Correct"));
      if (!verdictOk) failures.push(`[flow:${device}] identify: answered the highlighted pitch (${flow.pitch}) but was not marked Correct`);
      await shoot("keyboard-correct");
      await sleep(1600); // let auto-advance fire

      // -- keyboard reverse: tap the asked-for key --
      const reverseTab = await page.$$eval("[role=tab]", (tabs) => {
        const tab = tabs.find((t) => t.textContent.trim() === "reverse");
        tab?.click();
        return Boolean(tab);
      });
      if (reverseTab) {
        await sleep(600);
        const asked = await page.$eval("h1", (h) => h.textContent);
        const askedNote = asked.match(/Find (.+) on the keyboard/)?.[1]?.trim();
        const pitch = Object.entries(labelMap).find(([, label]) => {
          const pretty = label.replace("#", "♯").replace(/([A-G])b/, "$1♭");
          return askedNote === pretty || askedNote === label;
        })?.[0];
        if (pitch) {
          await page.$eval(`[data-key-pitch="${pitch}"]`, (el) => {
            el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
          });
          await sleep(400);
          const reverseOk = await page.evaluate(() => document.body.innerText.includes("Correct"));
          if (!reverseOk) failures.push(`[flow:${device}] reverse: tapped ${pitch} for prompt "${asked}" but was not marked Correct`);
        }
        await shoot("keyboard-reverse");
      }

      // -- remaining drills --
      for (const route of ["staff-notes", "chords", "scales", "circle-of-fifths", "piano-terms"]) {
        await page.goto(`${base}/drill/${route}`, { waitUntil: "networkidle0" });
        await shoot(route);
        // answer (wrongly is fine) to capture the feedback state
        const clicked = await page.evaluate(() => {
          const choice = document.querySelector("[data-answer-choice]");
          if (choice) { choice.click(); return true; }
          return false;
        });
        if (clicked) await shoot(`${route}-answered`);
      }

      await page.close();
    }
  } finally {
    await browser.close();
    if (server?.pid) {
      try { process.kill(-server.pid); } catch {}
    }
  }

  console.log(failures.length ? `\nFAILURES:\n${failures.join("\n")}` : "\nAll flows passed.");
  process.exit(failures.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
