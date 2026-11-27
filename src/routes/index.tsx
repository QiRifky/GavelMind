import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, FileSearch, GitBranch, Gavel, SlidersHorizontal, Sparkles, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { average, draftsFor, useApi } from "@/lib/api";
const heroUrl = "/images/judging-hero.png";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Gavel Mind — AI prepares. You decide." },
    { name: "description", content: "A hackathon judging workspace for project material, evidence and AI draft scores. Your rubric. Your final decision." },
    { property: "og:title", content: "Gavel Mind — AI prepares. You decide." },
    { property: "og:description", content: "Review project evidence and AI draft scores in one workspace. Human judges make every final decision." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: LandingPage,
});

function LandingPage() {
  const state = useApi();
  const project = state.projects.find((p) => p.status === "done" && state.reports[p.id]);
  const report = project ? state.reports[project.id] : undefined;

  return (
    <div className="landing-page">
      <section className="landing-hero relative isolate overflow-hidden">
        <img src={heroUrl} alt="A titanium and amber glass judge's gavel on a charcoal sound block" className="landing-hero-image pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover" fetchPriority="high" />
        <div className="landing-hero-inner px-5 sm:px-6">
          <p className="flex items-center gap-2 text-xs font-medium text-accent-foreground"><span className="size-1.5 rounded-full bg-primary" /> THE HACKATHON JUDGING WORKSPACE</p>
          <h1 className="mt-6 text-5xl font-medium leading-none sm:text-7xl">GavelMind<span className="text-primary">.</span></h1>
          <h2 className="mt-6 text-3xl font-normal leading-tight sm:text-4xl">AI prepares.<br /><span className="text-muted-foreground">You decide.</span></h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground sm:text-base">From repository to review. Project material, evidence, and draft scores in one place — with the final call always yours.</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-full px-6"><Link to="/app">Open workspace <ArrowRight /></Link></Button>
            {project && <Button asChild variant="ghost" className="glass-nav h-12 rounded-full px-5"><Link to="/app/p/$id" params={{ id: project.id }}>Explore a sample report <ArrowUpRight /></Link></Button>}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Interactive demo · No sign-up · Sample data</p>
        </div>
      </section>

      <div className="px-4 sm:px-6">
        <div className="glass-nav rounded-full flex flex-wrap items-center justify-between gap-x-8 gap-y-4 px-5 py-6 sm:px-6">
          <span className="flex items-center gap-2 text-sm"><ShieldCheck className="size-4 text-primary" /> Human judgment, at the center.</span>
          <div className="flex flex-wrap gap-x-7 gap-y-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><Check className="size-3.5" /> Evidence alongside scores</span>
            <span className="flex items-center gap-2"><Check className="size-3.5" /> Your own rubric</span>
            <span className="flex items-center gap-2"><Check className="size-3.5" /> Judge-only final rankings</span>
          </div>
        </div>
      </div>

      <section className="px-5 py-16 sm:px-6 sm:py-20" aria-labelledby="review-heading">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-xs font-medium text-primary">FROM SUBMISSION TO DECISION</p><h2 id="review-heading" className="mt-3 text-3xl font-normal sm:text-4xl">A clearer path to your final call.</h2></div>
          <p className="max-w-xs text-sm leading-6 text-muted-foreground">Let AI organize the material.<br />Give the projects your full attention.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="glass-panel p-6"><div className="flex items-center justify-between"><GitBranch className="size-6 text-primary" /><span className="font-mono text-xs text-muted-foreground">01 / COLLECT</span></div><h3 className="mt-6 text-xl">Bring the projects together.</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">Add repositories and demo links to a single review queue. Keep every submission in sight.</p></div>
          <div className="glass-panel p-6"><div className="flex items-center justify-between"><FileSearch className="size-6 text-primary" /><span className="font-mono text-xs text-muted-foreground">02 / REVIEW</span></div><h3 className="mt-6 text-xl">See the evidence. Not just a score.</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">Review summaries, rule checks, and model-by-model drafts, with reasons and sources beside them.</p></div>
          <div className="glass-panel p-6"><div className="flex items-center justify-between"><Gavel className="size-6 text-primary" /><span className="font-mono text-xs text-muted-foreground">03 / DECIDE</span></div><h3 className="mt-6 text-xl">Make it your decision.</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">Set final scores against your rubric. Choose the winners yourself, then finalize and export the results.</p></div>
        </div>
      </section>

      {project && report && <section className="px-4 sm:px-6" aria-labelledby="sample-heading">
        <div className="glass-panel grid gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <div><p className="text-xs font-medium text-primary">A LOOK INSIDE</p><h2 id="sample-heading" className="mt-3 text-3xl leading-tight sm:text-4xl">Prepared by AI.<br />Reviewed by you.</h2><p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">Draft scores are a starting point, never a verdict. Compare the material, weigh the evidence, and record your own judgment.</p><Button asChild variant="ghost" className="glass-nav mt-6 h-11 rounded-full"><Link to="/app/p/$id" params={{ id: project.id }}>Open sample report <ArrowUpRight /></Link></Button></div>
          <div className="bento overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4"><div className="flex min-w-0 items-center gap-2 text-sm"><GitBranch className="size-4 shrink-0 text-primary" /><span className="truncate">{project.name}</span></div><span className="shrink-0 text-xs text-muted-foreground">Sample report</span></div>
            <div className="px-5 py-5"><div className="mb-5 flex items-center gap-2 text-xs text-accent-foreground"><Sparkles className="size-3.5" /> AI DRAFT SCORES</div><div className="grid grid-cols-[1fr_auto_auto] gap-x-5 gap-y-4 text-sm"><span className="text-xs text-muted-foreground">Criterion</span><span className="text-xs text-muted-foreground">AI draft</span><span className="text-xs text-muted-foreground">Judge</span>{state.criteria.map((c) => <div key={c.id} className="contents"><span>{c.name}</span><span className="text-right font-mono">{average(draftsFor(report, c).map((d) => d.score)).toFixed(1)}</span><span className="text-right font-mono text-muted-foreground">{state.judge[project.id]?.[c.id]?.score ?? "—"}</span></div>)}</div></div>
            <div className="border-t border-border bg-accent/40 px-5 py-4 text-xs leading-6 text-muted-foreground">AI scores are suggestions to help you decide. The final decision is yours.</div>
          </div>
        </div>
      </section>}

      <section className="mx-4 my-16 glass-panel flex flex-col gap-6 px-5 py-10 sm:mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div><div className="mb-3 flex items-center gap-2 text-xs text-primary"><SlidersHorizontal className="size-4" /> YOUR RUBRIC. YOUR CALL.</div><h2 className="text-3xl">The next great project is waiting.</h2></div>
        <Button asChild size="lg" className="h-12 w-fit rounded-full"><Link to="/app">Start reviewing <ArrowRight /></Link></Button>
      </section>
      <footer className="border-t border-border"><div className="flex flex-wrap items-center justify-between gap-4 px-5 py-6 text-xs text-muted-foreground sm:px-6"><Link to="/" className="text-sm text-foreground">GavelMind<span className="text-primary">.</span></Link><span>AI assists. Humans decide.</span><Link to="/app" className="hover:text-foreground">Enter workspace ↗</Link></div></footer>
    </div>
  );
}
