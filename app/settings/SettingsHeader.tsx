import Button from "@/components/Button";

export default function SettingsHeader({
  text,
  working,
  canApply,
  onApply,
  onDiscard,
  onReset,
}: {
  text: string;
  working: boolean;
  canApply: boolean;
  onApply: () => void;
  onDiscard: () => void;
  onReset: () => void;
}) {
  return (
    <>
      <h2 className="d-inline-block">{text}</h2>
      <Button
        loading={working}
        icon="trash"
        className="d-inline-block float-end ms-1"
        text="common.resetDefaults"
        variant="danger"
        onClick={onReset}
      />
      <Button
        loading={working}
        icon="rotate-left"
        className="d-inline-block float-end ms-1"
        enabled={canApply}
        text="common.discard"
        variant="primary"
        onClick={onDiscard}
      />
      <Button
        loading={working}
        icon="check"
        className="d-inline-block float-end ms-1"
        enabled={canApply}
        text="common.apply"
        variant="success"
        onClick={onApply}
      />
    </>
  );
}
