import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function IncomePage() {
  const today = new Date().toLocaleDateString("en-CA");

  const [view, setView] = useState("home");
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7));

  const [loading, setLoading] = useState(false);

  const emptySummary = {
    quarryIncome: 0,
    crusherIncome: 0,
    labour: 0,
    machinery: 0,
    fuel: 0,
    quarryMaterials: 0,
    crusherMaterials: 0,
    pettyCash: 0,
    otherExpenses: 0,
  };

  const [dailySummary, setDailySummary] = useState(emptySummary);
  const [monthlySummary, setMonthlySummary] = useState(emptySummary);

  // =====================================================
  // HELPERS
  // =====================================================

  function sumField(rows, field) {
    return (rows || []).reduce(
      (total, row) => total + Number(row[field] || 0),
      0
    );
  }

  function formatMoney(value) {
    return Number(value || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function getMonthRange(monthValue) {
    const [year, month] = monthValue.split("-").map(Number);

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;

    const lastDay = new Date(year, month, 0).getDate();

    const endDate = `${year}-${String(month).padStart(
      2,
      "0"
    )}-${String(lastDay).padStart(2, "0")}`;

    return { startDate, endDate };
  }

  function getMonthName(monthValue) {
    const [year, month] = monthValue.split("-").map(Number);

    return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  // =====================================================
  // DAILY SUMMARY
  // =====================================================

  useEffect(() => {
    if (view === "daily") {
      loadDailySummary();
    }
  }, [selectedDate, view]);

  async function loadDailySummary() {
    if (!selectedDate) return;

    setLoading(true);

    try {
      const [
        quarryProductionResult,
        crusherProductionResult,
        attendanceResult,
        machineryResult,
        fuelResult,
        quarryMaterialResult,
        crusherMaterialResult,
        pettyCashResult,
        otherExpensesResult,
      ] = await Promise.all([
        supabase
          .from("quarry_production")
          .select("total_value")
          .eq("production_date", selectedDate),

        supabase
          .from("crusher_production")
          .select("total_value")
          .eq("production_date", selectedDate),

        supabase
          .from("attendance")
          .select(`
            present,
            employees (
              day_rate
            )
          `)
          .eq("attendance_date", selectedDate),

        supabase
          .from("machinery_usage")
          .select("total_cost")
          .eq("usage_date", selectedDate),

        supabase
          .from("fuel_usage")
          .select("total_cost")
          .eq("fuel_date", selectedDate),

        supabase
          .from("quarry_material_usage")
          .select("total_cost")
          .eq("usage_date", selectedDate),

        supabase
          .from("crusher_material_usage")
          .select("total_cost")
          .eq("usage_date", selectedDate),

        supabase
          .from("petty_cash")
          .select("amount")
          .eq("expense_date", selectedDate),

        supabase
          .from("other_expenses")
          .select("amount")
          .eq("expense_date", selectedDate),
      ]);

      const results = [
        quarryProductionResult,
        crusherProductionResult,
        attendanceResult,
        machineryResult,
        fuelResult,
        quarryMaterialResult,
        crusherMaterialResult,
        pettyCashResult,
        otherExpensesResult,
      ];

      const failedResult = results.find((result) => result.error);

      if (failedResult) {
        throw failedResult.error;
      }

      const labourCost = (attendanceResult.data || []).reduce(
        (total, row) => {
          if (!row.present) return total;

          return total + Number(row.employees?.day_rate || 0);
        },
        0
      );

      setDailySummary({
        quarryIncome: sumField(
          quarryProductionResult.data,
          "total_value"
        ),

        crusherIncome: sumField(
          crusherProductionResult.data,
          "total_value"
        ),

        labour: labourCost,

        machinery: sumField(
          machineryResult.data,
          "total_cost"
        ),

        fuel: sumField(
          fuelResult.data,
          "total_cost"
        ),

        quarryMaterials: sumField(
          quarryMaterialResult.data,
          "total_cost"
        ),

        crusherMaterials: sumField(
          crusherMaterialResult.data,
          "total_cost"
        ),

        pettyCash: sumField(
          pettyCashResult.data,
          "amount"
        ),

        otherExpenses: sumField(
          otherExpensesResult.data,
          "amount"
        ),
      });
    } catch (error) {
      console.error("Daily summary error:", error);
      alert("Failed to load daily summary.");
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // MONTHLY SUMMARY
  // =====================================================

  useEffect(() => {
    if (view === "monthly") {
      loadMonthlySummary();
    }
  }, [selectedMonth, view]);

  async function loadMonthlySummary() {
    if (!selectedMonth) return;

    setLoading(true);

    const { startDate, endDate } = getMonthRange(selectedMonth);

    try {
      const [
        quarryProductionResult,
        crusherProductionResult,
        attendanceResult,
        machineryResult,
        fuelResult,
        quarryMaterialResult,
        crusherMaterialResult,
        pettyCashResult,
        otherExpensesResult,
      ] = await Promise.all([
        supabase
          .from("quarry_production")
          .select("total_value")
          .gte("production_date", startDate)
          .lte("production_date", endDate),

        supabase
          .from("crusher_production")
          .select("total_value")
          .gte("production_date", startDate)
          .lte("production_date", endDate),

        supabase
          .from("attendance")
          .select(`
            present,
            employees (
              day_rate
            )
          `)
          .gte("attendance_date", startDate)
          .lte("attendance_date", endDate),

        supabase
          .from("machinery_usage")
          .select("total_cost")
          .gte("usage_date", startDate)
          .lte("usage_date", endDate),

        supabase
          .from("fuel_usage")
          .select("total_cost")
          .gte("fuel_date", startDate)
          .lte("fuel_date", endDate),

        supabase
          .from("quarry_material_usage")
          .select("total_cost")
          .gte("usage_date", startDate)
          .lte("usage_date", endDate),

        supabase
          .from("crusher_material_usage")
          .select("total_cost")
          .gte("usage_date", startDate)
          .lte("usage_date", endDate),

        supabase
          .from("petty_cash")
          .select("amount")
          .gte("expense_date", startDate)
          .lte("expense_date", endDate),

        supabase
          .from("other_expenses")
          .select("amount")
          .gte("expense_date", startDate)
          .lte("expense_date", endDate),
      ]);

      const results = [
        quarryProductionResult,
        crusherProductionResult,
        attendanceResult,
        machineryResult,
        fuelResult,
        quarryMaterialResult,
        crusherMaterialResult,
        pettyCashResult,
        otherExpensesResult,
      ];

      const failedResult = results.find((result) => result.error);

      if (failedResult) {
        throw failedResult.error;
      }

      const labourCost = (attendanceResult.data || []).reduce(
        (total, row) => {
          if (!row.present) return total;

          return total + Number(row.employees?.day_rate || 0);
        },
        0
      );

      setMonthlySummary({
        quarryIncome: sumField(
          quarryProductionResult.data,
          "total_value"
        ),

        crusherIncome: sumField(
          crusherProductionResult.data,
          "total_value"
        ),

        labour: labourCost,

        machinery: sumField(
          machineryResult.data,
          "total_cost"
        ),

        fuel: sumField(
          fuelResult.data,
          "total_cost"
        ),

        quarryMaterials: sumField(
          quarryMaterialResult.data,
          "total_cost"
        ),

        crusherMaterials: sumField(
          crusherMaterialResult.data,
          "total_cost"
        ),

        pettyCash: sumField(
          pettyCashResult.data,
          "amount"
        ),

        otherExpenses: sumField(
          otherExpensesResult.data,
          "amount"
        ),
      });
    } catch (error) {
      console.error("Monthly summary error:", error);
      alert("Failed to load monthly summary.");
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // PRINT
  // =====================================================

  function handlePrint() {
    window.print();
  }

  // =====================================================
  // HOME
  // =====================================================

  if (view === "home") {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">
            Income / Expenditure Reports
          </h2>

          <p className="text-slate-500 mt-1">
            View daily and monthly financial summaries
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* DAILY */}
          <button
            onClick={() => setView("daily")}
            className="bg-white border border-slate-200 rounded-2xl p-8 text-left hover:border-slate-400 hover:shadow-md transition"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-5">
              <span className="text-xl">📅</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              Daily Summary
            </h3>

            <p className="text-slate-500 mt-2">
              View income, expenditure and profit/loss for a
              selected date.
            </p>

            <div className="mt-6 font-semibold text-slate-900">
              View Daily Report →
            </div>
          </button>

          {/* MONTHLY */}
          <button
            onClick={() => setView("monthly")}
            className="bg-white border border-slate-200 rounded-2xl p-8 text-left hover:border-slate-400 hover:shadow-md transition"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-5">
              <span className="text-xl">📊</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              Monthly Summary
            </h3>

            <p className="text-slate-500 mt-2">
              View total monthly income, expenditure and
              profit/loss.
            </p>

            <div className="mt-6 font-semibold text-slate-900">
              View Monthly Report →
            </div>
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // DAILY REPORT
  // =====================================================

  if (view === "daily") {
    return (
      <ReportPage
        title="Daily Summary"
        periodLabel={selectedDate}
        input={
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-4 py-2 bg-white"
          />
        }
        summary={dailySummary}
        loading={loading}
        formatMoney={formatMoney}
        onBack={() => setView("home")}
        onPrint={handlePrint}
        printText="Print Daily Report"
      />
    );
  }

  // =====================================================
  // MONTHLY REPORT
  // =====================================================

  return (
    <ReportPage
      title="Monthly Summary"
      periodLabel={getMonthName(selectedMonth)}
      input={
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border border-slate-300 rounded-lg px-4 py-2 bg-white"
        />
      }
      summary={monthlySummary}
      loading={loading}
      formatMoney={formatMoney}
      onBack={() => setView("home")}
      onPrint={handlePrint}
      printText="Print Monthly Report"
    />
  );
}

// =====================================================
// REPORT PAGE
// =====================================================

function ReportPage({
  title,
  periodLabel,
  input,
  summary,
  loading,
  formatMoney,
  onBack,
  onPrint,
  printText,
}) {
  const totalIncome =
    Number(summary.quarryIncome || 0) +
    Number(summary.crusherIncome || 0);

  const totalExpenditure =
    Number(summary.labour || 0) +
    Number(summary.machinery || 0) +
    Number(summary.fuel || 0) +
    Number(summary.quarryMaterials || 0) +
    Number(summary.crusherMaterials || 0) +
    Number(summary.pettyCash || 0) +
    Number(summary.otherExpenses || 0);

  const profitLoss = totalIncome - totalExpenditure;

  return (
    <div>
      {/* SCREEN CONTROLS */}
      <div className="print:hidden mb-6">
        <button
          onClick={onBack}
          className="text-sm font-medium text-slate-600 hover:text-slate-900 mb-5"
        >
          ← Back to Reports
        </button>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              {title}
            </h2>

            <p className="text-slate-500 mt-1">
              Income, expenditure and profit/loss report
            </p>

            <div className="mt-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {title === "Daily Summary"
                  ? "Select Date"
                  : "Select Month"}
              </label>

              {input}
            </div>
          </div>

          <button
            onClick={onPrint}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium"
          >
            🖨 {printText}
          </button>
        </div>
      </div>

      {/* PRINTABLE REPORT */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 print:border-0 print:shadow-none">
        <div className="text-center border-b border-slate-200 pb-5 mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            CEC Costing Management System
          </h1>

          <h2 className="text-lg font-semibold text-slate-700 mt-2">
            {title}
          </h2>

          <p className="text-slate-500 mt-1">
            {periodLabel}
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500">
            Loading report...
          </div>
        ) : (
          <>
            {/* TOP SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <ReportCard
                title="Total Income"
                value={totalIncome}
                formatMoney={formatMoney}
              />

              <ReportCard
                title="Total Expenditure"
                value={totalExpenditure}
                formatMoney={formatMoney}
              />

              <ReportCard
                title={profitLoss >= 0 ? "Net Profit" : "Net Loss"}
                value={Math.abs(profitLoss)}
                formatMoney={formatMoney}
                status={profitLoss >= 0 ? "profit" : "loss"}
              />
            </div>

            {/* INCOME */}
            <ReportSection title="Income">
              <ReportRow
                label="Quarry Production / Sales Income"
                value={summary.quarryIncome}
                formatMoney={formatMoney}
              />

              <ReportRow
                label="Crusher Production / Sales Income"
                value={summary.crusherIncome}
                formatMoney={formatMoney}
              />

              <TotalRow
                label="Total Income"
                value={totalIncome}
                formatMoney={formatMoney}
              />
            </ReportSection>

            {/* EXPENDITURE */}
            <ReportSection title="Expenditure">
              <ReportRow
                label="Labour Cost"
                value={summary.labour}
                formatMoney={formatMoney}
              />

              <ReportRow
                label="Machinery Cost"
                value={summary.machinery}
                formatMoney={formatMoney}
              />

              <ReportRow
                label="Fuel Cost"
                value={summary.fuel}
                formatMoney={formatMoney}
              />

              <ReportRow
                label="Quarry Material Cost"
                value={summary.quarryMaterials}
                formatMoney={formatMoney}
              />

              <ReportRow
                label="Crusher Material Cost"
                value={summary.crusherMaterials}
                formatMoney={formatMoney}
              />

              <ReportRow
                label="Petty Cash"
                value={summary.pettyCash}
                formatMoney={formatMoney}
              />

              <ReportRow
                label="Other Expenses"
                value={summary.otherExpenses}
                formatMoney={formatMoney}
              />

              <TotalRow
                label="Total Expenditure"
                value={totalExpenditure}
                formatMoney={formatMoney}
              />
            </ReportSection>

            {/* PROFIT LOSS */}
            <div className="bg-slate-900 text-white rounded-xl p-6 print:bg-white print:text-black print:border print:border-slate-300">
              <h3 className="text-lg font-bold mb-5">
                Profit / Loss
              </h3>

              <div className="flex justify-between py-2">
                <span>Total Income</span>
                <span className="font-semibold">
                  Rs. {formatMoney(totalIncome)}
                </span>
              </div>

              <div className="flex justify-between py-2">
                <span>Total Expenditure</span>
                <span className="font-semibold">
                  - Rs. {formatMoney(totalExpenditure)}
                </span>
              </div>

              <div className="border-t border-slate-600 print:border-slate-300 mt-3 pt-4 flex justify-between">
                <span className="font-bold">
                  {profitLoss >= 0 ? "Net Profit" : "Net Loss"}
                </span>

                <span className="text-xl font-bold">
                  Rs. {formatMoney(Math.abs(profitLoss))}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =====================================================
// REPORT SECTION
// =====================================================

function ReportSection({ title, children }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-900">
          {title}
        </h3>
      </div>

      <div className="px-6 py-3">
        {children}
      </div>
    </div>
  );
}

// =====================================================
// REPORT ROW
// =====================================================

function ReportRow({ label, value, formatMoney }) {
  return (
    <div className="flex justify-between py-3 border-b border-slate-100">
      <span className="text-slate-600">
        {label}
      </span>

      <span className="font-semibold text-slate-900">
        Rs. {formatMoney(value)}
      </span>
    </div>
  );
}

// =====================================================
// TOTAL ROW
// =====================================================

function TotalRow({ label, value, formatMoney }) {
  return (
    <div className="flex justify-between py-4">
      <span className="font-bold text-slate-900">
        {label}
      </span>

      <span className="font-bold text-lg text-slate-900">
        Rs. {formatMoney(value)}
      </span>
    </div>
  );
}

// =====================================================
// REPORT CARD
// =====================================================

function ReportCard({
  title,
  value,
  formatMoney,
  status,
}) {
  let valueClass = "text-slate-900";

  if (status === "profit") {
    valueClass = "text-emerald-600";
  }

  if (status === "loss") {
    valueClass = "text-red-600";
  }

  return (
    <div className="border border-slate-200 rounded-xl p-5">
      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className={`text-xl font-bold mt-2 ${valueClass}`}>
        Rs. {formatMoney(value)}
      </p>
    </div>
  );
}

export default IncomePage;