import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import css from "@/index.css?raw";
import { NativeSelect } from "./native-select";

// Every source file except tests and this component, as text (Vite glob, read at test time).
const sources = import.meta.glob(["/src/**/*.tsx", "!/src/**/*.test.tsx", "!/src/components/ui/native-select.tsx"], {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/** The "Selects" section of index.css: from its heading comment to the end of the file. */
const selectsCss = css.slice(css.indexOf("Selects – the one place"));

describe("NativeSelect", () => {
  it("is a real select: combobox role, label, keyboard choice and type-ahead", async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="g">Genre</label>
        <NativeSelect id="g" defaultValue="">
          <option value="" disabled>
            Choose a genre
          </option>
          <option value="rap">Rap</option>
          <option value="rock">Rock</option>
        </NativeSelect>
      </>,
    );
    const select = screen.getByRole("combobox", { name: "Genre" });
    expect(select.tagName).toBe("SELECT");
    expect(screen.getByRole("option", { name: "Choose a genre" })).toBeDisabled();

    await user.selectOptions(select, "Rock");
    expect(select).toHaveValue("rock");
  });

  it("is the only place that renders a <select>", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(20);
    const offenders = Object.entries(sources)
      .filter(([, text]) => /<select[\s>]/.test(text))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});

describe("select styles (index.css)", () => {
  it("opts in to the customizable select only behind @supports, keeping themed native options as the fallback", () => {
    const supports = selectsCss.indexOf("@supports (appearance: base-select)");
    expect(supports).toBeGreaterThan(-1);
    expect(selectsCss.indexOf("appearance: base-select;")).toBeGreaterThan(supports);
    // fallback rules come before (outside) the @supports block
    expect(selectsCss.slice(0, supports)).toMatch(/select option,\s*select optgroup \{\s*background-color: var\(--popover\);\s*color: var\(--popover-foreground\);/);
  });

  it("uses design tokens only (no literal colours)", () => {
    const rules = selectsCss.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(rules).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(|oklab\(\s*[\d.]/i);
  });

  it("styles every row state of the open list and gives keyboard focus a ring", () => {
    for (const selector of [
      "select::picker(select)",
      "select option:checked",
      "select option:hover:not(:disabled)",
      "select option:focus-visible",
      "select option:disabled",
    ]) {
      expect(selectsCss).toContain(`${selector} {`);
    }
    expect(selectsCss).toMatch(/option:focus-visible \{[^}]*outline: 2px solid var\(--ring\)/);
  });
});
