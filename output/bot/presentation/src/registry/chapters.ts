import type { ChapterDef } from "./types";
import Coldopen from "../chapters/01-coldopen/Coldopen";
import { narrations as coldopenNarrations } from "../chapters/01-coldopen/narrations";
import Routing from "../chapters/02-routing/Routing";
import { narrations as routingNarrations } from "../chapters/02-routing/narrations";
import Computer from "../chapters/03-computer/Computer";
import { narrations as computerNarrations } from "../chapters/03-computer/narrations";
import Mission from "../chapters/04-mission/Mission";
import { narrations as missionNarrations } from "../chapters/04-mission/narrations";
import Roster from "../chapters/05-roster/Roster";
import { narrations as rosterNarrations } from "../chapters/05-roster/narrations";
import States from "../chapters/06-states/States";
import { narrations as statesNarrations } from "../chapters/06-states/narrations";
import Delegate from "../chapters/07-delegate/Delegate";
import { narrations as delegateNarrations } from "../chapters/07-delegate/narrations";
import Review from "../chapters/08-review/Review";
import { narrations as reviewNarrations } from "../chapters/08-review/narrations";
import Permissions from "../chapters/09-permissions/Permissions";
import { narrations as permissionsNarrations } from "../chapters/09-permissions/narrations";
import SkillNight from "../chapters/10-skill-night/SkillNight";
import { narrations as skillNightNarrations } from "../chapters/10-skill-night/narrations";
import Recovery from "../chapters/11-recovery/Recovery";
import { narrations as recoveryNarrations } from "../chapters/11-recovery/narrations";
import Ladder from "../chapters/12-ladder/Ladder";
import { narrations as ladderNarrations } from "../chapters/12-ladder/narrations";

/**
 * Order = order of presentation.
 *
 * 每章必须提供 `narrations: Narration[]`；它的长度就是该章的 step 数，
 * 没有单独的 totalSteps。音频合成、运行时步进、章节里 `step === N` 的
 * 分支因此不可能漂移。画面样式全部来自主题 token，章节不硬编码调色板。
 */
export const CHAPTERS: ChapterDef[] = [
  {
    id: "coldopen",
    title: "凌晨三点的一条 issue",
    narrations: coldopenNarrations,
    Component: Coldopen,
  },
  {
    id: "routing",
    title: "模型路由：谁在选大脑",
    narrations: routingNarrations,
    Component: Routing,
  },
  {
    id: "computer",
    title: "同一台云端电脑",
    narrations: computerNarrations,
    Component: Computer,
  },
  {
    id: "mission",
    title: "任务、证据与工作区",
    narrations: missionNarrations,
    Component: Mission,
  },
  {
    id: "roster",
    title: "一个 Chief 加四个专家",
    narrations: rosterNarrations,
    Component: Roster,
  },
  {
    id: "states",
    title: "让流程变成状态机",
    narrations: statesNarrations,
    Component: States,
  },
  {
    id: "delegate",
    title: "把编码外包到隔离环境",
    narrations: delegateNarrations,
    Component: Delegate,
  },
  {
    id: "review",
    title: "给评审者证据",
    narrations: reviewNarrations,
    Component: Review,
  },
  {
    id: "permissions",
    title: "权限写在提示词外面",
    narrations: permissionsNarrations,
    Component: Permissions,
  },
  {
    id: "skill-night",
    title: "存成技能，再开夜班",
    narrations: skillNightNarrations,
    Component: SkillNight,
  },
  {
    id: "recovery",
    title: "失败要能看清也能接手",
    narrations: recoveryNarrations,
    Component: Recovery,
  },
  {
    id: "ladder",
    title: "先跑一条 bug，再谈夜班",
    narrations: ladderNarrations,
    Component: Ladder,
  },
];
