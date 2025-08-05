import { useState, useEffect, useContext } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  VersionCacheData,
  VersionCacheProgress,
  VersionEntry,
  Versions,
} from "@/app/types";
import GameBuildsList from "./GameBuildsList";
import { SettingsCtx } from "@/app/contexts";
import { listen } from "@tauri-apps/api/event";
import { Stack } from "react-bootstrap";
import Button from "@/components/Button";
import AddBuildModal from "./AddBuildModal";
import RemoveBuildModal from "./RemoveBuildModal";
import { useT } from "@/app/i18n";

const findVersion = (versions: VersionEntry[], uuid: string) => {
  return versions.find((version) => version.uuid == uuid);
};

export default function GameBuildsTab({ active }: { active: boolean }) {
  const [versions, setVersions] = useState<VersionEntry[] | undefined>(
    undefined,
  );
  const [versionData, setVersionData] = useState<VersionCacheData[]>([]);

  const [showAddBuildModal, setShowAddBuildModal] = useState(false);
  const [showRemoveBuildModal, setShowRemoveBuildModal] = useState(false);

  const [removeTarget, setRemoveTarget] = useState("");

  const ctx = useContext(SettingsCtx);
  const t = useT();

  const clearGameCache = async (uuid: string, name?: string) => {
    try {
      await invoke("delete_cache", { uuid, offline: false });
      if (ctx.alertSuccess) {
        const message = name
          ? t("cache.gameClearedSuccessfully", { name })
          : t("cache.gameClearedSuccessfully2");
        ctx.alertSuccess(message);
      }
      setVersionData((prev) => {
        return prev.map((pv) => {
          if (pv.versionUuid != uuid) {
            return pv;
          }
          const nv: VersionCacheData = { ...pv, gameItems: {}, gameDone: true };
          return nv;
        });
      });
    } catch (e) {
      if (ctx.alertError) {
        const message = name
          ? t("cache.failedClearGame", {
              name,
              error: String(e),
            })
          : t("cache.failedClearGame2", { error: String(e) });
        ctx.alertError(message);
      }
    }
  };

  const clearAllGameCaches = async () => {
    if (!versionData) {
      return;
    }

    for (const v of versionData) {
      if (v.gameDone && Object.keys(v.gameItems).length > 0) {
        const version = versions!.find((ve) => ve.uuid == v.versionUuid)!;
        const label = version.name ?? version.uuid;
        clearGameCache(version.uuid, label);
      }
    }
  };

  const downloadOfflineCache = async (uuid: string) => {
    try {
      await invoke("download_cache", { uuid, offline: true, repair: false });
      setVersionData((prev) => {
        return prev.map((pv) =>
          pv.versionUuid == uuid ? { ...pv, offlineDone: false } : pv,
        );
      });
    } catch (e) {
      if (ctx.alertError) {
        ctx.alertError(
          t("cache.failedKickoffOffline", {
            error: String(e),
          }),
        );
      }
    }
  };

  const repairOfflineCache = async (uuid: string) => {
    try {
      await invoke("download_cache", { uuid, offline: true, repair: true });
      if (ctx.alertSuccess) {
        ctx.alertSuccess(t("cache.offlineRepairStarted"));
      }
    } catch (e) {
      if (ctx.alertError) {
        ctx.alertError(
          t("cache.failedKickoffOffline2", {
            error: String(e),
          }),
        );
      }
    }
  };

  const deleteOfflineCache = async (uuid: string, name?: string) => {
    try {
      await invoke("delete_cache", { uuid, offline: true });
      if (ctx.alertSuccess) {
        const message = name
          ? t("cache.offlineDeletedSuccessfully", { name })
          : t("cache.offlineDeletedSuccessfully2");
        ctx.alertSuccess(message);
      }
      setVersionData((prev) => {
        return prev.map((pv) => {
          if (pv.versionUuid != uuid) {
            return pv;
          }
          const nv: VersionCacheData = {
            ...pv,
            offlineItems: {},
            offlineDone: true,
          };
          return nv;
        });
      });
    } catch (e) {
      if (ctx.alertError) {
        const message = name
          ? t("cache.failedDeleteOffline", {
              name,
              error: String(e),
            })
          : t("cache.failedDeleteOffline2", {
              error: String(e),
            });
        ctx.alertError(message);
      }
    }
  };

  const deleteAllOfflineCaches = async () => {
    for (const v of versionData) {
      if (v.offlineDone && Object.keys(v.offlineItems).length > 0) {
        const version = versions!.find((ve) => ve.uuid == v.versionUuid)!;
        const label = version.name ?? version.uuid;
        deleteOfflineCache(version.uuid, label);
      }
    }
  };

  const handleProgress = (progress: VersionCacheProgress) => {
    setVersionData((prev) => {
      const ppv = prev.find((pv) => pv.versionUuid == progress.uuid);
      const pv: VersionCacheData = ppv ?? {
        versionUuid: progress.uuid,
        gameDone: false,
        gameItems: {},
        offlineDone: false,
        offlineItems: {},
      };
      const isDone = progress.done;
      const nv: VersionCacheData = progress.offline
        ? {
            ...pv,
            offlineItems: progress.items,
            offlineDone: isDone,
          }
        : {
            ...pv,
            gameItems: progress.items,
            gameDone: isDone,
          };

      if (ppv) {
        return prev.map((n) => (n.versionUuid == progress.uuid ? nv : n));
      } else {
        return [...prev, nv];
      }
    });
  };

  const onRemoveButton = (uuid: string) => {
    setRemoveTarget(uuid);
    setShowRemoveBuildModal(true);
  };

  const importBuild = async (manifestPath: string) => {
    try {
      const newVersionLabel: string = await invoke("import_version", {
        uri: manifestPath,
      });
      await fetchVersions();
      if (ctx.alertSuccess) {
        ctx.alertSuccess(
          t("build.imported", { name: newVersionLabel }),
        );
      }
      return true;
    } catch (e: unknown) {
      if (ctx.alertError) {
        ctx.alertError(
          t("build.failedImport", { error: String(e) }),
        );
      }
    }
    return false;
  };

  const removeBuild = async (uuid: string, deleteCaches: boolean) => {
    try {
      const name: string = versions!.find((v) => v.uuid == uuid)!.name ?? uuid;
      await invoke("remove_version", { uuid, deleteCaches });
      await fetchVersions();
      setRemoveTarget("");
      setShowRemoveBuildModal(false);
      if (ctx.alertSuccess) {
        ctx.alertSuccess(t("build.removed", { name }));
      }
    } catch (e: unknown) {
      if (ctx.alertError) {
        ctx.alertError(
          t("build.failedRemove", { error: String(e) }),
        );
      }
    }
  };

  const addBuildManual = async (name: string, assetUrl: string) => {
    try {
      await invoke("add_version_manual", { name, assetUrl });
      await fetchVersions();
      if (ctx.alertSuccess) {
        ctx.alertSuccess(t("build.added", { name }));
      }
    } catch (e: unknown) {
      if (ctx.alertError) {
        ctx.alertError(t("build.failedAdd", { error: String(e) }));
      }
    }
  };

  const fetchVersions = async () => {
    const versions: Versions = await invoke("get_versions");
    setVersions(versions.versions);
  };

  useEffect(() => {
    const listener = listen<VersionCacheProgress>("cache_progress", (e) => {
      handleProgress(e.payload);
    });
    fetchVersions();

    return () => {
      listener.then((unlisten) => unlisten());
    };
  }, []);

  useEffect(() => {
    if (active && versions) {
      let vd: VersionCacheData[] = [...versionData];
      for (const version of versions) {
        if (vd.find((v) => v.versionUuid == version.uuid)) {
          continue;
        }
        console.log("Validating cache for " + (version.name ?? version.uuid));
        invoke("validate_cache", {
          uuid: version.uuid,
          offline: false,
        });
        invoke("validate_cache", {
          uuid: version.uuid,
          offline: true,
        });
        vd = [
          ...vd,
          {
            versionUuid: version.uuid,
            gameDone: false,
            gameItems: {},
            offlineDone: false,
            offlineItems: {},
          },
        ];
      }
      setVersionData(vd);
    }
  }, [active, versions]);

  return (
    <>
      <Stack
        direction="horizontal"
        className="p-2"
        gap={2}
        id="game-builds-buttonstack"
      >
        <Button
          icon="plus"
          text={t("build.add")}
          tooltip="build.addNewManifest"
          variant="success"
          onClick={() => setShowAddBuildModal(true)}
        />
        <div className="p-2 ms-auto"></div>
        <Button
          icon="trash"
          text={t("common.deleteOffline")}
          tooltip="cache.deleteOfflineCaches"
          variant="danger"
          onClick={() => {
            if (ctx.showConfirmationModal) {
              ctx.showConfirmationModal(
                t("dialog.deleteAllOffline"),
                t("common.delete"),
                "danger",
                deleteAllOfflineCaches,
              );
            }
          }}
        />
        <Button
          icon="trash"
          text={t("common.clearGame")}
          tooltip="cache.clearGameCaches"
          variant="danger"
          onClick={() => {
            if (ctx.showConfirmationModal) {
              ctx.showConfirmationModal(
                t("dialog.confirmClear"),
                t("common.clear"),
                "danger",
                clearAllGameCaches,
              );
            }
          }}
        />
      </Stack>
      <GameBuildsList
        versions={versions}
        versionDataList={versionData}
        clearGameCache={(uuid) => {
          if (ctx.showConfirmationModal) {
            const version = versions!.find((v) => v.uuid == uuid)!;
            const label = version.name ?? "version " + version.uuid;
            ctx.showConfirmationModal(
              t("dialog.confirmClear2", {
                name: label,
              }),
              t("common.clear2"),
              "danger",
              clearGameCache.bind(null, uuid),
            );
          }
        }}
        downloadOfflineCache={downloadOfflineCache}
        repairOfflineCache={repairOfflineCache}
        deleteOfflineCache={(uuid) => {
          if (ctx.showConfirmationModal) {
            const version = versions!.find((v) => v.uuid == uuid)!;
            const label = version.name ?? "version " + version.uuid;
            ctx.showConfirmationModal(
              t("dialog.deleteOffline", {
                name: label,
              }),
              t("common.delete2"),
              "danger",
              deleteOfflineCache.bind(null, uuid),
            );
          }
        }}
        removeVersion={onRemoveButton}
      />
      <AddBuildModal
        show={showAddBuildModal}
        setShow={setShowAddBuildModal}
        onImport={importBuild}
        onManualAdd={addBuildManual}
      />
      <RemoveBuildModal
        show={showRemoveBuildModal}
        setShow={setShowRemoveBuildModal}
        version={findVersion(versions ?? [], removeTarget)}
        onConfirm={removeBuild}
      />
    </>
  );
}
