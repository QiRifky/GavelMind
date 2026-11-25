import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { setTone, useApi, type Tone } from "../lib/api";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Replace these placeholders with the app's name and description when first building the app.
    // Each content route, / included, must still set its own head(). Never add og:image or
    // twitter:image here: every page without its own would inherit the root's preview image.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "GavelMind — AI assistant for hackathon judges" },
      { name: "description", content: "GavelMind prepares material and drafts scores. The judge makes every final decision." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "GavelMind — AI assistant for hackathon judges" },
      { property: "og:description", content: "GavelMind prepares material and drafts scores. The judge makes every final decision." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600&display=swap" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Nav />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
        <Outlet />
      </main>
    </QueryClientProvider>
  );
}

const links = [
  { to: "/", label: "Entries" },
  { to: "/rubric", label: "Rubric" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/changelog", label: "Change log" },
] as const;

function Nav() {
  const { tone } = useApi();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className={`sticky top-0 z-30 border-b transition-colors ${scrolled || open ? "border-border bg-(--nav-scrolled) backdrop-blur-md" : "border-transparent bg-transparent"}`}>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-medium tracking-tight">
          <svg viewBox="0 0 24 24" className="size-6 text-primary" fill="currentColor" aria-hidden><rect x="4" y="3" width="11" height="6" rx="2" transform="rotate(-35 9.5 6)"/><rect x="10" y="9" width="3" height="11" rx="1.5" transform="rotate(-35 11.5 14.5)"/><rect x="13" y="19" width="9" height="2.5" rx="1.25"/></svg>
          gavelmind
        </Link>
        <div className="hidden flex-1 items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} activeOptions={{ exact: true }} className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground" activeProps={{ className: "bg-secondary text-foreground shadow-glass" }}>{l.label}</Link>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground md:ml-0">
          <span className="hidden sm:inline">Assistant tone</span>
          <select value={tone} onChange={(e) => setTone(e.target.value as Tone)} className="h-9 rounded-full border border-border bg-secondary px-3 text-foreground">
            <option value="serious">Serious</option>
            <option value="sarcastic">Sarcastic but fair</option>
            <option value="playful">Playful</option>
          </select>
        </label>
        <button className="rounded-full border border-border px-3 py-1.5 text-sm md:hidden" onClick={() => setOpen(!open)} aria-expanded={open}>Menu</button>
      </div>
      {open && (
        <div className="flex flex-col gap-1 px-4 pb-3 md:hidden">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm hover:bg-secondary">{l.label}</Link>
          ))}
        </div>
      )}
    </nav>
  );
}
