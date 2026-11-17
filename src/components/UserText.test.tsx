import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserText } from "./UserText";

describe("UserText", () => {
  it("renders user text with dir=auto so Arabic displays right-to-left", () => {
    render(<UserText as="h2">عمرو دياب</UserText>);
    const heading = screen.getByRole("heading", { name: "عمرو دياب" });
    expect(heading).toHaveAttribute("dir", "auto");
  });

  it("defaults to a span", () => {
    render(<UserText>Track title</UserText>);
    expect(screen.getByText("Track title").tagName).toBe("SPAN");
  });
});
