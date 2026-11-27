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
- Rubric criterion names are picked from CRITERION_PRESETS in api.ts via a dropdown; "Custom name…" is the only typed path, so the preset list stays in one place.
- App theme is dark (#191919 base); every color is a CSS variable in the :root block of src/styles.css — no hex in components, so palette changes touch one place.
- Report page uses the glow bento style (GlowCard has no mouse-following glow; accents from --glow-* vars; pass/warn/fail colors only for status).
- Report criteria use CriterionDeck to show one CriterionEvaluation over layered back cards; inactive forms stay mounted but hidden to preserve notes and evidence state, while criterion navigation remains separate from project navigation.
- Event rules live at /app/event; the scoring rubric has its own page at /app/rubric (step 2, before Entries) so each setup step stays focused.
- Analysis-ready summaries use the reusable DonutBreakdown presentation component; ring areas show weighted AI contributions while labels retain absolute /10 scores to avoid confusing scores with percentages.
- AI analysis and criterion drafts use HandoffBeam as a shared adapter for border-beam line animation; override decorative colors with CSS tokens and keep idle, offscreen, hidden-tab, and reduced-motion states static to avoid judging distractions.
- ShinyButton wraps the shared Button with token-based gleam styling and native button props so animated CTAs preserve form submission and disabled behavior.
- Entries uses persistent Radix tabs for single analysis, bulk URLs, and showcase import; hidden panels retain state so switching modes never cancels work or loses input.
- Single-analysis previews and explicit queue insertion live in api.ts; Start judging prepares only selected entries before navigation, so previewing never silently queues a project and existing ready reports are not regenerated.
- WorkflowNav is an expanding rounded-3xl navbar card (motion/react layout + height animation, step pills, folder panel with switch/delete, mobile menu) replacing the EventFolders header on workflow pages. WorkflowNav shares the existing Event → Rubric → Entries → Judging → Results order (Judging links to the next unreviewed ready project at /app/p/$id) and reads session status from the mock store; page footers link to existing next-step and completed-report views without changing scoring rules.
- Event folders swap the whole mock workspace (event, projects, rubric, scores, results) in api.ts so events never mix; EventFolders owns create/edit event dialogs and contains WorkflowNav on every workspace step and report; global navigation shows only the active folder to keep steps scoped to that event.
- /app is the event-folder gallery (open a folder → /app/event); Entries lives at /app/entries so the folder level stays separate from the workflow steps.
- The top bar (Gavel Mind brand + active-folder pill) is hidden only on the workflow-step paths (/app/event, /app/entries, /app/rubric, /app/results, plus /app/p/*) via WORKSPACE_STEP_PATHS in src/routes/__root.tsx, because WorkflowNav already shows the location; every other page keeps the top bar.
- Workflow-step pages (Event/Entries/Rubric/Results) use normal page scroll on all sizes (no h-dvh lock), so cards never get squeezed; only long lists like the Entries queue cap their height.
- Workflow-step pages open with the shared StatsBento strip (src/components/ui/stats-bento.tsx) and use the `bento` utility for cards, so all four steps share one card language.
- Card surfaces and deck layers use the shared `rounded-card` / `--card-radius` token, solid semantic surfaces, and shared subtle shadow, including glass and bento utilities; this keeps card presentation centralized without affecting form controls, pills, or orange fills.
