
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

function OtherExpensesPage({ userRole }) {
  const [selectedDate, setSelectedDate] = useState(getSriLankaDate);

  const [expenseType, setExpenseType] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [permissionEnabled, setPermissionEnabled] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const isAdmin = userRole === "admin";

  const canEdit =
    isAdmin ||
    (!permissionsLoading &&
      userRole === "staff" &&
      permissionEnabled &&
      selectedDate === getSriLankaDate());

  const totalCost = expenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
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
        .eq("category", "other-expenses")
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error("Error loading other expenses permission:", error);
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

  // Load expenses when selected date changes
  useEffect(() => {
    let active = true;

    async function loadExpenses() {
      setLoadingExpenses(true);
      setExpenses([]);

      const { data, error } = await supabase
        .from("other_expenses")
        .select("*")
        .eq("expense_date", selectedDate)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        console.error("Error loading other expenses:", error);
        setExpenses([]);
      } else {
        setExpenses(data || []);
      }

      setLoadingExpenses(false);
    }

    loadExpenses();

    return () => {
      active = false;
    };
  }, [selectedDate]);

  // Save new expense
  async function handleSaveExpense(e) {
    e.preventDefault();

    if (!canEdit || saving) {
      alert("You do not have permission to add expenses for this date.");
      return;
    }

    const type = expenseType.trim();
    const desc = description.trim();
    const expenseAmount = Number(amount);

    if (!type) {
      alert("Please enter expense type.");
      return;
    }

    if (!desc) {
      alert("Please enter description.");
      return;
    }

    if (
      amount === "" ||
      !Number.isFinite(expenseAmount) ||
      expenseAmount <= 0
    ) {
      alert("Please enter a valid amount.");
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("other_expenses")
      .insert([
        {
          expense_date: selectedDate,
          expense_type: type,
          description: desc,
          amount: expenseAmount,
          notes: notes.trim(),
        },
      ])
      .select()
      .single();

    setSaving(false);

    if (error) {
      console.error("Error saving other expense:", error);
      alert("Failed to save expense: " + error.message);
      return;
    }

    setExpenses((previous) => [data, ...previous]);

    setExpenseType("");
    setDescription("");
    setAmount("");
    setNotes("");

    alert("Other expense saved successfully.");
  }

  // Delete expense
  async function handleDeleteExpense(id) {
    if (!canEdit || deletingId !== null) {
      alert("You do not have permission to delete expenses for this date.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) return;

    setDeletingId(id);

    const { error } = await supabase
      .from("other_expenses")
      .delete()
      .eq("id", id);

    setDeletingId(null);

    if (error) {
      console.error("Error deleting other expense:", error);
      alert("Failed to delete expense: " + error.message);
      return;
    }

    setExpenses((previous) =>
      previous.filter((expense) => expense.id !== id)
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">
          Other Expenses
        </h2>

        <p className="text-slate-500 mt-1">
          Manage daily other expenses and costs
        </p>

        <div className="mt-4">
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

      {/* Permission Notice */}
      {!permissionsLoading && !canEdit && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-5 text-sm">
          <strong>View Only:</strong> You cannot add or delete
          expenses for the selected date.
        </div>
      )}

      {/* Add Expense Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-5">
          Add Other Expense
        </h3>

        <form onSubmit={handleSaveExpense}>
          <fieldset
            disabled={!canEdit || saving}
            className="disabled:opacity-60"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Expense Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Expense Type
                </label>

                <input
                  type="text"
                  value={expenseType}
                  onChange={(e) => setExpenseType(e.target.value)}
                  placeholder="e.g. Electricity, Repair"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amount (Rs.)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>

                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter expense description"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                />
              </div>

              {/* Notes */}
              <div>
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
            </div>

            <button
              type="submit"
              disabled={!canEdit || saving}
              className="mt-6 bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Entry"}
            </button>
          </fieldset>
        </form>
      </div>

      {/* Total Cost */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <p className="text-sm font-medium text-slate-500">
          Total Other Expenses Cost
        </p>

        <p className="text-3xl font-bold text-slate-900 mt-2">
          Rs. {money(totalCost)}
        </p>

        <p className="text-sm text-slate-500 mt-1">
          For {selectedDate}
        </p>
      </div>

      {/* Saved Expenses */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Saved Other Expenses
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Entries for {selectedDate}
          </p>
        </div>

        {loadingExpenses ? (
          <div className="p-8 text-center text-slate-500">
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No other expenses recorded for this date.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">
                    Expense Type
                  </th>

                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">
                    Description
                  </th>

                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">
                    Amount
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
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-t border-slate-100"
                  >
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {expense.expense_type}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {expense.description}
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      Rs. {money(expense.amount)}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {expense.notes || "-"}
                    </td>

                    <td className="px-6 py-4">
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(expense.id)}
                          disabled={deletingId !== null}
                          className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                        >
                          {deletingId === expense.id
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default OtherExpensesPage;
