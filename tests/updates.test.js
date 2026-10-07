import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createRequire } from "node:module";
import { createServer, request } from "node:http";
import { mkdtemp, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { createUpdateController } from "../desktop/updates.cjs";
import { releaseFeed } from "../scripts/prepare-update-feed.cjs";

const require = createRequire(import.meta.url);
function fixture(supported = true, decide) {
  const updater = new EventEmitter();
  const calls = { check: 0, download: 0, install: 0, confirm: 0 };
  updater.checkForUpdates = async () => {
    calls.check++;
    updater.emit("update-available", { version: "1.3.0" });
    return {};
  };
  updater.downloadUpdate = async () => {
    calls.download++;
    updater.emit("update-downloaded", { version: "1.3.0" });
  };
  updater.quitAndInstall = (...args) => {
    calls.install++;
    calls.args = args;
  };
  const changes = [];
  const choice = { restart: false };
  const controller = createUpdateController({
    updater,
    version: "1.2.0",
    supported,
    onStatus: (value) => changes.push(value),
    confirmRestart: async () => {
      calls.confirm++;
      return decide ? await decide() : choice.restart;
    },
  });
  return { controller, updater, calls, changes, choice };
}

test("Finding and downloading an update never silently installs or closes the app", async () => {
  const { controller, updater, calls, choice } = fixture();
  assert.equal(updater.autoDownload, false);
  assert.equal(updater.autoInstallOnAppQuit, false);
  assert.equal(updater.allowDowngrade, false);
  assert.equal(updater.allowPrerelease, false);
  await controller.restart();
  await controller.download();
  assert.equal(calls.install + calls.download, 0);
  assert.equal((await controller.check()).state, "available");
  assert.equal(calls.download, 0);
  assert.equal((await controller.download()).state, "ready");
  assert.equal(calls.install, 0);
  await controller.check();
  assert.equal(calls.check, 1);
  await controller.restart();
  assert.equal(controller.getStatus().state, "ready");
  assert.equal(calls.install, 0);
  choice.restart = true;
  await Promise.all([controller.restart(), controller.restart()]);
  assert.equal(calls.install, 1);
  assert.deepEqual(calls.args, [true, true]);
});

test("An update failure while restart confirmation is open prevents installation", async () => {
  let finish;
  const { controller, updater, calls } = fixture(
    true,
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await controller.check();
  await controller.download();
  const restart = controller.restart();
  updater.emit("error", Error("Installer unavailable"));
  finish(true);
  assert.equal((await restart).state, "error");
  assert.equal(calls.install, 0);
});

test("Concurrent requests are coalesced and offline checks can be retried", async () => {
  const { controller, updater, calls } = fixture();
  let finish;
  updater.checkForUpdates = () => {
    calls.check++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  };
  const check = controller.check();
  await controller.check();
  assert.equal(calls.check, 1);
  updater.emit("error", new Error("offline"));
  finish({});
  assert.equal((await check).state, "error");
  updater.checkForUpdates = async () => {
    updater.emit("update-not-available", {});
    return {};
  };
  assert.equal((await controller.check()).state, "current");
});

test("A failed download cannot restart; progress is bounded and duplicate downloads are ignored", async () => {
  const { controller, updater, calls } = fixture();
  await controller.check();
  let reject;
  updater.downloadUpdate = () => {
    calls.download++;
    return new Promise((_resolve, fail) => {
      reject = fail;
    });
  };
  const download = controller.download();
  await controller.download();
  assert.equal(calls.download, 1);
  updater.emit("download-progress", { percent: 200 });
  assert.equal(controller.getStatus().percent, 100);
  updater.emit("download-progress", { percent: NaN });
  assert.equal(controller.getStatus().percent, 0);
  reject(new Error("checksum mismatch"));
  assert.equal((await download).state, "error");
  await controller.restart();
  assert.equal(calls.confirm + calls.install, 0);
});

test("Development, non-Windows and portable sessions do not contact an update server", async () => {
  const { controller, calls } = fixture(false);
  for (const action of ["check", "download", "restart"])
    assert.equal((await controller[action]()).state, "unsupported");
  assert.equal(calls.check + calls.download + calls.install + calls.confirm, 0);
});

test("Published metadata pins downloads to their release and preserves file checksums", () => {
  const feed = {
    version: "1.2.0",
    path: "Meshcraft-Setup-1.2.0-Windows-x64.exe",
    sha512: "legacy-hash",
    files: [
      {
        url: "Meshcraft-Setup-1.2.0-Windows-x64.exe",
        size: 123,
        sha512: "file-hash",
      },
    ],
  };
  const result = releaseFeed(feed, "1.2.0");
  assert.equal(
    result.files[0].url,
    "https://github.com/darkmage1000/3d-model-app/releases/download/v1.2.0/Meshcraft-Setup-1.2.0-Windows-x64.exe",
  );
  assert.equal(result.files[0].sha512, "file-hash");
  assert.equal(result.sha512, "legacy-hash");
  assert.throws(() => releaseFeed(feed, "1.3.0"));
  assert.throws(() =>
    releaseFeed({ ...feed, files: [{ url: "../evil.exe" }] }, "1.2.0"),
  );
});

test("The real NSIS updater downloads verified bytes and rejects a corrupted installer", async () => {
  const { NsisUpdater } = require("electron-updater");
  const {
    ElectronHttpExecutor,
  } = require("electron-updater/out/electronHttpExecutor.js");
  class LocalExecutor extends ElectronHttpExecutor {
    createRequest(options, callback) {
      assert.equal(options.hostname, "127.0.0.1");
      return request(options, callback);
    }
  }
  const folder = await mkdtemp(join(tmpdir(), "meshcraft-update-"));
  const bytes = Buffer.concat([Buffer.from("MZ"), Buffer.alloc(8192, 42)]);
  const hash = createHash("sha512").update(bytes).digest("base64");
  let corrupt = false;
  const server = createServer((req, res) => {
    if (req.url.startsWith("/latest.yml")) {
      res.end(
        `version: 1.3.0\nfiles:\n  - url: patch.exe\n    sha512: ${hash}\n    size: ${bytes.length}\npath: patch.exe\nsha512: ${hash}\n`,
      );
    } else if (req.url === "/patch.exe") {
      res.setHeader("Content-Length", bytes.length);
      res.end(corrupt ? Buffer.alloc(bytes.length, 0) : bytes);
    } else {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    for (const damaged of [false, true]) {
      corrupt = damaged;
      const dir = join(folder, damaged ? "corrupt" : "valid");
      const config = join(folder, `${damaged}.yml`);
      await writeFile(
        config,
        `updaterCacheDirName: ${damaged ? "corrupt-cache" : "valid-cache"}\n`,
      );
      const updater = new NsisUpdater(null, {
        version: "1.2.0",
        name: "Meshcraft",
        isPackaged: true,
        userDataPath: dir,
        baseCachePath: folder,
        appUpdateConfigPath: config,
        whenReady: async () => {},
        onQuit: () => {
          throw Error("Unexpected quit hook");
        },
      });
      updater.httpExecutor = new LocalExecutor();
      updater._testOnlyOptions = {
        platform: "win32",
        isUseDifferentialDownload: false,
      };
      updater.setFeedURL({
        provider: "generic",
        url: `http://127.0.0.1:${server.address().port}/`,
      });
      updater.logger = null;
      const failures = [];
      updater.on("error", (error) => failures.push(error.message));
      const controller = createUpdateController({
        updater,
        version: "1.2.0",
        supported: true,
        onStatus: () => {},
        confirmRestart: async () => false,
      });
      assert.equal((await controller.check()).state, "available");
      const result = await controller.download();
      assert.equal(
        result.state,
        damaged ? "error" : "ready",
        failures.join("\n"),
      );
      if (!damaged)
        assert.deepEqual(await readFile(updater.installerPath), bytes);
      else assert.equal(updater.installerPath, null);
    }
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
