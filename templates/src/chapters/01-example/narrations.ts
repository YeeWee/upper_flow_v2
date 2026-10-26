import type { Narration } from "../../registry/types";

/**
 * Per-step narration for this chapter.
 *
 * Length === number of steps the chapter component renders.
 * Index i === the narration for `step === i` in `Example.tsx`.
 *
 * `say` is spoken; `caption` is shown. Captions are written for the eye —
 * keep them ≤ 18 full-width cells and never add `…`. When `caption` is
 * omitted, `avp plan` derives one and records `captionSource: "derived"`.
 *
 * `say: ""` = silent beat (no TTS, no derived caption). `motion` defaults to
 * `"hook"` when `say` is non-empty and `"static"` when it is empty.
 *
 * Audio synthesis uses this file via scripts/extract-narrations.ts.
 */
export const narrations: Narration[] = [
  // step 0 — magazine cover
  {
    say: "这是示例章节的第一步。把这一行换成你这一步的口播文案。",
    caption: "第一步 · 换成你的文案",
  },
  // step 1 — split layout
  {
    say: "第二步。每个数组元素对应章节里 step === N 的那一屏。长度必须严格相等。",
    caption: "第二步 · 每个数组元素一屏",
  },
  // step 2 — pull-quote close
  {
    say: "第三步。这个数组就是音频合成 + 自动播放的唯一真相源——再也不会和章节代码漂移。",
    caption: "第三步 · 音频与自动播放同源",
  },
];
