import os
import sys
import numpy as np
import soundfile as sf

from kokoro_onnx import Kokoro
from misaki import zh

def generate_audio():
    model_path = os.path.join(os.environ.get("USERPROFILE", ""), ".cache", "hyperframes", "tts", "models", "kokoro-v1.0.onnx")
    voices_path = os.path.join(os.environ.get("USERPROFILE", ""), ".cache", "hyperframes", "tts", "voices", "voices-v1.0.bin")

    if not os.path.exists(model_path):
        print(f"ERROR: Model not found at {model_path}")
        return
    if not os.path.exists(voices_path):
        print(f"ERROR: Voices not found at {voices_path}")
        return

    print("Loading Kokoro model...")
    kokoro = Kokoro(model_path, voices_path)

    g2p = zh.ZHG2P()

    texts = [
        "你把需求丢给 AI，它写代码。",
        "也产生幻觉。跳过测试。自由发挥。",
        "所以有人做了一个框架，叫 trae-harness。",
        "不确定每个 Agent 的边界，就一定有幻觉的模糊空间。",
        "它怎么解决的？四个字：步骤隔离。",
        "每个子 Agent 只做当前步。不知道下一步是什么。",
        "还有信息瓶颈。模块间只传 200 token。",
        "上下文不到 400 token。你想让它自由发挥？没门。",
        "全程三个子 Agent 并行跑。辩论、审核、开发。",
        "铁面编排器坐镇中间——Gate 不通过，别想往前走一步。",
        "说完架构，看效果。",
        "同一个模型，DeepSeek V4 Pro。11 轮 A/B 实验。",
        "代码正确率从 90% 拉到 100%。满分。一个 bug 都没放过。",
        "测试断言密度 28 条变 124 条，翻了四倍。",
        "覆盖率 62% 干到 85%。代码规范违规直接砍掉六成。",
        "安全防御覆盖翻了三倍。同类 bug 复发率降了 91.7%。",
        "性能加速 4.6 倍。SWE-bench 回归从两个 bug 干到零。",
        "花两万 token 跑流程，净省十万。ROI 529%。",
        "复杂度越高回报越大。L3 级任务 ROI 能超一千。",
        "v2.0 不止做代码。项目类型自适应。视频上 VISUAL_GATE，设计走视觉验收。8 个模板，11 个 Agent 角色。",
        "独立验收引擎 trae-acceptance。浏览器自动化加视觉检查，再加双轨复盘。三层保险。",
        "trae-harness。用确定性对抗模糊。用规则防幻觉。用 11 轮实验数据量化给你看。GitHub 搜 zzzkeepdd slash trae-harness。",
    ]

    base = os.path.join("d:", os.sep, "动画", "trae-harness-video", "presentation", "public", "audio")
    dirs = ["coldopen", "architecture", "results", "v2-and-cta"]
    idx = 0

    for di, d in enumerate(dirs):
        dpath = os.path.join(base, d)
        os.makedirs(dpath, exist_ok=True)
        narr_count = [5, 6, 8, 3][di]
        for i in range(narr_count):
            text = texts[idx]
            path = os.path.join(dpath, f"{i + 1}.wav")

            phonemes, _ = g2p(text)
            samples, sample_rate = kokoro.create(
                phonemes,
                voice="zf_xiaoxiao",
                is_phonemes=True,
                trim=False,
            )
            sf.write(path, samples, sample_rate)
            print(f"OK [{idx+1}/22]: {os.path.basename(path)}")
            idx += 1

    print(f"DONE: {idx} files generated with zf_xiaoxiao voice")

if __name__ == "__main__":
    generate_audio()
