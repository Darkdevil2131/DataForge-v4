"""
kaggle_search.py
Real dataset search: HuggingFace API (live) + curated metadata + Kaggle (with full credentials).
Kaggle KGAT tokens: need to set KAGGLE_USERNAME env var alongside KAGGLE_KEY.
"""
import os, json, urllib.request, urllib.parse, base64
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

META_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "dataset_metadata.json")
with open(META_PATH) as f:
    _METADATA = json.load(f)

# Build TF-IDF index over curated metadata
_corpus = []
for ds in _METADATA:
    text = (f"{ds['name']} {ds['description']} "
            f"{' '.join(ds.get('tags',[]))} "
            f"{' '.join(ds.get('task_type',[]))} "
            f"{ds.get('domain','')} "
            f"{' '.join(ds.get('recommended_models',[]))}")
    _corpus.append(text.lower())

_vec = TfidfVectorizer(ngram_range=(1, 2), max_features=2000, min_df=1)
_mat = _vec.fit_transform(_corpus)


def _curated_search(query: str, intent: str, limit: int) -> list:
    """Semantic search over curated dataset metadata."""
    augmented = f"{query} {intent} {intent.replace('_',' ')}"
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


def _search_huggingface(query: str, limit: int) -> list:
    """Live search HuggingFace Datasets Hub — no API key needed."""
    url = f"https://huggingface.co/api/datasets?search={urllib.parse.quote(query)}&limit={limit}&sort=likes"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "DataForgeAI/2.0"})
        with urllib.request.urlopen(req, timeout=6) as r:
            data = json.loads(r.read().decode())
        results = []
        for ds in data[:limit]:
            ds_id = ds.get("id", "")
            name = ds_id.split("/")[-1].replace("-", " ").replace("_", " ").title()
            tags = ds.get("tags", [])[:6]
            results.append({
                "id": ds_id,
                "name": name,
                "source": "HuggingFace",
                "url": f"https://huggingface.co/datasets/{ds_id}",
                "description": f"HuggingFace dataset: {name}. {', '.join(tags[:3])}.",
                "tags": tags,
                "rows": None, "features": None,
                "difficulty": "intermediate",
                "relevance_score": 0.78,
                "recommended_models": [],
                "task_type": ["general_ml"],
            })
        return results
    except Exception:
        return []


def _search_kaggle(query: str, limit: int) -> list:
    """Search Kaggle API. Requires KAGGLE_USERNAME + KAGGLE_KEY env vars."""
    username = os.environ.get("KAGGLE_USERNAME", "")
    api_key  = os.environ.get("KAGGLE_KEY", "")
    
    # Handle new KGAT token format — still needs username
    if not username or not api_key:
        return []
    
    creds = base64.b64encode(f"{username}:{api_key}".encode()).decode()
    url = (f"https://www.kaggle.com/api/v1/datasets/list"
           f"?search={urllib.parse.quote(query)}&pageSize={limit}&sortBy=voteCount")
    try:
        req = urllib.request.Request(url, headers={
            "Authorization": f"Basic {creds}",
            "Content-Type": "application/json",
        })
        with urllib.request.urlopen(req, timeout=8) as r:
            data = json.loads(r.read().decode())
        results = []
        for ds in data[:limit]:
            ref = ds.get("ref", "")
            results.append({
                "id": ref,
                "name": ds.get("title", "Unknown"),
                "source": "Kaggle",
                "url": f"https://www.kaggle.com/datasets/{ref}",
                "description": ds.get("subtitle", "")[:200] or ds.get("title", ""),
                "tags": [t.get("name","") for t in ds.get("tags", [])[:5]],
                "rows": None, "features": None,
                "difficulty": "intermediate",
                "relevance_score": min(0.99, ds.get("voteCount", 0) / 5000),
                "recommended_models": [],
                "task_type": ["general_ml"],
                "votes": ds.get("voteCount", 0),
            })
        return results
    except Exception:
        return []


def search_datasets(query: str, intent: str, limit: int = 8) -> list:
    """
    Search all sources. Priority: Kaggle > HuggingFace > curated.
    Always returns curated results so response is never empty.
    """
    all_results = []

    # Try Kaggle first (needs credentials)
    kaggle = _search_kaggle(query, limit=5)
    all_results.extend(kaggle)

    # HuggingFace (no key needed — always try)
    if len(all_results) < 3:
        hf = _search_huggingface(query, limit=3)
        all_results.extend(hf)

    # Always include curated (guaranteed relevant results)
    curated = _curated_search(query, intent, limit=limit)
    all_results.extend(curated)

    # Deduplicate by name, sort by score
    seen, unique = set(), []
    for r in sorted(all_results, key=lambda x: x.get("relevance_score", 0), reverse=True):
        key = (r.get("name", "") or "").lower()[:28]
        if key not in seen:
            seen.add(key)
            unique.append(r)

    return unique[:limit]
