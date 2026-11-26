import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Button } from "@/components/ui/button";
import { folderName, useApi } from "@/lib/api";
import { FolderOpen, ArrowUpRight } from "lucide-react";

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
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" },
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
  const isLanding = useRouterState({ select: (s) => s.location.pathname === "/" });

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Nav />
      <main className={isLanding ? "" : "mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12"}>
        <Outlet />
      </main>
    </QueryClientProvider>
  );
}

function Nav() {
  const isLanding = useRouterState({ select: (s) => s.location.pathname === "/" });
  const state = useApi();
  const active = state.folders.find((f) => f.id === state.activeFolderId);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className={`sticky top-0 z-30 border-b transition-colors ${scrolled ? "border-border bg-(--nav-scrolled) backdrop-blur-md" : "border-transparent bg-transparent"}`}>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-medium">
          <svg viewBox="0 0 24 24" className="size-6 text-primary" fill="currentColor" aria-hidden><rect x="4" y="3" width="11" height="6" rx="2" transform="rotate(-35 9.5 6)"/><rect x="10" y="9" width="3" height="11" rx="1.5" transform="rotate(-35 11.5 14.5)"/><rect x="13" y="19" width="9" height="2.5" rx="1.25"/></svg>
          Gavel Mind
        </Link>
        {isLanding ? <div className="ml-auto flex items-center gap-6"><span className="hidden text-xs text-muted-foreground sm:block">Built for the human behind the score.</span><Button asChild variant="outline" className="rounded-full"><Link to="/app">Open app <ArrowUpRight /></Link></Button></div> : <Button asChild variant="ghost" className="ml-auto min-w-0 max-w-[55%] rounded-full"><Link to="/app/event"><FolderOpen className="size-4 shrink-0 text-primary" /><span className="truncate">{active ? folderName(active, state) : "Event folders"}</span></Link></Button>}
      </div>

    </nav>
  );
}
