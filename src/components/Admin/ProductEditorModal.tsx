import { useRef, useState } from "react";

export default function ProductEditorModal({
  title,
  categories,
  initial,
  showDelete,
  onDelete,
  onClose,
  onSave,
  onCreateCategory,
}: {
  title: string;
  categories: string[];
  initial?: { id: string; name: string; price: number; category: string };
  showDelete?: boolean;
  onDelete?: () => void | Promise<void>;
  onClose: () => void;
  onSave: (data: {
    name: string;
    price: number;
    categoryName: string;
    file?: File | null;
    keepExistingImage: boolean;
  }) => void | Promise<void>;
  onCreateCategory: (rawName: string) => Promise<string | null>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [category, setCategory] = useState(initial?.category ?? (categories[0] ?? "Otros"));
  const [file, setFile] = useState<File | null>(null);

  const [creatingCat, setCreatingCat] = useState(false);
  const [newCat, setNewCat] = useState("");

  const [keepExistingImage, setKeepExistingImage] = useState(true);

  // 2 opciones para productos (galería/archivos + cámara)
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const canSave =
    name.trim().length > 0 &&
    Number(price) > 0 &&
    (creatingCat ? newCat.trim().length > 0 : category.trim().length > 0);

  async function handleCreateCat() {
    const created = await onCreateCategory(newCat);
    if (created) {
      setCreatingCat(false);
      setNewCat("");
      setCategory(created);
    }
  }

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modalCard" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalTop">
          <div className="modalTitle">{title}</div>
          <button className="btnSecondary" onClick={onClose}>Cerrar</button>
        </div>

        <div className="modalForm">
          <label className="field">
            <div className="fieldLabel">Nombre</div>
            <input className="fieldInput" value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label className="field">
            <div className="fieldLabel">Precio (S/)</div>
            <input className="fieldInput" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
          </label>

          <div className="field">
            <div className="fieldLabel">Categoría</div>

            {!creatingCat ? (
              <div className="catPickRow">
                <select className="fieldInput" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.length === 0 ? <option>Otros</option> : categories.map((c) => <option key={c}>{c}</option>)}
                </select>
                <button type="button" className="btnSecondary" onClick={() => setCreatingCat(true)}>+ Crear</button>
              </div>
            ) : (
              <div className="catPickRow">
                <input className="fieldInput" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Ej. Dulces" />
                <button type="button" className="btnSecondary" onClick={handleCreateCat}>Guardar</button>
                <button type="button" className="btnSecondary" onClick={() => { setCreatingCat(false); setNewCat(""); }}>Cancelar</button>
              </div>
            )}
          </div>

          <label className="field">
            <div className="fieldLabel">Foto del producto</div>

            <input
              ref={galleryInputRef}
              className="fileHidden"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            <input
              ref={cameraInputRef}
              className="fileHidden"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            <div className="photoRow">
              <button type="button" className="btnSecondary" onClick={() => galleryInputRef.current?.click()}>
                Seleccionar archivo (galería/archivos)
              </button>
              <button type="button" className="btnSecondary" onClick={() => cameraInputRef.current?.click()}>
                Tomar foto (cámara)
              </button>
            </div>

            {file && <div className="filePicked">📷 {file.name}</div>}

            {initial && (
              <label className="keepImgRow">
                <input type="checkbox" checked={keepExistingImage} onChange={(e) => setKeepExistingImage(e.target.checked)} />
                <span>Conservar imagen actual (si no subo una nueva)</span>
              </label>
            )}
          </label>

          <div className="modalActions">
            {showDelete && onDelete && (
              <button className="btnDanger" onClick={() => onDelete()}>
                Eliminar
              </button>
            )}

            <button
              className="btnPrimary"
              disabled={!canSave}
              onClick={() =>
                onSave({
                  name,
                  price: Number(price),
                  categoryName: creatingCat ? newCat : category,
                  file,
                  keepExistingImage,
                })
              }
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
