import { useState, useEffect, useContext } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SettingsCtx } from "@/app/contexts";
import { Stack } from "react-bootstrap";
import Button from "@/components/Button";
import { ServerEntry, Servers } from "@/app/types";
import AuthenticationList from "./AuthenticationList";
import { useT } from "@/app/i18n";

export default function AuthenticationTab({ active }: { active: boolean }) {
  const [servers, setServers] = useState<ServerEntry[] | undefined>(undefined);
  const [refreshes, setRefreshes] = useState(0);

  const ctx = useContext(SettingsCtx);
  const t = useT();

  const fetchServers = async () => {
    const servers: Servers = await invoke("get_servers");
    setServers(servers.servers);
  };

  const logOutAll = async () => {
    try {
      await invoke("do_logout");
      if (ctx.alertSuccess) {
        ctx.alertSuccess(t("server.loggedOutGame"));
      }
      refresh();
    } catch (e) {
      if (ctx.alertError) {
        ctx.alertError(
          t("server.failedLogOut", { error: String(e) }),
        );
      }
    }
  };

  const refresh = async () => {
    fetchServers();
    setRefreshes((refreshes) => refreshes + 1);
  };

  useEffect(() => {
    if (!servers && active) {
      fetchServers();
    }
  }, [active]);

  return (
    <>
      <Stack
        direction="horizontal"
        className="flex-row-reverse p-2"
        gap={2}
        id="game-builds-buttonstack"
      >
        <Button
          icon="rotate-right"
          text="nav.refresh"
          tooltip="nav.refreshLogins"
          variant="primary"
          onClick={refresh}
        />
        {/* <div className="p-2 ms-auto"></div> */}
        <Button
          icon="sign-out-alt"
          text="auth.logOut"
          tooltip="server.logOutGame"
          variant="danger"
          onClick={() => {
            if (ctx.showConfirmationModal) {
              ctx.showConfirmationModal(
                t("dialog.confirmLogout"),
                t("auth.logOut"),
                "danger",
                logOutAll,
              );
            }
          }}
        />
      </Stack>
      <AuthenticationList servers={servers} refreshes={refreshes} />
    </>
  );
}
