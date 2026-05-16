import { Form, Modal } from "react-bootstrap";
import Button from "@/components/Button";
import { useState, useEffect } from "react";
import { ServerEntry } from "@/app/types";
import { validateEmail } from "@/app/util";

export default function ForgotPasswordModal({
  show,
  setShow,
  server,
  onSubmit,
}: {
  show: boolean;
  setShow: (show: boolean) => void;
  server?: ServerEntry,
  onSubmit: (email: string) => Promise<void>;
}) {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setEmail("");
  }, [server]);

  const onHitSubmit = async () => {
    if (server) {
      setLoading(true);
      await onSubmit(email);
      setLoading(false);
    }
  }

  return (
    <Modal show={show} onHide={() => setShow(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Забыли пароль?</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <p className="px-3 pt-3 mb-0">
          Введите ниже адрес электронной почты, связанный с вашим аккаунтом,
          чтобы получить одноразовый пароль для входа.
        </p>
        <Form className="p-3">
          <Form.Group controlId="editEmail">
            <Form.Control
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Эл. почта"
              isInvalid={
                email.length > 0 && !validateEmail(email, false)
              }
            />
          </Form.Group>
        </Form>
        <p className="px-3">
          {"После входа вы можете изменить пароль в разделе Настройки -> Авторизация -> Управление аккаунтом -> Изменить пароль."}
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          onClick={() => setShow(false)}
          text="Отмена"
        />
        <Button
          variant="success"
          text={"Отправить временный пароль"}
          loading={loading}
          enabled={validateEmail(email, false)}
          onClick={() => onHitSubmit()}
        />
      </Modal.Footer>
    </Modal>
  );
}
