import type { ComponentType } from "react";

export interface ChapterStepProps {
  step: number; // 0..(narrations.length - 1)
}

export type NarrationMotion = "hook" | "static";

/**
 * One narration entry — what the audience hears and what they read.
 *
 * `say` is spoken (TTS + Auto-mode timing). `""` means a silent beat: no
 * TTS audio, no derived caption.
 *
 * `caption` is written for the eye, not mechanically cut from `say`; it may
 * differ from what is spoken. When omitted, `avp plan` derives one from the
 * first sentence (and errors if it cannot fit 18 full-width cells). Write
 * one to keep control. Never append `…` / `...`.
 *
 * `motion` declares whether the beat has a hook. Default: `"hook"` when
 * `say` is non-empty, `"static"` when it is empty.
 */
export interface Narration {
  say: string;
  caption?: string;
  motion?: NarrationMotion;
}

export interface ChapterDef {
  id: string;
  title: string;
  /**
   * Per-step narration entries. **Length === total steps in this chapter.**
   * This is the single source of truth for step count and audio synthesis.
   */
  narrations: Narration[];
  Component: ComponentType<ChapterStepProps>;
}
