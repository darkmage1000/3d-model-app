const { basename, dirname, extname, join } = require("node:path");
const { writeFile } = require("node:fs/promises");

function validateFiles(files) {
  if (!Array.isArray(files) || (files.length !== 1 && files.length !== 2))
    throw new Error("Expected a GLB or an OBJ and MTL pair.");
  for (const file of files) {
    if (
      !file ||
      typeof file.name !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*\.(glb|obj|mtl)$/.test(file.name)
    )
      throw new Error("Invalid model filename.");
    if (typeof file.data !== "string" && !(file.data instanceof Uint8Array))
      throw new Error("Invalid export data.");
    if (file.data.length > 100 * 1024 * 1024)
      throw new Error("Export is too large.");
  }
  const validGLB =
    files.length === 1 &&
    files[0].name.endsWith(".glb") &&
    files[0].data instanceof Uint8Array;
  const validOBJ =
    files.length === 2 &&
    files[0].name.endsWith(".obj") &&
    files[1].name === files[0].name.replace(/\.obj$/, ".mtl") &&
    files.every((f) => typeof f.data === "string");
  if (!validGLB && !validOBJ) throw new Error("Mismatched model export files.");
  return validGLB ? "glb" : "obj";
}

async function saveModelFiles(files, choosePath) {
  const format = validateFiles(files);
  const result = await choosePath(files[0].name, format);
  if (result.canceled || !result.filePath) return { canceled: true, paths: [] };
  const chosenPath =
    extname(result.filePath).toLowerCase() === `.${format}`
      ? result.filePath
      : `${result.filePath}.${format}`;
  if (format === "glb") {
    await writeFile(chosenPath, files[0].data);
    return { canceled: false, paths: [chosenPath] };
  }
  // A renamed OBJ must still refer to its sibling material file.
  const materialName = `${basename(chosenPath, extname(chosenPath))}.mtl`;
  const materialPath = join(dirname(chosenPath), materialName);
  const obj = files[0].data.replace(
    /^mtllib [^\r\n]+/,
    `mtllib ${materialName}`,
  );
  await writeFile(materialPath, files[1].data);
  await writeFile(chosenPath, obj);
  return { canceled: false, paths: [chosenPath, materialPath] };
}

module.exports = { validateFiles, saveModelFiles };
