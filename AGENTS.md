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
- Leaderboard ranks only by judge final scores (judgeTotal); AI drafts never rank or declare a winner.
- App theme is dark (#191919 base); every color is a CSS variable in the :root block of src/styles.css — no hex in components, so palette changes touch one place.
- Report card page uses the glow bento style (GlowCard; accents read from --glow-* vars; status colors pass/warn/fail only for status).
- AI drafts come from several models (state.models in api.ts, never hard-coded names); the aggregated draft is their average and is reference-only.
- Rubric weights must total exactly 100 to save (weightsValid/saveRubric); the rubric page edits a local draft until Save.
- Exports (src/lib/export.ts) are built in the browser from judge finals, rubric and change log only, and always carry the "AI scores are drafts" note.
- Every card on every page uses the shared bento tile look (glass/tile utilities in styles.css; GlowCard uses the same radius); why: all pages read as one family, matching the Bento Component Board project.

- No assistant tone selector, no copilot, no separate change-log page; the change log lives on the Leaderboard. Why: matches Bento Component Board, user removed them.
