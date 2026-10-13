
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Settings,
  ShieldCheck,
  Database,
  CalendarDays,
  Loader2,
  Save,
} from "lucide-react";

// Daily Transaction Permissions
const dailyCategories = [
  { key: "attendance", label: "Attendance" },
  { key: "machinery", label: "Machinery" },
  { key: "fuel", label: "Fuel" },
  { key: "quarry-materials", label: "Quarry Materials" },
  { key: "crusher-materials", label: "Crusher Materials" },
  { key: "petty-cash", label: "Petty Cash Used" },
  { key: "other-expenses", label: "Other Expenses" },
  { key: "quarry-production", label: "Production at Quarry" },
  { key: "crusher-production", label: "Production at Crusher" },
];

// Master Data Permissions
const masterCategories = [
  { key: "master-employees", label: "Employees Master Data" },
  { key: "master-machinery", label: "Machinery Master Data" },
  {
    key: "master-quarry-materials",
    label: "Quarry Materials Master Data",
  },
  {
    key: "master-crusher-materials",
    label: "Crusher Materials Master Data",
  },
  {
    key: "master-quarry-products",
    label: "Quarry Products Master Data",
  },
  {
    key: "master-crusher-products",
    label: "Crusher Products Master Data",
  },
];

const categories = [...dailyCategories, ...masterCategories];

export default function SettingsPage({ userRole }) {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const isAdmin = userRole === "admin";

  useEffect(() => {
    if (isAdmin) {
      loadPermissions();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  async function loadPermissions() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("staff_permissions")
      .select("category, is_enabled");

    if (error) {
      setMessage("Error loading permissions: " + error.message);
      setMessageType("error");
    } else {
      const permissionMap = {};

      (data || []).forEach((item) => {
        permissionMap[item.category] = item.is_enabled;
      });

      setPermissions(permissionMap);
    }

    setLoading(false);
  }

  function togglePermission(category) {
    if (!isAdmin || saving || loading) return;

    setPermissions((previous) => ({
      ...previous,
      [category]: !previous[category],
    }));

    setMessage("");
  }

  async function savePermissions() {
    if (!isAdmin || saving || loading) return;

    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      for (const category of categories) {
        const { data, error } = await supabase
          .from("staff_permissions")
          .update({
            is_enabled: permissions[category.key] === true,
            updated_at: new Date().toISOString(),
          })
          .eq("category", category.key)
          .select("category");

        if (error) throw error;

        if (!data || data.length !== 1) {
          throw new Error(
            "Permission update was not allowed for " +
              category.label
          );
        }
      }

      setMessage("All staff permissions saved successfully!");
      setMessageType("success");
    } catch (error) {
      setMessage("Error saving permissions: " + error.message);
      setMessageType("error");

      await loadPermissions();
    } finally {
      setSaving(false);
    }
  }

  function renderPermissionRow(category, type) {
    const enabled = permissions[category.key] === true;

    return (
      <div
        key={category.key}
        className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100 last:border-b-0"
      >
        <div>
          <p className="font-semibold text-slate-800">
            {category.label}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            {enabled
              ? type === "daily"
                ? "Staff can modify today's records"
                : "Staff can add, edit and remove master data"
              : "Staff can view only"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold ${
              enabled ? "text-green-600" : "text-slate-400"
            }`}
          >
            {enabled ? "ON" : "OFF"}
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={`Allow Staff to modify ${category.label}`}
            onClick={() => togglePermission(category.key)}
            disabled={saving || loading}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              enabled ? "bg-green-500" : "bg-slate-300"
            } ${
              saving || loading
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
          Access denied. Only administrators can manage settings.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-amber-100 p-3 rounded-xl">
          <Settings className="text-amber-700" size={26} />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Admin Settings
          </h1>

          <p className="text-sm text-slate-500">
            Manage permissions for all Staff users
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 flex items-center justify-center gap-3 text-slate-500">
          <Loader2 className="animate-spin" size={22} />
          Loading permissions...
        </div>
      ) : (
        <>
          {/* Daily Transaction Permissions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start gap-3">
              <CalendarDays
                className="text-amber-600 mt-1"
                size={24}
              />

              <div>
                <h2 className="font-bold text-lg text-slate-900">
                  Daily Transaction Permissions
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Staff can modify only today's records when
                  permission is enabled. Admin can modify
                  records from any date.
                </p>
              </div>
            </div>

            <div>
              {dailyCategories.map((category) =>
                renderPermissionRow(category, "daily")
              )}
            </div>
          </div>

          {/* Master Data Permissions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start gap-3">
              <Database
                className="text-blue-600 mt-1"
                size={24}
              />

              <div>
                <h2 className="font-bold text-lg text-slate-900">
                  Master Data Permissions
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Allow Staff to add, edit or remove master
                  data. When disabled, Staff can only view
                  master data.
                </p>
              </div>
            </div>

            <div>
              {masterCategories.map((category) =>
                renderPermissionRow(category, "master")
              )}
            </div>
          </div>

          {/* Save Permissions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start gap-3 mb-5">
              <ShieldCheck
                className="text-green-600"
                size={23}
              />

              <div>
                <h3 className="font-bold text-slate-900">
                  Save Staff Permissions
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  These permissions apply to all Staff
                  accounts. Click Save Permissions to apply
                  your changes.
                </p>
              </div>
            </div>

            {message && (
              <div
                role="status"
                className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                  messageType === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="button"
              onClick={savePermissions}
              disabled={loading || saving}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save size={18} />
              )}

              {saving ? "Saving..." : "Save Permissions"}
            </button>
          </div>

          {/* Information */}
          <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>Permission Rules:</strong>
            </p>

            <p className="text-sm text-blue-700 mt-2">
              Admin users have full access to daily records
              and master data.
            </p>

            <p className="text-sm text-blue-700 mt-2">
              Staff users can modify today's daily records
              only when the relevant daily permission is ON.
            </p>

            <p className="text-sm text-blue-700 mt-2">
              Staff users can modify master data only when
              the relevant master permission is ON.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
