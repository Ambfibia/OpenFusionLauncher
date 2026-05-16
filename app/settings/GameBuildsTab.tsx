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

  const clearGameCache = async (uuid: string, name?: string) => {
    const txt = name ? " для " + name : "";
    try {
      await invoke("delete_cache", { uuid, offline: false });
      if (ctx.alertSuccess) {
        ctx.alertSuccess("Игровой кэш" + txt + " очищен");
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
        ctx.alertError("Не удалось очистить игровой кэш" + txt + ": " + e);
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
        ctx.alertError("Не удалось запустить загрузку офлайн-кэша: " + e);
      }
    }
  };

  const repairOfflineCache = async (uuid: string) => {
    try {
      await invoke("download_cache", { uuid, offline: true, repair: true });
      if (ctx.alertSuccess) {
        ctx.alertSuccess("Восстановление офлайн-кэша запущено");
      }
    } catch (e) {
      if (ctx.alertError) {
        ctx.alertError("Не удалось запустить восстановление офлайн-кэша: " + e);
      }
    }
  };

  const deleteOfflineCache = async (uuid: string, name?: string) => {
    const txt = name ? " для " + name : "";
    try {
      await invoke("delete_cache", { uuid, offline: true });
      if (ctx.alertSuccess) {
        ctx.alertSuccess("Офлайн-кэш" + txt + " удален");
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
        ctx.alertError("Не удалось удалить офлайн-кэш" + txt + ": " + e);
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
        ctx.alertSuccess("Сборка импортирована: " + newVersionLabel);
      }
      return true;
    } catch (e: unknown) {
      if (ctx.alertError) {
        ctx.alertError("Не удалось импортировать сборку: " + e);
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
        ctx.alertSuccess("Сборка удалена: " + name);
      }
    } catch (e: unknown) {
      if (ctx.alertError) {
        ctx.alertError("Не удалось удалить сборку: " + e);
      }
    }
  };

  const addBuildManual = async (name: string, assetUrl: string) => {
    try {
      await invoke("add_version_manual", { name, assetUrl });
      await fetchVersions();
      if (ctx.alertSuccess) {
        ctx.alertSuccess("Сборка добавлена: " + name);
      }
    } catch (e: unknown) {
      if (ctx.alertError) {
        ctx.alertError("Не удалось добавить сборку: " + e);
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
        console.log("Проверка кэша для " + (version.name ?? version.uuid));
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
          text="Добавить сборку"
          tooltip="Добавить новую сборку из манифеста или URL ресурсов"
          variant="success"
          onClick={() => setShowAddBuildModal(true)}
        />
        <div className="p-2 ms-auto"></div>
        <Button
          icon="trash"
          text="Удалить офлайн-кэши"
          tooltip="Удалить все офлайн-кэши"
          variant="danger"
          onClick={() => {
            if (ctx.showConfirmationModal) {
              ctx.showConfirmationModal(
                "Вы уверены, что хотите удалить все офлайн-кэши?",
                "Удалить все",
                "danger",
                deleteAllOfflineCaches,
              );
            }
          }}
        />
        <Button
          icon="trash"
          text="Очистить кэш игры"
          tooltip="Очистить все игровые кэши"
          variant="danger"
          onClick={() => {
            if (ctx.showConfirmationModal) {
              ctx.showConfirmationModal(
                "Вы уверены, что хотите очистить все игровые кэши?",
                "Очистить все",
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
            const label = version.name ?? "версия " + version.uuid;
            ctx.showConfirmationModal(
              "Вы уверены, что хотите очистить игровой кэш для " +
                label +
                "?",
              "Очистить",
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
            const label = version.name ?? "версия " + version.uuid;
            ctx.showConfirmationModal(
              "Вы уверены, что хотите удалить офлайн-кэш для " +
                label +
                "?",
              "Удалить",
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
