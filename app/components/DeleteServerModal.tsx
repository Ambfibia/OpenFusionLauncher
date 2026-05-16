import Modal from "react-bootstrap/Modal";

import Button from "./Button";

import { ServerEntry } from "@/app/types";

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
  return (
    <Modal show={show} onHide={() => setShow(false)} centered={true}>
      <Modal.Header>
        <Modal.Title>Вы уверены?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Вы действительно хотите удалить {server?.description}?
        <br />
        Вы сможете добавить его снова позже.
      </Modal.Body>
      <Modal.Footer>
        <Button
          onClick={() => setShow(false)}
          variant="primary"
          text="Отмена"
        />
        <Button
          onClick={() => {
            setShow(false);
            deleteServer(server?.uuid);
          }}
          variant="danger"
          text="Да, удалить"
        />
      </Modal.Footer>
    </Modal>
  );
}
