# GroundingPI Project Page

This repository hosts the official project website for **GroundingPI: A Grounding Foundation Model towards Physical Intelligence with Visual Primitives**.

> **Online:** **<https://groundingpi.github.io/>**

[![Paper](https://img.shields.io/badge/Paper-arXiv-5B358B?logo=arxiv&logoColor=%23B31B1B)](https://arxiv.org/abs/2609.39601)
[![Code](https://img.shields.io/badge/Code-GitHub-30263F?logo=github)](https://github.com/groundingpi/GroundingPI)
[![Model](https://img.shields.io/badge/Model-Hugging_Face-91C331?logo=huggingface)](https://huggingface.co/GroundingPI/GroundingPI)
[![Demo](https://img.shields.io/badge/Demo-HF_Space-784EBC?logo=huggingface)](https://huggingface.co/spaces/GroundingPI/GroundingPI)

---

## Resources

| Resource | Link |
|:---|:---|
| 🌐 Project page | <https://groundingpi.github.io/> |
| 📄 Paper (arXiv) | <https://arxiv.org/abs/2609.39601> |
| 💻 Code | <https://github.com/groundingpi/GroundingPI> |
| 🤗 Model weights | <https://huggingface.co/GroundingPI/GroundingPI> |
| 🎯 Online demo (HF Space) | <https://huggingface.co/spaces/GroundingPI/GroundingPI> |
| 🎬 Demo video | [demo.mp4](https://huggingface.co/GroundingPI/GroundingPI/resolve/aca9bde34a146cf0510e7f8732d4766169105194/assets/demo.mp4) |

## Repository structure

```
.
├── index.html                    # page markup + inline scripts (scrollspy, copy, lazy embed)
├── styles.css                    # all styling, official palette in :root
└── assets/
    ├── favicon.svg               # browser tab icon (box + point mark)
    ├── teaser.jpg                # paper Figure 1 (1800 px wide)
    ├── architecture.png          # paper Figure 2 — model architecture
    ├── training.png              # paper Figure 4 — training pipeline
    ├── grounding-performance.png # paper Figure 5 — capability rose chart
    ├── physical-intelligence.png # paper Figure 6 — transfer results
    ├── demo-poster.jpg           # local fallback poster for the demo video
    └── icons/                    # simple-icons style SVGs (arXiv, GitHub, Hugging Face)
```

## Deployment

The site is served by **GitHub Pages** from the `main` branch root — pushing to `main` deploys automatically (usually within a minute). There is nothing to build.

## Updating content

- **Text / links / sections** — edit [`index.html`](index.html); all external links live in the hero button row, the demo section, and the footer.
- **Numbers / figures** — replace the matching file in `assets/` (keep the same filename), or update the `<img>` tags. Figure images were extracted from the paper PDF at 200 dpi.
- **Colors** — edit the CSS custom properties in `:root` in [`styles.css`](styles.css).
- **Demo video / poster** — hot-linked from the [GroundingPI model repo](https://huggingface.co/GroundingPI/GroundingPI) on Hugging Face. `assets/demo-poster.jpg` is a local fallback that renders when HF is unreachable; the remote poster frame is swapped in automatically when it loads.
- **HF Space embed** — mounted on demand (click *Load demo*) so the page never blocks on a slow iframe.

## Citation

If you find GroundingPI useful in your research, please cite:

```bibtex
@misc{yu2026groundingpigroundingfoundationmodel,
  title   = {{GroundingPI}: A Grounding Foundation Model towards Physical Intelligence with Visual Primitives},
  author  = {Qize Yu and Lianrui Fan and Boyu Chen and Jiaqi Liang and Xini Ding and Yue Chen and Zetian Song and Yuran Wang and Yi Zou and Kaixuan Wang and Tianxing Chen and Wenxuan Song and Bohan Zhou and Mingleyang Li and Siqiao Huang and Yuqi Ye and Caigao Jiang and Wei Wei and Ruihai Wu and Hang Zhang and Yixiao Ge and Shuchang Zhou and Shilong Liu and Xianming Liu and Ping Luo and Shiyu Huang},
  year    = {2026},
  eprint  = {2609.39601},
  archivePrefix = {arXiv},
  primaryClass  = {cs.CV},
  url     = {https://arxiv.org/abs/2609.39601},
}
```

## License

Site content in this repository is released under the same license as the main [GroundingPI](https://github.com/groundingpi/GroundingPI) repository — see [LICENSE](LICENSE). Paper figures are © the GroundingPI authors.
