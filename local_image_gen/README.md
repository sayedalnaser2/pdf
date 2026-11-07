# imggen – control a local AI image generator from Python

One file (`imggen.py`), Python 3.8+, no dependencies. Works with **FastSD CPU**, **AUTOMATIC1111 / Forge / SD.Next**
and **ComfyUI**, and finds which one is running by itself.

## FastSD CPU
1. Start its API server (leave it running): in the FastSD CPU folder run `python src/app.py --api`
   (or `start-webserver.bat` / `start-webserver.sh`). It listens on `http://127.0.0.1:8000` (`--port N` to change).
2. Generate:
```bash
python imggen.py ping
python imggen.py models                                   # models your FastSD CPU offers
python imggen.py "a red fox in the snow, golden hour"     # defaults = the FastSD web page: 4 steps, guidance 1.5, 512x512
python imggen.py "a red fox in the snow" --steps 4 --count 4 --seed 42
python imggen.py "portrait, studio light" --openvino --tiny-vae          # faster on Intel CPUs
python imggen.py "city at night" --model LCM_Dreamshaper                  # part of the model name is enough
python imggen.py "make it a watercolor" --init-image photo.png --strength 0.5
python imggen.py "a cat" --extra clip_skip=2 --extra use_safety_checker=true   # any other /api/generate field
```
## Better quality
```bash
python imggen.py "a red fox in the snow" --quality good      # 4 steps (same as the defaults)
python imggen.py "a red fox in the snow" --quality high      # + a second "refine" pass that adds detail
python imggen.py "a red fox in the snow" --quality best      # + enlarge x1.5, then refine  (needs: pip install pillow)
python imggen.py compare "a red fox in the snow" --seed 42   # renders the SAME seed at draft/good/high/best and prints the times
```
Run `compare` once with your real model and look at the pictures, then use the level you like. Levels: `draft` (fastest) <
`good` < `high` < `best` (slowest, on a CPU several times longer than `good`). You can mix with your own numbers
(`--quality high --steps 6 --cfg 2`): anything you type beats the preset. `--refine`, `--upscale 1.5` and
`--refine-strength 0.3` (lower = keeps the first image more) work on their own too.
For quality that no setting can add, pick a better model: `python imggen.py models`, then `--model <part of name>`.

Notes: FastSD makes **JPEG** files. The first image (and every model change) loads or downloads the model, which can take
minutes on a CPU; after that it is fast. The web-page settings for CLIP skip, token merging and seed can be sent with `--extra clip_skip=1 --extra token_merging=0`;
`--seed N` turns the fixed seed on. Turbo/LCM models want few steps; a negative prompt only has an effect when `--cfg` is above 1. Your FastSD CPU web page and this script share one server, so close long runs
before starting another.

## AUTOMATIC1111 / Forge and ComfyUI
```bash
python imggen.py gen "portrait, studio light" -n "blurry, low quality" -W 768 -H 1024 --steps 30 --model dreamshaper
python imggen.py --backend comfyui "a cat"
python imggen.py --url http://192.168.1.20:7860 "a cat"        # generator on another PC
```
(A1111/Forge must be started with `--api`.)

## Output and settings
Images go to `./outputs/` as `<time>_<seed>_<n>.png|jpg`, each with a `.json` of the settings (use the same `--seed` to
reproduce one; FastSD only reports a seed if you set one). `IMGGEN_URL` / `IMGGEN_BACKEND` set defaults.

## From your own code
```python
from imggen import connect, Params, save_results
gen = connect()                                  # or connect("fastsd", "http://127.0.0.1:8000")
p = Params(prompt="a lighthouse at dusk", steps=4, count=2)
save_results(gen.generate(p), gen.resolve(p), "outputs")     # resolve() fills in the real defaults
```
Not supported: Ollama and other text-only servers (they don't make images).
