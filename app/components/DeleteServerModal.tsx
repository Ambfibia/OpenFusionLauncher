import Modal from "react-bootstrap/Modal";

import Button from "./Button";

import { ServerEntry } from "@/app/types";
import { useT } from "@/app/i18n";

export default function DeleteServerModal({
  server,
  show,
  setShow,
  deleteServer,
}: {
  server?: ServerEntry;
  show: boolean;
  setShow: (newShow: boolean) => void;
  deleteServer: (uuid: string | undefined) => void;
}) {
  const t = useT();
  return (
    <Modal show={show} onHide={() => setShow(false)} centered={true}>
      <Modal.Header>
        <Modal.Title>{t("server.delete.title")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {t("server.delete.message").replace(
          "{server}",
          server?.description ?? "",
        )}
        <br />
        {t("server.delete.hint")}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => setShow(false)} variant="primary" text="common.cancel" />
        <Button
          onClick={() => {
            setShow(false);
            deleteServer(server?.uuid);
          }}
          variant="danger"
          text="server.delete.confirm"
        />
      </Modal.Footer>
    </Modal>
  );
}
