import { useState, useEffect, useContext } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SettingsCtx } from "@/app/contexts";
import { Stack } from "react-bootstrap";
import Button from "@/components/Button";
import { ServerEntry, Servers } from "@/app/types";
import AuthenticationList from "./AuthenticationList";

export default function AuthenticationTab({ active }: { active: boolean }) {
  const [servers, setServers] = useState<ServerEntry[] | undefined>(undefined);
  const [refreshes, setRefreshes] = useState(0);

  const ctx = useContext(SettingsCtx);

  const fetchServers = async () => {
    const servers: Servers = await invoke("get_servers");
    setServers(servers.servers);
  };

  const logOutAll = async () => {
    try {
      await invoke("do_logout");
      if (ctx.alertSuccess) {
        ctx.alertSuccess("Выполнен выход со всех игровых серверов");
      }
      refresh();
    } catch (e) {
      if (ctx.alertError) {
        ctx.alertError("Не удалось выйти со всех игровых серверов: " + e);
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
          text="Обновить"
          tooltip="Обновить входы"
          variant="primary"
          onClick={refresh}
        />
        {/* <div className="p-2 ms-auto"></div> */}
        <Button
          icon="sign-out-alt"
          text="Выйти со всех"
          tooltip="Выйти со всех игровых серверов"
          variant="danger"
          onClick={() => {
            if (ctx.showConfirmationModal) {
              ctx.showConfirmationModal(
                "Вы уверены, что хотите выйти со всех игровых серверов?",
                "Выйти со всех",
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
