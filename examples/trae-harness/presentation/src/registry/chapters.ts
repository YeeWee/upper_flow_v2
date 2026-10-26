import type { ChapterDef } from "./types";
import Coldopen from "../chapters/01-coldopen/Coldopen";
import Architecture from "../chapters/02-architecture/Architecture";
import Results from "../chapters/03-results/Results";
import V2AndCta from "../chapters/04-v2-and-cta/V2AndCta";
import { narrations as coldopenNarrations } from "../chapters/01-coldopen/narrations";
import { narrations as architectureNarrations } from "../chapters/02-architecture/narrations";
import { narrations as resultsNarrations } from "../chapters/03-results/narrations";
import { narrations as v2AndCtaNarrations } from "../chapters/04-v2-and-cta/narrations";

/**
 * 播放顺序 = 数组顺序。
 *
 * 每章的 `narrations` 长度就是该章 step 数（章内 0-based）。音频路径由
 * `beats.json` 的 `audio` 字段决定；演示预览走 `/audio/<chapter>/<step+1>.wav`
 * 的约定，文件名由 `avp tts` 按同一份节拍清单写出。
 *
 * 章节组件只接收章内 0-based step（0..n-1）—— 永远不要在组件里比较
 * outline 的全局 1-based 编号。
 */
export const CHAPTERS: ChapterDef[] = [
  {
    id: "coldopen",
    title: "问题引入",
    narrations: coldopenNarrations,
    Component: Coldopen,
  },
  {
    id: "architecture",
    title: "四个核心机制",
    narrations: architectureNarrations,
    Component: Architecture,
  },
  {
    id: "results",
    title: "11 轮 A/B 实验数据",
    narrations: resultsNarrations,
    Component: Results,
  },
  {
    id: "v2-and-cta",
    title: "v2.0 能力与行动召唤",
    narrations: v2AndCtaNarrations,
    Component: V2AndCta,
  },
];
