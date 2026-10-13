import {
  LayoutDashboard,
  CalendarCheck,
  Tractor,
  Fuel,
  Package,
  WalletCards,
  Factory,
  FileBarChart,
  Settings,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
} from "lucide-react";

import { supabase } from "./lib/supabase";
import { useEffect, useState } from "react";
import FuelPage from "./pages/FuelPage";
import QuarryMaterialsPage from "./pages/QuarryMaterialsPage";
import CrusherMaterialsPage from "./pages/CrusherMaterialsPage";
import PettyCashPage from "./pages/PettyCashPage";
import OtherExpensesPage from "./pages/OtherExpensesPage";
import QuarryProductionPage from "./pages/QuarryProductionPage";
import CrusherProductionPage from "./pages/CrusherProductionPage";
import IncomePage from "./pages/IncomePage";
import ReportsPage from "./pages/ReportsPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!active) return;

      if (user) {
        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (!active) return;

        if (!error && ["admin", "staff"].includes(roleData?.role)) {
          setCurrentUser(user);
          setUserRole(roleData.role);
        } else {
          await supabase.auth.signOut();
        }
      }

      if (active) setCheckingAuth(false);
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  function handleLogin({ user, role }) {
    setCurrentUser(user);
    setUserRole(role);
    setActivePage("dashboard");
  }
  async function handleLogout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    alert("Logout failed: " + error.message);
    return;
  }

  setCurrentUser(null);
  setUserRole(null);
  setActivePage("dashboard");
}

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Checking session...
      </div>
    );
  }

  if (!currentUser || !userRole) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 h-screen bg-slate-950 text-white p-5 overflow-y-auto sticky top-0">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-amber-400">CEC</h1>
          <p className="text-sm text-slate-400">Costing Management</p>
        </div>

        <nav className="space-y-2">
          <MenuItem
            icon={<LayoutDashboard size={19} />}
            text="Dashboard"
            active={activePage === "dashboard"}
            onClick={() => setActivePage("dashboard")}
          />

          <MenuItem
            icon={<CalendarCheck size={19} />}
            text="Attendance"
            active={activePage === "attendance"}
            onClick={() => setActivePage("attendance")}
          />

       <MenuItem
  icon={<Tractor size={19} />}
  text="Machinery"
  active={activePage === "machinery"}
  onClick={() => setActivePage("machinery")}
/>
          <MenuItem
  icon={<Fuel size={19} />}
  text="Fuel"
  active={activePage === "fuel"}
  onClick={() => setActivePage("fuel")}
/>
         <MenuItem
  icon={<Package size={19} />}
  text="Quarry Materials"
  active={activePage === "quarry-materials"}
  onClick={() => setActivePage("quarry-materials")}
/>

<MenuItem
  icon={<Package size={19} />}
  text="Crusher Materials"
  active={activePage === "crusher-materials"}
  onClick={() => setActivePage("crusher-materials")}
/>

<MenuItem
  icon={<WalletCards size={19} />}
  text="Petty Cash Used"
  active={activePage === "petty-cash"}
  onClick={() => setActivePage("petty-cash")}
/>

<MenuItem
  icon={<WalletCards size={19} />}
  text="Other Expenses"
  active={activePage === "other-expenses"}
  onClick={() => setActivePage("other-expenses")}
/>

<MenuItem
  icon={<Factory size={19} />}
  text="Production at Quarry"
  active={activePage === "quarry-production"}
  onClick={() => setActivePage("quarry-production")}
/>

<MenuItem
  icon={<Factory size={19} />}
  text="Production at Crusher"
  active={activePage === "crusher-production"}
  onClick={() => setActivePage("crusher-production")}
/>

<MenuItem
  icon={<TrendingUp size={19} />}
  text="Income"
  active={activePage === "income"}
  onClick={() => setActivePage("income")}
/>

<MenuItem
  icon={<FileBarChart size={19} />}
  text="Reports"
  active={activePage === "reports"}
  onClick={() => setActivePage("reports")}
/>

{/* Admin Settings Menu */}
{userRole === "admin" && (
  <MenuItem
    icon={<Settings size={19} />}
    text="Settings"
    active={activePage === "settings"}
    onClick={() => setActivePage("settings")}
  />
)}


        </nav>
        <div className="mt-8 pt-5 border-t border-slate-700">
  <div className="mb-4 text-sm text-slate-300">
    <p className="font-semibold text-white">
      {userRole === "admin" ? "Administrator" : "Staff"}
    </p>
    <p className="text-xs break-all">{currentUser.email}</p>
  </div>




  <button
    onClick={handleLogout}
    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl"
  >
    Logout
  </button>
</div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {activePage === "dashboard" && <DashboardPage />}
        {activePage === "attendance" && (
  <AttendancePage userRole={userRole} />
)}
      {activePage === "machinery" && (
  <MachineryPage userRole={userRole} />
)}
       {activePage === "fuel" && <FuelPage userRole={userRole} />}
       {activePage === "quarry-materials" && <QuarryMaterialsPage userRole={userRole} />}
      {activePage === "crusher-materials" && <CrusherMaterialsPage userRole={userRole} />}
      {activePage === "petty-cash" && <PettyCashPage userRole={userRole} />}
      {activePage === "other-expenses" &&<OtherExpensesPage userRole={userRole} />}
      {activePage === "quarry-production" && <QuarryProductionPage userRole={userRole} />}
      {activePage === "crusher-production" && <CrusherProductionPage userRole={userRole} />}
     {activePage === "income" && <IncomePage />}
     {activePage === "reports" && <ReportsPage />}
     {activePage === "settings" && userRole === "admin" && (
  <SettingsPage userRole={userRole} />
)}
     
      </main>
    </div>
  );
}

/* =========================================================
   DASHBOARD PAGE
========================================================= */
function DashboardPage() {
  const today = new Date().toLocaleDateString("en-CA");

  const currentMonth = today.slice(0, 7);

  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const [todayData, setTodayData] = useState({
    income: 0,
    expenses: 0,
    profit: 0,
  });

  const [monthlyData, setMonthlyData] = useState({
    income: 0,
    expenses: 0,
    profit: 0,
    labour: 0,
    machinery: 0,
    fuel: 0,
    quarryMaterials: 0,
    crusherMaterials: 0,
    pettyCash: 0,
    otherExpenses: 0,
  });

  // =========================================================
  // HELPER - SUM FIELD
  // =========================================================
  function sumField(rows, field) {
    return (rows || []).reduce(
      (total, row) => total + Number(row[field] || 0),
      0
    );
  }

  // =========================================================
  // LOAD DASHBOARD DATA
  // =========================================================
  useEffect(() => {
    async function loadDashboard() {
      setLoadingDashboard(true);

      const monthStart = `${currentMonth}-01`;

      const date = new Date(
        Number(currentMonth.slice(0, 4)),
        Number(currentMonth.slice(5, 7)),
        0
      );

      const monthEnd = `${currentMonth}-${String(
        date.getDate()
      ).padStart(2, "0")}`;

      try {
        // =====================================================
        // TODAY DATA
        // =====================================================

        const [
          todayQuarryProduction,
          todayCrusherProduction,
          todayAttendance,
          todayMachinery,
          todayFuel,
          todayQuarryMaterials,
          todayCrusherMaterials,
          todayPettyCash,
          todayOtherExpenses,
        ] = await Promise.all([
          supabase
            .from("quarry_production")
            .select("total_value")
            .eq("production_date", today),

          supabase
            .from("crusher_production")
            .select("total_value")
            .eq("production_date", today),

          supabase
            .from("attendance")
            .select(`
              present,
              employees (
                day_rate
              )
            `)
            .eq("attendance_date", today),

          supabase
            .from("machinery_usage")
            .select("total_cost")
            .eq("usage_date", today),

          supabase
            .from("fuel_usage")
            .select("total_cost")
            .eq("fuel_date", today),

          supabase
            .from("quarry_material_usage")
            .select("total_cost")
            .eq("usage_date", today),

          supabase
            .from("crusher_material_usage")
            .select("total_cost")
            .eq("usage_date", today),

          supabase
            .from("petty_cash")
            .select("amount")
            .eq("expense_date", today),

          supabase
            .from("other_expenses")
            .select("amount")
            .eq("expense_date", today),
        ]);

        const todayQuarryIncome = sumField(
          todayQuarryProduction.data,
          "total_value"
        );

        const todayCrusherIncome = sumField(
          todayCrusherProduction.data,
          "total_value"
        );

        const todayIncome =
          todayQuarryIncome + todayCrusherIncome;

        const todayLabour = (
          todayAttendance.data || []
        ).reduce((total, record) => {
          if (!record.present) {
            return total;
          }

          return (
            total +
            Number(record.employees?.day_rate || 0)
          );
        }, 0);

        const todayMachineryCost = sumField(
          todayMachinery.data,
          "total_cost"
        );

        const todayFuelCost = sumField(
          todayFuel.data,
          "total_cost"
        );

        const todayQuarryMaterialCost = sumField(
          todayQuarryMaterials.data,
          "total_cost"
        );

        const todayCrusherMaterialCost = sumField(
          todayCrusherMaterials.data,
          "total_cost"
        );

        const todayPettyCashCost = sumField(
          todayPettyCash.data,
          "amount"
        );

        const todayOtherExpenseCost = sumField(
          todayOtherExpenses.data,
          "amount"
        );

        const todayExpenses =
          todayLabour +
          todayMachineryCost +
          todayFuelCost +
          todayQuarryMaterialCost +
          todayCrusherMaterialCost +
          todayPettyCashCost +
          todayOtherExpenseCost;

        setTodayData({
          income: todayIncome,
          expenses: todayExpenses,
          profit: todayIncome - todayExpenses,
        });

        // =====================================================
        // MONTHLY DATA
        // =====================================================

        const [
          monthQuarryProduction,
          monthCrusherProduction,
          monthAttendance,
          monthMachinery,
          monthFuel,
          monthQuarryMaterials,
          monthCrusherMaterials,
          monthPettyCash,
          monthOtherExpenses,
        ] = await Promise.all([
          supabase
            .from("quarry_production")
            .select("total_value")
            .gte("production_date", monthStart)
            .lte("production_date", monthEnd),

          supabase
            .from("crusher_production")
            .select("total_value")
            .gte("production_date", monthStart)
            .lte("production_date", monthEnd),

          supabase
            .from("attendance")
            .select(`
              present,
              employees (
                day_rate
              )
            `)
            .gte("attendance_date", monthStart)
            .lte("attendance_date", monthEnd),

          supabase
            .from("machinery_usage")
            .select("total_cost")
            .gte("usage_date", monthStart)
            .lte("usage_date", monthEnd),

          supabase
            .from("fuel_usage")
            .select("total_cost")
            .gte("fuel_date", monthStart)
            .lte("fuel_date", monthEnd),

          supabase
            .from("quarry_material_usage")
            .select("total_cost")
            .gte("usage_date", monthStart)
            .lte("usage_date", monthEnd),

          supabase
            .from("crusher_material_usage")
            .select("total_cost")
            .gte("usage_date", monthStart)
            .lte("usage_date", monthEnd),

          supabase
            .from("petty_cash")
            .select("amount")
            .gte("expense_date", monthStart)
            .lte("expense_date", monthEnd),

          supabase
            .from("other_expenses")
            .select("amount")
            .gte("expense_date", monthStart)
            .lte("expense_date", monthEnd),
        ]);

        const monthlyIncome =
          sumField(
            monthQuarryProduction.data,
            "total_value"
          ) +
          sumField(
            monthCrusherProduction.data,
            "total_value"
          );

        const monthlyLabour = (
          monthAttendance.data || []
        ).reduce((total, record) => {
          if (!record.present) {
            return total;
          }

          return (
            total +
            Number(record.employees?.day_rate || 0)
          );
        }, 0);

        const monthlyMachinery = sumField(
          monthMachinery.data,
          "total_cost"
        );

        const monthlyFuel = sumField(
          monthFuel.data,
          "total_cost"
        );

        const monthlyQuarryMaterials = sumField(
          monthQuarryMaterials.data,
          "total_cost"
        );

        const monthlyCrusherMaterials = sumField(
          monthCrusherMaterials.data,
          "total_cost"
        );

        const monthlyPettyCash = sumField(
          monthPettyCash.data,
          "amount"
        );

        const monthlyOtherExpenses = sumField(
          monthOtherExpenses.data,
          "amount"
        );

        const monthlyExpenses =
          monthlyLabour +
          monthlyMachinery +
          monthlyFuel +
          monthlyQuarryMaterials +
          monthlyCrusherMaterials +
          monthlyPettyCash +
          monthlyOtherExpenses;

        setMonthlyData({
          income: monthlyIncome,
          expenses: monthlyExpenses,
          profit: monthlyIncome - monthlyExpenses,
          labour: monthlyLabour,
          machinery: monthlyMachinery,
          fuel: monthlyFuel,
          quarryMaterials: monthlyQuarryMaterials,
          crusherMaterials: monthlyCrusherMaterials,
          pettyCash: monthlyPettyCash,
          otherExpenses: monthlyOtherExpenses,
        });
      } catch (error) {
        console.error(
          "Error loading dashboard:",
          error
        );
      }

      setLoadingDashboard(false);
    }

    loadDashboard();
  }, [today, currentMonth]);

  function money(value) {
    return Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <>
      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            Dashboard
          </h2>

          <p className="text-slate-500 mt-1">
            Daily costing, income & profit overview
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-400">
            Today's Date
          </p>

          <p className="font-semibold text-slate-900">
            {today}
          </p>
        </div>
      </div>

      {/* =====================================================
          TODAY CARDS
      ====================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Today's Income"
          amount={
            loadingDashboard
              ? "Loading..."
              : `Rs. ${money(todayData.income)}`
          }
          icon={<TrendingUp />}
        />

        <StatCard
          title="Today's Expenses"
          amount={
            loadingDashboard
              ? "Loading..."
              : `Rs. ${money(todayData.expenses)}`
          }
          icon={<TrendingDown />}
        />

        <StatCard
          title="Today's Profit / Loss"
          amount={
            loadingDashboard
              ? "Loading..."
              : `Rs. ${money(todayData.profit)}`
          }
          icon={<DollarSign />}
        />
      </div>

      {/* =====================================================
          MONTHLY OVERVIEW
      ====================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-lg text-slate-900">
            Monthly Financial Overview
          </h3>

          <p className="text-sm text-slate-500">
            Income and expenses for {currentMonth}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <p className="text-sm text-slate-500">
                Monthly Income
              </p>

              <p className="text-2xl font-bold text-slate-900 mt-2">
                {loadingDashboard
                  ? "Loading..."
                  : `Rs. ${money(monthlyData.income)}`}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <p className="text-sm text-slate-500">
                Monthly Expenses
              </p>

              <p className="text-2xl font-bold text-slate-900 mt-2">
                {loadingDashboard
                  ? "Loading..."
                  : `Rs. ${money(monthlyData.expenses)}`}
              </p>
            </div>

            <div className="bg-slate-900 text-white rounded-xl p-5">
              <p className="text-sm text-slate-300">
                Monthly Profit / Loss
              </p>

              <p className="text-2xl font-bold mt-2">
                {loadingDashboard
                  ? "Loading..."
                  : `Rs. ${money(monthlyData.profit)}`}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500">
                Income
              </span>

              <span className="font-semibold text-slate-900">
                Rs. {money(monthlyData.income)}
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-amber-500 h-3 rounded-full"
                style={{
                  width:
                    monthlyData.income === 0
                      ? "0%"
                      : "100%",
                }}
              />
            </div>

            <div className="flex justify-between text-sm mb-2 mt-5">
              <span className="text-slate-500">
                Expenses
              </span>

              <span className="font-semibold text-slate-900">
                Rs. {money(monthlyData.expenses)}
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-slate-800 h-3 rounded-full"
                style={{
                  width:
                    monthlyData.income === 0 &&
                    monthlyData.expenses === 0
                      ? "0%"
                      : `${Math.min(
                          100,
                          (monthlyData.expenses /
                            Math.max(
                              monthlyData.income,
                              monthlyData.expenses
                            )) *
                            100
                        )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* ===================================================
            EXPENSE BREAKDOWN
        ==================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-lg text-slate-900">
            Expense Breakdown
          </h3>

          <p className="text-sm text-slate-500 mb-4">
            Current month
          </p>

          <Expense
            name="Labour Cost"
            amount={`Rs. ${money(monthlyData.labour)}`}
          />

          <Expense
            name="Machinery"
            amount={`Rs. ${money(monthlyData.machinery)}`}
          />

          <Expense
            name="Fuel"
            amount={`Rs. ${money(monthlyData.fuel)}`}
          />

          <Expense
            name="Quarry Materials"
            amount={`Rs. ${money(
              monthlyData.quarryMaterials
            )}`}
          />

          <Expense
            name="Crusher Materials"
            amount={`Rs. ${money(
              monthlyData.crusherMaterials
            )}`}
          />

          <Expense
            name="Petty Cash"
            amount={`Rs. ${money(monthlyData.pettyCash)}`}
          />

          <Expense
            name="Other Expenses"
            amount={`Rs. ${money(
              monthlyData.otherExpenses
            )}`}
          />

          <div className="flex justify-between pt-4 mt-2">
            <span className="font-bold text-slate-900">
              Total
            </span>

            <span className="font-bold text-slate-900">
              Rs. {money(monthlyData.expenses)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   ATTENDANCE PAGE
========================================================= */

function AttendancePage({ userRole }) {
  const [staffPermissions, setStaffPermissions] = useState({});
const [permissionsLoading, setPermissionsLoading] = useState(true);

useEffect(() => {
  let active = true;

  async function loadStaffPermissions() {
    setPermissionsLoading(true);

    const { data, error } = await supabase
      .from("staff_permissions")
      .select("category, is_enabled")
      .in("category", ["attendance", "master-employees"]);

    if (!active) return;

    if (error) {
      console.error("Error loading staff permissions:", error);
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

  if (userRole === "staff") {
    loadStaffPermissions();
  } else {
    setPermissionsLoading(false);
  }

  return () => {
    active = false;
  };
}, [userRole]);


  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState(null);

  const [newEmployee, setNewEmployee] = useState({
    name: "",
    designation: "",
    employee_type: "Staff",
    day_rate: "",
  });


const [selectedDate, setSelectedDate] = useState(() => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type) =>
    parts.find((part) => part.type === type)?.value || "";

  return `${get("year")}-${get("month")}-${get("day")}`;
});

const todaySriLanka = (() => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type) =>
    parts.find((part) => part.type === type)?.value || "";

  return `${get("year")}-${get("month")}-${get("day")}`;
})();

const canEditAttendance =
  userRole === "admin" ||
  (userRole === "staff" &&
    !permissionsLoading &&
    staffPermissions["attendance"] === true &&
    selectedDate === todaySriLanka);

const canManageEmployees =
  userRole === "admin" ||
  (userRole === "staff" &&
    !permissionsLoading &&
    staffPermissions["master-employees"] === true);

  /* ---------------------------------------------------------
     LOAD ACTIVE EMPLOYEES
  --------------------------------------------------------- */

  useEffect(() => {
    async function loadEmployees() {
      setLoading(true);

      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error loading employees:", error);
        setEmployees([]);
        setLoading(false);
        return;
      }

      setEmployees(data || []);
      setLoading(false);
    }

    loadEmployees();
  }, []);

  /* ---------------------------------------------------------
     LOAD ATTENDANCE FOR SELECTED DATE
  --------------------------------------------------------- */

  useEffect(() => {
    async function loadAttendance() {
      setAttendance({});
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("attendance_date", selectedDate);

      if (error) {
        console.error("Error loading attendance:", error);
        return;
      }

      const attendanceMap = {};

      (data || []).forEach((record) => {
        attendanceMap[record.employee_id] = record.present;
      });

      setAttendance(attendanceMap);
    }

    loadAttendance();
  }, [selectedDate]);

  /* ---------------------------------------------------------
     SAVE ATTENDANCE
  --------------------------------------------------------- */

  async function saveAttendance() {
    if (!canEditAttendance) {
  alert("You do not have permission to modify attendance for this date.");
  return;
}
    if (employees.length === 0) {
      alert("No employees available to save.");
      return;
    }

    setSaving(true);

    const records = employees.map((employee) => ({
      attendance_date: selectedDate,
      employee_id: employee.id,
      present: Boolean(attendance[employee.id]),
    }));

    const { error } = await supabase
      .from("attendance")
      .upsert(records, {
        onConflict: "attendance_date,employee_id",
      });

    setSaving(false);

    if (error) {
      console.error("Error saving attendance:", error);
      alert("Error saving attendance.");
      return;
    }

    alert("Attendance saved successfully!");
  }

  /* ---------------------------------------------------------
     SAVE EMPLOYEE
  --------------------------------------------------------- */

  async function saveEmployee() {
 if (!canManageEmployees) {
    alert("You do not have permission to add employees.");
    return;
  }



    if (!newEmployee.name.trim()) {
      alert("Please enter employee name.");
      return;
    }

    if (!newEmployee.designation.trim()) {
      alert("Please enter designation.");
      return;
    }

    if (
      newEmployee.day_rate === "" ||
      Number(newEmployee.day_rate) < 0
    ) {
      alert("Please enter a valid day rate.");
      return;
    }

    setSavingEmployee(true);

    const { data, error } = await supabase
      .from("employees")
      .insert([
        {
          name: newEmployee.name.trim(),
          designation: newEmployee.designation.trim(),
          employee_type: newEmployee.employee_type,
          day_rate: Number(newEmployee.day_rate),
          is_active: true,
        },
      ])
      .select()
      .single();

    setSavingEmployee(false);

    if (error) {
      console.error("Error saving employee:", error);
      alert("Error saving employee.");
      return;
    }

    setEmployees((currentEmployees) =>
      [...currentEmployees, data].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );

    setNewEmployee({
      name: "",
      designation: "",
      employee_type: "Staff",
      day_rate: "",
    });

    setShowEmployeeForm(false);

    alert("Employee added successfully!");
  }

  /* ---------------------------------------------------------
     REMOVE EMPLOYEE
     We do not permanently delete the employee.
     is_active becomes false so historical data is preserved.
  --------------------------------------------------------- */

  async function deleteEmployee(employee) {

    
if (!canManageEmployees) {
  alert("You do not have permission to remove employees.");
  return;
}

    const confirmed = window.confirm(
      `Are you sure you want to remove ${employee.name}?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingEmployeeId(employee.id);

    const { error } = await supabase
      .from("employees")
      .update({ is_active: false })
      .eq("id", employee.id);

    setDeletingEmployeeId(null);

    if (error) {
      console.error("Error removing employee:", error);
      alert("Error removing employee.");
      return;
    }

    setEmployees((currentEmployees) =>
      currentEmployees.filter(
        (currentEmployee) => currentEmployee.id !== employee.id
      )
    );

    setAttendance((currentAttendance) => {
      const updatedAttendance = { ...currentAttendance };
      delete updatedAttendance[employee.id];
      return updatedAttendance;
    });

    alert("Employee removed successfully!");
  }

  /* ---------------------------------------------------------
     LABOUR COST
  --------------------------------------------------------- */

  const labourCost = employees.reduce((total, employee) => {
    if (attendance[employee.id]) {
      return total + Number(employee.day_rate || 0);
    }

    return total;
  }, 0);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            Attendance
          </h2>

          <p className="text-slate-500 mt-1">
            Manage daily employee attendance and labour costs
          </p>
        </div>

       {canManageEmployees && (
  <button
    onClick={() => setShowEmployeeForm(true)}
    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-semibold"
  >
    <Plus size={19} />
    Add Employee
  </button>
)}
      </div>

      {/* Add Employee Form */}
      {showEmployeeForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Add New Employee
              </h3>

              <p className="text-sm text-slate-500">
                Enter the employee details below
              </p>
            </div>

            <button
              onClick={() => setShowEmployeeForm(false)}
              className="text-slate-500 hover:text-slate-900 font-medium"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Employee Name
              </label>

              <input
                type="text"
                value={newEmployee.name}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    name: e.target.value,
                  })
                }
                placeholder="Enter name"
                className="w-full border border-slate-300 rounded-xl px-4 py-3"
              />
            </div>

            {/* Designation */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Designation
              </label>

              <input
                type="text"
                value={newEmployee.designation}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    designation: e.target.value,
                  })
                }
                placeholder="e.g. Supervisor"
                className="w-full border border-slate-300 rounded-xl px-4 py-3"
              />
            </div>

            {/* Employee Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Employee Type
              </label>

              <select
                value={newEmployee.employee_type}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    employee_type: e.target.value,
                  })
                }
                className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
              >
                <option value="Staff">Staff</option>
                <option value="Driver/Operator">
                  Driver / Operator
                </option>
                <option value="Labour">Labour</option>
                <option value="Security">Security</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Day Rate */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Day Rate (Rs.)
              </label>

              <input
                type="number"
                min="0"
                value={newEmployee.day_rate}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    day_rate: e.target.value,
                  })
                }
                placeholder="0.00"
                className="w-full border border-slate-300 rounded-xl px-4 py-3"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={saveEmployee}
              disabled={savingEmployee}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold px-6 py-3 rounded-xl"
            >
              {savingEmployee ? "Saving..." : "Save Employee"}
            </button>
          </div>
        </div>
      )}

      {/* Daily Attendance Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              Daily Attendance
            </h3>

            <p className="text-sm text-slate-500">
              Select a date to manage employee attendance
            </p>
          </div>

          {/* Date + Save */}
          <div className="flex items-center gap-3">
            <input
              type="date"
              name="attendanceDate"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-300 rounded-xl px-4 py-2 text-slate-700"
            />

            <button
              onClick={saveAttendance}
              disabled={saving || loading || !canEditAttendance}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold px-5 py-2 rounded-xl"
            >
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>

        {/* Employee Table */}
        <div className="overflow-hidden border border-slate-200 rounded-xl">
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600">
            <div>Employee</div>
            <div>Designation</div>
            <div>Type</div>
            <div>Day Rate</div>
            <div className="text-center">Present</div>
            <div className="text-center">Actions</div>
          </div>

          {/* Employee Rows */}
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              Loading employees...
            </div>
          ) : employees.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No active employees found.
            </div>
          ) : (
            employees.map((employee) => (
              <div
                key={employee.id}
                className="grid grid-cols-6 gap-4 items-center px-5 py-4 border-t border-slate-100"
              >
                {/* Name */}
                <div className="font-semibold text-slate-900">
                  {employee.name}
                </div>

                {/* Designation */}
                <div className="text-slate-600">
                  {employee.designation || "-"}
                </div>

                {/* Type */}
                <div className="text-slate-600">
                  {employee.employee_type || "-"}
                </div>

                {/* Day Rate */}
                <div className="font-semibold text-slate-700">
                  Rs.{" "}
                  {Number(
                    employee.day_rate || 0
                  ).toLocaleString()}
                </div>

                {/* Present */}
                <div className="flex justify-center">
                 <input
  type="checkbox"
  name={`attendance-${employee.id}`}
  checked={Boolean(attendance[employee.id])}
  disabled={!canEditAttendance}
  onChange={(e) => {
    setAttendance((currentAttendance) => ({
      ...currentAttendance,
      [employee.id]: e.target.checked,
    }));
  }}
  className="w-5 h-5 accent-amber-500 cursor-pointer disabled:cursor-not-allowed"
/>
                </div>

                {/* Actions */}
                <div className="flex justify-center">
                  <button
                    onClick={() => deleteEmployee(employee)}
                    disabled={
  !canManageEmployees ||
  deletingEmployeeId === employee.id
}
                    className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingEmployeeId === employee.id
                      ? "Removing..."
                      : "Remove"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Labour Cost */}
        {!loading && employees.length > 0 && (
          <div className="flex justify-end mt-6">
            <div className="bg-slate-100 rounded-xl px-6 py-4">
              <p className="text-sm text-slate-500">
                Labour Cost for Selected Date
              </p>

              <p className="text-2xl font-bold text-slate-900 mt-1">
                Rs. {labourCost.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function MachineryPage({ userRole }) {
  
const [machineryPermissions, setMachineryPermissions] = useState({});
const [machineryPermissionsLoading, setMachineryPermissionsLoading] =
  useState(true);

useEffect(() => {
  let active = true;

  async function loadMachineryPermissions() {
    setMachineryPermissionsLoading(true);

    if (userRole !== "staff") {
      setMachineryPermissionsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("staff_permissions")
      .select("category, is_enabled")
      .in("category", ["machinery", "master-machinery"]);

    if (!active) return;

    if (error) {
      console.error("Error loading machinery permissions:", error);
      setMachineryPermissions({});
    } else {
      const permissionMap = {};

      (data || []).forEach((item) => {
        permissionMap[item.category] = item.is_enabled;
      });

      setMachineryPermissions(permissionMap);
    }

    setMachineryPermissionsLoading(false);
  }

  loadMachineryPermissions();

  return () => {
    active = false;
  };
}, [userRole]);

  const [showMachineForm, setShowMachineForm] = useState(false);
  const [savingMachine, setSavingMachine] = useState(false);
  const [savingUsage, setSavingUsage] = useState(false);
  const [deletingUsageId, setDeletingUsageId] = useState(null);
  const [machines, setMachines] = useState([]);
  const [usageEntries, setUsageEntries] = useState([]);

 
const [selectedDate, setSelectedDate] = useState(() => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type) =>
    parts.find((part) => part.type === type)?.value || "";

  return `${get("year")}-${get("month")}-${get("day")}`;
});

const todaySriLanka = (() => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type) =>
    parts.find((part) => part.type === type)?.value || "";

  return `${get("year")}-${get("month")}-${get("day")}`;
})();

const canEditMachinery =
  userRole === "admin" ||
  (userRole === "staff" &&
    !machineryPermissionsLoading &&
    machineryPermissions["machinery"] === true &&
    selectedDate === todaySriLanka);

const canManageMachinery =
  userRole === "admin" ||
  (userRole === "staff" &&
    !machineryPermissionsLoading &&
    machineryPermissions["master-machinery"] === true);


  const [newMachine, setNewMachine] = useState({
    machine_name: "",
    usage_type: "Hours",
    rate: "",
  });

  const [usageForm, setUsageForm] = useState({
    machinery_id: "",
    usage_amount: "",
    rate: "",
    notes: "",
  });

  const selectedMachine = machines.find(
    (machine) =>
      String(machine.id) === String(usageForm.machinery_id)
  );
const totalMachineryCost =
  Number(usageForm.usage_amount || 0) *
  Number(usageForm.rate || 0);
  const dailyMachineryCost = usageEntries.reduce(
  (total, entry) => total + Number(entry.total_cost || 0),
  0
);
  // =========================================================
  // LOAD MACHINES
  // =========================================================
  useEffect(() => {
    async function loadMachines() {
      const { data, error } = await supabase
        .from("machinery")
        .select("*")
        .eq("is_active", true)
        .order("machine_name", { ascending: true });

      if (error) {
        console.error("Error loading machines:", error);
        return;
      }

      setMachines(data || []);
    }

    loadMachines();
  }, []);
useEffect(() => {
  async function loadUsageEntries() {
    const { data, error } = await supabase
      .from("machinery_usage")
      .select("*")
      .eq("usage_date", selectedDate)
      .order("id", { ascending: false });

    if (error) {
      console.error("Error loading machinery usage:", error);
      setUsageEntries([]);
      return;
    }

    setUsageEntries(data || []);
  }

  loadUsageEntries();
}, [selectedDate]);
  // =========================================================
  // SAVE MACHINE
  // =========================================================
  async function saveMachine() {

if (!canManageMachinery) {
  alert("You do not have permission to add machines.");
  return;
}



    
    if (!newMachine.machine_name.trim()) {
      alert("Please enter machine name.");
      return;
    }

    if (newMachine.rate === "" || Number(newMachine.rate) < 0) {
      alert("Please enter a valid default rate.");
      return;
    }

    setSavingMachine(true);

    const { data, error } = await supabase
      .from("machinery")
      .insert([
        {
          machine_name: newMachine.machine_name.trim(),
          usage_type: newMachine.usage_type,
          rate: Number(newMachine.rate),
          is_active: true,
        },
      ])
      .select()
      .single();

    setSavingMachine(false);

    if (error) {
      console.error("Error saving machine:", error);
      alert("Error saving machine.");
      return;
    }

    setMachines((currentMachines) =>
      [...currentMachines, data].sort((a, b) =>
        a.machine_name.localeCompare(b.machine_name)
      )
    );

    alert("Machine added successfully!");

    setNewMachine({
      machine_name: "",
      usage_type: "Hours",
      rate: "",
    });

    setShowMachineForm(false);
  }

  // =========================================================
  // MACHINE SELECTION
  // =========================================================
  function handleMachineSelection(machineId) {
    const machine = machines.find(
      (item) => String(item.id) === String(machineId)
    );

    setUsageForm({
      ...usageForm,
      machinery_id: machineId,
      rate: machine ? String(machine.rate ?? 0) : "",
    });
  }
async function saveUsageEntry() {

if (!canEditMachinery) {
  alert("You do not have permission to save machinery usage for this date.");
  return;
}




  if (!usageForm.machinery_id) {
    alert("Please select a machine.");
    return;
  }

  if (
    usageForm.usage_amount === "" ||
    Number(usageForm.usage_amount) <= 0
  ) {
    alert("Please enter valid Hours / KM.");
    return;
  }

  if (usageForm.rate === "" || Number(usageForm.rate) < 0) {
    alert("Please enter a valid rate.");
    return;
  }

  const totalCost =
    Number(usageForm.usage_amount) *
    Number(usageForm.rate);

  setSavingUsage(true);

 const { data, error } = await supabase
  .from("machinery_usage")
  .insert([
    {
      usage_date: selectedDate,
      machinery_id: Number(usageForm.machinery_id),
      usage_amount: Number(usageForm.usage_amount),
      rate: Number(usageForm.rate),
      total_cost: totalCost,
      notes: usageForm.notes.trim() || null,
    },
  ])
  .select()
  .single();

  setSavingUsage(false);

  if (error) {
    console.error("Error saving machinery usage:", error);
    alert("Error saving machinery usage.");
    return;
  }
setUsageEntries((currentEntries) => [data, ...currentEntries]);
  alert("Machinery usage saved successfully!");

  setUsageForm({
    machinery_id: "",
    usage_amount: "",
    rate: "",
    notes: "",
  });
}

async function deleteUsageEntry(entryId) {
  if (!canEditMachinery) {
  alert("You do not have permission to delete machinery usage for this date.");
  return;
}
  const confirmed = window.confirm(
    "Are you sure you want to delete this machinery usage entry?"
  );

  if (!confirmed) {
    return;
  }

  setDeletingUsageId(entryId);

  const { error } = await supabase
    .from("machinery_usage")
    .delete()
    .eq("id", entryId);

  setDeletingUsageId(null);

  if (error) {
    console.error("Error deleting machinery usage:", error);
    alert("Error deleting machinery usage.");
    return;
  }

  setUsageEntries((currentEntries) =>
    currentEntries.filter((entry) => entry.id !== entryId)
  );

  alert("Machinery usage deleted successfully!");
}

return (
  <>
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            Machinery
          </h2>

          <p className="text-slate-500 mt-1">
            Manage machines and daily machinery costs
          </p>

          {/* DATE */}
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

        {/* ADD MACHINE BUTTON */}
      
{canManageMachinery && (
  <button
    onClick={() => setShowMachineForm(true)}
    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-semibold"
  >
    <Plus size={19} />
    Add Machine
  </button>
)}

      </div>

      {/* =====================================================
          ADD NEW MACHINE FORM
      ====================================================== */}
      {showMachineForm && canManageMachinery && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mt-6">
          <h3 className="text-lg font-bold text-slate-900 mb-5">
            Add New Machine
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* MACHINE NAME */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Machine Name
              </label>

              <input
                type="text"
                value={newMachine.machine_name}
                onChange={(e) =>
                  setNewMachine({
                    ...newMachine,
                    machine_name: e.target.value,
                  })
                }
                placeholder="Enter machine name"
                className="w-full border border-slate-300 rounded-xl px-4 py-3"
              />
            </div>

            {/* USAGE TYPE */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Usage Type
              </label>

              <select
                value={newMachine.usage_type}
                onChange={(e) =>
                  setNewMachine({
                    ...newMachine,
                    usage_type: e.target.value,
                  })
                }
                className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
              >
                <option value="Hours">Hours</option>
                <option value="KM">KM</option>
              </select>
            </div>

            {/* DEFAULT RATE */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Default Rate (Rs.)
              </label>

              <input
                type="number"
                min="0"
                value={newMachine.rate}
                onChange={(e) =>
                  setNewMachine({
                    ...newMachine,
                    rate: e.target.value,
                  })
                }
                placeholder="0.00"
                className="w-full border border-slate-300 rounded-xl px-4 py-3"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowMachineForm(false)}
              className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold"
            >
              Cancel
            </button>

            <button
              onClick={saveMachine}
              disabled={savingMachine}
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingMachine ? "Saving..." : "Save Machine"}
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          DAILY MACHINERY USAGE
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mt-6">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-slate-900">
            Daily Machinery Usage
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Add machinery usage for the selected date
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MACHINE */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Machine
            </label>

            <select
              value={usageForm.machinery_id}
              onChange={(e) =>
                handleMachineSelection(e.target.value)
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

          {/* HOURS / KM */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {selectedMachine?.usage_type || "Hours / KM"}
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={usageForm.usage_amount}
              onChange={(e) =>
                setUsageForm({
                  ...usageForm,
                  usage_amount: e.target.value,
                })
              }
              placeholder={
                selectedMachine
                  ? `Enter ${selectedMachine.usage_type}`
                  : "Select a machine first"
              }
              disabled={!selectedMachine}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>
          {/* RATE */}
<div>
  <label className="block text-sm font-medium text-slate-700 mb-2">
    Rate (Rs.)
  </label>

  <input
    type="number"
    min="0"
    step="0.01"
    value={usageForm.rate}
    onChange={(e) =>
      setUsageForm({
        ...usageForm,
        rate: e.target.value,
      })
    }
    placeholder="0.00"
    className="w-full border border-slate-300 rounded-xl px-4 py-3"
  />
</div>

{/* TOTAL COST */}
<div>
  <label className="block text-sm font-medium text-slate-700 mb-2">
    Total Cost (Rs.)
  </label>

  <input
    type="text"
    value={`Rs. ${totalMachineryCost.toLocaleString()}`}
    readOnly
    className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-slate-100 font-semibold text-slate-900"
  />
</div>
<div className="flex justify-end mt-6">
  <button
    onClick={saveUsageEntry}
    disabled={savingUsage || !canEditMachinery}
    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {savingUsage ? "Saving..." : "Save Entry"}
  </button>
</div>


        </div>
      </div>
{/* SAVED MACHINERY USAGE */}
<div className="bg-white rounded-2xl border border-slate-200 p-6 mt-6">
  <div className="mb-5">
    <h3 className="text-lg font-bold text-slate-900">
      Machinery Usage - {selectedDate}
    </h3>

    <p className="text-sm text-slate-500 mt-1">
      Saved machinery usage for the selected date
    </p>
  </div>

  {usageEntries.length === 0 ? (
    <div className="text-center py-8 text-slate-400">
      No machinery usage recorded for this date.
    </div>
  ) : (
    <div className="overflow-x-auto border border-slate-200 rounded-xl">
      <div className="min-w-[700px]">
        <div className="grid grid-cols-5 gap-4 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600">
  <div>Machine</div>
  <div>Usage</div>
  <div>Rate</div>
  <div>Total Cost</div>
  <div>Action</div>
</div>

        {usageEntries.map((entry) => {
          const machine = machines.find(
            (item) => String(item.id) === String(entry.machinery_id)
          );

          return (
            <div
              key={entry.id}
              className="grid grid-cols-4 gap-4 px-5 py-4 border-t border-slate-100"
            >
              <div className="font-semibold text-slate-900">
                {machine?.machine_name || "Unknown Machine"}
              </div>

              <div className="text-slate-600">
                {Number(entry.usage_amount).toLocaleString()}{" "}
                {machine?.usage_type || ""}
              </div>

              <div className="text-slate-600">
                Rs. {Number(entry.rate || 0).toLocaleString()}
              </div>

              <div className="font-semibold text-slate-900">
                Rs. {Number(entry.total_cost || 0).toLocaleString()}
              </div>
<div>
  <button
    onClick={() => deleteUsageEntry(entry.id)}
  disabled={!canEditMachinery || deletingUsageId === entry.id}
    className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {deletingUsageId === entry.id ? "Deleting..." : "Delete"}
  </button>
</div>


            </div>
          );
        })}
      </div>
    </div>
  )}
  <div className="flex justify-end mt-6">
  <div className="bg-slate-900 text-white rounded-xl px-6 py-4">
    <p className="text-sm text-slate-300">
      Total Machinery Cost
    </p>

    <p className="text-2xl font-bold mt-1">
      Rs. {dailyMachineryCost.toLocaleString()}
    </p>
  </div>
</div>
</div>
      {/* =====================================================
          ACTIVE MACHINES
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mt-6">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-slate-900">
            Active Machines
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Machines available for daily usage
          </p>
        </div>

        {machines.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No active machines found.
          </div>
        ) : (
          <div className="overflow-hidden border border-slate-200 rounded-xl">
            <div className="grid grid-cols-3 gap-4 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600">
              <div>Machine</div>
              <div>Usage Type</div>
              <div>Default Rate</div>
            </div>

            {machines.map((machine) => (
              <div
                key={machine.id}
                className="grid grid-cols-3 gap-4 px-5 py-4 border-t border-slate-100"
              >
                <div className="font-semibold text-slate-900">
                  {machine.machine_name}
                </div>

                <div className="text-slate-600">
                  {machine.usage_type}
                </div>

                <div className="text-slate-700">
                  Rs. {Number(machine.rate || 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
/* =========================================================
   SIDEBAR MENU ITEM
========================================================= */

function MenuItem({ icon, text, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${
        active
          ? "bg-amber-500 text-slate-950 font-semibold"
          : "text-slate-300 hover:bg-slate-800"
      }`}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}

/* =========================================================
   DASHBOARD STAT CARD
========================================================= */

function StatCard({ title, amount, icon }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="text-2xl font-bold text-slate-900 mt-3">
            {amount}
          </h3>
        </div>

        <div className="bg-amber-100 text-amber-600 p-3 rounded-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   EXPENSE ITEM
========================================================= */

function Expense({ name, amount }) {
  return (
    <div className="flex justify-between py-3 border-b border-slate-100">
      <span className="text-slate-600">{name}</span>

      <span className="font-semibold text-slate-900">
        {amount}
      </span>
    </div>
  );
}

export default App;