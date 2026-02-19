export default function AlertModal({
  title = "Aviso",
  message,
  onClose,
}: {
  title?: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="alertCard" onMouseDown={(e) => e.stopPropagation()}>
        <div className="alertTitle">{title}</div>
        <div className="alertMsg">{message}</div>
        <button className="btnPrimary" onClick={onClose}>OK</button>
      </div>
    </div>
  );
}
