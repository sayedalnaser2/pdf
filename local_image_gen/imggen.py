#!/usr/bin/env python3
"""imggen - control a local AI image generator from Python or the command line.

Supports (auto-detected):
  * FastSD CPU                        start it with: python src/app.py --api   (default http://127.0.0.1:8000)
  * AUTOMATIC1111 / Forge / SD.Next   start it with the --api flag             (default http://127.0.0.1:7860)
  * ComfyUI                                                                    (default http://127.0.0.1:8188)

Only the Python standard library is used, so there is nothing to install.

Command line
    python imggen.py ping
    python imggen.py models
    python imggen.py gen "a red fox in the snow, golden hour" --steps 4 --count 4
    python imggen.py gen "portrait, studio light" -n "blurry, low quality" -W 768 -H 1024 --model dreamshaper
    python imggen.py gen "make it a watercolor" --init-image photo.png --strength 0.55

As a library
    from imggen import connect, Params, save_results
    gen = connect()                                   # auto-detect, or connect("a1111", "http://127.0.0.1:7860")
    results = gen.generate(Params(prompt="a lighthouse at dusk", steps=28, count=2))
    save_results(results, Params(prompt="a lighthouse at dusk"), "outputs")
"""
from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
import random
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
import warnings
from dataclasses import asdict, dataclass, replace
from pathlib import Path
from typing import Callable, List, Optional

DEFAULT_URLS = {"fastsd": "http://127.0.0.1:8000", "a1111": "http://127.0.0.1:7860", "comfyui": "http://127.0.0.1:8188"}
# Never route local traffic through an HTTP proxy.
_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


class GeneratorError(RuntimeError):
    """Anything that goes wrong talking to the generator, with a message fit to show a user."""


@dataclass
class Params:
    prompt: str
    negative: str = ""
    width: Optional[int] = None         # width/height/steps/cfg: None = the generator's usual default
    height: Optional[int] = None
    steps: Optional[int] = None
    cfg: Optional[float] = None
    seed: int = -1                      # -1 = random
    sampler: Optional[str] = None       # backend default if None
    scheduler: Optional[str] = None     # ComfyUI only
    count: int = 1                      # how many images
    model: Optional[str] = None         # checkpoint name (substring match is fine)
    init_image: Optional[str] = None    # path -> image-to-image
    strength: float = 0.6               # img2img denoising strength
    openvino: bool = False              # FastSD CPU only: use the OpenVINO models (often faster on Intel CPUs)
    tiny_vae: bool = False              # FastSD CPU only: tiny auto-encoder (faster, slightly less detail)
    extra: Optional[dict] = None        # FastSD CPU only: any other /api/generate field, e.g. {"clip_skip": 2}


@dataclass
class Result:
    image: bytes
    seed: int


def _http(url: str, data=None, timeout: float = 30, raw: Optional[bytes] = None, headers: Optional[dict] = None) -> bytes:
    body = raw if raw is not None else (None if data is None else json.dumps(data).encode())
    hdrs = dict(headers or {})
    if data is not None:
        hdrs["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=hdrs)
    try:
        with _OPENER.open(req, timeout=timeout) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        detail = e.read()[:800].decode(errors="replace")
        hint = " (start AUTOMATIC1111/Forge with the --api flag)" if e.code == 404 and "/sdapi/" in url else ""
        raise GeneratorError(f"HTTP {e.code} from {url}{hint}: {detail}") from None
    except (urllib.error.URLError, OSError) as e:
        raise GeneratorError(f"Cannot reach {url} ({getattr(e, 'reason', e)}). Is the generator running?") from None


def _pick(options: List[str], wanted: str, what: str) -> str:
    """Exact match, else unique case-insensitive substring match."""
    for o in options:
        if o == wanted:
            return o
    hits = [o for o in options if wanted.lower() in o.lower()]
    if len(hits) == 1:
        return hits[0]
    if not hits:
        raise GeneratorError(f"No {what} matches '{wanted}'. Available: {', '.join(options) or '(none)'}")
    raise GeneratorError(f"'{wanted}' matches several {what}s: {', '.join(hits)}")


def resolve(p: Params, defaults: dict) -> Params:
    """Fill every None setting with the backend's default."""
    return replace(p, **{k: v for k, v in defaults.items() if getattr(p, k) is None})


def _round8(v: int) -> int:
    return max(64, int(v / 8 + 0.5) * 8)   # nearest multiple of 8, halves round up


# --------------------------------------------------------------------------- AUTOMATIC1111 / Forge
class A1111:
    name = "a1111"
    defaults = {"width": 512, "height": 512, "steps": 25, "cfg": 7.0}

    def resolve(self, p: Params) -> Params:
        return resolve(p, self.defaults)

    def __init__(self, url: str = DEFAULT_URLS["a1111"]):
        self.url = url.rstrip("/")

    def _get(self, path, timeout=30):
        return json.loads(_http(self.url + path, timeout=timeout))

    def ping(self):
        self._get("/sdapi/v1/options")

    def models(self) -> List[str]:
        return [m["title"] for m in self._get("/sdapi/v1/sd-models")]

    def samplers(self) -> List[str]:
        return [s["name"] for s in self._get("/sdapi/v1/samplers")]

    def set_model(self, wanted: str) -> str:
        title = _pick(self.models(), wanted, "model")
        _http(self.url + "/sdapi/v1/options", {"sd_model_checkpoint": title}, timeout=900)  # loading can be slow
        return title

    def generate(self, p: Params, on_progress: Optional[Callable[[float, float], None]] = None) -> List[Result]:
        p = resolve(p, self.defaults)
        if p.model:
            self.set_model(p.model)
        payload = {
            "prompt": p.prompt, "negative_prompt": p.negative, "width": _round8(p.width), "height": _round8(p.height),
            "steps": p.steps, "cfg_scale": p.cfg, "seed": p.seed, "n_iter": p.count, "batch_size": 1,
            "send_images": True, "save_images": False,
        }
        if p.sampler:
            payload["sampler_name"] = p.sampler
        endpoint = "/sdapi/v1/txt2img"
        if p.init_image:
            endpoint = "/sdapi/v1/img2img"
            payload["init_images"] = [base64.b64encode(Path(p.init_image).read_bytes()).decode()]
            payload["denoising_strength"] = p.strength

        stop = threading.Event()
        if on_progress:
            threading.Thread(target=self._poll, args=(stop, on_progress), daemon=True).start()
        try:
            resp = json.loads(_http(self.url + endpoint, payload, timeout=3600))
        finally:
            stop.set()

        info = json.loads(resp["info"]) if isinstance(resp.get("info"), str) else (resp.get("info") or {})
        seeds = info.get("all_seeds") or [info.get("seed", p.seed)] * len(resp["images"])
        images = resp["images"]
        if len(images) == len(seeds) + 1:      # A1111 prepends a contact-sheet grid for batches
            images = images[1:]
        return [Result(base64.b64decode(b.split(",", 1)[-1]), int(s)) for b, s in zip(images, seeds)]

    def _poll(self, stop: threading.Event, cb):
        while not stop.wait(0.7):
            try:
                d = self._get("/sdapi/v1/progress?skip_current_image=true", timeout=5)
                cb(float(d.get("progress", 0)), float(d.get("eta_relative", 0)))
            except Exception:
                pass


# --------------------------------------------------------------------------- ComfyUI
class ComfyUI:
    name = "comfyui"
    defaults = {"width": 512, "height": 512, "steps": 25, "cfg": 7.0}

    def resolve(self, p: Params) -> Params:
        return resolve(p, self.defaults)

    def __init__(self, url: str = DEFAULT_URLS["comfyui"]):
        self.url = url.rstrip("/")

    def _get(self, path, timeout=30):
        return json.loads(_http(self.url + path, timeout=timeout))

    def ping(self):
        self._get("/system_stats")

    def _choices(self, node: str, field: str) -> List[str]:
        return self._get(f"/object_info/{node}")[node]["input"]["required"][field][0]

    def models(self) -> List[str]:
        return self._choices("CheckpointLoaderSimple", "ckpt_name")

    def samplers(self) -> List[str]:
        return self._choices("KSampler", "sampler_name")

    def _upload(self, path: str) -> str:
        p = Path(path)
        boundary = uuid.uuid4().hex
        ctype = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
        body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"{p.name}\"\r\nContent-Type: {ctype}\r\n\r\n").encode() \
            + p.read_bytes() + (f"\r\n--{boundary}\r\nContent-Disposition: form-data; name=\"overwrite\"\r\n\r\ntrue\r\n--{boundary}--\r\n").encode()
        out = json.loads(_http(self.url + "/upload/image", raw=body, headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}))
        return out["name"]

    def _graph(self, p: Params, seed: int, ckpt: str, uploaded: Optional[str]) -> dict:
        g = {
            "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": ckpt}},
            "6": {"class_type": "CLIPTextEncode", "inputs": {"text": p.prompt, "clip": ["4", 1]}},
            "7": {"class_type": "CLIPTextEncode", "inputs": {"text": p.negative, "clip": ["4", 1]}},
            "3": {"class_type": "KSampler", "inputs": {
                "seed": seed, "steps": p.steps, "cfg": p.cfg, "sampler_name": p.sampler or "euler",
                "scheduler": p.scheduler or "normal", "positive": ["6", 0], "negative": ["7", 0],
                "latent_image": ["5", 0], "denoise": 1.0}},
            "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
            "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "imggen", "images": ["8", 0]}},
        }
        if uploaded:
            g["10"] = {"class_type": "LoadImage", "inputs": {"image": uploaded}}
            g["5"] = {"class_type": "VAEEncode", "inputs": {"pixels": ["10", 0], "vae": ["4", 2]}}
            g["3"]["inputs"]["denoise"] = p.strength
        else:
            g["5"] = {"class_type": "EmptyLatentImage", "inputs": {"width": _round8(p.width), "height": _round8(p.height), "batch_size": 1}}
        return g

    def generate(self, p: Params, on_progress: Optional[Callable[[float, float], None]] = None) -> List[Result]:
        p = resolve(p, self.defaults)
        ckpt = _pick(self.models(), p.model, "model") if p.model else self.models()[0]
        uploaded = self._upload(p.init_image) if p.init_image else None
        base = random.randint(0, 2**32 - 1) if p.seed < 0 else p.seed
        client_id = uuid.uuid4().hex
        results: List[Result] = []
        for i in range(p.count):
            seed = base + i
            q = json.loads(_http(self.url + "/prompt", {"prompt": self._graph(p, seed, ckpt, uploaded), "client_id": client_id}))
            for img in self._wait(q["prompt_id"]):
                qs = urllib.parse.urlencode({k: img[k] for k in ("filename", "subfolder", "type")})
                results.append(Result(_http(f"{self.url}/view?{qs}", timeout=120), seed))
            if on_progress:
                on_progress((i + 1) / p.count, 0)
        return results

    def _wait(self, prompt_id: str, timeout: float = 3600) -> List[dict]:
        end = time.time() + timeout
        while time.time() < end:
            h = self._get(f"/history/{prompt_id}").get(prompt_id)
            if h:
                st = h.get("status", {})
                if st.get("status_str") == "error":
                    msgs = [m for m in st.get("messages", []) if m and m[0] == "execution_error"]
                    raise GeneratorError("ComfyUI failed: " + (json.dumps(msgs[0][1])[:500] if msgs else "unknown error"))
                imgs = [i for o in h.get("outputs", {}).values() for i in o.get("images", []) if i.get("type") == "output"]
                if imgs:
                    return imgs
            time.sleep(0.5)
        raise GeneratorError("Timed out waiting for ComfyUI.")


# --------------------------------------------------------------------------- FastSD CPU
class FastSD:
    """FastSD CPU's web API (python src/app.py --api). It makes JPEG images and uses very few steps (1-4)."""
    name = "fastsd"
    defaults = {"width": 512, "height": 512, "steps": 1, "cfg": 1.0}

    def resolve(self, p: Params) -> Params:
        return resolve(p, self.defaults)
    LCM_LORA = "latent-consistency/lcm-lora-sdv1-5"

    def __init__(self, url: str = DEFAULT_URLS["fastsd"]):
        self.url = url.rstrip("/")

    def _get(self, path, timeout=30):
        return json.loads(_http(self.url + path, timeout=timeout))

    def ping(self):
        msg = str(self._get("/api/").get("message", ""))
        if "FastSD" not in msg:
            raise GeneratorError(f"{self.url} is not a FastSD CPU server")

    def _catalog(self) -> dict:
        return self._get("/api/models")

    def models(self) -> List[str]:
        c = self._catalog()
        return list(dict.fromkeys(c.get("lcm_models", []) + c.get("openvino_models", []) + c.get("stable_diffusion", [])))

    def describe_models(self) -> str:
        c = self._catalog()
        names = {"lcm_models": "Models (use --model)", "openvino_models": "OpenVINO models (use --openvino --model)",
                 "stable_diffusion": "Stable Diffusion + LCM-LoRA (use --model)"}
        return "\n\n".join(f"{title}:\n  " + "\n  ".join(c.get(k, [])) for k, title in names.items() if c.get(k))

    def samplers(self) -> List[str]:
        raise GeneratorError("FastSD CPU has no sampler setting.")

    def generate(self, p: Params, on_progress: Optional[Callable[[float, float], None]] = None) -> List[Result]:
        p = resolve(p, self.defaults)
        if p.negative and p.cfg <= 1:
            warnings.warn("FastSD CPU ignores the negative prompt unless --cfg is above 1.")
        payload = {
            "prompt": p.prompt, "negative_prompt": p.negative, "image_width": _round8(p.width), "image_height": _round8(p.height),
            "inference_steps": p.steps, "guidance_scale": p.cfg, "number_of_images": p.count,
            "use_seed": p.seed >= 0, "seed": p.seed if p.seed >= 0 else 123123,
            "use_openvino": p.openvino, "use_tiny_auto_encoder": p.tiny_vae, "diffusion_task": "text_to_image",
        }
        if p.model:
            c = self._catalog()
            if p.openvino:
                payload["openvino_lcm_model_id"] = _pick(c.get("openvino_models", []), p.model, "OpenVINO model")
            elif any(p.model.lower() in m.lower() for m in c.get("lcm_models", [])):
                payload["lcm_model_id"] = _pick(c.get("lcm_models", []), p.model, "model")
            else:           # a plain Stable Diffusion checkpoint is run through an LCM-LoRA
                payload["use_lcm_lora"] = True
                payload["lcm_lora"] = {"base_model_id": _pick(c.get("stable_diffusion", []) + c.get("lcm_models", []), p.model, "model"),
                                       "lcm_lora_id": self.LCM_LORA}
        if p.init_image:
            payload["diffusion_task"] = "image_to_image"
            payload["init_image"] = base64.b64encode(Path(p.init_image).read_bytes()).decode()
            payload["strength"] = p.strength
        payload.update(p.extra or {})
        # The first run (or a model change) downloads/loads the model, which can take several minutes on a CPU.
        resp = json.loads(_http(self.url + "/api/generate", payload, timeout=3600))
        if resp.get("error") and not resp.get("images"):
            raise GeneratorError(f"FastSD CPU: {resp['error']}")
        return [Result(base64.b64decode(b.split(",", 1)[-1]), p.seed) for b in resp.get("images", [])]


# --------------------------------------------------------------------------- connecting / saving
def connect(backend: str = "auto", url: Optional[str] = None):
    """Return a ready client. backend: 'fastsd', 'a1111', 'comfyui' or 'auto'."""
    classes = {"fastsd": FastSD, "a1111": A1111, "comfyui": ComfyUI}
    if backend != "auto":
        c = classes[backend](url or DEFAULT_URLS[backend])
        c.ping()
        return c
    if url:      # guess from the port first, then try them all
        port = urllib.parse.urlparse(url).port
        first = {8000: "fastsd", 7860: "a1111", 8188: "comfyui"}.get(port)
        order = ([first] if first else []) + [n for n in ("fastsd", "a1111", "comfyui") if n != first]
        tries = [(n, url) for n in order]
    else:
        tries = [(n, DEFAULT_URLS[n]) for n in ("fastsd", "a1111", "comfyui")]
    for name, u in tries:
        try:
            c = classes[name](u)
            c.ping()
            return c
        except GeneratorError:
            continue
    raise GeneratorError("No generator found. Start FastSD CPU (python src/app.py --api), AUTOMATIC1111/Forge (with --api) or ComfyUI, or pass --url/--backend. "
                         "Tried: " + ", ".join(u for _, u in tries))


def save_results(results: List[Result], p: Params, outdir: str = "outputs", meta: bool = True) -> List[Path]:
    out = Path(outdir)
    out.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%d-%H%M%S")
    paths = []
    for i, r in enumerate(results, 1):
        ext = ".jpg" if r.image[:2] == b"\xff\xd8" else ".png"      # FastSD CPU returns JPEG
        path = out / f"{stamp}_{r.seed if r.seed >= 0 else 'rand'}_{i}{ext}"
        path.write_bytes(r.image)
        if meta:
            path.with_suffix(".json").write_text(json.dumps({**asdict(p), "seed": r.seed}, indent=2))
        paths.append(path)
    return paths


def _open_file(path: Path):
    try:
        if sys.platform.startswith("win"):
            os.startfile(path)  # type: ignore[attr-defined]
        else:
            subprocess.Popen(["open" if sys.platform == "darwin" else "xdg-open", str(path)])
    except Exception:
        pass


# --------------------------------------------------------------------------- command line
def _progress_printer():
    def show(frac: float, eta: float):
        eta_txt = f"  ~{eta:.0f}s left" if eta else ""
        sys.stderr.write(f"\r  generating... {frac * 100:3.0f}%{eta_txt}   ")
        sys.stderr.flush()
    return show


def main(argv: Optional[List[str]] = None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    commands = {"gen", "models", "samplers", "ping"}
    i = 0                                           # `imggen.py [--url X] "a cat"` == `imggen.py [--url X] gen "a cat"`
    while i < len(argv):
        if argv[i] in ("--url", "--backend"):
            i += 2                                  # skip the option and its value
        elif argv[i].startswith("-"):
            i += 1
        else:
            if argv[i] not in commands:
                argv.insert(i, "gen")
            break

    ap = argparse.ArgumentParser(description="Control a local AI image generator (AUTOMATIC1111/Forge or ComfyUI).")
    ap.add_argument("--backend", choices=["auto", "fastsd", "a1111", "comfyui"], default=os.environ.get("IMGGEN_BACKEND", "auto"))
    ap.add_argument("--url", default=os.environ.get("IMGGEN_URL"), help="server address, e.g. http://127.0.0.1:7860")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("ping", help="check the generator is reachable")
    sub.add_parser("models", help="list available checkpoints")
    sub.add_parser("samplers", help="list available samplers")
    g = sub.add_parser("gen", help="generate images")
    g.add_argument("prompt")
    g.add_argument("-n", "--negative", default="")
    g.add_argument("-W", "--width", type=int, help="default 512")
    g.add_argument("-H", "--height", type=int, help="default 512")
    g.add_argument("--steps", type=int, help="default: 1 on FastSD CPU, 25 elsewhere")
    g.add_argument("--cfg", type=float, help="guidance scale. default: 1 on FastSD CPU, 7 elsewhere")
    g.add_argument("--seed", type=int, default=-1, help="-1 = random")
    g.add_argument("--sampler")
    g.add_argument("--scheduler", help="ComfyUI only, e.g. normal, karras")
    g.add_argument("--count", type=int, default=1, help="number of images")
    g.add_argument("--model", help="checkpoint name (part of the name is enough)")
    g.add_argument("--init-image", help="start from this image (image-to-image)")
    g.add_argument("--strength", type=float, default=0.6, help="img2img strength 0-1 (higher = change more)")
    g.add_argument("--openvino", action="store_true", help="FastSD CPU: use OpenVINO models (faster on Intel CPUs)")
    g.add_argument("--tiny-vae", action="store_true", help="FastSD CPU: tiny auto-encoder (faster)")
    g.add_argument("--extra", action="append", default=[], metavar="KEY=VALUE",
                   help="FastSD CPU: any other /api/generate field, e.g. --extra clip_skip=2 (repeatable)")
    g.add_argument("-o", "--out", default="outputs", help="output folder")
    g.add_argument("--no-meta", action="store_true", help="don't write the .json settings file next to each image")
    g.add_argument("--open", action="store_true", help="open the first image when done")
    a = ap.parse_args(argv)

    try:
        gen = connect(a.backend, a.url)
        print(f"Connected to {gen.name} at {gen.url}", file=sys.stderr)
        if a.cmd == "ping":
            print("OK")
        elif a.cmd == "models":
            print(gen.describe_models() if hasattr(gen, "describe_models") else "\n".join(gen.models()))
        elif a.cmd == "samplers":
            print("\n".join(gen.samplers()))
        else:
            if a.init_image and not Path(a.init_image).is_file():
                raise GeneratorError(f"Init image not found: {a.init_image}")
            if a.count < 1:
                raise GeneratorError("--count must be at least 1")
            extra = {}
            for item in a.extra:
                key, _, val = item.partition("=")
                if not key or not _:
                    raise GeneratorError(f"--extra needs KEY=VALUE, got '{item}'")
                try:
                    extra[key] = json.loads(val)
                except ValueError:
                    extra[key] = val
            p = Params(a.prompt, a.negative, a.width, a.height, a.steps, a.cfg, a.seed, a.sampler, a.scheduler,
                       a.count, a.model, a.init_image, a.strength, a.openvino, a.tiny_vae, extra or None)
            p = resolve(p, gen.defaults)               # so the .json file records the real settings used
            t0 = time.time()
            results = gen.generate(p, _progress_printer() if sys.stderr.isatty() else None)
            if sys.stderr.isatty():
                sys.stderr.write("\r" + " " * 50 + "\r")
            paths = save_results(results, p, a.out, meta=not a.no_meta)
            for path, r in zip(paths, results):
                print(f"{path}  (seed {r.seed})")
            print(f"Done: {len(paths)} image(s) in {time.time() - t0:.1f}s", file=sys.stderr)
            if a.open and paths:
                _open_file(paths[0])
    except GeneratorError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("\nCancelled.", file=sys.stderr)
        return 130
    return 0


if __name__ == "__main__":
    sys.exit(main())
