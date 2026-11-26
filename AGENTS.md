<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- All app data goes through src/lib/api.ts (in-memory mock store via useSyncExternalStore); no backend or auth, by user request.
- Event setup and rule drafts use the same mock store; reportForEvent applies only judge-confirmed rules and marks eligibility unverified because no live event or repository extraction exists.
- Leaderboard ranks only by judge final scores (judgeTotal); AI drafts never rank or declare a winner.
- Summary style (Neutral/Concise/Detailed via summaryText()) changes wording only, never numbers.
- The public landing page lives at /; workspace pages stay under /app, and other legacy paths redirect to preserve links.
- The root shell uses pathname-based styling for the full-bleed landing page while always rendering Outlet, so workspace layouts stay unchanged.
- AI model names come from Report.models in api.ts, never hard-coded in components.
- App theme is dark (#191919 base); every color is a CSS variable in the :root block of src/styles.css — no hex in components, so palette changes touch one place.
- Report page uses the glow bento style (GlowCard glows on mouse only; accents from --glow-* vars; pass/warn/fail colors only for status).
- Report criteria use CriterionEvaluation to colocate model evidence and judge inputs; technical material is collapsible and project navigation targets completed reports to keep judging focused.
- Event rules live at /app/event; the scoring rubric has its own page at /app/rubric (step 3, after Entries) so each setup step stays focused.
