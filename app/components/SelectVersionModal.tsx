import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";

import Button from "./Button";

import { ServerEntry, VersionEntry } from "@/app/types";
import { useT } from "@/app/i18n";

const findVersion = (versions: VersionEntry[], uuid: string) => {
  return versions.find((version) => version.uuid == uuid);
};

const getVersionsForServer = async (server: ServerEntry) => {
  if (!server.endpoint) {
    // Not available for simple servers
    throw new Error("server.endpoint2");
  }

  const versions: string[] = await invoke("get_versions_for_server", {
    uuid: server.uuid,
  });
  return versions;
};

const getLabelForVersion = (version: VersionEntry) => {
  if (version.name) {
    let label = "";
    label += version.name;
    if (version.description) {
      label += ": " + version.description;
    }
    return label;
  }
  return version.uuid;
};

export default function SelectVersionModal({
  server,
  versions,
  show,
  setShow,
  onSelect,
}: {
  server?: ServerEntry;
  versions: VersionEntry[];
  show: boolean;
  setShow: (newShow: boolean) => void;
  onSelect: (selectedVersionUuid: string) => void;
}) {
  const t = useT();
  const doHide = () => {
    setShow(false);
  };

  const [available, setAvailable] = useState<string[] | undefined>(undefined);
  const [selected, setSelected] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchAvailableVersions = async () => {
      try {
        const availableVersions = await getVersionsForServer(server!);
        setAvailable(availableVersions);
      } catch (e: unknown) {
        console.error("Failed to fetch available versions: " + e);
        setAvailable([]);
      }
    };

    setSelected(undefined);
    if (server) {
      fetchAvailableVersions();
    }
  }, [server]);

  return (
    <Modal show={show} onHide={() => doHide()} centered={true}>
      <Modal.Header>
        <Modal.Title>{t("common.selectGameVersion")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <span
          dangerouslySetInnerHTML={{
            __html: t("server.supportsMultipleGame", {
              server: `<strong>${server?.description ?? ""}</strong>`,
            }),
          }}
        />
        <br />
        {available ? (
          <Form className="mt-2">
            {available.map((uuid) => {
              const version = findVersion(versions, uuid);
              return (
                version && (
                  <Form.Check
                    key={version.uuid}
                    type="radio"
                    name="common.version3"
                    label={getLabelForVersion(version)}
                    checked={selected === version.uuid}
                    onChange={() => setSelected(version.uuid)}
                  />
                )
              );
            })}
          </Form>
        ) : (
          <div className="text-center">
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            ></span>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => doHide()} variant="primary" text="common.cancel" />
        <Button
          onClick={() => {
            doHide();
            onSelect(selected!);
          }}
          variant="success"
          text="common.select"
          enabled={!!selected}
        />
      </Modal.Footer>
    </Modal>
  );
}
