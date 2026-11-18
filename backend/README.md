# BalikBagay backend

FastAPI + OpenCV + scikit-learn matching engine. Optional: the frontend works fully in the browser and
switches to this service automatically when it detects `http://localhost:8000`.

```bash
python -m venv .venv && .venv\Scripts\activate      # source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
python matcher.py                                   # self-test, prints ranked matches
uvicorn main:app --reload --port 8000
```

## Scoring

```
overall = 0.55 * visual + 0.45 * text
visual  = 0.60 * HSV-histogram intersection + 0.25 * edge (Sobel grid cosine + density) + 0.15 * shape (bbox aspect/fill)
text    = cosine(TF-IDF(query), TF-IDF(item))   # sublinear tf, smooth idf, l2, synonym-normalized tokens
```

If only one modality is supplied its score is used directly (`mode: visual-only | text-only`).

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | liveness probe used by the frontend |
| GET | `/api/items` | filters: `building`, `category`, `status`, `q` |
| POST | `/api/match` | multipart: `image?`, `description`, `location`, `category` → ranked results with breakdown and tags |
| POST | `/api/report` | multipart: `image`, `title`, `category`, `building`, `description`, `date`, `spot`, `id?` |

State is in-memory (resets on restart); the frontend re-syncs locally reported items when it reconnects.
