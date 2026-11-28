import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProjectImport } from "@/components/project-import";
import { createFolder, snapshot } from "@/lib/api";
afterEach(cleanup);
describe("import selection", () => {
  it("adds only explicitly selected file entries and avoids duplicates", async () => {
    createFolder("Import selection");
    render(<ProjectImport />);
    const file = new File(['["https://github.com/team/one","https://github.com/team/two"]'], "projects.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: async () => '["https://github.com/team/one","https://github.com/team/two"]' });
    fireEvent.change(screen.getByLabelText("Upload project file"), { target: { files: [file] } });
    await screen.findByLabelText("Import team/two");
    expect(snapshot().projects).toHaveLength(0);
    fireEvent.click(screen.getByLabelText("Import team/two"));
    fireEvent.click(screen.getByRole("button", { name: "Add selected (1)" }));
    await waitFor(() => expect(snapshot().projects.map((p) => p.repoUrl)).toEqual(["https://github.com/team/one"]));
    expect(screen.getByLabelText("Import team/one")).toBeDisabled();
  });
});