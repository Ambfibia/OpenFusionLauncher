"use client";
import { Modal } from "react-bootstrap";
import Button from "./Button";
import { useT } from "@/app/i18n";

export default function ConfirmationModal({
  show,
  setShow,
  message,
  confirmText,
  confirmVariant,
  onConfirm,
}: {
  show: boolean;
  setShow: (show: boolean) => void;
  message: string;
  confirmText: string;
  confirmVariant: string;
  onConfirm: () => void;
}) {
  const t = useT();
  return (
    <Modal show={show} onHide={() => setShow(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>{t("common.confirm")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          onClick={() => setShow(false)}
          text="common.cancel"
        />
        <Button
          variant={confirmVariant}
          onClick={onConfirm}
          text={confirmText}
        />
      </Modal.Footer>
    </Modal>
  );
}
