// Prints the legal texts of `src/legal` as the build variables the server needs when the
// texts are not in the repository (see "Privacy statement and imprint" in the README).
// Usage: node tools/legal-env.mjs   (paste the lines into the build variables of the server)
import { existsSync, readFileSync } from "node:fs";

const texts = [
  ["LEGAL_DATENSCHUTZ_DE_B64", "src/legal/datenschutz.de.md"],
  ["LEGAL_DATENSCHUTZ_EN_B64", "src/legal/datenschutz.en.md"],
  ["LEGAL_IMPRESSUM_DE_B64", "src/legal/impressum.de.md"],
  ["LEGAL_IMPRESSUM_EN_B64", "src/legal/impressum.en.md"],
];

for (const [name, file] of texts) {
  if (!existsSync(file)) {
    console.error(`missing: ${file}`);
    process.exitCode = 1;
    continue;
  }
  console.log(`${name}=${readFileSync(file).toString("base64")}`);
}
console.log("REQUIRE_LEGAL=1");
