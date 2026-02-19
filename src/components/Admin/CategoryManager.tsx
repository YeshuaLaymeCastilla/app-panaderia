import type { Category, Product } from "../../domain/types";

export default function CategoryManager({
  categories,
  products,
  onDelete,
  onClose,
}: {
  categories: Category[];
  products: Product[];
  onDelete: (key: string) => void;
  onClose: () => void;
}) {
  function handleDelete(cat: Category) {
    const hasProducts = products.some(p => p.category === cat.name);

    if (hasProducts) {
      alert("No puedes eliminar esta categoría porque tiene productos.");
      return;
    }

    if (confirm(`Eliminar categoría "${cat.name}"?`)) {
      onDelete(cat.key);
    }
  }

  return (
    <div className="modalOverlay">
      <div className="modalCard">
        <div className="modalTop">
          <div className="modalTitle">Categorías</div>
          <button className="btnSecondary" onClick={onClose}>Cerrar</button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {categories.map(c => (
            <div key={c.key} className="lineRow">
              <div>{c.name}</div>
              <button className="btnDanger" onClick={() => handleDelete(c)}>
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
