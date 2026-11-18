"""BalikBagay hybrid matcher: OpenCV visual features + scikit-learn TF-IDF text vectors.

    overall = 0.55 * visual_score + 0.45 * text_score

The visual score fuses an HSV color histogram (0.60), Sobel edge density and a 4x4 spatial
edge grid (0.25) and a silhouette descriptor from the foreground bounding box (0.15).
Everything mirrors frontend/src/lib/{vision,text,matcher}.ts so the in-browser engine and
this one agree.

Run `python matcher.py` for a self-test on synthetic images.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

import cv2
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

VISUAL_WEIGHT = 0.55
TEXT_WEIGHT = 0.45

N = 64
HBINS, SBINS, VBINS = 16, 4, 4
BG_DIST = 36
EDGE_T = 120

# ---------------------------------------------------------------- text

STOP = set(
    "a an the and or of in on at to for with is are was were it its i my me we our this that there near by "
    "from have has had left lost found after very some into as be been can just one".split()
)
SYNONYMS = {
    "aquaflask": "tumbler", "flask": "tumbler", "thermos": "tumbler", "bottle": "tumbler",
    "adapter": "charger", "charging": "charger", "plug": "charger",
    "calc": "calculator", "casio": "calculator",
    "earphones": "earbuds", "earphone": "earbuds", "airpods": "earbuds", "earbud": "earbuds",
    "usb": "usb", "thumbdrive": "flashdrive", "flash": "flashdrive", "drive": "flashdrive", "pendrive": "flashdrive",
    "jacket": "hoodie", "sweater": "hoodie", "pullover": "hoodie",
    "gray": "grey", "navy": "blue", "maroon": "red", "powerbank": "power", "bank": "power",
    "id": "lanyard", "card": "lanyard", "strap": "lanyard",
    "bag": "tote", "backpack": "tote",
    "specs": "eyeglasses", "glasses": "eyeglasses", "spectacles": "eyeglasses",
    "keychain": "keys", "key": "keys",
}


NOSTEM = {"cics", "cea", "cit"}


def tokenize(text: str) -> list[str]:
    out: list[str] = []
    for raw in re.split(r"[^a-z0-9]+", text.lower()):
        if len(raw) < 2 or raw in STOP:
            continue
        t = raw[:-1] if len(raw) > 3 and raw.endswith("s") and not raw.endswith("ss") and raw not in NOSTEM else raw
        out.append(SYNONYMS.get(t) or SYNONYMS.get(raw) or t)
    return out


def item_doc(item: dict) -> str:
    return f"{item['title']} {item['category']} {item['building']} {item.get('spot', '')} {item['description']}"


def query_doc(description: str, location: str, category: str) -> str:
    return f"{description} {category} {location}"


# ---------------------------------------------------------------- vision


@dataclass
class Features:
    hist: np.ndarray
    edge: float
    grid: np.ndarray
    aspect: float
    fill: float
    colors: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {"edge": round(self.edge, 4), "aspect": round(self.aspect, 3), "fill": round(self.fill, 3), "colors": self.colors}


def color_name(h: float, s: float, v: float) -> str:
    if v < 0.22:
        return "black"
    if s < 0.14:
        return "white" if v > 0.82 else "gray"
    if h < 15 or h >= 345:
        return "maroon" if v < 0.45 else "red"
    if h < 40:
        return "brown" if v < 0.6 else "orange"
    if h < 68:
        return "yellow"
    if h < 165:
        return "green"
    if h < 255:
        return "light blue" if (s < 0.45 and v > 0.7) else "blue"
    if h < 300:
        return "purple"
    return "pink"


def decode_image(data: bytes) -> np.ndarray:
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    return img


def visual_features(img: np.ndarray) -> Features:
    """Extract HSV histogram, edge and shape descriptors from a BGR image."""
    h, w = img.shape[:2]
    side = min(h, w)
    y0, x0 = (h - side) // 2, (w - side) // 2
    img = cv2.resize(img[y0:y0 + side, x0:x0 + side], (N, N), interpolation=cv2.INTER_AREA)
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32)

    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bg = np.median(border, axis=0)
    mask = np.linalg.norm(rgb - bg, axis=2) > BG_DIST
    frac = mask.mean()
    if frac < 0.03 or frac > 0.92:
        mask = np.ones((N, N), bool)
    fg = int(mask.sum())

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hdeg = hsv[..., 0].astype(np.float32) * 2.0
    s = hsv[..., 1].astype(np.float32) / 255.0
    v = hsv[..., 2].astype(np.float32) / 255.0
    hb = np.where(s < 0.12, 0, np.floor(hdeg / 360.0 * HBINS).astype(int) % HBINS)
    sb = np.minimum(SBINS - 1, np.floor(s * SBINS).astype(int))
    vb = np.minimum(VBINS - 1, np.floor(v * VBINS).astype(int))
    idx = (hb * SBINS + sb) * VBINS + vb
    hist = np.bincount(idx[mask], minlength=HBINS * SBINS * VBINS).astype(np.float64) / fg

    names: dict[str, int] = {}
    for hh, ss, vv in zip(hdeg[mask], s[mask], v[mask]):
        n = color_name(float(hh), float(ss), float(vv))
        names[n] = names.get(n, 0) + 1
    colors = [n for n, c in sorted(names.items(), key=lambda kv: -kv[1]) if c / fg >= 0.12][:3]

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    edges = np.hypot(gx, gy) > EDGE_T
    edges[0, :] = edges[-1, :] = False
    edges[:, 0] = edges[:, -1] = False
    cell = N // 4
    grid = edges.reshape(4, cell, 4, cell).sum(axis=(1, 3)).astype(np.float64).ravel() / (cell * cell)
    edge = float(edges.sum()) / ((N - 2) * (N - 2))

    ys, xs = np.nonzero(mask)
    bw, bh = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
    return Features(hist, edge, grid, bw / bh, fg / (bw * bh), colors)


def _ratio(a: float, b: float) -> float:
    m = max(a, b)
    return 1.0 if m <= 1e-9 else min(a, b) / m


def _cos(a: np.ndarray, b: np.ndarray) -> float:
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    return float(a @ b / (na * nb)) if na and nb else 0.0


def visual_similarity(a: Features, b: Features) -> tuple[float, dict]:
    color = float(np.minimum(a.hist, b.hist).sum())
    edge = 0.6 * _cos(a.grid, b.grid) + 0.4 * _ratio(a.edge, b.edge)
    shape = 0.5 * _ratio(a.aspect, b.aspect) + 0.5 * _ratio(a.fill, b.fill)
    return 0.6 * color + 0.25 * edge + 0.15 * shape, {"color": color, "edge": edge, "shape": shape}


# ---------------------------------------------------------------- fusion


def fuse(visual: float, text: float, has_image: bool, has_text: bool) -> tuple[float, str]:
    if has_image and has_text:
        return VISUAL_WEIGHT * visual + TEXT_WEIGHT * text, "hybrid"
    if has_image:
        return visual, "visual-only"
    return text, "text-only"


def rank(items: list[dict], description: str = "", location: str = "", category: str = "",
         image: Features | None = None, limit: int = 8) -> list[dict]:
    """Rank unclaimed items. Each item dict needs: id, title, category, building, spot, description, status, features."""
    if not items:
        return []
    vec = TfidfVectorizer(analyzer=tokenize, sublinear_tf=True, norm="l2")
    doc_matrix = vec.fit_transform([item_doc(i) for i in items])
    qdoc = query_doc(description, location, category)
    q_tokens = set(tokenize(qdoc))
    q = vec.transform([qdoc])
    text_scores = (doc_matrix @ q.T).toarray().ravel() if q.nnz else np.zeros(len(items))
    has_text = bool(q_tokens)

    out = []
    for item, text in zip(items, text_scores):
        if item.get("status") != "Unclaimed":
            continue
        visual, parts, tags = 0.0, {"color": 0.0, "edge": 0.0, "shape": 0.0}, []
        feat: Features | None = item.get("features")
        if image is not None and feat is not None:
            visual, parts = visual_similarity(image, feat)
            tags += [{"label": c, "kind": "color"} for c in image.colors if c in feat.colors]
        doc_tokens = set(tokenize(item_doc(item)))
        color_labels = {t["label"] for t in tags}
        if location and location.lower() == item["building"].lower():
            tags.append({"label": item["building"], "kind": "place"})
        if category and category == item["category"]:
            tags.append({"label": item["category"], "kind": "category"})
        skip = {item["building"].lower(), item["category"].lower()}
        tags += [{"label": t, "kind": "keyword"} for t in sorted(q_tokens & doc_tokens)
                 if t not in skip and t not in color_labels]
        overall, mode = fuse(visual, float(text), image is not None, has_text)
        out.append({"id": item["id"], "overall": round(overall, 4), "visual": round(visual, 4), "text": round(float(text), 4),
                    "breakdown": {k: round(x, 4) for k, x in parts.items()}, "tags": tags[:7], "mode": mode})
    return sorted(out, key=lambda r: -r["overall"])[:limit]


# ---------------------------------------------------------------- self-test


def _selftest() -> None:
    from seed_data import SEED_ITEMS, render_item

    items = []
    for it in SEED_ITEMS:
        d = dict(it)
        d["features"] = visual_features(render_item(it["kind"], it["colors"]))
        items.append(d)

    # a "photo" of the black tumbler: different background, slight noise and brightness shift
    rng = np.random.default_rng(7)
    src = SEED_ITEMS[0]
    photo = render_item(src["kind"], src["colors"], bg="#cdbfa6").astype(np.int16)
    photo = np.clip(photo * 1.05 + rng.normal(0, 4, photo.shape), 0, 255).astype(np.uint8)
    q_feat = visual_features(photo)
    print("query colors:", q_feat.colors, "edge:", round(q_feat.edge, 3))

    cases = {
        "hybrid  (photo + text)": dict(description="black insulated tumbler with a handle, dent at the bottom", location="CICS", category="Drinkware", image=q_feat),
        "visual-only": dict(image=q_feat),
        "text-only": dict(description="Casio scientific calculator, black, hard cover", location="CEA"),
    }
    expected = {"hybrid  (photo + text)": "bb-001", "visual-only": "bb-001", "text-only": "bb-003"}
    for name, kw in cases.items():
        res = rank(items, **kw)
        print(f"\n[{name}]")
        for r in res[:3]:
            title = next(i["title"] for i in items if i["id"] == r["id"])
            print(f"  {r['overall']*100:5.1f}%  v={r['visual']*100:5.1f} t={r['text']*100:5.1f}  {title}  {[t['label'] for t in r['tags']]}")
        assert res[0]["id"] == expected[name], f"{name}: expected {expected[name]}, got {res[0]['id']}"
        assert all(next(i for i in items if i['id'] == r['id'])['status'] == 'Unclaimed' for r in res)
    h = rank(items, **cases["hybrid  (photo + text)"])[0]
    assert abs(h["overall"] - (0.55 * h["visual"] + 0.45 * h["text"])) < 1e-3
    print("\nOK: matcher self-test passed")


if __name__ == "__main__":
    _selftest()
