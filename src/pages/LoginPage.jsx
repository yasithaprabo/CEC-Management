
import { useState } from "react";
import { supabase } from "../lib/supabase";
import {
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setErrorMessage("");

    try {
      // 1. Authenticate user
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError) throw authError;

      const user = authData.user;

      if (!user) {
        throw new Error("Unable to identify the user.");
      }

      // 2. Load role from database
      const { data: roleData, error: roleError } =
        await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

      if (roleError || !roleData) {
        throw new Error(
          "No role assigned to this account. Contact the administrator."
        );
      }

      if (!["admin", "staff"].includes(roleData.role)) {
        throw new Error("Invalid account role.");
      }

      // 3. Notify parent App component
      if (onLogin) {
        onLogin({
          user,
          role: roleData.role,
        });
      }
    } catch (error) {
      await supabase.auth.signOut();

      setErrorMessage(
        error.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ShieldCheck size={32} className="text-slate-950" />
          </div>

          <h1 className="text-4xl font-extrabold text-amber-400">
            CEC
          </h1>

          <p className="text-slate-400 mt-2">
            Costing Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-900">
              Welcome Back
            </h2>

            <p className="text-slate-500 text-sm mt-2">
              Sign in to access your dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="absolute left-4 top-3.5 text-slate-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter your email"
                  autoComplete="username"
                  required
                  className="w-full border border-slate-300 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="absolute left-4 top-3.5 text-slate-400"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full border border-slate-300 rounded-xl py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-900"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {errorMessage && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4"
              >
                {errorMessage}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-7">
          CEC Costing Management System
        </p>
      </div>
    </div>
  );
}
