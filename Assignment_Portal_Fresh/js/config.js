
window.SUPABASE_URL = "https://dzrtnavuinjudpqhyuho.supabase.co";

window.SUPABASE_ANON_KEY = "sb_publishable_N4dPq2c-gNR9K9YvTgGMwQ_FttjxvuY";

// Admin username login ke liye email mapping
window.ADMIN_AUTH_EMAIL = "naveenthawani00@gmail.com";


window.getSupabase = function () {
  if (!window.supabase) {
    throw new Error("Supabase library not loaded");
  }

  if (!window._supabaseClient) {
    const isAdmin = window.location.pathname
      .toLowerCase()
      .endsWith("/admin.html");

    window._supabaseClient = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY,
      {
        auth: {
          storageKey: isAdmin
            ? "assignment-admin-auth"
            : "assignment-student-auth",
          persistSession: isAdmin,
          autoRefreshToken: isAdmin,
          detectSessionInUrl: false
        }
      }
    );
  }

  return window._supabaseClient;
};
