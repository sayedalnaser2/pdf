# imggen – control a local AI image generator from Python

One file (`imggen.py`), Python 3.8+, no dependencies. Works with **AUTOMATIC1111 / Forge / SD.Next** (start it with `--api`)
and **ComfyUI**, and finds which one is running by itself.

```bash
python imggen.py ping
python imggen.py models
python imggen.py "a red fox in the snow, golden hour" --steps 30 --count 4
python imggen.py gen "portrait, studio light" -n "blurry, low quality" -W 768 -H 1024 --model dreamshaper
python imggen.py gen "make it a watercolor" --init-image photo.png --strength 0.55     # image-to-image
python imggen.py --url http://192.168.1.20:7860 "a cat"                                 # generator on another PC
```
Images go to `./outputs/` as `<time>_<seed>_<n>.png` with a `.json` file of the settings (use `--seed` with the same
number to reproduce one). Set `IMGGEN_URL` / `IMGGEN_BACKEND` to avoid typing `--url` / `--backend`.

From your own code:
```python
from imggen import connect, Params, save_results
gen = connect()                                  # or connect("comfyui", "http://127.0.0.1:8188")
p = Params(prompt="a lighthouse at dusk", steps=28, count=2, model="dreamshaper")
save_results(gen.generate(p), p, "outputs")
```
Not supported: Ollama and other text-only servers (they don't make images).
