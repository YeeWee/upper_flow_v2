import { join } from "node:path";
import { requireApproval } from "../lib/approval";
import { readBeats } from "../lib/beats";
import type { BeatsManifest } from "../lib/beats";
import { runCheckCommand } from "./check";
import { AvpError } from "../lib/errors";
import { relativeTo, writeJson } from "../lib/fs";
import { projectPaths, readLedger } from "../lib/project";
import {
  makeThumbnails,
  renderArtifacts,
  renderVideo,
  writeRenderReceipt,
} from "../lib/render-media";
import { inputHashFor } from "../lib/status";
import { recordStep } from "../lib/state";
import { runComposeCommand } from "./compose";

export interface RenderOptions {
  brief?: boolean;
  afterPlan?: boolean;
}

export interface DurationRow {
  chapter: string;
  beats: number;
  durationMs: number;
}

export interface RenderResult {
  brief: boolean;
  totalMs: number;
  chapters: DurationRow[];
  check: { errors: number; warnings: number; reports: number };
  thumbnails?: string[];
  output?: string;
  receipt?: string;
  contactSheet?: string;
  stillReport?: string;
  staticBeats?: string[];
}

function summarizeChapters(manifest: BeatsManifest): DurationRow[] {
  const rows = new Map<string, DurationRow>();
  for (const beat of manifest.beats) {
    const row = rows.get(beat.chapter) ?? {
      chapter: beat.chapter,
      beats: 0,
      durationMs: 0,
    };
    row.beats += 1;
    row.durationMs += beat.durationMs ?? 0;
    rows.set(beat.chapter, row);
  }
  return [...rows.values()];
}

async function assertCheckPassed(root: string): Promise<{
  errors: number;
  warnings: number;
  reports: number;
}> {
  const check = await runCheckCommand(root);
  if (check.errors.length > 0) {
    throw new AvpError(
      "check-failed",
      `检查未通过（${check.errors.length} 个 error），拒绝渲染。` +
        `\n先运行 avp check --json 看每条 error 的 beat / field / fix。`,
      {
        errors: check.errors.length,
        findings: check.errors.map((finding) => ({
          id: finding.id,
          beatId: finding.beatId,
          message: finding.message,
          fix: finding.fix,
        })),
      },
    );
  }
  return {
    errors: 0,
    warnings: check.warnings.length,
    reports: check.reports.length,
  };
}

export async function runRenderCommand(
  root: string,
  options: RenderOptions = {},
): Promise<RenderResult> {
  const ledger = readLedger(root);
  const paths = projectPaths(root);
  if (options.afterPlan) requireApproval(root);

  // 合成稿是可重建派生物：渲染前先对齐，人不需要记得再跑一次 compose。
  runComposeCommand(root);
  const summary = await assertCheckPassed(root);

  const manifest = readBeats(root);
  const totalMs = manifest.beats.reduce(
    (sum, beat) => sum + (beat.durationMs ?? 0),
    0,
  );
  const chapters = summarizeChapters(manifest);

  if (options.brief) {
    const thumbs = makeThumbnails(
      paths.composition,
      join(root, "output", "brief"),
      totalMs,
    );
    return {
      brief: true,
      totalMs,
      chapters,
      check: summary,
      thumbnails: thumbs.files.map((file) => relativeTo(root, file)),
    };
  }

  const output = join(root, "output", "output.mp4");
  const render = renderVideo(paths.composition, output, totalMs);
  const artifacts = renderArtifacts(
    output,
    manifest.beats,
    join(root, "output"),
  );
  const receipt = writeRenderReceipt(paths, manifest, render, artifacts);
  writeJson(paths.receipt, receipt);

  recordStep(root, "render", inputHashFor("render", paths, ledger) ?? "", [
    "output/output.mp4",
    "output/receipt.json",
  ]);

  return {
    brief: false,
    totalMs: render.durationMs,
    chapters,
    check: summary,
    output: relativeTo(root, output),
    receipt: relativeTo(root, paths.receipt),
    contactSheet: relativeTo(root, artifacts.contactSheet.file),
    stillReport: relativeTo(root, artifacts.stillReport.file),
    staticBeats: artifacts.stillReport.staticBeats,
  };
}
