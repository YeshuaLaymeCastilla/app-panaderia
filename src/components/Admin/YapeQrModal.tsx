import { useState } from "react";

export default function YapeQrModal({
  current,
  onClose,
  onSaveFile,
}: {
  current: string | null;
  onClose: () => void;
  onSaveFile: (file: File) => Promise<void> | void;
}) {
  const [picked, setPicked] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSave() {
    if (!picked) {
      setMsg("Primero selecciona un archivo PNG o JPG.");
      return;
    }
    try {
      setSaving(true);
      setMsg(null);
      await onSaveFile(picked);
      onClose();
    } catch (e) {
      console.error(e);
      setMsg("No se pudo guardar el QR. Intenta con otra imagen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="modalTop">
          <div className="modalTitle">QR de Yape</div>
          <button type="button" className="btnSecondary" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="modalForm">
          <label className="field">
            <div className="fieldLabel">Sube tu QR (PNG o JPG)</div>

            <input
              className="fieldInput"
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setPicked(f);
                setMsg(f ? `Archivo: ${f.name}` : null);
              }}
            />
          </label>

          {current ? (
            <div className="qrPreviewWrap">
              <div className="fieldLabel">Vista previa actual</div>
              <img className="qrPreview" src={current} alt="QR Yape" />
            </div>
          ) : (
            <div className="emptyBox">Aún no has subido un QR.</div>
          )}

          {msg && <div className="searchHint">{msg}</div>}

          <div className="modalActions">
            <div />
            <button
              type="button"
              className="btnPrimary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar QR"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
