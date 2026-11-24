# Assignment Submission Portal V2

A fresh HTML/CSS/JavaScript + Supabase student assignment portal with an admin dashboard.

## Setup (start from zero)
1. Create a **new** Supabase project. In Authentication > Users, create your admin email/password and copy its User UID.
2. Open `supabase_setup.sql`. Replace `00000000-0000-0000-0000-000000000000` with your **new** admin UID in `public.is_portal_admin()` before running.
3. Run the full SQL in Supabase > SQL Editor **on the new project**. It creates `submissions`, `portal_settings`, storage bucket `assignments`, and RLS policies. A new project is important because unrelated old policies can conflict.
4. Open `js/config.js`. Enter your new project URL, publishable key, and `ADMIN_AUTH_EMAIL` (the email you used when creating the admin Auth user), replacing the placeholders with its base Project URL (no `/rest/v1/`) and its Publishable key. **Never put a secret/service_role key in browser code.**
5. Use VS Code Live Server or `python -m http.server 8000` in this folder; open `http://localhost:8000/admin.html`. Avoid opening via `file://`.
6. Log in with username `Admin` and the strong password you set for the Supabase Auth admin user. The UI hides the email field but Supabase still securely authenticates using that configured email. Do **not** hardcode the password in JavaScript. Set a future deadline in the dashboard and click **Save / Extend Deadline**. The database initially has `deadline_at = NULL` (submissions closed).
7. Open `index.html` in an **Incognito/private browser window** (so the student is `anon`, not authenticated as admin). Upload a .doc or .docx under 10 MB.
8. Refresh admin dashboard to see/download/delete submissions. ZIP download uses JSZip CDN.

## Security and operational notes
- Student browser access is anonymous and can INSERT only while deadline is in the future. The private bucket prevents anonymous reading/listing/deletion. Admin privileges are limited to the configured Auth user UUID.
- The browser checks deadline for UX; Supabase RLS also enforces deadline for both storage and database INSERT.
- File upload and database insert are separate operations. If the database insert fails after storage succeeds, an orphan file may remain in storage; only admin can remove it from the Storage dashboard. For a production system, use an Edge Function for transactional orchestration and rate limiting.
- Anonymous uploads can be abused. Consider CAPTCHA, rate limits, per-student login, and malware scanning for a public deployment.
- Supabase bucket MIME limits accept standard Word MIME types plus `application/octet-stream` for clients that cannot identify type. Client extension validation is not a security scanner.
- `submissions` table records may be deleted without removing file when deleting manually in SQL; prefer dashboard Delete.
- Student must not be signed in as admin. RLS policies intentionally allow `anon` upload only, not `authenticated` upload.
- JavaScript dependencies load from CDN and need internet access.

## Troubleshooting
- **Upload says deadline closed**: Admin must set a future deadline; check `select deadline_at, now() from public.portal_settings;`.
- **Storage upload failed / row-level security**: Open DevTools > Network > failing `/storage/v1/object/` request > Response. Verify student browser is Incognito, project URL/key are correct, `assignments` bucket exists, and policies were run on the same project.
- **Database record failed**: Check `/rest/v1/submissions` Response and ensure deadline did not pass mid-upload. Admin can remove any orphan file in Supabase Storage.
- **Admin login works but no data**: Verify Auth user UID equals the UUID in `public.is_portal_admin()` in SQL.
- **Deadline save failed**: Check `portal_settings` exists, admin UID, and browser Console/Network response.

Footer credit: Developed by Naveen (student and admin pages).

**Note:** `Admin` is a fixed display username, not a second Supabase identity. Choose a strong password; using the literal `Naveen` as a password is unsafe for a public site.
