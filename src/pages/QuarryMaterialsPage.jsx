
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

function QuarryMaterialsPage({ userRole }) {
  const [selectedDate, setSelectedDate] = useState(getSriLankaDate);

  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [removingMaterialId, setRemovingMaterialId] = useState(null);

  const [materialForm, setMaterialForm] = useState({
    material_name: "",
    unit: "",
  });

  const [usageEntries, setUsageEntries] = useState([]);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [savingUsage, setSavingUsage] = useState(false);
  const [deletingUsageId, setDeletingUsageId] = useState(null);

  const [usageForm, setUsageForm] = useState({
    material_id: "",
    quantity: "",
    rate: "",
  });

  const [staffPermissions, setStaffPermissions] = useState({});
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const isAdmin = userRole === "admin";

  const canEditUsage =
    isAdmin ||
    (!permissionsLoading &&
      userRole === "staff" &&
      staffPermissions["quarry-materials"] === true &&
      selectedDate === getSriLankaDate());

  const canManageMaterials =
    isAdmin ||
    (!permissionsLoading &&
      userRole === "staff" &&
      staffPermissions["master-quarry-materials"] === true);

  const selectedMaterial = materials.find(
    (material) =>
      String(material.id) === String(usageForm.material_id)
  );

  const calculatedTotal =
    Number(usageForm.quantity || 0) *
    Number(usageForm.rate || 0);

  const dailyTotal = usageEntries.reduce(
    (total, entry) => total + Number(entry.total_cost || 0),
    0
  );

  // Load permissions
  useEffect(() => {
    let active = true;

    async function loadPermissions() {
      setPermissionsLoading(true);
      setStaffPermissions({});

      if (isAdmin) {
        setPermissionsLoading(false);
        return;
      }

      if (userRole !== "staff") {
        setPermissionsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("staff_permissions")
        .select("category, is_enabled")
        .in("category", [
          "quarry-materials",
          "master-quarry-materials",
        ]);

      if (!active) return;

      if (error) {
        console.error("Error loading permissions:", error);
      } else {
        const permissionMap = {};

        (data || []).forEach((item) => {
          permissionMap[item.category] = item.is_enabled === true;
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

  // Load active materials
  async function loadMaterials() {
    setLoadingMaterials(true);

    const { data, error } = await supabase
      .from("quarry_materials")
      .select("*")
      .eq("is_active", true)
      .order("material_name", { ascending: true });

    if (error) {
      console.error("Error loading quarry materials:", error);
      setMaterials([]);
    } else {
      setMaterials(data || []);
    }

    setLoadingMaterials(false);
  }

  // Load usage for selected date
  async function loadUsageEntries() {
    setLoadingUsage(true);
    setUsageEntries([]);

    const requestedDate = selectedDate;

    const { data, error } = await supabase
      .from("quarry_material_usage")
      .select("*")
      .eq("usage_date", requestedDate)
      .order("id", { ascending: false });

    if (error) {
      console.error("Error loading quarry material usage:", error);
      setUsageEntries([]);
    } else {
      setUsageEntries(data || []);
    }

    setLoadingUsage(false);
  }

  useEffect(() => {
    loadMaterials();
  }, []);

  useEffect(() => {
    loadUsageEntries();
  }, [selectedDate]);

  // Add master material
  async function addMaterial() {
    if (!canManageMaterials || savingMaterial) {
      alert("You do not have permission to add materials.");
      return;
    }

    const materialName = materialForm.material_name.trim();
    const unit = materialForm.unit.trim();

    if (!materialName) {
      alert("Please enter the material name.");
      return;
    }

    if (!unit) {
      alert("Please enter the unit.");
      return;
    }

    setSavingMaterial(true);

    const { data, error } = await supabase
      .from("quarry_materials")
      .insert([
        {
          material_name: materialName,
          unit,
          is_active: true,
        },
      ])
      .select()
      .single();

    setSavingMaterial(false);

    if (error) {
      console.error("Error adding quarry material:", error);
      alert("Failed to add material: " + error.message);
      return;
    }

    setMaterials((current) =>
      [...current, data].sort((a, b) =>
        a.material_name.localeCompare(b.material_name)
      )
    );

    setMaterialForm({
      material_name: "",
      unit: "",
    });

    setShowAddMaterial(false);
    alert("Material added successfully!");
  }

  // Soft remove master material
  async function removeMaterial(material) {
    if (!canManageMaterials || removingMaterialId !== null) {
      alert("You do not have permission to remove materials.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove "${material.material_name}"?`
    );

    if (!confirmed) return;

    setRemovingMaterialId(material.id);

    const { error } = await supabase
      .from("quarry_materials")
      .update({ is_active: false })
      .eq("id", material.id);

    setRemovingMaterialId(null);

    if (error) {
      console.error("Error removing quarry material:", error);
      alert("Failed to remove material: " + error.message);
      return;
    }

    setMaterials((current) =>
      current.filter((item) => item.id !== material.id)
    );
  }

  // Save daily usage
  async function saveUsageEntry() {
    if (!canEditUsage || savingUsage) {
      alert("You do not have permission to modify usage for this date.");
      return;
    }

    if (!usageForm.material_id) {
      alert("Please select a material.");
      return;
    }

    const quantity = Number(usageForm.quantity);
    const rate = Number(usageForm.rate);

    if (
      usageForm.quantity === "" ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      alert("Please enter a valid quantity.");
      return;
    }

    if (
      usageForm.rate === "" ||
      !Number.isFinite(rate) ||
      rate < 0
    ) {
      alert("Please enter a valid rate.");
      return;
    }

    setSavingUsage(true);

    const { data, error } = await supabase
      .from("quarry_material_usage")
      .insert([
        {
          usage_date: selectedDate,
          material_id: Number(usageForm.material_id),
          quantity,
          rate,
          total_cost: quantity * rate,
        },
      ])
      .select()
      .single();

    setSavingUsage(false);

    if (error) {
      console.error("Error saving quarry material usage:", error);
      alert("Failed to save material usage: " + error.message);
      return;
    }

    setUsageEntries((current) => [data, ...current]);

    setUsageForm({
      material_id: "",
      quantity: "",
      rate: "",
    });

    alert("Material usage saved successfully!");
  }

  // Delete daily usage
  async function deleteUsageEntry(entry) {
    if (!canEditUsage || deletingUsageId !== null) {
      alert("You do not have permission to delete usage for this date.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this material usage entry?"
    );

    if (!confirmed) return;

    setDeletingUsageId(entry.id);

    const { error } = await supabase
      .from("quarry_material_usage")
      .delete()
      .eq("id", entry.id);

    setDeletingUsageId(null);

    if (error) {
      console.error("Error deleting material usage:", error);
      alert("Failed to delete material usage: " + error.message);
      return;
    }

    setUsageEntries((current) =>
      current.filter((item) => item.id !== entry.id)
    );
  }

  function getMaterial(materialId) {
    return materials.find(
      (material) =>
        String(material.id) === String(materialId)
    );
  }

  const money = (value) =>
    Number(value || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">
          Quarry Materials
        </h2>

        <p className="text-slate-500 mt-1">
          Manage quarry materials and daily material costs
        </p>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-600 mb-2">
            Date
          </label>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-slate-300 rounded-xl px-4 py-2 bg-white text-slate-700"
          />
        </div>
      </div>

      {/* Permission Notice */}
      {!permissionsLoading && !canEditUsage && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-5 text-sm">
          <strong>Daily Usage - View Only:</strong> You cannot
          add or delete usage entries for the selected date.
        </div>
      )}

      {/* Add Material Button */}
      {canManageMaterials && (
        <div className="mb-5">
          <button
            type="button"
            onClick={() => setShowAddMaterial(!showAddMaterial)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-2.5 rounded-xl transition"
          >
            + Add Material
          </button>
        </div>
      )}

      {/* Add Material Form */}
      {canManageMaterials && showAddMaterial && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-5">
            Add New Quarry Material
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Material Name
              </label>

              <input
                type="text"
                value={materialForm.material_name}
                onChange={(e) =>
                  setMaterialForm({
                    ...materialForm,
                    material_name: e.target.value,
                  })
                }
                placeholder="Example: Detonator Cord"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Unit
              </label>

              <input
                type="text"
                value={materialForm.unit}
                onChange={(e) =>
                  setMaterialForm({
                    ...materialForm,
                    unit: e.target.value,
                  })
                }
                placeholder="Example: kg, litre, meter, nos"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={addMaterial}
              disabled={savingMaterial}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition"
            >
              {savingMaterial ? "Saving..." : "Save Material"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAddMaterial(false);
                setMaterialForm({
                  material_name: "",
                  unit: "",
                });
              }}
              className="border border-slate-300 text-slate-700 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active Quarry Materials */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Active Quarry Materials
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Materials currently available for quarry usage
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="text-sm font-semibold text-slate-600">
            Material Name
          </div>
          <div className="text-sm font-semibold text-slate-600">
            Unit
          </div>
          <div className="text-sm font-semibold text-slate-600 text-right">
            Action
          </div>
        </div>

        {loadingMaterials ? (
          <div className="px-6 py-6 text-sm text-slate-500">
            Loading materials...
          </div>
        ) : materials.length === 0 ? (
          <div className="px-6 py-6 text-sm text-slate-500">
            No active quarry materials found.
          </div>
        ) : (
          materials.map((material) => (
            <div
              key={material.id}
              className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-slate-100 last:border-b-0 items-center"
            >
              <div className="font-medium text-slate-800">
                {material.material_name}
              </div>

              <div className="text-slate-600">
                {material.unit || "-"}
              </div>

              <div className="text-right">
                {canManageMaterials ? (
                  <button
                    type="button"
                    onClick={() => removeMaterial(material)}
                    disabled={removingMaterialId !== null}
                    className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                  >
                    {removingMaterialId === material.id
                      ? "Removing..."
                      : "Remove"}
                  </button>
                ) : (
                  <span className="text-sm text-slate-400">
                    View Only
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Daily Material Usage Form */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Daily Quarry Material Usage
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Add material usage for {selectedDate}
          </p>
        </div>

        <fieldset
          disabled={!canEditUsage || savingUsage}
          className="disabled:opacity-60"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Material */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Material
              </label>

              <select
                value={usageForm.material_id}
                onChange={(e) =>
                  setUsageForm({
                    ...usageForm,
                    material_id: e.target.value,
                  })
                }
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-white text-slate-700"
              >
                <option value="">Select Material</option>

                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.material_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Quantity
                {selectedMaterial?.unit
                  ? ` (${selectedMaterial.unit})`
                  : ""}
              </label>

              <input
                type="number"
                min="0"
                step="any"
                value={usageForm.quantity}
                onChange={(e) =>
                  setUsageForm({
                    ...usageForm,
                    quantity: e.target.value,
                  })
                }
                placeholder="0"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-white text-slate-700"
              />
            </div>

            {/* Rate */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Rate
              </label>

              <input
                type="number"
                min="0"
                step="any"
                value={usageForm.rate}
                onChange={(e) =>
                  setUsageForm({
                    ...usageForm,
                    rate: e.target.value,
                  })
                }
                placeholder="0.00"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-white text-slate-700"
              />
            </div>

            {/* Total Cost */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Total Cost
              </label>

              <div className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 font-semibold text-slate-800">
                Rs. {money(calculatedTotal)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={saveUsageEntry}
            disabled={savingUsage || !canEditUsage}
            className="mt-6 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition"
          >
            {savingUsage ? "Saving..." : "Save Entry"}
          </button>
        </fieldset>
      </div>

      {/* Daily Total */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 mb-6">
        <p className="text-sm text-slate-300">
          Total Quarry Material Cost
        </p>

        <p className="text-3xl font-bold mt-2">
          Rs. {money(dailyTotal)}
        </p>

        <p className="text-sm text-slate-400 mt-1">
          {selectedDate}
        </p>
      </div>

      {/* Saved Usage Entries */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Saved Quarry Material Usage
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Entries saved for {selectedDate}
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[850px]">
            <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200">
              <div className="text-sm font-semibold text-slate-600">
                Material
              </div>
              <div className="text-sm font-semibold text-slate-600">
                Quantity
              </div>
              <div className="text-sm font-semibold text-slate-600">
                Unit
              </div>
              <div className="text-sm font-semibold text-slate-600">
                Rate
              </div>
              <div className="text-sm font-semibold text-slate-600">
                Total Cost
              </div>
              <div className="text-sm font-semibold text-slate-600 text-right">
                Action
              </div>
            </div>

            {loadingUsage ? (
              <div className="px-6 py-6 text-sm text-slate-500">
                Loading usage entries...
              </div>
            ) : usageEntries.length === 0 ? (
              <div className="px-6 py-6 text-sm text-slate-500">
                No quarry material usage entries for this date.
              </div>
            ) : (
              usageEntries.map((entry) => {
                const material = getMaterial(entry.material_id);

                return (
                  <div
                    key={entry.id}
                    className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-slate-100 last:border-b-0 items-center"
                  >
                    <div className="font-medium text-slate-800">
                      {material?.material_name || "Unknown Material"}
                    </div>

                    <div className="text-slate-600">
                      {Number(entry.quantity || 0).toLocaleString()}
                    </div>

                    <div className="text-slate-600">
                      {material?.unit || "-"}
                    </div>

                    <div className="text-slate-600">
                      Rs. {money(entry.rate)}
                    </div>

                    <div className="font-semibold text-slate-800">
                      Rs. {money(entry.total_cost)}
                    </div>

                    <div className="text-right">
                      {canEditUsage ? (
                        <button
                          type="button"
                          onClick={() => deleteUsageEntry(entry)}
                          disabled={deletingUsageId !== null}
                          className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                        >
                          {deletingUsageId === entry.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      ) : (
                        <span className="text-sm text-slate-400">
                          View Only
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default QuarryMaterialsPage;
