"""
kaggle_search.py
Real dataset search:
- HuggingFace API
- Kaggle API
- Curated metadata fallback

SAFE VERSION:
Never crashes pipeline if APIs fail.
"""

import os
import json
import urllib.request
import urllib.parse
import base64
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

META_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "data",
    "dataset_metadata.json"
)

# ─────────────────────────────────────────────────────────────
# Load metadata
# ─────────────────────────────────────────────────────────────
with open(META_PATH, "r", encoding="utf-8") as f:
    _METADATA = json.load(f)

# ─────────────────────────────────────────────────────────────
# Build TF-IDF index
# ─────────────────────────────────────────────────────────────
_corpus = []

for ds in _METADATA:
    text = (
        f"{ds.get('name', '')} "
        f"{ds.get('description', '')} "
        f"{' '.join(ds.get('tags', []))} "
        f"{' '.join(ds.get('task_type', []))} "
        f"{ds.get('domain', '')} "
        f"{' '.join(ds.get('recommended_models', []))}"
    )

    _corpus.append(text.lower())

_vec = TfidfVectorizer(
    ngram_range=(1, 2),
    max_features=2000,
    min_df=1
)

_mat = _vec.fit_transform(_corpus)

# ─────────────────────────────────────────────────────────────
# Curated semantic search
# ─────────────────────────────────────────────────────────────
def _curated_search(query: str, intent: str, limit: int):
    augmented = f"{query} {intent} {intent.replace('_', ' ')}"

    q_vec = _vec.transform([augmented.lower()])
    scores = cosine_similarity(q_vec, _mat)[0]

    top_idx = np.argsort(scores)[::-1][:limit]

    results = []

    for i in top_idx:
        if scores[i] < 0.01:
            continue

        ds = _METADATA[i].copy()
        ds["relevance_score"] = round(float(scores[i]), 4)

        results.append(ds)

    return results

# ─────────────────────────────────────────────────────────────
# HuggingFace Search
# ─────────────────────────────────────────────────────────────
def _search_huggingface(query: str, limit: int):

    url = (
        "https://huggingface.co/api/datasets"
        f"?search={urllib.parse.quote(query)}"
        f"&limit={limit}"
        "&sort=likes"
    )

    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "DataForgeAI/2.0"}
        )

        with urllib.request.urlopen(req, timeout=8) as r:
            data = json.loads(r.read().decode())

        results = []

        for ds in data[:limit]:

            ds_id = ds.get("id", "")

            name = (
                ds_id.split("/")[-1]
                .replace("-", " ")
                .replace("_", " ")
                .title()
            )

            results.append({
                "id": ds_id,
                "name": name,
                "source": "HuggingFace",
                "url": f"https://huggingface.co/datasets/{ds_id}",
                "description": f"HuggingFace dataset: {name}",
                "tags": ds.get("tags", [])[:5],
                "difficulty": "intermediate",
                "relevance_score": 0.78,
                "task_type": ["general_ml"]
            })

        return results

    except Exception as e:
        print(f"[HF SEARCH ERROR] {e}")
        return []

# ─────────────────────────────────────────────────────────────
# Kaggle Search
# ─────────────────────────────────────────────────────────────
def _search_kaggle(query: str, limit: int):

    username = os.environ.get("KAGGLE_USERNAME", "")
    api_key = os.environ.get("KAGGLE_KEY", "")

    if not username or not api_key:
        print("[KAGGLE] Missing credentials")
        return []

    creds = base64.b64encode(
        f"{username}:{api_key}".encode()
    ).decode()

    url = (
        "https://www.kaggle.com/api/v1/datasets/list"
        f"?search={urllib.parse.quote(query)}"
        f"&pageSize={limit}"
        "&sortBy=voteCount"
    )

    try:
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Basic {creds}",
                "Content-Type": "application/json",
            },
        )

        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode())

        results = []

        for ds in data[:limit]:

            ref = ds.get("ref", "")

            results.append({
                "id": ref,
                "name": ds.get("title", "Unknown"),
                "source": "Kaggle",
                "url": f"https://www.kaggle.com/datasets/{ref}",
                "description": ds.get("subtitle", ""),
                "tags": [
                    t.get("name", "")
                    for t in ds.get("tags", [])[:5]
                ],
                "difficulty": "intermediate",
                "relevance_score": min(
                    0.99,
                    ds.get("voteCount", 0) / 5000
                ),
                "task_type": ["general_ml"],
                "votes": ds.get("voteCount", 0),
            })

        return results

    except Exception as e:
        print(f"[KAGGLE SEARCH ERROR] {e}")
        return []

# ─────────────────────────────────────────────────────────────
# Main Search Function
# ─────────────────────────────────────────────────────────────
def search_datasets(
    query: str,
    intent: str,
    limit: int = 8
):

    all_results = []

    # Kaggle
    kaggle = _search_kaggle(query, limit=5)
    all_results.extend(kaggle)

    # HuggingFace
    if len(all_results) < 3:
        hf = _search_huggingface(query, limit=3)
        all_results.extend(hf)

    # Curated fallback
    curated = _curated_search(query, intent, limit)
    all_results.extend(curated)

    # Deduplicate
    seen = set()
    unique = []

    for r in sorted(
        all_results,
        key=lambda x: x.get("relevance_score", 0),
        reverse=True
    ):

        key = (
            r.get("name", "")
            .lower()
            .strip()[:40]
        )

        if key not in seen:
            seen.add(key)
            unique.append(r)

    return unique[:limit]