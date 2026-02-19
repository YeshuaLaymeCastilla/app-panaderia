import { useState } from "react";

import ProductGrid from "../components/ProductGrid/ProductGrid";
import CartPanel from "../components/Cart/CartPanel";
import CheckoutScreen from "../components/Checkout/CheckoutScreen";
import WelcomeScreen from "../components/Welcome/WelcomeScreen";
import EndOfDayScreen from "../components/EndOfDay/EndOfDayScreen";

import AlertModal from "../components/Common/AlertModal";
import { useKioskStore } from "../hooks/useKioskStore";

// Si ya creaste el manager de categorías:
import CategoryManager from "../components/Admin/CategoryManager";

type AdminMode = "none" | "edit";

export default function App() {
  const s = useKioskStore();

  const [adminMode, setAdminMode] = useState<AdminMode>("none");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);

  const [showCats, setShowCats] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);

  const editProduct = editProductId
    ? s.products.find((p) => p.id === editProductId) ?? null
    : null;

  // Pantallas principales
  if (s.screen === "welcome") return <WelcomeScreen onStart={s.startDay} />;

  if (s.screen === "endday") {
    return (
      <EndOfDayScreen
        startISO={s.dayStartISO}
        endISO={s.dayEndISO}
        orders={s.orders}
        onCloseApp={s.closeApp}
      />
    );
  }

  if (s.screen === "checkout") {
    return (
      <CheckoutScreen
        total={s.total}
        onBack={() => s.setScreen("order")}
        onConfirmPaid={s.confirmPaid}
      />
    );
  }

  // Click de producto depende del modo admin
  function onProductClick(p: any) {
    if (adminMode === "edit") setEditProductId(p.id);
    else s.addProductToCart(p);
  }

  return (
    <div className="page">
      <div className="topbar">
        <div className="topTitle">App Panadería</div>
      </div>

      <div className="layout">
        <div className="left">
          {/* Categorías + búsqueda */}
          <div className="filters">
            <div className="catRow">
              {s.categoryNames.map((c) => (
                <button
                  key={c}
                  className={`chip ${s.selectedCategory === c ? "chipActive" : ""}`}
                  onClick={() => s.setSelectedCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="searchRow">
              <input
                className="searchInput"
                value={s.query}
                onChange={(e) => s.setQuery(e.target.value)}
                placeholder="Buscar producto (mín. 3 letras)…"
              />
              {s.query.trim().length > 0 && (
                <button className="btnSecondary" onClick={() => s.setQuery("")}>
                  Limpiar
                </button>
              )}
            </div>

            {s.query.trim().length > 0 && s.query.trim().length < 3 && (
              <div className="searchHint">Escribe al menos 3 letras para buscar.</div>
            )}
          </div>

          <h2 className="sectionTitle">
            {adminMode === "edit"
              ? "Editar productos (toca uno)"
              : "Productos"}
          </h2>

          {s.filteredProducts.length === 0 ? (
            <div className="emptyBox">
              No se encontró nada. Prueba con otra categoría o cambia la búsqueda.
            </div>
          ) : (
            <ProductGrid
              products={s.filteredProducts}
              onProductClick={onProductClick}
              isEditMode={adminMode === "edit"}
            />
          )}
        </div>

        {/* Carrito */}
        <div className="right">
          <CartPanel
            cart={s.cart}
            total={s.total}
            onAdd={s.addById}
            onRemove={s.removeById}
            onClear={s.clearCartNow}
            onCheckout={() => s.setScreen("checkout")}
          />
        </div>
      </div>

      {/* Botón rojo inferior izquierdo */}
      <button className="btnEndDayFloating" onClick={s.endDay}>
        TERMINAR DÍA
      </button>

      {/* Dock admin (centrado abajo) */}
      <div className="adminDock">
        <button
          className="fab fabAdd"
          title="Agregar producto"
          onClick={() => setIsAddOpen(true)}
        >
          ✎+
        </button>

        <button
          className={`fab fabEdit ${adminMode === "edit" ? "fabActive" : ""}`}
          title="Modo editar"
          onClick={() => {
            setEditProductId(null);
            setAdminMode((m) => (m === "edit" ? "none" : "edit"));
          }}
        >
          ✎
        </button>

        {/* Botón azul para gestionar categorías */}
        <button
          className="fab"
          title="Categorías"
          style={{ background: "#3b82f6", color: "white" }}
          onClick={() => setShowCats(true)}
        >
          ☰
        </button>
      </div>

      {/* Modal Agregar */}
      {isAddOpen && (
        <ProductEditorModal
          title="Agregar producto"
          categories={s.categories.map((c) => c.name)}
          onClose={() => setIsAddOpen(false)}
          onCreateCategory={async (raw) => {
            const res = await s.createCategory(raw);
            if (!res.ok && res.reason === "exists")
              setAlert(`Esa categoría ya existe: ${res.existingName}`);
            if (!res.ok && res.reason === "empty")
              setAlert("Ingresa un nombre de categoría válido.");
            return res.ok ? res.category.name : null;
          }}
          onSave={async (data) => {
            await s.addNewProduct(data);
            setIsAddOpen(false);
          }}
        />
      )}

      {/* Modal Editar */}
      {editProduct && (
        <ProductEditorModal
          title="Editar producto"
          categories={s.categories.map((c) => c.name)}
          initial={{
            id: editProduct.id,
            name: editProduct.name,
            price: editProduct.price,
            category: editProduct.category,
          }}
          showDelete
          onDelete={async () => {
            await s.deleteProduct(editProduct.id);
            setEditProductId(null);
          }}
          onClose={() => setEditProductId(null)}
          onCreateCategory={async (raw) => {
            const res = await s.createCategory(raw);
            if (!res.ok && res.reason === "exists")
              setAlert(`Esa categoría ya existe: ${res.existingName}`);
            if (!res.ok && res.reason === "empty")
              setAlert("Ingresa un nombre de categoría válido.");
            return res.ok ? res.category.name : null;
          }}
          onSave={async (data) => {
            await s.updateExistingProduct({ ...data, id: editProduct.id });
            setEditProductId(null);
          }}
        />
      )}

      {/* Gestor categorías (si lo implementaste en el hook como deleteCategory) */}
      {showCats && (
        <CategoryManager
          categories={s.categories}
          products={s.products}
          onDelete={(key) => {
            s.deleteCategory?.(key);
          }}
          onClose={() => setShowCats(false)}
        />
      )}

      {/* Alerta centrada */}
      {alert && (
        <AlertModal title="Categoría" message={alert} onClose={() => setAlert(null)} />
      )}
    </div>
  );
}

/** Modal editor: agregar/editar producto + crear categoría */
function ProductEditorModal({
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
  const [category, setCategory] = useState(
    initial?.category ?? (categories[0] ?? "Otros")
  );
  const [file, setFile] = useState<File | null>(null);

  const [creatingCat, setCreatingCat] = useState(false);
  const [newCat, setNewCat] = useState("");

  const [keepExistingImage, setKeepExistingImage] = useState(true);

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
          <button className="btnSecondary" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="modalForm">
          <label className="field">
            <div className="fieldLabel">Nombre</div>
            <input
              className="fieldInput"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Pan cacho"
            />
          </label>

          <label className="field">
            <div className="fieldLabel">Precio (S/)</div>
            <input
              className="fieldInput"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="Ej. 7.50"
            />
          </label>

          <div className="field">
            <div className="fieldLabel">Categoría</div>

            {!creatingCat ? (
              <div className="catPickRow">
                <select
                  className="fieldInput"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.length === 0 ? (
                    <option>Otros</option>
                  ) : (
                    categories.map((c) => <option key={c}>{c}</option>)
                  )}
                </select>

                <button
                  className="btnSecondary"
                  onClick={() => setCreatingCat(true)}
                >
                  + Crear
                </button>
              </div>
            ) : (
              <div className="catPickRow">
                <input
                  className="fieldInput"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  placeholder="Ej. Dulces"
                />
                <button className="btnSecondary" onClick={handleCreateCat}>
                  Guardar
                </button>
                <button
                  className="btnSecondary"
                  onClick={() => {
                    setCreatingCat(false);
                    setNewCat("");
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          <label className="field">
            <div className="fieldLabel">Foto (subir o tomar)</div>
            <input
              className="fieldInput"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {initial && (
              <label className="keepImgRow">
                <input
                  type="checkbox"
                  checked={keepExistingImage}
                  onChange={(e) => setKeepExistingImage(e.target.checked)}
                />
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
