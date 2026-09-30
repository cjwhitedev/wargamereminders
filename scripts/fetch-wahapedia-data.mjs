#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { parseArgs } from "node:util";
import * as XLSX from "xlsx";

const outputRoot = path.join(process.cwd(), "src", "data", "wahapedia");
const downloadDelayMs = 200;
const requestTimeoutMs = 30_000;
const games = {
  "40k": {
    directory: "wh40k10ed",
    exportPageUrl: "https://wahapedia.ru/wh40k10ed/the-rules/data-export/",
    specificationUrl: "https://wahapedia.ru/wh40k10ed/Export%20Data%20Specs.xlsx",
  },
  aos: {
    directory: "aos4",
    exportPageUrl: "https://wahapedia.ru/aos4/the-rules/data-export/",
  },
};

const { values } = parseArgs({
  options: {
    game: { type: "string", default: "all" },
    help: { type: "boolean", short: "h", default: false },
  },
});

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function fileNameFromUrl(value) {
  const name = decodeURIComponent(path.posix.basename(new URL(value).pathname));
  if (!name || name.includes("/") || name.includes("\\")) {
    throw new Error(`Could not determine a safe filename from ${value}`);
  }
  return name;
}

function extensionFromUrl(value) {
  return path.posix.extname(new URL(value).pathname).toLowerCase();
}

function isWahapediaUrl(url) {
  return ["wahapedia.ru", "www.wahapedia.ru"].includes(url.hostname.toLowerCase());
}

function discoverPageLinks(html, pageUrl) {
  const links = new Set();
  const hrefPattern = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;

  for (const match of html.matchAll(hrefPattern)) {
    const href = (match[1] ?? match[2] ?? match[3] ?? "").replaceAll("&amp;", "&");
    try {
      const url = new URL(href, pageUrl);
      if (isWahapediaUrl(url) && [".csv", ".xlsx"].includes(extensionFromUrl(url))) {
        links.add(url.href);
      }
    } catch {
      continue;
    }
  }

  return [...links];
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,*/*",
      "User-Agent": "WargameRemindersDataFetcher/0.1",
    },
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status} ${response.statusText}): ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function discoverWorkbookCsvLinks(buffer, workbookUrl) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const links = new Set();

  for (const sheetName of workbook.SheetNames) {
    for (const [address, cell] of Object.entries(workbook.Sheets[sheetName])) {
      if (address.startsWith("!")) continue;

      for (const candidate of [cell?.l?.Target, cell?.v]) {
        if (typeof candidate !== "string") continue;
        try {
          const url = new URL(candidate, workbookUrl);
          if (isWahapediaUrl(url) && extensionFromUrl(url) === ".csv") {
            links.add(url.href);
          }
        } catch {
          continue;
        }
      }
    }
  }

  return [...links];
}

function sortExports(urls) {
  const byName = new Map();
  for (const url of urls) {
    const name = fileNameFromUrl(url);
    const previous = byName.get(name);
    if (previous && previous !== url) {
      throw new Error(`Multiple export URLs use the filename ${name}`);
    }
    byName.set(name, url);
  }
  return [...byName.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, url]) => url);
}

async function currentManifest(directory) {
  try {
    return JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8"));
  } catch {
    return null;
  }
}

async function isCurrent(directory, specificationSha256, lastUpdate, urls) {
  if (!lastUpdate) return false;
  const manifest = await currentManifest(directory);
  const expectedNames = urls.map(fileNameFromUrl).sort();
  const actualNames = manifest?.files?.map((file) => file.name).sort();
  if (
    manifest?.lastUpdate !== lastUpdate ||
    manifest?.specificationSha256 !== specificationSha256 ||
    JSON.stringify(actualNames) !== JSON.stringify(expectedNames)
  ) {
    return false;
  }

  for (const name of expectedNames) {
    try {
      await stat(path.join(directory, name));
    } catch {
      return false;
    }
  }
  return true;
}

async function replaceDirectory(staging, destination) {
  const backup = `${destination}.backup-${randomUUID()}`;
  let hasBackup = false;
  try {
    await rename(destination, backup);
    hasBackup = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  try {
    await rename(staging, destination);
  } catch (error) {
    if (hasBackup) await rename(backup, destination);
    throw error;
  }
  if (hasBackup) await rm(backup, { recursive: true, force: true });
}

async function fetchGame(gameKey) {
  const game = games[gameKey];
  console.log(`[${gameKey}] Reading ${game.exportPageUrl}`);
  const pageHtml = (await fetchBuffer(game.exportPageUrl)).toString("utf8");
  const pageLinks = discoverPageLinks(pageHtml, game.exportPageUrl);
  const specificationUrl =
    game.specificationUrl ?? pageLinks.find((url) => extensionFromUrl(url) === ".xlsx");
  if (!specificationUrl) {
    throw new Error(`No export-specification workbook link found on ${game.exportPageUrl}`);
  }

  console.log(`[${gameKey}] Reading export specification`);
  const specification = await fetchBuffer(specificationUrl);
  const urls = sortExports([
    ...pageLinks.filter((url) => extensionFromUrl(url) === ".csv"),
    ...discoverWorkbookCsvLinks(specification, specificationUrl),
  ]);
  if (!urls.length) throw new Error(`No Wahapedia CSV links found in ${specificationUrl}`);

  const lastUpdateUrl = urls.find(
    (url) => fileNameFromUrl(url).toLowerCase() === "last_update.csv"
  );
  const lastUpdateBuffer = lastUpdateUrl ? await fetchBuffer(lastUpdateUrl) : null;
  const lastUpdate = lastUpdateBuffer
    ?.toString("utf8")
    .replace(/^\uFEFF/, "")
    .trim() ?? null;
  const specificationSha256 = sha256(specification);
  const outputDirectory = path.join(outputRoot, game.directory);

  if (await isCurrent(outputDirectory, specificationSha256, lastUpdate, urls)) {
    console.log(`[${gameKey}] Already current (${lastUpdate}); no exports downloaded.`);
    return;
  }

  const staging = `${outputDirectory}.tmp-${randomUUID()}`;
  await mkdir(staging, { recursive: true });
  try {
    const files = [];
    for (const [index, url] of urls.entries()) {
      if (index > 0) await delay(downloadDelayMs);
      const buffer = url === lastUpdateUrl ? lastUpdateBuffer : await fetchBuffer(url);
      const name = fileNameFromUrl(url);
      await writeFile(path.join(staging, name), buffer);
      files.push({ name, url, bytes: buffer.byteLength, sha256: sha256(buffer) });
      console.log(`[${gameKey}] ${index + 1}/${urls.length} ${name}`);
    }

    const manifest = {
      schemaVersion: 1,
      game: gameKey,
      edition: game.directory,
      exportPageUrl: game.exportPageUrl,
      specificationUrl,
      specificationSha256,
      lastUpdate,
      fetchedAt: new Date().toISOString(),
      files: files.sort((left, right) => left.name.localeCompare(right.name)),
    };
    await writeFile(path.join(staging, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    await replaceDirectory(staging, outputDirectory);
    console.log(`[${gameKey}] Saved ${files.length} exports to ${outputDirectory}`);
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
}

function printHelp() {
  console.log(`Usage: npm run data:fetch -- [options]

Options:
  --game <40k|aos|all>  Which ruleset to fetch (default: all)
  --help, -h            Show this help`);
}

async function main() {
  if (values.help) return printHelp();
  const gameKeys = values.game === "all" ? Object.keys(games) : [values.game];
  for (const gameKey of gameKeys) {
    if (!Object.hasOwn(games, gameKey)) {
      throw new Error(`Unknown game "${gameKey}". Choose 40k, aos, or all.`);
    }
  }
  await mkdir(outputRoot, { recursive: true });
  for (const gameKey of gameKeys) await fetchGame(gameKey);
}

main().catch((error) => {
  console.error(`Data fetch failed: ${error.message}`);
  process.exitCode = 1;
});