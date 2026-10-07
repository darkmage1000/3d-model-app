import { useEffect, useState } from "react";
import { RefreshCw, Download } from "lucide-react";

const MESSAGES = {
  idle: "Check for the latest Meshcraft release.",
  checking: "Checking for updates…",
  current: "You’re using the latest version of Meshcraft.",
  available: "An update is available. Download it when you’re ready.",
  downloading: "Downloading your update. You can keep working.",
  ready: "Your update is ready. Restart when you’re ready to install it.",
  installing: "Restarting Meshcraft to install your update…",
  error:
    "The update could not be completed. Check your connection and try again.",
  unsupported:
    "Install Meshcraft using the Windows installer to enable updates.",
};

export default function DesktopUpdates({ Dialog, persistBeforeRestart }) {
  const bridge = window.meshcraftDesktop;
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState({ state: "idle", currentVersion: "" });
  const [savingError, setSavingError] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    let alive = true;
    const receive = (value) => {
      if (alive) setStatus(value);
    };
    const unsubscribe = bridge.onUpdateStatus(receive);
    const unsubscribeMenu = bridge.onShowUpdates(() => setOpen(true));
    bridge
      .getUpdateStatus()
      .then(receive)
      .catch(() => receive({ state: "error" }));
    return () => {
      alive = false;
      unsubscribe();
      unsubscribeMenu();
    };
  }, [bridge]);

  async function act(action) {
    setActing(true);
    setSavingError(false);
    try {
      if (action === "restartToUpdate") {
        try {
          persistBeforeRestart();
        } catch {
          setSavingError(true);
          return;
        }
      }
      // Events own the status during operations, avoiding stale IPC snapshots.
      await bridge[action]();
    } catch {
      setStatus((previous) => ({ ...previous, state: "error" }));
    } finally {
      setActing(false);
    }
  }

  const busy =
    acting || ["checking", "downloading", "installing"].includes(status.state);
  const hasUpdate = ["available", "downloading", "ready"].includes(
    status.state,
  );
  return (
    <>
      <button
        className={`update-button ${hasUpdate ? "has-update" : ""}`}
        aria-label="Check for updates"
        onClick={() => {
          setOpen(true);
          if (!["available", "downloading", "ready"].includes(status.state))
            void act("checkForUpdates");
        }}
      >
        <RefreshCw size={16} />
        <span>{hasUpdate ? "Update available" : "Check for updates"}</span>
      </button>
      {open && (
        <Dialog
          title="Meshcraft updates"
          subtitle={
            status.currentVersion
              ? `Installed version ${status.currentVersion}`
              : "Keep your desktop app up to date."
          }
          onClose={() => setOpen(false)}
        >
          <div className="update-details">
            {status.version && <strong>Meshcraft {status.version}</strong>}
            <p role={status.state === "error" ? "alert" : "status"}>
              {MESSAGES[status.state]}
            </p>
            {status.state === "downloading" && (
              <div className="update-progress">
                <progress
                  aria-label="Update download progress"
                  max="100"
                  value={status.percent}
                />
                <span>{status.percent}%</span>
              </div>
            )}
            <p className="update-preserves">
              Updates keep your saved characters, draft, and settings. Downloads
              need an internet connection.
            </p>
            {savingError && (
              <p role="alert">
                Your current work could not be saved. Export a backup before
                restarting.
              </p>
            )}
          </div>
          <div className="update-actions">
            <button className="button secondary" onClick={() => setOpen(false)}>
              Keep working
            </button>
            {status.state !== "unsupported" && (
              <button
                className="button primary"
                disabled={busy}
                onClick={() =>
                  void act(
                    status.state === "available"
                      ? "downloadUpdate"
                      : status.state === "ready"
                        ? "restartToUpdate"
                        : "checkForUpdates",
                  )
                }
              >
                {status.state === "available" ? (
                  <Download size={16} />
                ) : (
                  <RefreshCw size={16} />
                )}
                {status.state === "available"
                  ? "Download update"
                  : status.state === "ready"
                    ? "Restart to update"
                    : busy
                      ? "Please wait…"
                      : "Check for updates"}
              </button>
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}
