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
  const [tab, setTab] = useState(TAB_IMPORT);
  const t = useT();

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
          name: t("build.manifestFile"),
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
        <Modal.Title>{t("build.add")}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <Tabs activeKey={tab} onSelect={(k) => setTab(k || TAB_IMPORT)} fill>
          <Tab eventKey={TAB_IMPORT} title={t("common.import")}>
            <Form className="p-3">
              <Form.Group className="mb-3" controlId="editManifestPath">
                <Form.Label>{t("build.manifest")}</Form.Label>
                <div className="d-flex align-items-center">
                  <Form.Control
                    type="text"
                    value={manifestPath}
                    onChange={(e) => setManifestPath(e.target.value)}
                    placeholder={t("build.noFileSelected")}
                  />
                  <Button
                    className="ms-3"
                    text="common.browse"
                    onClick={() => onBrowse()}
                  />
                </div>
              </Form.Group>
            </Form>
          </Tab>
          <Tab eventKey={TAB_MANUAL} title={t("build.addManually")}>
            <Form className="p-3">
              <Form.Group className="mb-3" controlId="editName">
                <Form.Label>{t("build.name")}</Form.Label>
                <Form.Control
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("build.myBuild")}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="editAssetUrl">
                <Form.Label>{t("build.assetUrl")}</Form.Label>
                <Form.Control
                  type="text"
                  value={assetUrl}
                  onChange={(e) => setAssetUrl(e.target.value)}
                  placeholder={t("build.assetUrlExample")}
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
          text="common.cancel"
        />
        <Button
          variant="success"
          text={tab == TAB_MANUAL ? "common.add" : "common.import"}
          enabled={tab == TAB_MANUAL ? validateManual() : validateImport()}
          onClick={() => onSubmit()}
        />
      </Modal.Footer>
    </Modal>
  );
}
