import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  BLUR_KEY,
  BlurControl,
  applyBlur,
  blurScale,
  clampPct,
  readBlurPct,
  writeBlurPct,
} from "@/components/blur-control";

describe("card blur persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty("--blur-scale");
    document.documentElement.style.removeProperty("--landing-blur-scale");
  });

  it("has no saved level before the user chooses one", () => {
    expect(readBlurPct()).toBeNull();
  });

  it("starts fully clear on a first visit", () => {
    render(<BlurControl />);
    expect(screen.getByLabelText("Card blur")).toHaveValue("0");
  });

  it("defaults only the landing navbar to 5% and all other glass to 0%", () => {
    const css = readFileSync("src/styles.css", "utf8");
    const defaults = css.match(/:root\s*\{\s*--blur-scale:\s*([\d.]+);\s*--landing-blur-scale:\s*([\d.]+);/);
    expect(Number(defaults?.[1])).toBe(blurScale(0));
    expect(Number(defaults?.[2])).toBe(blurScale(5));
  });

  it("keeps the chosen level after it is saved", () => {
    writeBlurPct(88);
    expect(readBlurPct()).toBe(88);
  });

  it("clamps out-of-range levels", () => {
    writeBlurPct(140);
    expect(readBlurPct()).toBe(100);
    expect(clampPct(-5)).toBe(0);
  });

  it("maps the level to the blur multiplier", () => {
    expect(blurScale(0)).toBe(0);
    expect(blurScale(50)).toBe(1);
    expect(blurScale(100)).toBe(2);
  });

  it("paints the multiplier onto the page", () => {
    applyBlur(88);
    expect(document.documentElement.style.getPropertyValue("--blur-scale")).toBe(String(88 / 50));
    expect(document.documentElement.style.getPropertyValue("--landing-blur-scale")).toBe(String(88 / 50));
  });

  it("saves the level the moment the slider moves", () => {
    render(<BlurControl />);
    fireEvent.change(screen.getByLabelText("Card blur"), { target: { value: "75" } });
    expect(localStorage.getItem(BLUR_KEY)).toBe("75");
  });

  it("opens with the saved level instead of the default", () => {
    writeBlurPct(30);
    render(<BlurControl />);
    expect(screen.getByLabelText("Card blur")).toHaveValue("30");
  });

  it("does not overwrite the saved level when the control only opens", () => {
    writeBlurPct(62);
    render(<BlurControl />);
    expect(localStorage.getItem(BLUR_KEY)).toBe("62");
  });
});
