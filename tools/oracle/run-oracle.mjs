// Renders the lid cases with the reference script and writes oracle.json (bounding box
// and volume per case). The script is rendered by OpenSCAD WASM (GPL-2.0), which is only
// a test tool here: it is NOT a dependency of the app. Install it outside the repository:
//   mkdir oracle-tool && cd oracle-tool && npm init -y && npm install openscad-wasm
//   node <repo>/tools/oracle/run-oracle.mjs <repo> > <repo>/src/geometry/oracle.json
// (run from inside oracle-tool: the module is loaded from ./node_modules)
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ORACLE_CASES } from "./cases.mjs";

const { createOpenSCAD } = await import(
  pathToFileURL(path.resolve("node_modules/openscad-wasm/openscad.js")).href
);
const repo = path.resolve(process.argv[2] ?? ".");
const scad = fs.readFileSync(
  path.join(repo, "reference/gridfinity_generator.scad"),
  "utf8",
);

const render = async (defs) => {
  const o = await createOpenSCAD({ print: () => {}, printErr: () => {} });
  const inst = o.getInstance();
  inst.FS.writeFile("/in.scad", scad);
  const args = ["/in.scad", "-o", "/out.stl", "-D", 'mode="lid"'];
  for (const [k, v] of Object.entries(defs)) {
    args.push("-D", `${k}=${typeof v === "string" ? JSON.stringify(v) : v}`);
  }
  const code = inst.callMain(args);
  if (code !== 0) throw new Error(`OpenSCAD exited with ${code}`);
  return inst.FS.readFile("/out.stl", { encoding: "utf8" });
};

const measure = (stl) => {
  const re = /vertex\s+(\S+)\s+(\S+)\s+(\S+)/g;
  const tris = [];
  let m;
  let cur = [];
  while ((m = re.exec(stl))) {
    cur.push([+m[1], +m[2], +m[3]]);
    if (cur.length === 3) {
      tris.push(cur);
      cur = [];
    }
  }
  let volume = 0;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const [a, b, c] of tris) {
    volume +=
      (a[0] * (b[1] * c[2] - b[2] * c[1]) -
        a[1] * (b[0] * c[2] - b[2] * c[0]) +
        a[2] * (b[0] * c[1] - b[1] * c[0])) /
      6;
    for (const p of [a, b, c]) {
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], p[i]);
        max[i] = Math.max(max[i], p[i]);
      }
    }
  }
  return { triangles: tris.length, volume, size: max.map((v, i) => v - min[i]), min };
};

const out = {};
for (const [name, defs] of Object.entries(ORACLE_CASES)) {
  const t = Date.now();
  out[name] = { params: defs, ...measure(await render(defs)) };
  console.error(`${name}: ${Date.now() - t} ms`);
}
console.log(JSON.stringify(out, null, 2));
