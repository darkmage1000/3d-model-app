import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import exports from "../desktop/export-files.cjs";

const glb = [
  { name: "giant-lizard.glb", data: new Uint8Array([103, 108, 84, 70]) },
];
const obj = [
  {
    name: "giant-lizard.obj",
    data: "mtllib giant-lizard.mtl\no body\nv 1 2 3\nusemtl skin\n",
  },
  { name: "giant-lizard.mtl", data: "newmtl skin\nKd 0.2 0.8 0.4\n" },
];

test("Desktop exports reject path traversal, mismatched pairs, and unsupported data before a save dialog", async () => {
  for (const files of [
    [],
    [{ name: "../model.glb", data: glb[0].data }],
    [{ name: "model.exe", data: glb[0].data }],
    [{ name: "model.glb", data: {} }],
    [{ name: "model.glb", data: "not binary" }],
    [obj[0], { ...obj[1], name: "other.mtl" }],
  ]) {
    let opened = false;
    await assert.rejects(
      exports.saveModelFiles(files, async () => {
        opened = true;
        return { canceled: true };
      }),
    );
    assert.equal(opened, false);
  }
});

test("Canceling a desktop export creates no files", async () => {
  const folder = await mkdtemp(join(tmpdir(), "meshcraft-cancel-"));
  const result = await exports.saveModelFiles(glb, async () => ({
    canceled: true,
    filePath: join(folder, "ignored.glb"),
  }));
  assert.equal(result.canceled, true);
  assert.deepEqual(await readdir(folder), []);
});

test("Desktop GLB saves binary bytes at the chosen path and adds the format extension", async () => {
  const folder = await mkdtemp(join(tmpdir(), "meshcraft-glb-"));
  const result = await exports.saveModelFiles(glb, async (name, format) => {
    assert.equal(name, "giant-lizard.glb");
    assert.equal(format, "glb");
    return { canceled: false, filePath: join(folder, "Renamed creature") };
  });
  assert.equal(result.canceled, false);
  assert.deepEqual([...(await readFile(result.paths[0]))], [...glb[0].data]);
  assert.equal(result.paths[0], join(folder, "Renamed creature.glb"));
});

test("A renamed desktop OBJ keeps its material file together and rewrites mtllib", async () => {
  const folder = await mkdtemp(join(tmpdir(), "meshcraft-obj-"));
  const result = await exports.saveModelFiles(obj, async () => ({
    canceled: false,
    filePath: join(folder, "Boss Creature.obj"),
  }));
  assert.deepEqual((await readdir(folder)).sort(), [
    "Boss Creature.mtl",
    "Boss Creature.obj",
  ]);
  assert.match(
    await readFile(result.paths[0], "utf8"),
    /^mtllib Boss Creature\.mtl\no body\nv 1 2 3/,
  );
  assert.equal(await readFile(result.paths[1], "utf8"), obj[1].data);
});
