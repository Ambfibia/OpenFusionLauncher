import Button from "./Button";
import { Stack, Modal } from "react-bootstrap";
import { open } from "@tauri-apps/plugin-shell";

export default function AboutModal({
  show,
  setShow,
  name,
  version,
}: {
  show: boolean;
  setShow: (newShow: boolean) => void;
  name: string;
  version: string;
}) {
  return (
    <Modal show={show} onHide={() => setShow(false)} centered={true}>
      <Modal.Header>
        <Modal.Title>О программе {name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="font-monospace">Версия {version}</p>
        <p>
          ©2020-2025 Участники OpenFusion
          <br />
          OpenFusion распространяется по лицензии MIT.
          <br />
        </p>
      </Modal.Body>
      <Modal.Footer className="flex-row-reverse">
        <Stack direction="horizontal" gap={2} className="w-100">
          <Button
            onClick={() => open("https://github.com/OpenFusionProject/")}
            variant="primary"
            icon="github fa-brands fa-xl"
            tooltip="Страница на GitHub"
          />
          <Button
            onClick={() => open("https://discord.gg/DYavckB")}
            variant="primary"
            icon="discord fa-brands fa-lg"
            tooltip="Чат Discord"
          />
          <div className="ms-auto"></div>
          <Button
            onClick={() => setShow(false)}
            variant="primary"
            text="Закрыть"
          />
        </Stack>
      </Modal.Footer>
    </Modal>
  );
}
