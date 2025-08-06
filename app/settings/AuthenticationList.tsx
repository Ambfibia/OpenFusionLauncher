import Button from "../components/Button";
import { LoginSession, RegistrationResult, ServerEntry } from "@/app/types";
import {
  getBackgroundImageStyle,
  getBackgroundImageUrlForServer,
  getLogoImageUrlForServer,
} from "@/app/util";
import { invoke } from "@tauri-apps/api/core";
import { CSSProperties, useContext, useEffect, useState } from "react";
import { SettingsCtx } from "@/app/contexts";
import LoginModal from "@/components/LoginModal";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import ManageAccountModal from "./ManageAccountModal";
import { useT } from "@/app/i18n";

function ListEntry({
  server,
  refreshes,
}: {
  server: ServerEntry;
  refreshes: number;
}) {
  const t = useT();
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [offline, setOffline] = useState<boolean | undefined>(undefined);
  const [buttonLoading, setButtonLoading] = useState<boolean>(false);
  const [session, setSession] = useState<LoginSession | undefined | null>(
    undefined,
  );

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showManageAccountModal, setShowManageAccountModal] = useState(false);

  const ctx = useContext(SettingsCtx);

  const loadSession = async () => {
    setOffline(undefined);
    setSession(undefined);
    const endpoint = "https://" + server.endpoint!;
    const live: boolean = await invoke("live_check", { url: endpoint });
    if (!live) {
      setOffline(true);
      setSession(null);
      return;
    }
    setOffline(false);

    try {
      const session: LoginSession = await invoke("get_session", {
        serverUuid: server.uuid,
      });
      setSession(session);
    } catch (e) {
      setSession(null);
    }
  };

  const logIn = () => {
    setShowLoginModal(true);
  };

  const logOut = async () => {
    setButtonLoading(true);
    try {
      await invoke("do_logout", { serverUuid: server.uuid });
      if (ctx.alertSuccess) {
        ctx.alertSuccess(
          t("server.loggedOut", { server: server.description }),
        );
      }
      loadSession();
    } catch (e: unknown) {
      if (ctx.alertError) {
          ctx.alertError(
          t("auth.failedLogout", { error: String(e) }),
          );
      }
    }
    setButtonLoading(false);
  };

  const doLogin = async (username: string, password: string) => {
    setButtonLoading(true);
    try {
      await invoke("do_login", {
        serverUuid: server.uuid,
        username: username,
        password: password,
        remember: true,
      });
      if (ctx.alertSuccess) {
        ctx.alertSuccess(t("status.loggedSuccessfully"));
      }
      loadSession();
    } catch (e: unknown) {
      if (ctx.alertError) {
        ctx.alertError(
          t("status.failedLogin", { error: String(e) }),
        );
      }
    }
    setButtonLoading(false);
  };

  const doRegister = async (
    username: string,
    password: string,
    email: string,
  ) => {
    setButtonLoading(true);
    try {
      const res: RegistrationResult = await invoke("do_register", {
        serverUuid: server.uuid,
        username: username,
        password: password,
        email: email,
      });

      if (res.can_login) {
        if (ctx.alertSuccess) {
          ctx.alertSuccess(res.resp);
        }
        doLogin(username, password);
      } else {
        if (ctx.alertWarning) {
          ctx.alertWarning(res.resp);
        }
      }
    } catch (e: unknown) {
      if (ctx.alertError) {
        ctx.alertError(
          t("status.failedRegister", { error: String(e) }),
        );
      }
    }
    setButtonLoading(false);
  };

  const sendOneTimePassword = async (email: string) => {
    try {
      await invoke("send_otp", { email, serverUuid: server.uuid });
      setShowForgotPasswordModal(false);
      if (ctx.alertSuccess) {
        ctx.alertSuccess(t("auth.onetimePasswordSent"));
      }
    } catch (e: unknown) {
      if (ctx.alertError) {
        ctx.alertError(
          t("auth.failedSendOnetime", {
            error: String(e),
          }),
        );
      }
    }
  };

  const updateEmail = async (newEmail: string) => {
    try {
      await invoke("update_email", { newEmail, serverUuid: server.uuid, sessionToken: session!.session_token });
      if (ctx.alertSuccess) {
        ctx.alertSuccess(
          t("common.verificationEmailSent", { email: newEmail }),
        );
      }
      setShowManageAccountModal(false);
    } catch (e: unknown) {
      if (ctx.alertError) {
        ctx.alertError(
          t("status.failedSendVerification", {
            error: String(e),
          }),
        );
      }
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      await invoke("update_password", { newPassword, serverUuid: server.uuid, sessionToken: session!.session_token });
      if (ctx.alertSuccess) {
        ctx.alertSuccess(t("auth.passwordUpdatedSuccessfully"));
      }
      setShowManageAccountModal(false);
    } catch (e: unknown) {
      if (ctx.alertError) {
        ctx.alertError(
          t("auth.failedUpdatePassword", { error: String(e) }),
        );
      }
    }
  };

  useEffect(() => {
    const logoUrl = getLogoImageUrlForServer(server);
    if (logoUrl) {
      const img = new Image();
      img.src = logoUrl;
      img.onload = () => {
        setLogo(logoUrl);
      };
    }

    loadSession();
  }, [refreshes]);

  const bgUrl = getBackgroundImageUrlForServer(server) + "&r=" + refreshes;
  const rowStyle: CSSProperties = {
    ...getBackgroundImageStyle(bgUrl),
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };
  return (
    <>
      <tr>
        <td colSpan={2} className="bg-blend p-3" style={rowStyle}>
          <div className="d-flex justify-content-between align-items-center">
            <div className="font-monospace ps-3">
              {logo ? (
                <img
                  src={logo}
                  height={60}
                  className="d-block tt"
                  title={server.description}
                />
              ) : (
                <h3 className="mb-0">{server.description}</h3>
              )}
              <small className="text-muted">{server.endpoint}</small>
              {offline !== undefined && (
                <small className={"text-" + (offline! ? "danger" : "success")}>
                  {" " + (offline! ? t("common.offline") : t("common.online"))}
                </small>
              )}
            </div>
            {session === undefined ? (
              <span
                className="spinner-border spinner-border-lg mx-3"
                role="status"
                aria-hidden="true"
              ></span>
            ) : offline === true ? null : session === null ? (
              <div className="text-end">
                <small className="mb-1 d-block text-muted">{t("common.logged2")}</small>
                <Button
                  loading={buttonLoading}
                  icon="sign-in-alt"
                  text="auth.login"
                  onClick={logIn}
                  variant="success"
                />
              </div>
            ) : (
              <div className="text-end">
                <span className="mb-1 d-block">
                  <small className="text-muted">{t("common.logged3")}</small>
                  <h4 className="d-inline">{" " + session.username}</h4>
                </span>
                <Button
                  loading={buttonLoading}
                  icon="user"
                  text="common.manageAccount"
                  onClick={() => setShowManageAccountModal(true)}
                  variant="primary"
                  className="me-2"
                />
                <Button
                  loading={buttonLoading}
                  icon="sign-out-alt"
                  text="auth.logout"
                  onClick={logOut}
                  variant="danger"
                />
              </div>
            )}
          </div>
        </td>
      </tr>
      <LoginModal
        show={showLoginModal}
        server={server}
        alwaysRemember={true}
        onClose={() => setShowLoginModal(false)}
        onSubmitLogin={doLogin}
        onSubmitRegister={doRegister}
        onForgotPassword={() => setShowForgotPasswordModal(true)}
      />
      <ForgotPasswordModal
        show={showForgotPasswordModal}
        setShow={setShowForgotPasswordModal}
        server={server}
        onSubmit={(email) => sendOneTimePassword(email)}
      />
      <ManageAccountModal
        show={showManageAccountModal}
        setShow={setShowManageAccountModal}
        server={server}
        session={session || undefined}
        onUpdateEmail={updateEmail}
        onUpdatePassword={updatePassword}
      />
    </>
  );
}

export default function AuthenticationList({
  servers,
  refreshes,
}: {
  servers?: ServerEntry[];
  refreshes: number;
}) {
  const t = useT();
  return (
    <div className="table-responsive" id="auth-table">
      <table className="table table-striped table-hover mb-0">
        <tbody className="align-middle">
          {!servers ? (
            <tr>
              <td colSpan={3} className="text-center">
                <span
                  className="spinner-border spinner-border-sm m-2"
                  role="status"
                  aria-hidden="true"
                ></span>
              </td>
            </tr>
          ) : servers.length == 0 ? (
            <tr>
              <td colSpan={3}>{t("server.noServersAvailable")}</td>
            </tr>
          ) : (
            servers.map((server: ServerEntry) => {
              return (
                server.endpoint && (
                  <ListEntry
                    key={server.uuid}
                    server={server}
                    refreshes={refreshes}
                  />
                )
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
