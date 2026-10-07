// The renderer receives status only. Feed URLs and installer paths stay in main.
function createUpdateController({
  updater,
  version,
  supported,
  onStatus,
  confirmRestart,
}) {
  let status = {
    state: supported ? "idle" : "unsupported",
    currentVersion: version,
    version: null,
    percent: 0,
  };
  let confirming = false;
  const getStatus = () => ({ ...status });
  const set = (values) => {
    status = { ...status, ...values };
    onStatus(getStatus());
  };
  const fail = () => set({ state: "error", percent: 0 });

  if (supported) {
    updater.autoDownload = false;
    updater.autoInstallOnAppQuit = false;
    updater.allowPrerelease = false;
    updater.allowDowngrade = false;
    updater.disableWebInstaller = true;
    updater.on("error", fail);
    updater.on("update-available", (info) =>
      set({ state: "available", version: info.version, percent: 0 }),
    );
    updater.on("update-not-available", () =>
      set({ state: "current", version: null, percent: 0 }),
    );
    updater.on("download-progress", (info) => {
      if (status.state !== "downloading") return;
      set({
        percent: Number.isFinite(info.percent)
          ? Math.min(100, Math.max(0, Math.floor(info.percent)))
          : 0,
      });
    });
    updater.on("update-downloaded", (info) =>
      set({ state: "ready", version: info.version, percent: 100 }),
    );
  }

  return {
    getStatus,
    async check() {
      if (
        !supported ||
        ["checking", "downloading", "ready", "installing"].includes(
          status.state,
        )
      )
        return getStatus();
      set({ state: "checking", version: null, percent: 0 });
      try {
        const result = await updater.checkForUpdates();
        if (!result && status.state === "checking") fail();
      } catch {
        fail();
      }
      return getStatus();
    },
    async download() {
      if (!supported || status.state !== "available") return getStatus();
      set({ state: "downloading", percent: 0 });
      try {
        await updater.downloadUpdate();
      } catch {
        fail();
      }
      return getStatus();
    },
    async restart() {
      if (!supported || status.state !== "ready" || confirming)
        return getStatus();
      confirming = true;
      try {
        if ((await confirmRestart()) && status.state === "ready") {
          set({ state: "installing" });
          updater.quitAndInstall(true, true);
        }
      } catch {
        fail();
      } finally {
        confirming = false;
      }
      return getStatus();
    },
  };
}

module.exports = { createUpdateController };
