// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { addEntries, removeEntry, snapshot } from "@/lib/api";

async function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient: new QueryClient() },
    defaultPreload: false,
  });
  await router.load();
  return render(<RouterProvider router={router} />);
}

/** Entries this test put into the queue; removed again afterwards. */
const added: string[] = [];
function queue(urls: string) {
  const before = new Set(snapshot().entries.map((e) => e.id));
  addEntries(urls);
  for (const e of snapshot().entries) if (!before.has(e.id)) added.push(e.id);
}

function statusOf(url: string): string {
  const li = screen.getByText(url, { selector: "p.text-xs" }).closest("li");
  if (!li) throw new Error(`entry for ${url} not rendered`);
  return li.textContent ?? "";
}

describe("Entries queue card", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    while (added.length) removeEntry(added.pop()!);
  });

  it("adds pasted URLs to the queue without analyzing them", async () => {
    await renderAt("/");
    const box = screen.getByPlaceholderText(/project-one/);
    fireEvent.change(box, {
      target: { value: "https://github.com/team/project-one\nhttps://github.com/team/project-two" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to queue" }));

    expect(statusOf("https://github.com/team/project-one")).toContain("queued");
    expect(statusOf("https://github.com/team/project-two")).toContain("queued");
    expect(screen.queryByText("analyzing…")).toBeNull();
  });

  it("runs the analysis only when Analyze is pressed, then marks a non-repo URL failed", async () => {
    await renderAt("/");
    // Start from a clean queue: entries left over from earlier tests would be
    // analyzed first and push this one's timers past the window we check.
    for (const e of snapshot().entries) removeEntry(e.id);
    const box = screen.getByPlaceholderText(/project-one/);
    fireEvent.change(box, { target: { value: "not-a-repo" } });
    fireEvent.click(screen.getByRole("button", { name: "Analyze →" }));

    expect(statusOf("not-a-repo")).toContain("queued");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(statusOf("not-a-repo")).toContain("analyzing…");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });
    expect(statusOf("not-a-repo")).toContain("failed");
  });

  it("never shows a queued entry on the leaderboard before the judge reviews it", async () => {
    queue("https://github.com/team/queued-only-repo");
    await renderAt("/leaderboard");
    expect(screen.queryByText("team/queued-only-repo")).toBeNull();
  });
});
