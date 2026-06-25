# FILE: recommendation/models/content_based.py
"""
Content-based filtering.

Builds a TF-IDF vector for every video from its title, description, tags and
category, then finds the nearest neighbours to a seed video (or seed tags
derived from the user's watch history).

Vectors are re-computed on each call — dataset is small enough that this is
fast (< 100 ms for 10k videos).  Add a Redis or in-process TTL cache later.
"""
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from bson import ObjectId


def _build_doc(video: dict) -> str:
    """Combine title, description, tags, category into one string."""
    parts = [
        video.get("title", ""),
        video.get("category", ""),
        " ".join(video.get("tags", [])),
        (video.get("description", "") or "")[:300],  # cap at 300 chars
    ]
    text = " ".join(parts)
    # Basic normalisation
    text = re.sub(r"[^\w\s]", " ", text.lower())
    return text


async def get_content_based(db, seed_video_id: str = None,
                             seed_tags: list = None, seed_category: str = None,
                             exclude_ids: list = None, limit: int = 20,
                             shorts_only: bool = False):
    """
    If seed_video_id is given  → find videos similar to that video.
    If seed_tags/category given → find videos similar to those tags/category.
    """
    exclude_ids = exclude_ids or []
    exclude_oids = [ObjectId(i) for i in exclude_ids if ObjectId.is_valid(i)]

    # Fetch candidate pool — published public videos
    pool_match = {"status": "published", "visibility": "public"}
    if shorts_only:
        pool_match["isShort"] = True
    cursor = db["videos"].find(
        pool_match,
        {
            "title": 1, "description": 1, "tags": 1, "category": 1,
            "thumbnailUrl": 1, "duration": 1, "viewCount": 1,
            "likeCount": 1, "commentCount": 1, "isShort": 1,
            "createdAt": 1, "uploader": 1,
        }
    ).limit(5000)  # cap pool size for performance

    pool = []
    async for doc in cursor:
        pool.append(doc)

    if len(pool) < 2:
        return []

    # Build TF-IDF matrix
    corpus  = [_build_doc(v) for v in pool]
    tfidf   = TfidfVectorizer(max_features=3000, stop_words="english")
    matrix  = tfidf.fit_transform(corpus)

    # Build query vector
    if seed_video_id and ObjectId.is_valid(seed_video_id):
        seed_oid = ObjectId(seed_video_id)
        indices  = [i for i, v in enumerate(pool) if v["_id"] == seed_oid]
        if not indices:
            return []
        query_vec = matrix[indices[0]]
    else:
        # Build from tags + category
        seed_text = " ".join(seed_tags or []) + " " + (seed_category or "")
        seed_text = re.sub(r"[^\w\s]", " ", seed_text.lower())
        query_vec = tfidf.transform([seed_text])

    # Cosine similarity
    sims   = cosine_similarity(query_vec, matrix).flatten()
    order  = np.argsort(sims)[::-1]

    # Exclude seed video + already-seen videos
    exclude_set = set(str(i) for i in exclude_oids)
    if seed_video_id:
        exclude_set.add(seed_video_id)

    results = []
    for idx in order:
        if len(results) >= limit:
            break
        doc = pool[idx]
        if str(doc["_id"]) in exclude_set:
            continue
        if sims[idx] < 0.01:   # skip near-zero similarity
            break

        # Fetch uploader info
        uploader_doc = await db["users"].find_one(
            {"_id": doc["uploader"]},
            {"displayName": 1, "handle": 1, "avatar": 1}
        )

        out = {
            "_id":         str(doc["_id"]),
            "title":       doc.get("title", ""),
            "thumbnailUrl":doc.get("thumbnailUrl", ""),
            "duration":    doc.get("duration", 0),
            "viewCount":   doc.get("viewCount", 0),
            "likeCount":   doc.get("likeCount", 0),
            "commentCount":doc.get("commentCount", 0),
            "category":    doc.get("category", ""),
            "tags":        doc.get("tags", []),
            "isShort":     doc.get("isShort", False),
            "createdAt":   doc.get("createdAt"),
            "uploader":    {
                "_id":         str(uploader_doc["_id"]) if uploader_doc else "",
                "displayName": uploader_doc.get("displayName", "") if uploader_doc else "",
                "handle":      uploader_doc.get("handle", "") if uploader_doc else "",
                "avatar":      uploader_doc.get("avatar", "") if uploader_doc else "",
            },
            "score":  round(float(sims[idx]), 4),
            "source": "content",
        }
        results.append(out)

    return results