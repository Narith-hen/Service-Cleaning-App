const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const targets = [
  path.join(root, "node_modules", "sass-embedded"),
  path.join(root, "node_modules", "sass-embedded-win32-x64"),
  path.join(root, "node_modules", "sass-embedded-win32-arm64"),
];

for (const target of targets) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`Removed optional Sass runtime: ${path.basename(target)}`);
  }
}
