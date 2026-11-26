// Dependency-free consistency check for every extension.
//
// It cannot replace `shopify app function run`, but it catches the mistakes
// that break a deploy: a missing query file, an export name that does not match
// the config, or a malformed GraphQL query.
//
// Usage: node scripts/validate.js

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const extensionsDir = join(root, "extensions");

/** "cart-validations-generate-run" -> "cartValidationsGenerateRun" */
const toCamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/** Pull a `key = "value"` from the TOML without a parser. */
const tomlValue = (toml, key) =>
  toml.match(new RegExp(`^\\s*${key}\\s*=\\s*"([^"]*)"`, "m"))?.[1];

/** Minimal GraphQL sanity check: balanced braces/parens and a named query. */
function checkGraphql(source) {
  const problems = [];
  const stripped = source.replace(/#.*$/gm, "");
  if (!/^\s*query\s+\w+/m.test(stripped)) problems.push("no named query");
  for (const [open, close] of [["{", "}"], ["(", ")"]]) {
    const o = stripped.split(open).length - 1;
    const c = stripped.split(close).length - 1;
    if (o !== c) problems.push(`unbalanced ${open}${close}`);
  }
  return problems;
}

let failures = 0;
const fail = (name, msg) => {
  failures++;
  console.error(`FAIL ${name}: ${msg}`);
};

for (const name of readdirSync(extensionsDir)) {
  const dir = join(extensionsDir, name);
  const tomlPath = join(dir, "shopify.extension.toml");
  if (!existsSync(tomlPath)) continue;

  const toml = readFileSync(tomlPath, "utf8");
  const handle = tomlValue(toml, "handle");
  const target = tomlValue(toml, "target");
  const inputQuery = tomlValue(toml, "input_query");
  const exportName = tomlValue(toml, "export");

  if (handle !== name) fail(name, `handle "${handle}" should equal folder name`);
  if (!tomlValue(toml, "api_version")) fail(name, "missing api_version");
  if (!target || !inputQuery || !exportName) {
    fail(name, "target, input_query and export are all required");
    continue;
  }

  // Convention used here: file name = target with dots -> underscores.
  const expectedBase = target.replace(/[.-]/g, "_");
  if (inputQuery !== `src/${expectedBase}.graphql`) {
    fail(name, `input_query should be src/${expectedBase}.graphql`);
  }
  if (exportName !== target.replace(/\./g, "-")) {
    fail(name, `export should be ${target.replace(/\./g, "-")}`);
  }

  const queryPath = join(dir, inputQuery);
  if (!existsSync(queryPath)) {
    fail(name, `input_query file not found: ${inputQuery}`);
  } else {
    for (const p of checkGraphql(readFileSync(queryPath, "utf8"))) fail(name, `graphql: ${p}`);
  }

  const jsPath = join(dir, `src/${expectedBase}.js`);
  if (!existsSync(jsPath)) {
    fail(name, `function file not found: src/${expectedBase}.js`);
  } else {
    const mod = await import(pathToFileURL(jsPath).href);
    const fn = toCamel(exportName);
    if (typeof mod[fn] !== "function") fail(name, `JS must export function ${fn}`);
  }

  for (const f of ["README.md", "tests/run.test.js"]) {
    if (!existsSync(join(dir, f))) fail(name, `missing ${f}`);
  }
}

if (failures) {
  console.error(`\n${failures} problem(s) found.`);
  process.exit(1);
}
console.log("All extensions are consistent.");
