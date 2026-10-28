# 张力计划写在 outline，不写进 script.md

全片的埋扣 / 还扣 / 章节 re-hook / interrupt 位置，作为结构化行写进 `outline.md`（`> **埋扣**` / `> **总还扣**` / 每章 `> **张力线**`），不进 `script.md`。理由是 `script.md` 的每个 `---` 块必须与 `narrations.ts` 的 `say` **归一化后**相等（`plan` 的 `script-drift`：抹空白 + NFKC，标点不可差），任何标记注释都会污染 TTS 输入；而 `outline.md` 已经是「只规划节奏与信息密度」的文件。拍号（`第 N 拍`）而非秒数，因为秒随 TTS 实测漂移、拍号不变。

## 后果

- 张力计划与稿子可以各自改：改稿不必动计划字段，改计划不必重新 TTS。
- `check` 会读 `outline.md` 的张力计划出张力 findings（re-hook 缺失 / 还扣间隔 / interrupt 间隔 / 连续数字拍 / 节奏均匀）；声明一致性（缺字段、拍号越界、总还扣在末拍、章首 re-hook）仍只由 `plan` 负责。
- 只要 `outline.md` 有可解析的已知章节标题，张力计划就是 `plan` 的格式契约；`<3 分钟` 档只表示不做留存优化，不是可以跳过契约。没有 `outline.md` 或没有可识别章节时，`plan` 把 outline 当自由格式跳过。
- `check` 只能验声明与拍号自洽，判断不了某句话是否真是好钩子。
- 未来若要把张力计划移进独立 `story.md`，要迁移所有已有项目，并新写一个解析器与漂移检查。
