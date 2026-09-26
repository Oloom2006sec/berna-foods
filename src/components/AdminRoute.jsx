import { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { supabase } from "../lib/supabase";

export default function AdminRoute() {
  const [loading, setLoading] =
    useState(true);

  const [session, setSession] =
    useState(null);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const {
          data,
          error,
        } =
          await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error(
            "Admin session error:",
            error
          );

          setSession(null);
        } else {
          setSession(
            data?.session || null
          );
        }
      } catch (error) {
        console.error(
          "Admin authentication error:",
          error
        );

        if (mounted) {
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkSession();

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        (_event, currentSession) => {
          if (!mounted) return;

          setSession(
            currentSession || null
          );

          setLoading(false);
        }
      );

    return () => {
      mounted = false;

      listener?.subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <main
        className="admin-orders-page"
        dir="rtl"
      >
        <div className="container">

          <div className="admin-empty">

            <div>
              ⏳
            </div>

            <h2>
              جاري التحقق من الدخول...
            </h2>

            <p>
              برجاء الانتظار لحظات.
            </p>

          </div>

        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  return <Outlet />;
}