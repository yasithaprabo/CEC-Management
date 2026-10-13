import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  CalendarCheck,
  Tractor,
  Fuel,
  Package,
  WalletCards,
  Factory,
} from "lucide-react";

function ReportsPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  const [selectedCategory, setSelectedCategory] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const reportCategories = [
    {
      id: "attendance",
      name: "Attendance",
      description: "Employee attendance and labour cost",
      icon: <CalendarCheck size={24} />,
    },
    {
      id: "machinery",
      name: "Machinery",
      description: "Daily machinery usage and cost",
      icon: <Tractor size={24} />,
    },
    {
      id: "fuel",
      name: "Fuel",
      description: "Daily fuel usage and cost",
      icon: <Fuel size={24} />,
    },
    {
      id: "quarry-materials",
      name: "Quarry Materials",
      description: "Daily quarry material usage and cost",
      icon: <Package size={24} />,
    },
    {
      id: "petty-cash",
      name: "Petty Cash Used",
      description: "Daily petty cash expenses",
      icon: <WalletCards size={24} />,
    },
    {
      id: "other-expenses",
      name: "Other Expenses",
      description: "Daily other expenses",
      icon: <WalletCards size={24} />,
    },
    {
      id: "quarry-production",
      name: "Production at Quarry",
      description: "Daily quarry production records",
      icon: <Factory size={24} />,
    },
    {
      id: "crusher-production",
      name: "Production at Crusher",
      description: "Daily crusher production records",
      icon: <Factory size={24} />,
    },
  ];

  const selectedCategoryDetails = reportCategories.find(
    (category) => category.id === selectedCategory
  );

  // =========================================================
  // LOAD SELECTED REPORT
  // =========================================================
  useEffect(() => {
    if (!selectedCategory) {
      setRecords([]);
      return;
    }

    async function loadReport() {
      setLoading(true);
      setRecords([]);

      let query;

      if (selectedCategory === "attendance") {
        query = supabase
          .from("attendance")
          .select(`
            id,
            attendance_date,
            employee_id,
            present,
            employees (
              id,
              name,
              designation,
              employee_type,
              day_rate
            )
          `)
          .eq("attendance_date", selectedDate)
          .order("id", { ascending: true });
      }

      if (selectedCategory === "machinery") {
        query = supabase
          .from("machinery_usage")
          .select(`
            id,
            usage_date,
            machinery_id,
            usage_amount,
            rate,
            total_cost,
            notes,
            machinery (
              id,
              machine_name,
              usage_type
            )
          `)
          .eq("usage_date", selectedDate)
          .order("id", { ascending: true });
      }

      if (selectedCategory === "fuel") {
        query = supabase
          .from("fuel_usage")
          .select(`
            id,
            fuel_date,
            machinery_id,
            fuel_type,
            litres,
            rate_per_litre,
            total_cost,
            notes,
            machinery (
              id,
              machine_name
            )
          `)
          .eq("fuel_date", selectedDate)
          .order("id", { ascending: true });
      }

      if (selectedCategory === "quarry-materials") {
        query = supabase
          .from("quarry_material_usage")
          .select(`
            id,
            usage_date,
            material_id,
            quantity,
            rate,
            total_cost,
            notes,
            quarry_materials (
              id,
              material_name,
              unit
            )
          `)
          .eq("usage_date", selectedDate)
          .order("id", { ascending: true });
      }

      if (selectedCategory === "petty-cash") {
        query = supabase
          .from("petty_cash")
          .select("*")
          .eq("expense_date", selectedDate)
          .order("id", { ascending: true });
      }

      if (selectedCategory === "other-expenses") {
        query = supabase
          .from("other_expenses")
          .select("*")
          .eq("expense_date", selectedDate)
          .order("id", { ascending: true });
      }

      if (selectedCategory === "quarry-production") {
        query = supabase
          .from("quarry_production")
          .select(`
            id,
            production_date,
            product_id,
            quantity,
            rate,
            total_value,
            notes,
            quarry_products (
              id,
              product_name,
              unit
            )
          `)
          .eq("production_date", selectedDate)
          .order("id", { ascending: true });
      }

      if (selectedCategory === "crusher-production") {
        query = supabase
          .from("crusher_production")
          .select(`
            id,
            production_date,
            product_id,
            quantity,
            rate,
            total_value,
            notes,
            crusher_products (
              id,
              product_name,
              unit
            )
          `)
          .eq("production_date", selectedDate)
          .order("id", { ascending: true });
      }

      if (!query) {
        setLoading(false);
        return;
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error loading report:", error);
        alert("Error loading report. Please check the console.");
        setRecords([]);
        setLoading(false);
        return;
      }

      setRecords(data || []);
      setLoading(false);
    }

    loadReport();
  }, [selectedDate, selectedCategory]);

  // =========================================================
  // TOTALS
  // =========================================================

  const totalPresent =
    selectedCategory === "attendance"
      ? records.filter((record) => record.present).length
      : 0;

  const totalAbsent =
    selectedCategory === "attendance"
      ? records.filter((record) => !record.present).length
      : 0;

  const totalLabourCost =
    selectedCategory === "attendance"
      ? records.reduce((total, record) => {
          if (!record.present) return total;

          return total + Number(record.employees?.day_rate || 0);
        }, 0)
      : 0;

  const reportTotal = records.reduce((total, record) => {
    if (selectedCategory === "machinery") {
      return total + Number(record.total_cost || 0);
    }

    if (selectedCategory === "fuel") {
      return total + Number(record.total_cost || 0);
    }

    if (selectedCategory === "quarry-materials") {
      return total + Number(record.total_cost || 0);
    }

    if (selectedCategory === "petty-cash") {
      return total + Number(record.amount || 0);
    }

    if (selectedCategory === "other-expenses") {
      return total + Number(record.amount || 0);
    }

    if (
      selectedCategory === "quarry-production" ||
      selectedCategory === "crusher-production"
    ) {
      return total + Number(record.total_value || 0);
    }

    return total;
  }, 0);

  function printReport() {
    window.print();
  }

  function money(value) {
    return Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // =========================================================
  // REPORT TABLE
  // =========================================================

  function renderReportTable() {
    if (loading) {
      return (
        <div className="text-center py-12 text-slate-400">
          Loading report...
        </div>
      );
    }

    if (records.length === 0) {
      return (
        <div className="text-center py-12 text-slate-400 border border-slate-200 rounded-xl">
          No records found for {selectedDate}.
        </div>
      );
    }

    // ATTENDANCE
    if (selectedCategory === "attendance") {
      return (
        <ReportTable
          headers={[
            "Employee",
            "Designation",
            "Type",
            "Day Rate",
            "Status",
            "Labour Cost",
          ]}
        >
          {records.map((record) => (
            <ReportRow key={record.id} columns={6}>
              <div className="font-semibold">
                {record.employees?.name || "Unknown Employee"}
              </div>

              <div>{record.employees?.designation || "-"}</div>

              <div>{record.employees?.employee_type || "-"}</div>

              <div>
                Rs. {money(record.employees?.day_rate)}
              </div>

              <div>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                    record.present
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {record.present ? "Present" : "Absent"}
                </span>
              </div>

              <div className="font-semibold">
                Rs.{" "}
                {record.present
                  ? money(record.employees?.day_rate)
                  : "0.00"}
              </div>
            </ReportRow>
          ))}
        </ReportTable>
      );
    }

    // MACHINERY
    if (selectedCategory === "machinery") {
      return (
        <ReportTable
          headers={[
            "Machine",
            "Usage",
            "Rate",
            "Total Cost",
            "Notes",
          ]}
        >
          {records.map((record) => (
            <ReportRow key={record.id} columns={5}>
              <div className="font-semibold">
                {record.machinery?.machine_name || "Unknown Machine"}
              </div>

              <div>
                {Number(record.usage_amount || 0).toLocaleString()}{" "}
                {record.machinery?.usage_type || ""}
              </div>

              <div>Rs. {money(record.rate)}</div>

              <div className="font-semibold">
                Rs. {money(record.total_cost)}
              </div>

              <div>{record.notes || "-"}</div>
            </ReportRow>
          ))}
        </ReportTable>
      );
    }

    // FUEL
    if (selectedCategory === "fuel") {
      return (
        <ReportTable
          headers={[
            "Machine",
            "Fuel Type",
            "Litres",
            "Rate / Litre",
            "Total Cost",
            "Notes",
          ]}
        >
          {records.map((record) => (
            <ReportRow key={record.id} columns={6}>
              <div className="font-semibold">
                {record.machinery?.machine_name || "Unknown Machine"}
              </div>

              <div>{record.fuel_type || "-"}</div>

              <div>
                {Number(record.litres || 0).toLocaleString()} L
              </div>

              <div>Rs. {money(record.rate_per_litre)}</div>

              <div className="font-semibold">
                Rs. {money(record.total_cost)}
              </div>

              <div>{record.notes || "-"}</div>
            </ReportRow>
          ))}
        </ReportTable>
      );
    }

    // QUARRY MATERIALS
    if (selectedCategory === "quarry-materials") {
      return (
        <ReportTable
          headers={[
            "Material",
            "Quantity",
            "Rate",
            "Total Cost",
            "Notes",
          ]}
        >
          {records.map((record) => (
            <ReportRow key={record.id} columns={5}>
              <div className="font-semibold">
                {record.quarry_materials?.material_name ||
                  "Unknown Material"}
              </div>

              <div>
                {Number(record.quantity || 0).toLocaleString()}{" "}
                {record.quarry_materials?.unit || ""}
              </div>

              <div>Rs. {money(record.rate)}</div>

              <div className="font-semibold">
                Rs. {money(record.total_cost)}
              </div>

              <div>{record.notes || "-"}</div>
            </ReportRow>
          ))}
        </ReportTable>
      );
    }

    // PETTY CASH
    if (selectedCategory === "petty-cash") {
      return (
        <ReportTable
          headers={[
            "Category",
            "Description",
            "Amount",
            "Notes",
          ]}
        >
          {records.map((record) => (
            <ReportRow key={record.id} columns={4}>
              <div className="font-semibold">
                {record.category || "-"}
              </div>

              <div>{record.description || "-"}</div>

              <div className="font-semibold">
                Rs. {money(record.amount)}
              </div>

              <div>{record.notes || "-"}</div>
            </ReportRow>
          ))}
        </ReportTable>
      );
    }

    // OTHER EXPENSES
    if (selectedCategory === "other-expenses") {
      return (
        <ReportTable
          headers={[
            "Expense Type",
            "Description",
            "Amount",
            "Notes",
          ]}
        >
          {records.map((record) => (
            <ReportRow key={record.id} columns={4}>
              <div className="font-semibold">
                {record.expense_type || "-"}
              </div>

              <div>{record.description || "-"}</div>

              <div className="font-semibold">
                Rs. {money(record.amount)}
              </div>

              <div>{record.notes || "-"}</div>
            </ReportRow>
          ))}
        </ReportTable>
      );
    }

    // QUARRY PRODUCTION
    if (selectedCategory === "quarry-production") {
      return (
        <ReportTable
          headers={[
            "Product",
            "Quantity",
            "Rate",
            "Total Value",
            "Notes",
          ]}
        >
          {records.map((record) => (
            <ReportRow key={record.id} columns={5}>
              <div className="font-semibold">
                {record.quarry_products?.product_name ||
                  "Unknown Product"}
              </div>

              <div>
                {Number(record.quantity || 0).toLocaleString()}{" "}
                {record.quarry_products?.unit || ""}
              </div>

              <div>Rs. {money(record.rate)}</div>

              <div className="font-semibold">
                Rs. {money(record.total_value)}
              </div>

              <div>{record.notes || "-"}</div>
            </ReportRow>
          ))}
        </ReportTable>
      );
    }

    // CRUSHER PRODUCTION
    if (selectedCategory === "crusher-production") {
      return (
        <ReportTable
          headers={[
            "Product",
            "Quantity",
            "Rate",
            "Total Value",
            "Notes",
          ]}
        >
          {records.map((record) => (
            <ReportRow key={record.id} columns={5}>
              <div className="font-semibold">
                {record.crusher_products?.product_name ||
                  "Unknown Product"}
              </div>

              <div>
                {Number(record.quantity || 0).toLocaleString()}{" "}
                {record.crusher_products?.unit || ""}
              </div>

              <div>Rs. {money(record.rate)}</div>

              <div className="font-semibold">
                Rs. {money(record.total_value)}
              </div>

              <div>{record.notes || "-"}</div>
            </ReportRow>
          ))}
        </ReportTable>
      );
    }

    return null;
  }

  return (
    <>
      {/* =====================================================
          PRINT STYLES
      ====================================================== */}
      <style>
        {`
          @media print {
            body {
              background: white !important;
            }

            aside {
              display: none !important;
            }

            main {
              padding: 0 !important;
            }

            .no-print {
              display: none !important;
            }

            .report-print-area {
              border: none !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 20px !important;
            }

            .report-scroll {
              overflow: visible !important;
            }

            .report-table {
              min-width: 0 !important;
            }
          }
        `}
      </style>

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <div className="mb-8 no-print">
        <h2 className="text-3xl font-bold text-slate-900">
          Reports
        </h2>

        <p className="text-slate-500 mt-1">
          View and print daily reports by category
        </p>
      </div>

      {/* =====================================================
          DATE SELECTOR
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 no-print">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Select Report Date
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Select the date you want to view reports for
            </p>
          </div>

          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date
            </label>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedCategory("");
              }}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          CATEGORY CARDS
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 no-print">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900">
            Report Categories
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Select a category to view the report for {selectedDate}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {reportCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className={`text-left border rounded-2xl p-5 transition-all ${
                selectedCategory === category.id
                  ? "border-amber-500 bg-amber-50 ring-2 ring-amber-100"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  selectedCategory === category.id
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {category.icon}
              </div>

              <h4 className="font-bold text-slate-900">
                {category.name}
              </h4>

              <p className="text-sm text-slate-500 mt-2">
                {category.description}
              </p>

              <p className="text-sm font-semibold text-amber-600 mt-4">
                View Report →
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================
          SELECTED REPORT
      ====================================================== */}
      {selectedCategoryDetails && (
        <div className="report-print-area bg-white rounded-2xl border border-slate-200 p-6 mt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                {selectedCategoryDetails.name} Report
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Report Date: {selectedDate}
              </p>
            </div>

            <button
              type="button"
              onClick={printReport}
              disabled={loading || records.length === 0}
              className="no-print bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Print Report
            </button>
          </div>

          {/* ATTENDANCE SUMMARY */}
          {selectedCategory === "attendance" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <SummaryCard
                title="Present Employees"
                value={totalPresent}
              />

              <SummaryCard
                title="Absent Employees"
                value={totalAbsent}
              />

              <SummaryCard
                title="Total Labour Cost"
                value={`Rs. ${money(totalLabourCost)}`}
                dark
              />
            </div>
          )}

          {/* OTHER REPORT TOTAL */}
          {selectedCategory !== "attendance" &&
            !loading &&
            records.length > 0 && (
              <div className="flex justify-end mb-6">
                <div className="bg-slate-900 text-white rounded-xl px-6 py-4 min-w-64">
                  <p className="text-sm text-slate-300">
                    {selectedCategory === "quarry-production" ||
                    selectedCategory === "crusher-production"
                      ? "Total Production Value"
                      : "Total Cost"}
                  </p>

                  <p className="text-2xl font-bold mt-1">
                    Rs. {money(reportTotal)}
                  </p>
                </div>
              </div>
            )}

          {renderReportTable()}
        </div>
      )}
    </>
  );
}

// =========================================================
// SUMMARY CARD
// =========================================================

function SummaryCard({ title, value, dark = false }) {
  return (
    <div
      className={`rounded-xl p-5 ${
        dark
          ? "bg-slate-900 text-white"
          : "bg-slate-50 border border-slate-200"
      }`}
    >
      <p
        className={`text-sm ${
          dark ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {title}
      </p>

      <p className="text-2xl font-bold mt-1">
        {value}
      </p>
    </div>
  );
}

// =========================================================
// REPORT TABLE
// =========================================================

function ReportTable({ headers, children }) {
  return (
    <div className="report-scroll overflow-x-auto border border-slate-200 rounded-xl">
      <div className="report-table min-w-[850px]">
        <div
          className="grid gap-4 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600"
          style={{
            gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))`,
          }}
        >
          {headers.map((header) => (
            <div key={header}>{header}</div>
          ))}
        </div>

        {children}
      </div>
    </div>
  );
}

function ReportRow({ columns, children }) {
  return (
    <div
      className="grid gap-4 items-center px-5 py-4 border-t border-slate-100 text-slate-600"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {children}
    </div>
  );
}

export default ReportsPage;