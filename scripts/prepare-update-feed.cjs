const { readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");
const yaml = require("js-yaml");

function releaseFeed(feed, version) {
  if (
    feed.version !== version ||
    !Array.isArray(feed.files) ||
    !feed.files.length
  )
    throw new Error("Update metadata must match the built release.");
  const base = `https://github.com/darkmage1000/3d-model-app/releases/download/v${version}/`;
  const convert = (filename) => {
    if (
      ![
        `Meshcraft-Setup-${version}-Windows-x64.exe`,
        `Meshcraft-${version}-Windows-x64.zip`,
      ].includes(filename)
    )
      throw new Error("Unexpected file in Windows update metadata.");
    return base + filename;
  };
  return {
    ...feed,
    files: feed.files.map((file) => ({ ...file, url: convert(file.url) })),
    path: convert(feed.path),
  };
}

function prepareUpdateFeed(directory, version) {
  const path = join(directory, "latest.yml");
  const feed = releaseFeed(yaml.load(readFileSync(path, "utf8")), version);
  writeFileSync(path, yaml.dump(feed));
}

module.exports = { releaseFeed, prepareUpdateFeed };
