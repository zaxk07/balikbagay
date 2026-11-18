"""FastAPI service for BalikBagay. Run: uvicorn main:app --reload --port 8000"""
from __future__ import annotations

import time
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from matcher import decode_image, rank, visual_features
from seed_data import SEED_ITEMS, render_item

app = FastAPI(title="BalikBagay Matching API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

STORE: dict[str, dict] = {}


def _boot() -> None:
    for it in SEED_ITEMS:
        d = dict(it)
        d["features"] = visual_features(render_item(it["kind"], it["colors"]))
        STORE[d["id"]] = d


_boot()


def _public(item: dict) -> dict:
    return {k: v for k, v in item.items() if k != "features"} | {"visual": item["features"].to_dict()}


async def _read_image(upload: Optional[UploadFile]):
    if upload is None:
        return None
    data = await upload.read()
    if not data:
        return None
    try:
        return visual_features(decode_image(data))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "items": len(STORE)}


@app.get("/api/items")
def items(building: Optional[str] = None, category: Optional[str] = None, status: Optional[str] = None, q: Optional[str] = None) -> dict:
    out = list(STORE.values())
    if building:
        out = [i for i in out if i["building"] == building]
    if category:
        out = [i for i in out if i["category"] == category]
    if status:
        out = [i for i in out if i["status"] == status]
    if q:
        needle = q.lower()
        out = [i for i in out if needle in f"{i['title']} {i['description']}".lower()]
    return {"items": [_public(i) for i in out]}


@app.post("/api/match")
async def match(
    description: str = Form(""),
    location: str = Form(""),
    category: str = Form(""),
    image: Optional[UploadFile] = File(None),
) -> dict:
    feat = await _read_image(image)
    if feat is None and not (description.strip() or location or category):
        raise HTTPException(status_code=422, detail="Provide an image or a description.")
    results = rank(list(STORE.values()), description, location, category, feat)
    return {"results": results, "engine": "opencv+scikit-learn", "weights": {"visual": 0.55, "text": 0.45}}


@app.post("/api/report", status_code=201)
async def report(
    title: str = Form(...),
    category: str = Form(...),
    building: str = Form(...),
    description: str = Form(...),
    date: str = Form(""),
    spot: str = Form(""),
    id: str = Form(""),
    image: UploadFile = File(...),
) -> dict:
    feat = await _read_image(image)
    if feat is None:
        raise HTTPException(status_code=422, detail="Image is required.")
    item_id = id or f"bb-u{int(time.time() * 1000):x}"
    item = dict(id=item_id, title=title, category=category, building=building, spot=spot or "Handed to the guard post",
                description=description, date=date or time.strftime("%Y-%m-%d"), status="Unclaimed", kind="custom",
                colors=[], reported=True, features=feat)
    STORE[item_id] = item
    return {"item": _public(item)}
