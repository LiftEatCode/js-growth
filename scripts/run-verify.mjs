#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

function collectVerifyFiles(root) {
  const out = [];
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      out.push(...collectVerifyFiles(full));
      continue;
    }
    if (full.endsWith(".verify.ts")) {
      out.push(full);
    }
  }
  return out.sort();
}

const files = collectVerifyFiles(join(process.cwd(), "src"));
let failed = 0;

for (const file of files) {
  console.log(`==> ${file}`);
  const result = spawnSync("npx", ["tsx", file], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    failed += 1;
    break;
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log(`test:verify PASS (${files.length} files)`);
