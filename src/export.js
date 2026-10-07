import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { OBJExporter } from "three/addons/exporters/OBJExporter.js";
import { disposeModel } from "./models.js";

import { buildPreviewModel, bakeSkinnedPose } from "./rigging.js";

function download(data, name, mime) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

async function saveExport(files) {
  if (window.meshcraftDesktop) {
    const result = await window.meshcraftDesktop.exportFiles(
      files.map((file) => ({
        name: file.name,
        data:
          file.data instanceof ArrayBuffer
            ? new Uint8Array(file.data)
            : file.data,
      })),
    );
    return !result.canceled;
  }
  files.forEach((file) => download(file.data, file.name, file.mime));
  return true;
}

export async function exportModel(config, format) {
  const model = buildPreviewModel(config);
  let baked;
  const filename =
    (config.name || config.type)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "game-asset";
  try {
    if (format === "glb") {
      const result = await new GLTFExporter().parseAsync(model, {
        binary: true,
        animations: model.animations,
        trs: true,
      });
      return await saveExport([
        { data: result, name: `${filename}.glb`, mime: "model/gltf-binary" },
      ]);
    } else if (format === "obj") {
      // OBJ does not embed materials; ship a matching MTL as a second download.
      const exporter = new OBJExporter();
      baked = bakeSkinnedPose(model);
      const obj = exporter.parse(baked);
      const materials = new Map();
      baked.traverse((part) => {
        if (part.isMesh) {
          const mat = part.material;
          materials.set(mat.name || mat.id, mat);
        }
      });
      const mtl = [...materials]
        .map(([name, mat]) => {
          const color = mat.color.clone().convertLinearToSRGB();
          return `newmtl ${name}\nKd ${color.r.toFixed(6)} ${color.g.toFixed(6)} ${color.b.toFixed(6)}\nKa 0.1 0.1 0.1\nKs ${mat.metalness} ${mat.metalness} ${mat.metalness}\nNs ${Math.round((1 - mat.roughness) * 100)}\nd 1\n`;
        })
        .join("\n");
      return await saveExport([
        {
          data: `mtllib ${filename}.mtl\n${obj}`,
          name: `${filename}.obj`,
          mime: "text/plain",
        },
        { data: mtl, name: `${filename}.mtl`, mime: "text/plain" },
      ]);
    } else throw new Error("Unsupported export format");
  } finally {
    if (baked && baked !== model) disposeModel(baked);
    disposeModel(model);
  }
}
