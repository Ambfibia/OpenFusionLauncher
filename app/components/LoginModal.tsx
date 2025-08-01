import { useState, useEffect } from "react";

import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";

import Button from "./Button";

import { EndpointInfo, ServerEntry } from "@/app/types";
import { validateUsername, validatePassword, validateEmail, getPrivacyPolicyUrlForServer } from "@/app/util";
import { Overlay, Tooltip } from "react-bootstrap";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";
import { parse } from "marked";
import DOMPurify from "dompurify";
import get_seed from "@/app/seed";
import { useT } from "@/app/i18n";

const TAB_LOGIN = "login";
const TAB_REGISTER = "register";

const CONTROL_ID_USERNAME = "username";
const CONTROL_ID_PASSWORD = "password";
const CONTROL_ID_REMEMBER = "remember";
const CONTROL_ID_NEW_USERNAME = "newUsername";
const CONTROL_ID_NEW_PASSWORD = "newPassword";
const CONTROL_ID_CONFIRM_PASSWORD = "confirmPassword";
const CONTROL_ID_EMAIL = "email";

const replaceLinksWithShellOpen = (html: string) => {
  return html.replace(/<a href="([^"]+)">([^<]+)<\/a>/g, (match, href, text) => {
    return `<a href="#" onclick="window.__TAURI__.shell.open('${href}'); return false;">${text}</a>`;
  });
};

const getUpsellImage = (server?: ServerEntry) => {
  if (server?.endpoint) {
    // HACK: add the counter to the url as a parameter to prevent caching across reloads
    return (
      "https://" + server.endpoint + "/announcements.png?seed=" + get_seed()
    );
  }
  return undefined;
};

const checkEmailRequired = async (server: ServerEntry) => {
  if (!server.endpoint) return false;
  const info: EndpointInfo = await invoke("get_info_for_server", {
    uuid: server.uuid,
  });
  return info.email_required ?? false;
};

function AnnouncementsPanel({ server }: { server?: ServerEntry }) {
  const t = useT();
  const ERROR_TEXT = t("This server has no announcements.");

  const [showUpsell, setShowUpsell] = useState<boolean>(false);
  const [showAnnouncements, setShowAnnouncements] = useState<boolean>(false);
  const [announcements, setAnnouncements] = useState<string>("");
  const [error, setError] = useState<boolean>(false);

  const show = showUpsell || showAnnouncements;

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const announcements: string = await invoke(
          "get_announcements_for_server",
          {
            uuid: server!.uuid,
          },
        );
        setError(false);
        const parsed: string = await parse(announcements);
        const sanitized: string = DOMPurify.sanitize(parsed);
        const linksReplaced: string = replaceLinksWithShellOpen(sanitized);
        setAnnouncements(linksReplaced);
        setShowAnnouncements(true);
      } catch (e) {
        console.warn(e);
        setError(true);
      }
    };

    setShowUpsell(false);
    setShowAnnouncements(false);
    setAnnouncements("");
    setError(false);
    if (server) {
      fetchAnnouncements();
    }
  }, [server]);

  return (
    <div className={"server-landing " + (!show ? "d-none" : "")}>
      <img
        src={getUpsellImage(server)}
        className={!showUpsell ? "d-none" : ""}
        onLoad={() => setShowUpsell(true)}
        alt={t("Upsell")}
      />
      <div className="announcements">
        {error ? ERROR_TEXT : <div dangerouslySetInnerHTML={{ __html: announcements }} />}
      </div>
    </div>
  );
}

function RequirementsTooltip({
  focusedControlId,
  controlId,
  children,
}: {
  focusedControlId: string | null;
  controlId: string;
  children: React.ReactNode;
}) {
  const target = document.getElementById(controlId);
  const show = !!(focusedControlId && focusedControlId === controlId);
  return (
    <Overlay target={target} show={show} placement="right">
      <Tooltip id={controlId + "Tooltip"}>{children}</Tooltip>
    </Overlay>
  );
}

export default function LoginModal({
  server,
  show,
  alwaysRemember,
  onClose,
  onSubmitLogin,
  onSubmitRegister,
  onForgotPassword,
}: {
  server?: ServerEntry;
  show: boolean;
  alwaysRemember: boolean;
  onClose: () => void;
  onSubmitLogin: (username: string, password: string, remember: boolean) => void;
  onSubmitRegister: (username: string, password: string, email: string) => void;
  onForgotPassword: () => void;
}) {
  const t = useT();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [remember, setRemember] = useState<boolean>(alwaysRemember);
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  // I could not get this to work any other way; improvements welcome
  const [activeControl, setActiveControl] = useState<string | null>(null);

  const [tab, setTab] = useState<string>(TAB_LOGIN);

  const [emailRequired, setEmailRequired] = useState<boolean>(false);

  const validateLogin = () => {
    return username.length > 0 && password.length > 0;
  };

  const validateRegister = () => {
    return (
      validateUsername(username) &&
      validatePassword(password) &&
      password === confirmPassword &&
      validateEmail(email, !emailRequired)
    );
  };

  const clear = () => {
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setEmail("");
    setRemember(alwaysRemember);
  };

  useEffect(() => {
    clear();
    if (server) {
      checkEmailRequired(server).then(setEmailRequired);
    }
  }, [server]);

  const canSubmit = (tab: string) => {
    return tab === TAB_LOGIN ? validateLogin() : validateRegister();
  };

  const submitForm = () => {
    if (!canSubmit(tab)) return;
    onClose();
    if (tab === TAB_LOGIN) {
      onSubmitLogin(username, password, remember);
    } else if (tab === TAB_REGISTER) {
      onSubmitRegister(username, password, email);
    }
  };

  return (
    <Modal show={show && !!server} onHide={onClose} centered={true} size="lg">
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          submitForm();
        }}
      >
        <Modal.Header>
          <Modal.Title>{server?.description}</Modal.Title>
        </Modal.Header>
        <AnnouncementsPanel server={server} />
        <Modal.Body className="p-0">
          <Tabs
            activeKey={tab}
            onSelect={(k) => setTab(k ?? TAB_LOGIN)}
            className="mb-3"
            fill
          >
            <Tab eventKey={TAB_LOGIN} title={t("Log In")} className="p-3">
              <Form.Group className="mb-3" controlId={CONTROL_ID_USERNAME}>
                <Form.Control
                  type="text"
                  placeholder={t("Username")}
                  value={username}
                  onFocus={() => setActiveControl(CONTROL_ID_USERNAME)}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId={CONTROL_ID_PASSWORD}>
                <Form.Control
                  type="password"
                  placeholder={t("Password")}
                  value={password}
                  onFocus={() => setActiveControl(CONTROL_ID_PASSWORD)}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Group>
              <div className="d-flex justify-content-between">
                <Form.Group controlId={CONTROL_ID_REMEMBER}>
                  <Form.Check
                    type="checkbox"
                    label={t("Remember Me")}
                    disabled={alwaysRemember}
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                </Form.Group>
                <span
                  role="button"
                  className="text-decoration-underline"
                  onClick={() => {
                    onForgotPassword();
                    onClose(); // bootstrap doesn't support nested modals
                  }}
                >
                {t("Forgot your password?")}
                </span>
              </div>
            </Tab>
            <Tab eventKey={TAB_REGISTER} title={t("Register")} className="p-3">
              <Form.Group className="mb-3" controlId={CONTROL_ID_NEW_USERNAME}>
                <Form.Control
                  type="text"
                  placeholder={t("Username")}
                  value={username}
                  onFocus={() => setActiveControl(CONTROL_ID_NEW_USERNAME)}
                  onChange={(e) => setUsername(e.target.value)}
                  isInvalid={username.length > 0 && !validateUsername(username)}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId={CONTROL_ID_NEW_PASSWORD}>
                <Form.Control
                  type="password"
                  placeholder={t("Password")}
                  value={password}
                  onFocus={() => setActiveControl(CONTROL_ID_NEW_PASSWORD)}
                  onChange={(e) => setPassword(e.target.value)}
                  isInvalid={password.length > 0 && !validatePassword(password)}
                />
              </Form.Group>
              <Form.Group
                className="mb-3"
                controlId={CONTROL_ID_CONFIRM_PASSWORD}
              >
                <Form.Control
                  type="password"
                  placeholder={t("Confirm Password")}
                  value={confirmPassword}
                  onFocus={() => setActiveControl(CONTROL_ID_CONFIRM_PASSWORD)}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  isInvalid={password !== confirmPassword}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId={CONTROL_ID_EMAIL}>
                <Form.Control
                  type="text"
                  placeholder={t("Email") + (emailRequired ? "" : " " + t("(optional)"))}
                  value={email}
                  onFocus={() => setActiveControl(CONTROL_ID_EMAIL)}
                  onChange={(e) => setEmail(e.target.value)}
                  isInvalid={
                    email.length > 0 && !validateEmail(email, !emailRequired)
                  }
                />
              </Form.Group>
              <div className="text-center">
                <span
                  role="button"
                  className="text-decoration-underline"
                  onClick={() => {
                    const url = getPrivacyPolicyUrlForServer(server!);
                    open(url);
                  }}
                >
                  {t("View this server's privacy policy")}
                </span>
              </div>
              <RequirementsTooltip
                focusedControlId={activeControl}
                controlId={CONTROL_ID_NEW_USERNAME}
              >
                <div className="text-start lh-small">
                  {"\u2022 " + t("4 - 32 characters long")}
                  <br />{"\u2022 " + t("No special characters besides - and _")}
                </div>
              </RequirementsTooltip>
              <RequirementsTooltip
                focusedControlId={activeControl}
                controlId={CONTROL_ID_NEW_PASSWORD}
              >
                <div className="text-start lh-small">
                  {"\u2022 " + t("8 - 32 characters long")}
                </div>
              </RequirementsTooltip>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onClose} variant="primary" text="Cancel" />
          <Button
            onClick={submitForm}
            variant="success"
            text={tab === TAB_LOGIN ? "Log In" : "Register"}
            enabled={canSubmit(tab)}
          />
          {/* Hidden submit button */}
          <button type="submit" style={{ display: "none" }} />
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
