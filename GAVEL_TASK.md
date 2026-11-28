This is GavelMind, a TanStack Start app (React + TypeScript) running on this Sprite at port 8080 via the Vite dev server. It is a personal assistant for a hackathon judge: the AI only prepares material and drafts; the human judge decides. Keep the existing UI and design unchanged.

Goal: make the "Analyze" action work for real on a public GitHub repo URL, using the Fly.io Sprites GitHub connector.

Requirements:
1. Read the env var GH_GATEWAY (from .env). It is a base URL of a GitHub API gateway proxy that needs no token. Example calls: $GH_GATEWAY/repos/OWNER/REPO, /repos/OWNER/REPO/readme, /repos/OWNER/REPO/languages, /repos/OWNER/REPO/commits?per_page=100. Never print or show the contents of .env. Use the variable only.
2. Implement the calls on the SERVER side only (TanStack Start server functions or server routes), so the gateway URL never reaches the browser bundle. Never use a VITE_ prefix for it, never log it, never commit it.
3. Replace the mock behavior of the analyze/report functions in src/lib/api.ts for ONE project type: a real GitHub repo URL. Keep every other mock function as it is. The data shape returned to the UI must stay compatible with what the UI already expects.
4. From the real data, produce: repo name and description, languages, README summary (first meaningful lines, no AI model yet), created date, first and last commit dates, commit count (from the fetched page), license, whether a demo video link is found in the README (YouTube/Loom/Vimeo regex).
5. Rules checks, each as pass / warning / needs-judge-confirmation with a one-line reason and evidence: repo is public; README exists; commits fall inside the event window 23-29 Nov 2026 (flag, never a verdict); demo link found; "uses a Sprites connector" must be marked "needs judge confirmation" because it cannot be verified from GitHub alone.
6. Do NOT clone or execute the participant's code. Do NOT invent scores: draft scores stay empty ("not drafted yet") until a model is connected.
7. Handle errors: invalid URL, 404, private repo, rate limit, gateway down. Show readable messages in the existing error state.
8. After the code works, restart the dev server on port 8080 (it must keep running after the terminal closes, for example with nohup and logs in /tmp/dev.log), then test with https://github.com/QiRifky/GavelMind and one other public repo, and show me the output.
9. Commit with a clear message. Do not push anything.
