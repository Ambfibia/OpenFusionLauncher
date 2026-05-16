import { Modal } from "react-bootstrap";
import Button from "@/components/Button";
import { VersionEntry } from "@/app/types";

export default function RemoveBuildModal({
  show,
  setShow,
  version,
  onConfirm,
}: {
  show: boolean;
  setShow: (show: boolean) => void;
  version?: VersionEntry,
  onConfirm: (uuid: string, deleteCaches: boolean) => void;
}) {

  return (
    <Modal show={show} onHide={() => setShow(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Удалить сборку</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Вы уверены, что хотите удалить сборку <strong>{version?.name ?? version?.uuid}</strong>?
        Она будет автоматически загружена снова, если понадобится серверу.
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          onClick={() => setShow(false)}
          text="Отмена"
        />
        <Button
          variant="danger"
          text="Удалить и очистить кэши"
          onClick={() => onConfirm(version!.uuid, true)}
        />
        <Button
          variant="success"
          text="Удалить"
          onClick={() => onConfirm(version!.uuid, false)}
        />
      </Modal.Footer>
    </Modal>
  );
}
