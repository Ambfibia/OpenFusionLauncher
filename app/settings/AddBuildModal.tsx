import { Form, Modal } from "react-bootstrap";
import { Tabs, Tab } from "react-bootstrap";
import Button from "@/components/Button";
import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useT } from "@/app/i18n";

const TAB_IMPORT = "import";
const TAB_MANUAL = "manual";

export default function AddBuildModal({
  show,
  setShow,
  onImport,
  onManualAdd,
}: {
  show: boolean;
  setShow: (show: boolean) => void;
  onImport: (manifestPath: string) => Promise<boolean>;
  onManualAdd: (name: string, assetUrl: string) => void;
}) {
  const t = useT();
  const [tab, setTab] = useState(TAB_IMPORT);

  // Import tab
  const [manifestPath, setManifestPath] = useState<string>("");
  const validateImport = () => {
    return manifestPath.trim() != "";
  };

  // Manual tab
  const [name, setName] = useState<string>("");
  const [assetUrl, setAssetUrl] = useState<string>("");
  const validateManual = () => {
    return assetUrl.trim() != "";
  };

  useEffect(() => {
    if (show) {
      setTab(TAB_IMPORT);
      setManifestPath("");
      setName("");
      setAssetUrl("");
    }
  }, [show]);

  const onBrowse = async () => {
    const result = await open({
      multiple: false,
      directory: false,
      filters: [
        {
          name: t("Build manifest"),
          extensions: ["json"],
        },
      ],
    });
    if (result) {
      setManifestPath(result);
    }
  };

  const onSubmit = async () => {
    if (tab == TAB_MANUAL) {
      onManualAdd(name, assetUrl);
      setShow(false);
    } else {
      const succeeded = await onImport(manifestPath!);
      if (succeeded) {
        setShow(false);
      }
    }
  };

  return (
    <Modal show={show} onHide={() => setShow(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>{t("Add Build")}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <Tabs activeKey={tab} onSelect={(k) => setTab(k || TAB_IMPORT)} fill>
          <Tab eventKey={TAB_IMPORT} title={t("Import")}>
            <Form className="p-3">
              <Form.Group className="mb-3" controlId="editManifestPath">
                <Form.Label>{t("Manifest")}</Form.Label>
                <div className="d-flex align-items-center">
                  <Form.Control
                    type="text"
                    value={manifestPath}
                    onChange={(e) => setManifestPath(e.target.value)}
                    placeholder={t("No file selected")}
                  />
                  <Button
                    className="ms-3"
                    text="Browse..."
                    onClick={() => onBrowse()}
                  />
                </div>
              </Form.Group>
            </Form>
          </Tab>
          <Tab eventKey={TAB_MANUAL} title={t("Add Manually")}>
            <Form className="p-3">
              <Form.Group className="mb-3" controlId="editName">
                <Form.Label>{t("Name")}</Form.Label>
                <Form.Control
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("My Build")}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="editAssetUrl">
                <Form.Label>{t("Asset URL")}</Form.Label>
                <Form.Control
                  type="text"
                  value={assetUrl}
                  onChange={(e) => setAssetUrl(e.target.value)}
                  placeholder="https://cdn.example.com/build"
                />
              </Form.Group>
            </Form>
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          onClick={() => setShow(false)}
          text="Cancel"
        />
        <Button
          variant="success"
          text={tab == TAB_MANUAL ? "Add" : "Import"}
          enabled={tab == TAB_MANUAL ? validateManual() : validateImport()}
          onClick={() => onSubmit()}
        />
      </Modal.Footer>
    </Modal>
  );
}
