
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function getSriLankaDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type) =>
    parts.find((part) => part.type === type)?.value || "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function QuarryProductionPage({ userRole }) {
  const [selectedDate, setSelectedDate] = useState(getSriLankaDate);

  const [products, setProducts] = useState([]);
  const [productionEntries, setProductionEntries] = useState([]);

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [rate, setRate] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [removingProductId, setRemovingProductId] = useState(null);
  const [deletingEntryId, setDeletingEntryId] = useState(null);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(true);

  const [staffPermissions, setStaffPermissions] = useState({});
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const isAdmin = userRole === "admin";

  const canEditProduction =
    isAdmin ||
    (!permissionsLoading &&
      userRole === "staff" &&
      staffPermissions["quarry-production"] === true &&
      selectedDate === getSriLankaDate());

  const canManageProducts =
    isAdmin ||
    (!permissionsLoading &&
      userRole === "staff" &&
      staffPermissions["master-quarry-products"] === true);

  const money = (value) =>
    Number(value || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Load permissions
  useEffect(() => {
    let active = true;

    async function loadPermissions() {
      setPermissionsLoading(true);
      setStaffPermissions({});

      if (isAdmin || userRole !== "staff") {
        setPermissionsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("staff_permissions")
        .select("category, is_enabled")
        .in("category", [
          "quarry-production",
          "master-quarry-products",
        ]);

      if (!active) return;

      if (error) {
        console.error("Error loading permissions:", error);
        setStaffPermissions({});
      } else {
        const permissionMap = {};

        (data || []).forEach((item) => {
          permissionMap[item.category] = item.is_enabled;
        });

        setStaffPermissions(permissionMap);
      }

      setPermissionsLoading(false);
    }

    loadPermissions();

    return () => {
      active = false;
    };
  }, [isAdmin, userRole]);

  // Load all products so historical entries retain product names
  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoadingProducts(true);

      const { data, error } = await supabase
        .from("quarry_products")
        .select("*")
        .order("product_name", { ascending: true });

      if (!active) return;

      if (error) {
        console.error("Error loading quarry products:", error);
        setProducts([]);
      } else {
        setProducts(data || []);
      }

      setLoadingProducts(false);
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  // Load production entries
  useEffect(() => {
    let active = true;

    async function loadProductionEntries() {
      setLoadingEntries(true);
      setProductionEntries([]);

      const { data, error } = await supabase
        .from("quarry_production")
        .select("*")
        .eq("production_date", selectedDate)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        console.error("Error loading quarry production:", error);
        setProductionEntries([]);
      } else {
        setProductionEntries(data || []);
      }

      setLoadingEntries(false);
    }

    loadProductionEntries();

    return () => {
      active = false;
    };
  }, [selectedDate]);

  const activeProducts = products.filter(
    (product) => product.is_active === true
  );

  function getProduct(productId) {
    return products.find(
      (product) => String(product.id) === String(productId)
    );
  }

  const selectedProduct = getProduct(selectedProductId);

  const calculatedTotal =
    Number(quantity || 0) * Number(rate || 0);

  const totalProductionValue = productionEntries.reduce(
    (total, entry) => total + Number(entry.total_value || 0),
    0
  );

  // Add product
  async function handleAddProduct(e) {
    e.preventDefault();

    if (!canManageProducts || savingProduct) {
      alert("You do not have permission to add quarry products.");
      return;
    }

    if (!newProductName.trim()) {
      alert("Please enter product name.");
      return;
    }

    if (!newProductUnit.trim()) {
      alert("Please enter product unit.");
      return;
    }

    setSavingProduct(true);

    const { data, error } = await supabase
      .from("quarry_products")
      .insert([
        {
          product_name: newProductName.trim(),
          unit: newProductUnit.trim(),
          is_active: true,
        },
      ])
      .select()
      .single();

    setSavingProduct(false);

    if (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product: " + error.message);
      return;
    }

    setProducts((previousProducts) =>
      [...previousProducts, data].sort((a, b) =>
        a.product_name.localeCompare(b.product_name)
      )
    );

    setNewProductName("");
    setNewProductUnit("");
    setShowAddProduct(false);

    alert("Product added successfully.");
  }

  // Remove product (soft delete)
  async function handleRemoveProduct(productId) {
    if (!canManageProducts || removingProductId !== null) {
      alert("You do not have permission to remove quarry products.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove this product?"
    );

    if (!confirmed) return;

    setRemovingProductId(productId);

    const { error } = await supabase
      .from("quarry_products")
      .update({ is_active: false })
      .eq("id", productId);

    setRemovingProductId(null);

    if (error) {
      console.error("Error removing product:", error);
      alert("Failed to remove product: " + error.message);
      return;
    }

    setProducts((previousProducts) =>
      previousProducts.map((product) =>
        product.id === productId
          ? { ...product, is_active: false }
          : product
      )
    );

    if (String(selectedProductId) === String(productId)) {
      setSelectedProductId("");
    }
  }

  // Save production
  async function handleSaveProduction(e) {
    e.preventDefault();

    if (!canEditProduction || saving) {
      alert("You do not have permission to save production for this date.");
      return;
    }

    if (!selectedProductId) {
      alert("Please select a product.");
      return;
    }

    if (!selectedProduct || selectedProduct.is_active !== true) {
      alert("Please select an active product.");
      return;
    }

    const productionQuantity = Number(quantity);
    const productionRate = Number(rate);

    if (
      quantity === "" ||
      !Number.isFinite(productionQuantity) ||
      productionQuantity <= 0
    ) {
      alert("Please enter a valid quantity.");
      return;
    }

    if (
      rate === "" ||
      !Number.isFinite(productionRate) ||
      productionRate < 0
    ) {
      alert("Please enter a valid rate.");
      return;
    }

    const totalValue = productionQuantity * productionRate;

    setSaving(true);

    const { data, error } = await supabase
      .from("quarry_production")
      .insert([
        {
          production_date: selectedDate,
          product_id: Number(selectedProductId),
          quantity: productionQuantity,
          rate: productionRate,
          total_value: totalValue,
          notes: notes.trim(),
        },
      ])
      .select()
      .single();

    setSaving(false);

    if (error) {
      console.error("Error saving quarry production:", error);
      alert("Failed to save production entry: " + error.message);
      return;
    }

    setProductionEntries((previousEntries) => [
      data,
      ...previousEntries,
    ]);

    setSelectedProductId("");
    setQuantity("");
    setRate("");
    setNotes("");

    alert("Production entry saved successfully.");
  }

  // Delete production
  async function handleDeleteProduction(id) {
    if (!canEditProduction || deletingEntryId !== null) {
      alert("You do not have permission to delete production for this date.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this production entry?"
    );

    if (!confirmed) return;

    setDeletingEntryId(id);

    const { error } = await supabase
      .from("quarry_production")
      .delete()
      .eq("id", id);

    setDeletingEntryId(null);

    if (error) {
      console.error("Error deleting production entry:", error);
      alert("Failed to delete production entry: " + error.message);
      return;
    }

    setProductionEntries((previousEntries) =>
      previousEntries.filter((entry) => entry.id !== id)
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              Production at Quarry
            </h2>

            <p className="text-slate-500 mt-1">
              Manage quarry products and daily production
            </p>
          </div>

          {canManageProducts && (
            <button
              type="button"
              onClick={() => setShowAddProduct(!showAddProduct)}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium"
            >
              + Add Product
            </button>
          )}
        </div>

        {/* Date */}
        <div className="mt-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Date
          </label>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-4 py-2 bg-white"
          />
        </div>
      </div>

      {/* View Only Notice */}
      {!permissionsLoading && !canEditProduction && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-5 text-sm">
          <strong>View Only:</strong> You cannot save or delete
          production entries for the selected date.
        </div>
      )}

      {/* Add Product */}
      {showAddProduct && canManageProducts && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-5">
            Add Quarry Product
          </h3>

          <form onSubmit={handleAddProduct}>
            <fieldset disabled={savingProduct}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Product Name
                  </label>

                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Enter product name"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Unit
                  </label>

                  <input
                    type="text"
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value)}
                    placeholder="e.g. cube, kg"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
                >
                  {savingProduct ? "Saving..." : "Save Product"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="border border-slate-300 px-5 py-2.5 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </fieldset>
          </form>
        </div>
      )}

      {/* Active Products */}
      <div className="bg-white rounded-xl border border-slate-200 mb-6 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Active Quarry Products
          </h3>
        </div>

        {loadingProducts ? (
          <div className="p-6 text-slate-500">
            Loading products...
          </div>
        ) : activeProducts.length === 0 ? (
          <div className="p-6 text-slate-500">
            No active products available.
          </div>
        ) : (
          <div>
            {activeProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between px-6 py-4 border-b border-slate-100 last:border-b-0"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {product.product_name}
                  </p>

                  <p className="text-sm text-slate-500">
                    Unit: {product.unit}
                  </p>
                </div>

                {canManageProducts && (
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(product.id)}
                    disabled={removingProductId !== null}
                    className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                  >
                    {removingProductId === product.id
                      ? "Removing..."
                      : "Remove"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Production Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-5">
          Daily Quarry Production
        </h3>

        <form onSubmit={handleSaveProduction}>
          <fieldset
            disabled={!canEditProduction || saving}
            className="disabled:opacity-60"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Product */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Product
                </label>

                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-white"
                >
                  <option value="">Select Product</option>

                  {activeProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.product_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quantity
                  {selectedProduct ? ` (${selectedProduct.unit})` : ""}
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                />
              </div>

              {/* Rate */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rate (Rs.)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                />
              </div>

              {/* Total */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Total Value
                </label>

                <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 font-semibold">
                  Rs. {money(calculatedTotal)}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes
              </label>

              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
            </div>

            <button
              type="submit"
              disabled={!canEditProduction || saving}
              className="mt-6 bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Entry"}
            </button>
          </fieldset>
        </form>
      </div>

      {/* Total Production Value */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <p className="text-sm font-medium text-slate-500">
          Total Quarry Production Value
        </p>

        <p className="text-3xl font-bold text-slate-900 mt-2">
          Rs. {money(totalProductionValue)}
        </p>

        <p className="text-sm text-slate-500 mt-1">
          For {selectedDate}
        </p>
      </div>

      {/* Saved Production */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Saved Quarry Production
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Entries for {selectedDate}
          </p>
        </div>

        {loadingEntries ? (
          <div className="p-8 text-center text-slate-500">
            Loading production entries...
          </div>
        ) : productionEntries.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No production recorded for this date.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">
                    Product
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">
                    Quantity
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">
                    Rate
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">
                    Total Value
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">
                    Notes
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {productionEntries.map((entry) => {
                  const product = getProduct(entry.product_id);

                  return (
                    <tr
                      key={entry.id}
                      className="border-t border-slate-100"
                    >
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {product?.product_name || "Unknown Product"}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700">
                        {Number(entry.quantity).toLocaleString()}{" "}
                        {product?.unit || ""}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700">
                        Rs. {money(entry.rate)}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        Rs. {money(entry.total_value)}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700">
                        {entry.notes || "-"}
                      </td>

                      <td className="px-6 py-4">
                        {canEditProduction ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteProduction(entry.id)
                            }
                            disabled={deletingEntryId !== null}
                            className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                          >
                            {deletingEntryId === entry.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        ) : (
                          <span className="text-sm text-slate-400">
                            View Only
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuarryProductionPage;
