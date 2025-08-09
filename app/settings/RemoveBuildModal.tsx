import { Modal } from "react-bootstrap";
import Button from "@/components/Button";
import { VersionEntry } from "@/app/types";
import { useT } from "@/app/i18n";

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
  const t = useT();

  return (
    <Modal show={show} onHide={() => setShow(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>{t("build.remove")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <span
          dangerouslySetInnerHTML={{
            __html: t("build.confirmRemove", {
              build: `<strong>${version?.name ?? version?.uuid}</strong>`,
            }),
          }}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          onClick={() => setShow(false)}
          text="common.cancel"
        />
        <Button
          variant="danger"
          text="cache.removeClearCaches"
          onClick={() => onConfirm(version!.uuid, true)}
        />
        <Button
          variant="success"
          text="common.remove"
          onClick={() => onConfirm(version!.uuid, false)}
        />
      </Modal.Footer>
    </Modal>
  );
}
