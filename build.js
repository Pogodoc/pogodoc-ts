import { build } from "esbuild";

async function runBuild() {
  await build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    target: "es2020",
    format: "esm",
    outfile: "dist/index.mjs",
    sourcemap: true,
  });

  await build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    outfile: "dist/index.cjs",
    platform: "node",
    target: "es2020",
    format: "cjs",
    sourcemap: true,
  });
}

runBuild();
