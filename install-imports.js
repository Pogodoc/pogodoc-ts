#!/usr/bin/env node

/**
 * install-imports.js
 *
 * Scans all .js/.jsx/.ts/.tsx files under the given directory,
 * extracts imported modules, filters to real npm packages,
 * deduplicates them, and runs 'npm install' on the result.
 */

const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const { builtinModules } = require("module");

// 1. Walk directory recursively
function walk(dir, filelist = []) {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      walk(fullPath, filelist);
    } else if (stat.isFile()) {
      if (/\.(js|jsx|ts|tsx)$/.test(entry)) filelist.push(fullPath);
    }
  }
  return filelist;
}

// 2. Extract module specifiers
function extractModules(file) {
  const content = fs.readFileSync(file, "utf8");
  const modules = new Set();
  const importRegex = /import\s+[^'"]*['"]([^'"]+)['"]/g;
  const requireRegex = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
  const dynamicImportRegex = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const [_, mod] of content.matchAll(importRegex)) modules.add(mod);
  for (const [_, mod] of content.matchAll(requireRegex)) modules.add(mod);
  for (const [_, mod] of content.matchAll(dynamicImportRegex)) modules.add(mod);
  return modules;
}

// 3. Normalize to package names, filter out relative/builtin
function normalize(mod) {
  // skip relative or absolute
  if (mod.startsWith(".") || mod.startsWith("/")) return null;
  // skip built-ins
  if (
    builtinModules.includes(mod) ||
    builtinModules.includes(mod.split("/")[0])
  )
    return null;
  // catch scoped
  if (mod.startsWith("@")) {
    const [scope, pkg] = mod.split("/");
    if (!pkg) return null; // invalid
    return `${scope}/${pkg}`;
  }
  // non-scoped: take first segment
  return mod.split("/")[0];
}

function main() {
  const targetDir = process.argv[2] || process.cwd();
  console.log(`🔍 Scanning for imports under ${targetDir}`);
  const files = walk(targetDir);
  const pkgs = new Set();

  for (const file of files) {
    for (const raw of extractModules(file)) {
      const name = normalize(raw);
      if (name) pkgs.add(name);
    }
  }

  if (pkgs.size === 0) {
    console.log("✅ No external packages to install.");
    return;
  }

  const list = Array.from(pkgs);
  console.log("📦 Detected packages:", list.join(", "));

  // 4. Install
  try {
    console.log("⚙️  Running npm install...");
    child_process.execSync(`npm install ${list.join(" ")}`, {
      stdio: "inherit",
    });
    console.log("🎉 Installation complete!");
  } catch (err) {
    console.error("❌ npm install failed:", err.message);
    process.exit(1);
  }
}

main();
