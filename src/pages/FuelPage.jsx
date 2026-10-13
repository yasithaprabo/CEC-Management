
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function getSriLankaDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const value = (type) =>
    parts.find((part) => part.type === type)?.value || "";

  return `${value("year")}-${value("month")}-${value("day")}`;
}

export default function FuelPage({ userRole }) {
  const [selectedDate, setSelectedDate] = useState(getSriLankaDate);
  const [machines, setMachines] = useState([]);
  const [fuelEntries, setFuelEntries] = useState([]);
  const [savingFuel, setSavingFuel] = useState(false);
  const [deletingFuelId, setDeletingFuelId] = useState(null);

  const [fuelPermission, setFuelPermission] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(true);

  const [fuelForm, setFuelForm] = useState({
    machinery_id: "",
    fuel_type: "",
    litres: "",
    rate_per_litre: "",
    notes: "",
  });

  const isAdmin = userRole === "admin";
  const today = getSriLankaDate();

  const canModifyFuel =
    isAdmin ||
    (!permissionLoading &&
      userRole === "staff" &&
      fuelPermission &&
      selectedDate === today);

  const totalFuelCost =
    Number(fuelForm.litres || 0) *
    Number(fuelForm.rate_per_litre || 0);

  const dailyFuelCost = fuelEntries.reduce(
    (total, entry) => total + Number(entry.total_cost || 0),
    0
  );

  // Load Staff Fuel Permission
  useEffect(() => {
    let active = true;

    async function loadPermission() {
      setPermissionLoading(true);

      if (isAdmin) {
        setFuelPermission(true);
        setPermissionLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("staff_permissions")
        .select("is_enabled")
        .eq("category", "fuel")
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error("Error loading fuel permission:", error);
        setFuelPermission(false);
      } else {
        setFuelPermission(data?.is_enabled === true);
      }

      setPermissionLoading(false);
    }

    loadPermission();

    return () => {
      active = false;
    };
  }, [isAdmin]);

  // Load Machines
  useEffect(() => {
    let active = true;

    async function loadMachines() {
      const { data, error } = await supabase
        .from("machinery")
        .select("*")
        .eq("is_active", true)
        .order("machine_name", { ascending: true });

      if (!active) return;

      if (error) {
        console.error("Error loading machines:", error);
        setMachines([]);
      } else {
        setMachines(data || []);
      }
    }

    loadMachines();

    return () => {
      active = false;
    };
  }, []);

  // Load Fuel Entries
  useEffect(() => {
    let active = true;
    setEntriesLoading(true);
    setFuelEntries([]);

    async function loadFuelEntries() {
      const { data, error } = await supabase
        .from("fuel_usage")
        .select("*")
        .eq("fuel_date", selectedDate)
        .order("id", { ascending: false });

      if (!active) return;

      if (error) {
        console.error("Error loading fuel usage:", error);
        setFuelEntries([]);
      } else {
        setFuelEntries(data || []);
      }

      setEntriesLoading(false);
    }

    loadFuelEntries();

    return () => {
      active = false;
    };
  }, [selectedDate]);

  // Save Fuel Entry
  async function saveFuelEntry() {
    if (!canModifyFuel || savingFuel) {
      alert("You do not have permission to modify fuel for this date.");
      return;
    }

    if (!fuelForm.machinery_id) {
      alert("Please select a machine.");
      return;
    }

    if (!fuelForm.fuel_type) {
      alert("Please select a fuel type.");
      return;
    }

    if (
      fuelForm.litres === "" ||
      !Number.isFinite(Number(fuelForm.litres)) ||
      Number(fuelForm.litres) <= 0
    ) {
      alert("Please enter valid litres.");
      return;
    }

    if (
      fuelForm.rate_per_litre === "" ||
      !Number.isFinite(Number(fuelForm.rate_per_litre)) ||
      Number(fuelForm.rate_per_litre) < 0
    ) {
      alert("Please enter a valid rate per litre.");
      return;
    }

    const totalCost =
      Number(fuelForm.litres) *
      Number(fuelForm.rate_per_litre);

    setSavingFuel(true);

    const { data, error } = await supabase
      .from("fuel_usage")
      .insert([
        {
          fuel_date: selectedDate,
          machinery_id: Number(fuelForm.machinery_id),
          fuel_type: fuelForm.fuel_type,
          litres: Number(fuelForm.litres),
          rate_per_litre: Number(fuelForm.rate_per_litre),
          total_cost: totalCost,
          notes: fuelForm.notes.trim() || null,
        },
      ])
      .select()
      .single();

    setSavingFuel(false);

    if (error) {
      console.error("Error saving fuel usage:", error);
      alert("Error saving fuel usage: " + error.message);
      return;
    }

    setFuelEntries((currentEntries) => [
      data,
      ...currentEntries,
    ]);

    setFuelForm({
      machinery_id: "",
      fuel_type: "",
      litres: "",
      rate_per_litre: "",
      notes: "",
    });

    alert("Fuel usage saved successfully!");
  }

  // Delete Fuel Entry
  async function deleteFuelEntry(entryId) {
    if (!canModifyFuel || deletingFuelId !== null) {
      alert("You do not have permission to delete fuel for this date.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this fuel entry?"
    );

    if (!confirmed) return;

    setDeletingFuelId(entryId);

    const { error } = await supabase
      .from("fuel_usage")
      .delete()
      .eq("id", entryId);

    setDeletingFuelId(null);

    if (error) {
      console.error("Error deleting fuel usage:", error);
      alert("Error deleting fuel usage: " + error.message);
      return;
    }

    setFuelEntries((currentEntries) =>
      currentEntries.filter((entry) => entry.id !== entryId)
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">
          Fuel
        </h2>

        <p className="text-slate-500 mt-1">
          Manage daily fuel usage and fuel costs
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

      {/* Permission Information */}
      {!permissionLoading && !canModifyFuel && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-5 py-4 mb-6 text-sm">
          <strong>View Only:</strong> You do not have permission
          to modify fuel records for the selected date.
        </div>
      )}

      {/* Daily Fuel Usage */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-slate-900">
            Daily Fuel Usage
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Add fuel usage for the selected date
          </p>
        </div>

        <fieldset
          disabled={!canModifyFuel || savingFuel}
          className="disabled:opacity-60"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Machine */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Machine
              </label>

              <select
                value={fuelForm.machinery_id}
                onChange={(e) =>
                  setFuelForm({
                    ...fuelForm,
                    machinery_id: e.target.value,
                  })
                }
                className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
              >
                <option value="">Select Machine</option>

                {machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.machine_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Fuel Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fuel Type
              </label>

              <select
                value={fuelForm.fuel_type}
                onChange={(e) =>
                  setFuelForm({
                    ...fuelForm,
                    fuel_type: e.target.value,
                  })
                }
                className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
              >
                <option value="">Select Fuel Type</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
              </select>
            </div>

            {/* Litres */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Litres
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={fuelForm.litres}
                onChange={(e) =>
                  setFuelForm({
                    ...fuelForm,
                    litres: e.target.value,
                  })
                }
                placeholder="Enter litres"
                className="w-full border border-slate-300 rounded-xl px-4 py-3"
              />
            </div>

            {/* Rate per Litre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rate per Litre (Rs.)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={fuelForm.rate_per_litre}
                onChange={(e) =>
                  setFuelForm({
                    ...fuelForm,
                    rate_per_litre: e.target.value,
                  })
                }
                placeholder="Enter rate per litre"
                className="w-full border border-slate-300 rounded-xl px-4 py-3"
              />
            </div>

            {/* Total Cost */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Total Cost (Rs.)
              </label>

              <input
                type="text"
                value={`Rs. ${totalFuelCost.toLocaleString()}`}
                readOnly
                className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-slate-100 font-semibold text-slate-900"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes
              </label>

              <input
                type="text"
                value={fuelForm.notes}
                onChange={(e) =>
                  setFuelForm({
                    ...fuelForm,
                    notes: e.target.value,
                  })
                }
                placeholder="Optional notes"
                className="w-full border border-slate-300 rounded-xl px-4 py-3"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={saveFuelEntry}
              disabled={savingFuel || !canModifyFuel}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingFuel ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </fieldset>
      </div>

      {/* Saved Fuel Usage */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mt-6">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-slate-900">
            Fuel Usage - {selectedDate}
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Saved fuel usage for the selected date
          </p>
        </div>

        {entriesLoading ? (
          <div className="text-center py-8 text-slate-400">
            Loading fuel records...
          </div>
        ) : fuelEntries.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No fuel usage recorded for this date.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <div className="min-w-[900px]">
              {/* Table Header */}
              <div className="grid grid-cols-6 gap-4 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600">
                <div>Machine</div>
                <div>Fuel Type</div>
                <div>Litres</div>
                <div>Rate / Litre</div>
                <div>Total Cost</div>
                <div>Action</div>
              </div>

              {/* Table Rows */}
              {fuelEntries.map((entry) => {
                const machine = machines.find(
                  (item) =>
                    String(item.id) ===
                    String(entry.machinery_id)
                );

                return (
                  <div
                    key={entry.id}
                    className="grid grid-cols-6 gap-4 px-5 py-4 border-t border-slate-100 items-center"
                  >
                    <div className="font-semibold text-slate-900">
                      {machine?.machine_name || "Unknown Machine"}
                    </div>

                    <div className="text-slate-700 font-medium">
                      {entry.fuel_type || "-"}
                    </div>

                    <div className="text-slate-600">
                      {Number(entry.litres || 0).toLocaleString()} L
                    </div>

                    <div className="text-slate-600">
                      Rs.{" "}
                      {Number(
                        entry.rate_per_litre || 0
                      ).toLocaleString()}
                    </div>

                    <div className="font-semibold text-slate-900">
                      Rs.{" "}
                      {Number(
                        entry.total_cost || 0
                      ).toLocaleString()}
                    </div>

                    <div>
                      {canModifyFuel ? (
                        <button
                          type="button"
                          onClick={() => deleteFuelEntry(entry.id)}
                          disabled={deletingFuelId !== null}
                          className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingFuelId === entry.id
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
              })}
            </div>
          </div>
        )}

        {/* Daily Total */}
        <div className="flex justify-end mt-6">
          <div className="bg-slate-900 text-white rounded-xl px-6 py-4">
            <p className="text-sm text-slate-300">
              Total Fuel Cost
            </p>

            <p className="text-2xl font-bold mt-1">
              Rs. {dailyFuelCost.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
