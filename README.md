# Fair Score Finale

/skill:bento-component-board Now build the app pages in the same visual style (warm paper

background, Onest font, orange accent, glass cards with soft shadows,

pill buttons). Use React Router. Data comes only from src/lib/api.ts

with mock data.

Principle: the AI only PREPARES material and DRAFTS scores. The human

judge makes every final decision. The AI never declares a winner.

PAGES

1. Entries: paste multiple GitHub repo URLs, an "Analyze" button, and

   a status per entry (queued, analyzing, done, failed).

2. Rubric: add, remove, rename, and weight criteria. Defaults:

   creativity, usefulness, technical quality, demo clarity.

3. Report card per project: 3-5 sentence summary; run status (worked,

   failed, error) with evidence; an AI DRAFT score per criterion, each

   with a short reason and evidence; flags for suspicious points; and

   per criterion a field "Judge's decision" for the FINAL score, with

   the AI draft shown beside it.

4. Leaderboard: rank ONLY by the judge's final scores. Unreviewed

   projects show "Awaiting judge review", never a rank from AI scores.

5. Finalize button the judge must press; before that show "Draft, not

   final".

6. Change log of every judge edit (old value, new value, time).

7. Assistant tone selector: serious, sarcastic but fair, or playful.

   It changes wording only, never scores.

8. A visible notice on every report: "AI scores are suggestions to

   help you decide. The final decision is yours."

Responsive on phone and laptop. Build only what is listed.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d4b980cb-10ad-4890-ac1c-48c7d701bbd8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
