"use client";

import type { CSSProperties } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

export interface ShinyButtonProps extends ButtonProps {
  label?: string;
  fillColor?: string;
  labelColor?: string;
  accentColor?: string;
  accentSoftColor?: string;
  sweepDuration?: number;
  easeDuration?: number;
  arcWidth?: number;
  cornerRadius?: number;
  showSpeckle?: boolean;
  showSheen?: boolean;
  speckleOpacity?: number;
}

/** Theme-aware adaptation of the gleaming border button, retaining native form behavior. */
export function ShinyButton({
  label = "Get Started", children, className, style, type = "button",
  fillColor = "var(--well)", labelColor = "var(--foreground)",
  accentColor = "var(--primary)", accentSoftColor = "var(--beam-tip)",
  sweepDuration = 3, easeDuration = 0.8, arcWidth = 5, cornerRadius = 32,
  showSpeckle = true, showSheen = true, speckleOpacity = 0.4, ...props
}: ShinyButtonProps) {
  const reducedMotion = useReducedMotion();
  const variables = {
    "--gleam-base": fillColor, "--gleam-label": labelColor,
    "--gleam-accent": accentColor, "--gleam-soft": accentSoftColor,
    "--gleam-duration": `${Math.max(0.1, sweepDuration)}s`,
    "--gleam-ease": `${Math.max(0, easeDuration)}s`,
    "--gleam-arc": `${Math.min(25, Math.max(1, arcWidth))}%`,
    "--gleam-radius": `${Math.max(0, cornerRadius)}px`,
    "--gleam-speckle": showSpeckle ? Math.min(1, Math.max(0, speckleOpacity)) : 0,
    "--gleam-sheen": showSheen ? 0.6 : 0,
    ...style,
  } as CSSProperties;
  return (
    <Button {...props} type={type} className={cn("shiny-button h-11 px-6", className)} style={variables}
      data-reduced-motion={reducedMotion ? "true" : undefined}>
      <span className="shiny-button-label">{children ?? label}</span>
    </Button>
  );
}

export default ShinyButton;