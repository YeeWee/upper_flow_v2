import type { ChapterDef } from "./types";
import ColdOpen from "../chapters/01-coldopen/ColdOpen";
import { narrations as coldopenNarrations } from "../chapters/01-coldopen/narrations";
import Architecture from "../chapters/02-architecture/Architecture";
import { narrations as architectureNarrations } from "../chapters/02-architecture/narrations";
import Results from "../chapters/03-results/Results";
import { narrations as resultsNarrations } from "../chapters/03-results/narrations";
import V2AndCta from "../chapters/04-v2-and-cta/V2AndCta";
import { narrations as v2andctaNarrations } from "../chapters/04-v2-and-cta/narrations";

export const CHAPTERS: ChapterDef[] = [
  {
    id: "coldopen",
    title: "问题引入",
    narrations: coldopenNarrations,
    Component: ColdOpen,
  },
  {
    id: "architecture",
    title: "核心机制",
    narrations: architectureNarrations,
    Component: Architecture,
  },
  {
    id: "results",
    title: "实验数据",
    narrations: resultsNarrations,
    Component: Results,
  },
  {
    id: "v2-and-cta",
    title: "v2.0 与行动召唤",
    narrations: v2andctaNarrations,
    Component: V2AndCta,
  },
];
