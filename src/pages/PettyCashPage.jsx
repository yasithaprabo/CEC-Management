
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

function PettyCashPage({ userRole }) {
  const [selectedDate, setSelectedDate] = useState(getSriLankaDate);

  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [savingEntry, setSavingEntry] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState(null);

  const [form, setForm] = useState({
    category: "",
    description: "",
    amount: "",
    notes: "",
  });

  const [permissionEnabled, setPermissionEnabled] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const isAdmin = userRole === "admin";

  const canEdit =
    isAdmin ||
    (!permissionsLoading &&
      userRole === "staff" &&
      permissionEnabled &&
      selectedDate === getSriLankaDate());

  const totalCost = entries.reduce(
    (total, entry) => total + Number(entry.amount || 0),
    0
  );

  const money = (value) =>
    Number(value || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Load staff permission
  useEffect(() => {
    let active = true;

    async function loadPermission() {
      setPermissionsLoading(true);
      setPermissionEnabled(false);

      if (isAdmin || userRole !== "staff") {
        setPermissionsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("staff_permissions")
        .select("is_enabled")
        .eq("category", "petty-cash")
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error("Error loading petty cash permission:", error);
      } else {
        setPermissionEnabled(data?.is_enabled === true);
      }

      setPermissionsLoading(false);
    }

    loadPermission();

    return () => {
      active = false;
    };
  }, [isAdmin, userRole]);

  // Load entries for selected date
  useEffect(() => {
    let active = true;

    async function loadEntries() {
      setLoadingEntries(true);
      setEntries([]);

      const { data, error } = await supabase
        .from("petty_cash")
        .select("*")
        .eq("expense_date", selectedDate)
        .order("id", { ascending: false });

      if (!active) return;

      if (error) {
        console.error("Error loading petty cash entries:", error);
        setEntries([]);
      } else {
        setEntries(data || []);
      }

      setLoadingEntries(false);
    }

    loadEntries();

    return () => {
      active = false;
    };
  }, [selectedDate]);

  // Save petty cash entry
  async function saveEntry() {
    if (!canEdit || savingEntry) {
      alert("You do not have permission to add entries for this date.");
      return;
    }

    const category = form.category.trim();
    const description = form.description.trim();
    const amount = Number(form.amount);

    if (!category) {
      alert("Please enter a category.");
      return;
    }

    if (!description) {
      alert("Please enter a description.");
      return;
    }

    if (
      form.amount === "" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      alert("Please enter a valid amount.");
      return;
    }

    setSavingEntry(true);

    const { data, error } = await supabase
      .from("petty_cash")
      .insert([
        {
          expense_date: selectedDate,
          category,
          description,
          amount,
          notes: form.notes.trim() || null,
        },
      ])
      .select()
      .single();

    setSavingEntry(false);

    if (error) {
      console.error("Error saving petty cash entry:", error);
      alert("Failed to save petty cash entry: " + error.message);
      return;
    }

    setEntries((currentEntries) => [data, ...currentEntries]);

    setForm({
      category: "",
      description: "",
      amount: "",
      notes: "",
    });

    alert("Petty cash entry saved successfully!");
  }

  // Delete entry
  async function deleteEntry(entry) {
    if (!canEdit || deletingEntryId !== null) {
      alert("You do not have permission to delete entries for this date.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this petty cash entry?"
    );

    if (!confirmed) return;

    setDeletingEntryId(entry.id);

    const { error } = await supabase
      .from("petty_cash")
      .delete()
      .eq("id", entry.id);

    setDeletingEntryId(null);

    if (error) {
      console.error("Error deleting petty cash entry:", error);
      alert("Failed to delete petty cash entry: " + error.message);
      return;
    }

    setEntries((currentEntries) =>
      currentEntries.filter((item) => item.id !== entry.id)
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">
          Petty Cash Used
        </h2>

        <p className="text-slate-500 mt-1">
          Manage daily petty cash expenses
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
      {!permissionsLoading && !canEdit && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-5 text-sm">
          <strong>View Only:</strong> You cannot add or delete
          petty cash entries for the selected date.
        </div>
      )}

      {/* Add Petty Cash Entry */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Add Petty Cash Entry
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Add petty cash expense for {selectedDate}
          </p>
        </div>

        <fieldset
          disabled={!canEdit || savingEntry}
          className="disabled:opacity-60"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Category
              </label>

              <input
                type="text"
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value,
                  })
                }
                placeholder="Example: Transport"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-white text-slate-700"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Description
              </label>

              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                placeholder="Enter expense description"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-white text-slate-700"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Amount (Rs.)
              </label>

              <input
                type="number"
                min="0"
                step="any"
                value={form.amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    amount: e.target.value,
                  })
                }
                placeholder="0.00"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-white text-slate-700"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Notes
            </label>

            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm({
                  ...form,
                  notes: e.target.value,
                })
              }
              placeholder="Optional notes"
              rows={3}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-white text-slate-700"
            />
          </div>

          <button
            type="button"
            onClick={saveEntry}
            disabled={savingEntry || !canEdit}
            className="mt-6 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition"
          >
            {savingEntry ? "Saving..." : "Save Entry"}
          </button>
        </fieldset>
      </div>

      {/* Total Cost */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 mb-6">
        <p className="text-sm text-slate-300">
          Total Petty Cash Cost
        </p>

        <p className="text-3xl font-bold mt-2">
          Rs. {money(totalCost)}
        </p>

        <p className="text-sm text-slate-400 mt-1">
          {selectedDate}
        </p>
      </div>

      {/* Saved Entries */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Saved Petty Cash Entries
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Entries saved for {selectedDate}
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200">
              <div className="text-sm font-semibold text-slate-600">
                Category
              </div>

              <div className="text-sm font-semibold text-slate-600">
                Description
              </div>

              <div className="text-sm font-semibold text-slate-600">
                Amount
              </div>

              <div className="text-sm font-semibold text-slate-600">
                Notes
              </div>

              <div className="text-sm font-semibold text-slate-600 text-right">
                Action
              </div>
            </div>

            {loadingEntries ? (
              <div className="px-6 py-6 text-sm text-slate-500">
                Loading petty cash entries...
              </div>
            ) : entries.length === 0 ? (
              <div className="px-6 py-6 text-sm text-slate-500">
                No petty cash entries for this date.
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-slate-100 last:border-b-0 items-center"
                >
                  <div className="font-medium text-slate-800">
                    {entry.category}
                  </div>

                  <div className="text-slate-600">
                    {entry.description}
                  </div>

                  <div className="font-semibold text-slate-800">
                    Rs. {money(entry.amount)}
                  </div>

                  <div className="text-slate-600">
                    {entry.notes || "-"}
                  </div>

                  <div className="text-right">
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => deleteEntry(entry)}
                        disabled={deletingEntryId !== null}
                        className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
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
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default PettyCashPage;
