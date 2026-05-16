import { LauncherSettings } from "@/app/types";
import { useContext, useEffect, useState } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import SettingControlDropdown from "./SettingControlDropdown";
import SettingControlBrowse from "./SettingControlBrowse";
import { getDebugMode } from "@/app/util";
import { SettingsCtx } from "@/app/contexts";
import SettingsHeader from "./SettingsHeader";

export default function LauncherSettingsTab({
  active,
  currentSettings,
  updateSettings,
}: {
  active: boolean;
  currentSettings: LauncherSettings;
  updateSettings: (
    newSettings: LauncherSettings | undefined,
  ) => Promise<LauncherSettings>;
}) {
  const [settings, setSettings] = useState<LauncherSettings>(currentSettings);
  const [working, setWorking] = useState<boolean>(false);

  const [debug, setDebug] = useState<boolean>(false);

  const ctx = useContext(SettingsCtx);

  useEffect(() => {
    getDebugMode().then(setDebug);
  }, [active]);

  const applySettings = async () => {
    setWorking(true);
    // The backend might adjust stuff, so update the state
    const newConfig = await updateSettings(settings!);
    setSettings(newConfig);
    setWorking(false);
  };

  const areSettingsDifferent = () => {
    const currentJson = JSON.stringify(
      currentSettings,
      Object.keys(currentSettings).sort(),
    );
    const newJson = JSON.stringify(settings, Object.keys(settings).sort());
    return currentJson !== newJson;
  };
  const canApply = areSettingsDifferent();

  const resetSettings = async () => {
    setWorking(true);
    const newConfig = await updateSettings(undefined);
    setSettings(newConfig);
    setWorking(false);
  };

  const showResetConfirmation = () => {
    if (ctx.showConfirmationModal) {
      ctx.showConfirmationModal(
        "Вы уверены, что хотите сбросить настройки лаунчера к значениям по умолчанию?",
        "Сбросить настройки лаунчера",
        "danger",
        resetSettings,
      );
    }
  };

  return (
    <Container fluid id="settings-container" className="bg-footer">
      <Row>
        <Col />
        <Col
          xs={12}
          sm={10}
          md={8}
          id="settings-column"
          className="primary my-5 p-3 rounded border border-primary"
        >
          <SettingsHeader
            text="Настройки лаунчера"
            working={working}
            canApply={canApply}
            onApply={applySettings}
            onDiscard={() => setSettings(currentSettings)}
            onReset={showResetConfirmation}
          />
          <hr className="border-primary" />
          {settings && (
            <Form>
              {/* <SettingControlDropdown
                id="theme"
                name="Launcher Theme"
                options={[
                  { key: "system", label: "Match system theme" },
                  { key: "dexlabs_dark", label: "DexLabs Dark" },
                  { key: "dexlabs_light", label: "DexLabs Light" },
                ]}
                defaultKey="system"
                oldValue={currentSettings.theme}
                value={settings.theme}
                onChange={(value) =>
                  setSettings((current) => ({
                    ...current!,
                    theme: value === "system" ? undefined : value,
                  }))
                }
              /> */}
              <SettingControlDropdown
                id="check_for_updates"
                name="Проверять обновления лаунчера при запуске"
                options={[
                  { key: "yes", value: true, label: "Да" },
                  { key: "no", value: false, label: "Нет" },
                ]}
                defaultKey="yes"
                oldValue={currentSettings.check_for_updates}
                value={settings.check_for_updates}
                onChange={(value) =>
                  setSettings((current) => ({
                    ...current!,
                    check_for_updates: value,
                  }))
                }
              />
              <SettingControlBrowse
                id="game_cache_path"
                name="Путь к кэшу игры"
                oldValue={currentSettings.game_cache_path}
                value={settings.game_cache_path}
                directory={true}
                onChange={(value) =>
                  setSettings((current) => ({
                    ...current!,
                    game_cache_path: value,
                  }))
                }
              />
              <SettingControlBrowse
                id="offline_cache_path"
                name="Путь к офлайн-кэшу"
                oldValue={currentSettings.offline_cache_path}
                value={settings.offline_cache_path}
                directory={true}
                onChange={(value) =>
                  setSettings((current) => ({
                    ...current!,
                    offline_cache_path: value,
                  }))
                }
              />
              <SettingControlDropdown
                id="proxy_asset_downloads"
                name="Загружать игровые ресурсы через HTTPS-прокси"
                options={[
                  { key: "yes", value: true, label: "Да" },
                  { key: "no", value: false, label: "Нет" },
                ]}
                defaultKey="yes"
                oldValue={currentSettings.proxy_asset_downloads}
                value={settings.proxy_asset_downloads}
                onChange={(value) =>
                  setSettings((current) => ({
                    ...current!,
                    proxy_asset_downloads: value,
                  }))
                }
              />
              <SettingControlDropdown
                id="use_offline_caches"
                name="Использовать загруженные офлайн-кэши"
                options={[
                  { key: "yes", value: true, label: "Да" },
                  { key: "no", value: false, label: "Нет" },
                ]}
                defaultKey="yes"
                oldValue={currentSettings.use_offline_caches}
                value={settings.use_offline_caches}
                onChange={(value) =>
                  setSettings((current) => ({
                    ...current!,
                    use_offline_caches: value,
                  }))
                }
              />
              <SettingControlDropdown
                id="verify_offline_caches"
                name="Проверять офлайн-кэши при запуске"
                options={[
                  { key: "yes", value: true, label: "Да" },
                  { key: "no", value: false, label: "Нет" },
                ]}
                defaultKey="no"
                oldValue={currentSettings.verify_offline_caches}
                value={settings.verify_offline_caches}
                onChange={(value) =>
                  setSettings((current) => ({
                    ...current!,
                    verify_offline_caches: value,
                  }))
                }
              />
              <SettingControlDropdown
                id="delete_old_game_caches"
                name="Удалять старые игровые кэши при обновлении"
                options={[
                  { key: "yes", value: true, label: "Да" },
                  { key: "no", value: false, label: "Нет" },
                ]}
                defaultKey="no"
                oldValue={currentSettings.delete_old_game_caches}
                value={settings.delete_old_game_caches}
                onChange={(value) =>
                  setSettings((current) => ({
                    ...current!,
                    delete_old_game_caches: value,
                  }))
                }
              />
              <SettingControlDropdown
                id="launch_behavior"
                name="Поведение при запуске игры"
                options={[
                  {
                    key: "hide",
                    label: "Скрыть",
                    description:
                      "скрывать лаунчер при запуске игры и снова показывать после выхода",
                  },
                  {
                    key: "quit",
                    label: "Выйти",
                    description: "закрывать лаунчер при запуске игры",
                  },
                  {
                    key: "stay_open",
                    label: "Оставить открытым",
                    description:
                      "оставлять лаунчер открытым при запуске игры",
                  },
                ]}
                defaultKey="hide"
                oldValue={currentSettings.launch_behavior}
                value={settings.launch_behavior}
                onChange={(value) =>
                  setSettings((current) => ({
                    ...current!,
                    launch_behavior: value,
                  }))
                }
              />
            </Form>
          )}
          {debug && (
            <>
              <hr className="border-primary" />
              <h6>Отладка</h6>
              <textarea
                className="w-100"
                rows={5}
                value={JSON.stringify(currentSettings, null, 4)}
                readOnly
              />
              <textarea
                className="w-100"
                rows={5}
                value={JSON.stringify(settings, null, 4)}
                readOnly
              />
            </>
          )}
        </Col>
        <Col />
      </Row>
    </Container>
  );
}
