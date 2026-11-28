# Current fixes

- [x] Add CSV/JSON/TXT upload and public showcase import with selection previews; 80 tests pass, file-to-queue and real vite.dev-to-queue flows work, private URLs are blocked, and phone layout has no horizontal overflow.
- [ ] Verify live Groq enrichment of imported project names/demo links. Blocked: no Groq key is available here; real repository-link discovery works without it.

- [x] Limit both judging card heights with internal scrolling, preserving context and criterion navigation.

- [x] Expand judging Summary using collected description, README and verification/demo data; add bottom controls for Summary → Rules check → Evidence.

- [x] Move criteria into Event; extract quote-backed AI drafts, require judge confirmation, and verify 67 tests plus laptop/phone confirmation and navigation.
- [ ] Verify live Groq criteria extraction on Sprite. Blocked: no Groq key is configured in this preview and the private Sprite session is unavailable.

- [x] Remove the Rubric page and step; Event goes directly to Entries, old URLs redirect, and desktop/mobile navigation plus 7 targeted tests pass.

- [x] Verify New event folder opens its dialog and folder creation reaches the Event page on laptop and phone (3 targeted tests passed).
- [x] Fix the Sprite "Gemini API request failed (404)" error: direct Google API calls now use the real model name `gemini-2.0-flash` (commit d410334); 56 tests passed.
- [ ] Recheck Automatic rules on the private Sprite deployment after the user pulls this fix and restarts the server. Blocked: it requires the user's Fly.io sign-in session.
- [ ] Recheck the private Sprite deployment after the user updates and reloads it. Blocked: it requires the user's Fly.io sign-in session.
- [x] Verify both event-link rule analysis flows against the real Hacksgiving URL: 7 rules from the Event page and 8 during folder creation, with no errors; 4 targeted tests passed. Sprite still needs the feature commit and a restart.

# Glass dashboard style

# Real GitHub and Gemini analysis

- [x] Replace generated project reports and criterion scores with GitHub evidence and Google Gemini drafts.
- [x] Use Gemini through Lovable's built-in AI service, not the user's Google key; keep external Sprite server configuration documented.
- [x] Fail explicitly without configured services; never fall back to fabricated reports, rules, or showcase entries.
- [x] Verify analysis and judging tests (55 passing) and the live failure path without inserting fabricated data.
- [ ] Verify a successful GitHub → Gemini → judge → results flow. Blocked: configured GitHub connector denies access; external Sprite also needs a securely configured Lovable runtime API key.

- [x] Apply the uploaded glass dashboard treatment across the workspace while preserving Onest, the dark background, orange accents, and 8 px card corners.
- [x] Verify workflow pages, the folder gallery, judging interactions, mobile layout, and regression tests.

# Landing page

# Explicit queue and judging actions

- [x] Add analyzed previews to Project queue only through the queue button, without duplicates.
- [x] Replace Analyze selected with Start judging and open a selected project's judging page.
- [x] Verify the full flow, mobile layout, and regression tests.

# Reference card presentation

- [x] Adapt shared card corners, solid surfaces, and subtle shadows to the uploaded reference while preserving orange fills.
- [x] Verify workflow pages and reports on laptop and phone, and run existing tests.

# Card corners

- [x] Apply the shared card radius across card surfaces, deck layers, dialogs, and the folder creation tile.
- [x] Verify laptop and phone layouts and existing tests.

# Stacked criterion cards

- [x] Replace the vertical criterion list with a layered deck and criterion navigation, preserving judging inputs.
- [x] Verify navigation, score/note retention, evidence, desktop/phone layout, and existing tests.

# Folder event dialog

- [x] Move event details into a create/edit dialog and nest workflow navigation under the active folder.
- [x] Verify folder creation, editing, switching, navigation, and phone layout.

# Entries and guided workflow

- [x] Combine single analysis, bulk URLs, and showcase import into one persistent tabbed input.
- [x] Add consistent step navigation and clearer judging/next-step actions without reordering pages.
- [x] Verify all input modes, report navigation, existing tests, and phone layout.

# Shiny Analyze button

- [x] Adapt the supplied shiny button to the shared controls and dark palette.
- [x] Verify submission, disabled behavior, reduced motion, and phone layout.

# AI activity beam

- [x] Integrate the orange beam in analysis and report AI drafts without changing judging logic.
- [x] Verify analysis, scoring, mobile layout, and reduced motion.

# Analysis-ready design

- [x] Replace the analysis summary with a dark interactive donut and criterion legend.
- [x] Verify analysis completion, chart interactions, report navigation, and phone layout.

- [x] Create the dark Gavel Mind landing page and original hero image.
- [x] Connect landing buttons to existing workspace and sample report.
- [x] Verify navigation, mobile layout, and existing tests.

# Event & Rules

- [x] Add event setup, editable sample rule drafts, and judge confirmation.
- [x] Connect confirmed rules to participant reports and rubric suggestions.
- [x] Verify event flow, phone layout, tests, and save changes.

# Inline report judging

- [x] Combine AI evidence and judge inputs per criterion, with compact overview and collapsible technical material.
- [x] Remove duplicate AI tables and add previous/next project navigation.
- [x] Verify scoring, notes, navigation, phone layout, and existing tests.

# AI border animation

- [x] Replace the AI ribbon with the uploaded border-beam line animation in the existing AI blocks.
- [x] Verify analysis, report, phone layout, and reduced motion.

# Judged status in the queue

- [x] Show whether each queued project has been judged: Not judged yet → Not reviewed → In review → Finalized, with a test covering the switch after the judge's first score.

# Sprite AI reliability

- [x] Use Groq as the only AI for rules and analysis (Gemini and OpenRouter removed).
- [ ] Verify Automatic rules and repo analysis on the Sprite after the user pulls and restarts. Blocked: needs the user's Sprite terminal session and a working connector.
