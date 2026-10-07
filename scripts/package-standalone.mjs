import { rename, stat } from "node:fs/promises";

const folder = new URL("../release/", import.meta.url);
const app = new URL("Meshcraft.html", folder);
await rename(new URL("index.html", folder), app);
const { size } = await stat(app);
console.log(
  `\nClick-to-open app: release/Meshcraft.html (${(size / 1024 / 1024).toFixed(2)} MB)`,
);
console.log(
  "Download the file and double-click it to open Meshcraft in your browser.",
);
