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
python imggen.py "a red fox in the snow, golden hour"     # 1 step, guidance 1 = FastSD's fast defaults
python imggen.py "a red fox in the snow" --steps 4 --count 4 --seed 42
python imggen.py "portrait, studio light" --openvino --tiny-vae          # faster on Intel CPUs
python imggen.py "city at night" --model LCM_Dreamshaper                  # part of the model name is enough
python imggen.py "make it a watercolor" --init-image photo.png --strength 0.5
python imggen.py "a cat" --extra clip_skip=2 --extra use_safety_checker=true   # any other /api/generate field
```
Notes: FastSD makes **JPEG** files. The first image (and every model change) loads or downloads the model, which can take
minutes on a CPU; after that it is fast. Turbo/LCM models want 1-4 steps and guidance about 1; a negative prompt only has
an effect when `--cfg` is above 1. Your FastSD CPU web page and this script share one server, so close long runs
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
