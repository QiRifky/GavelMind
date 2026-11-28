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

- Workspace state stays in api.ts; analysis uses server-only GitHub + Groq helpers, no mock fallback. Groq (GROQ_API_KEY, groq.server.ts) is the only AI provider: the user removed Gemini/OpenRouter so a Sprite needs one key.
- Drafts and event rules (read from the public page) are quote-checked and stay unconfirmed until the judge confirms; code is never run. Sprite needs private runtime credentials.
- Leaderboard ranks only by judge final scores (judgeTotal); AI drafts never rank or declare a winner.
- Summary style (Neutral/Concise/Detailed via summaryText()) changes wording only, never numbers.
- The public landing page lives at /; workspace pages stay under /app, and other legacy paths redirect to preserve links.
- The root shell uses pathname-based styling for the full-bleed landing page while always rendering Outlet, so workspace layouts stay unchanged.
- AI model names come from Report.models in api.ts, never hard-coded in components.
- Rubric criterion names are picked from CRITERION_PRESETS in api.ts via a dropdown; "Custom name…" is the only typed path, so the preset list stays in one place.
- App theme is dark (#191919 base); every color is a CSS variable in the :root block of src/styles.css — no hex in components, so palette changes touch one place.
- Report page uses the glow bento style (GlowCard has no mouse-following glow; accents from --glow-* vars; pass/warn/fail colors only for status).
- Report criteria use CriterionDeck to show one CriterionEvaluation over layered back cards; inactive forms stay mounted but hidden to preserve score and evidence state, while criterion navigation remains separate from project navigation. Each card ends with Back and Continue buttons that move through the rubric (Continue on the last criterion links to results); no free-text judge note field exists, so the AI's role stays preparation-only and the judge's numbers remain the only saved decision.
- Event flows directly to Entries; former rubric URLs redirect to Entries, preserving bookmarks and existing judging criteria.
- Event criteria drafts need page quotes and judge confirmation; missing official weights become labeled equal-weight suggestions.
- Event uses equal-height desktop overview panels with internally scrolling rules and a two-column criteria list that stacks on phones, keeping review compact without altering confirmation or scoring.
- Analysis validates a numeric draft recommendation and quoted evidence for every criterion; ModelDraft.score is optional only for older reports, which offer explicit reanalysis. Recommendations never enter judge state except through a judge action, preserving judge-only ranking.
- Judging decks use natural-height cards and expandable supporting material instead of nested scroll areas, keeping decisions and navigation accessible.
- AI analysis and criterion drafts use HandoffBeam as a shared adapter for border-beam line animation; override decorative colors with CSS tokens and keep idle, offscreen, hidden-tab, and reduced-motion states static to avoid judging distractions.
- ShinyButton wraps the shared Button with token-based gleam styling and native button props so animated CTAs preserve form submission and disabled behavior.
- Entries uses persistent Radix tabs for single analysis, bulk URLs, and showcase import; hidden panels retain state so switching modes never cancels work or loses input.
- Single-analysis previews and explicit queue insertion live in api.ts; Start judging prepares only selected entries before navigation, so previewing never silently queues a project and existing ready reports are not regenerated.
- WorkflowNav is the expanding rounded-3xl workflow navbar (step pills Event → Entries → Judging → Results, folder panel, mobile menu); Judging links to the next unreviewed ready project at /app/p/$id; footers link to next steps without changing scoring.
- Event folders swap the whole mock workspace (event, projects, rubric, scores, results) in api.ts so events never mix; EventFolders owns create/edit event dialogs and contains WorkflowNav on every workspace step and report; global navigation shows only the active folder to keep steps scoped to that event.
- /app is the event-folder gallery (open a folder → /app/event); Entries lives at /app/entries so the folder level stays separate from the workflow steps.
- The top bar (Gavel Mind brand + active-folder pill) is hidden only on the workflow-step paths (/app/event, /app/entries, /app/results, plus /app/p/*) via WORKSPACE_STEP_PATHS in src/routes/__root.tsx, because WorkflowNav already shows the location; every other page keeps the top bar.
- Workflow pages scroll normally (no h-dvh lock); the __root.tsx shell is a min-h-dvh flex column so each page stage fills to the viewport bottom; only long lists cap their height.
- Workflow-step pages open with the shared StatsBento strip (src/components/ui/stats-bento.tsx) and use the `bento` utility for cards, so all four steps share one card language.
- Card surfaces use shared `rounded-card` / `--card-radius`, translucent glass, rims and soft shadows via `glass-panel`, `glass-nav`, `workspace-stage`; cards nested inside a card use `bento` / `--glass-nested`; form controls, pills, and orange fills keep their proportions and colors.
- Every page, landing included, renders CosmicBackground from __root.tsx (colors from --cosmic-* vars) so the landing page matches the workspace.
- CosmicBackground keeps a token-colored static CSS starfield under the canvas so stars are visible before hydration, even without JavaScript.
- Card blur: BlurControl slider sets --blur-scale on html; per-device.
- Project import parses CSV/JSON/TXT in the browser and scans bounded public pages server-side; only source-present GitHub links enter selectable previews, with optional Groq enrichment, so discovery never invents or queues entries automatically.
