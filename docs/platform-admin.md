# Platform Admin

`/platform-admin` is a private, cross-company owner dashboard. It is not the
team admin page and can only be opened by addresses in `PLATFORM_ADMIN_EMAILS`.

In Vercel, add this **Production** environment variable before using it:

```text
PLATFORM_ADMIN_EMAILS=your-workspace-admin-email@example.com
```

Use commas for more than one owner email. This dashboard uses the existing
Supabase service-role key server-side to read all profiles and task completions;
never expose that key in a browser variable.
