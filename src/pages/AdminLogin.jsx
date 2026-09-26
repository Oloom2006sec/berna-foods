import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const {
        data,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        throw loginError;
      }

      if (!data?.user) {
        throw new Error(
          "تعذر تسجيل الدخول."
        );
      }

      /*
        لم نعد نستخدم:
        localStorage.setItem(
          "berna-admin-auth",
          "true"
        )

        Supabase Auth هو المسؤول
        عن جلسة تسجيل الدخول.
      */

      navigate("/admin", {
        replace: true,
      });

    } catch (error) {
      console.error(
        "Admin login error:",
        error
      );

      setError(
        "البريد الإلكتروني أو كلمة المرور غير صحيحة."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="admin-login-page"
      dir="rtl"
    >
      <div className="admin-login-card">

        <div className="admin-login-logo">
          🍯
        </div>

        <span className="eyebrow">
          BERNA FOODS
        </span>

        <h1>
          تسجيل دخول الإدارة
        </h1>

        <p>
          قم بتسجيل الدخول للوصول إلى لوحة التحكم.
        </p>

        <form
          className="admin-login-form"
          onSubmit={handleSubmit}
        >

          <div className="form-field">

            <label>
              البريد الإلكتروني
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="admin@bernafoods.com"
              autoComplete="username"
              required
            />

          </div>

          <div className="form-field">

            <label>
              كلمة المرور
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="كلمة المرور"
              autoComplete="current-password"
              required
            />

          </div>

          {error && (
            <div className="admin-login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-login-btn"
            disabled={loading}
          >
            {loading
              ? "جاري تسجيل الدخول..."
              : "🔐 تسجيل الدخول"}
          </button>

        </form>

        <div className="admin-login-note">
          دخول الإدارة محمي بواسطة Supabase.
        </div>

      </div>
    </main>
  );
}