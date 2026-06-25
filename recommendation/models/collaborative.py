# FILE: recommendation/models/collaborative.py
"""
Collaborative filtering (user-based) using implicit feedback.

Signal weights (per interaction):
  watch ≥ 80% completion  → 3.0
  watch ≥ 40% completion  → 1.5
  like                    → 2.5
  save / playlist-add     → 2.0
  share                   → 1.5
  dislike                 → -1.0

Algorithm:
  1. Build a sparse user × video matrix from WatchHistory + Interactions.
  2. Compute cosine similarity between the target user and all other users.
  3. Weighted-average the top-K similar users' video scores.
  4. Return the top-N videos the target user hasn't seen.

Falls back to content-based if user has < MIN_INTERACTIONS interactions.
"""
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from bson import ObjectId
from collections import defaultdict

MIN_INTERACTIONS = 5   # interactions needed before collaborative kicks in
TOP_K_USERS      = 20  # similar users to aggregate over

WEIGHTS = {
    "watch_80": 3.0,
    "watch_40": 1.5,
    "like":     2.5,
    "save":     2.0,
    "share":    1.5,
    "dislike": -1.0,
}


async def _build_signals(db, user_ids: list[ObjectId]) -> dict[str, dict[str, float]]:
    """
    Returns { user_id_str: { video_id_str: score } }
    """
    signals: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))

    # ── WatchHistory ───────────────────────────────────────────────
    async for doc in db["watchhistories"].find(
        {"user": {"$in": user_ids}},
        {"user": 1, "video": 1, "progressPercent": 1}
    ):
        uid = str(doc["user"])
        vid = str(doc["video"])
        pct = doc.get("progressPercent", 0)
        if pct >= 80:
            signals[uid][vid] += WEIGHTS["watch_80"]
        elif pct >= 40:
            signals[uid][vid] += WEIGHTS["watch_40"]

    # ── Interactions ───────────────────────────────────────────────
    action_map = {
        "like":    WEIGHTS["like"],
        "save":    WEIGHTS["save"],
        "share":   WEIGHTS["share"],
        "dislike": WEIGHTS["dislike"],
    }
    async for doc in db["interactions"].find(
        {
            "user":       {"$in": user_ids},
            "targetType": "Video",
            "action":     {"$in": list(action_map.keys())},
        },
        {"user": 1, "targetId": 1, "action": 1}
    ):
        uid = str(doc["user"])
        vid = str(doc["targetId"])
        signals[uid][vid] += action_map[doc["action"]]

    return signals


async def get_collaborative(db, user_id: str, exclude_ids: list = None, limit: int = 20):
    if not ObjectId.is_valid(user_id):
        return []

    exclude_ids = exclude_ids or []
    target_oid  = ObjectId(user_id)

    # ── Fetch a neighbourhood of recently active users ─────────────
    # Use users who share at least one interacted video with the target
    target_signals = await _build_signals(db, [target_oid])
    target_map     = target_signals.get(user_id, {})

    if len(target_map) < MIN_INTERACTIONS:
        return []   # caller will fall back to content-based

    target_video_ids = [ObjectId(v) for v in target_map if ObjectId.is_valid(v)]

    # Find users who interacted with ANY of those videos
    neighbour_oids: set[ObjectId] = set()
    async for doc in db["interactions"].find(
        {
            "targetType": "Video",
            "targetId":   {"$in": target_video_ids},
            "user":       {"$ne": target_oid},
        },
        {"user": 1}
    ).limit(2000):
        neighbour_oids.add(doc["user"])

    async for doc in db["watchhistories"].find(
        {
            "video": {"$in": target_video_ids},
            "user":  {"$ne": target_oid},
        },
        {"user": 1}
    ).limit(2000):
        neighbour_oids.add(doc["user"])

    if not neighbour_oids:
        return []

    # ── Build signal matrix for all users ─────────────────────────
    all_oids     = [target_oid] + list(neighbour_oids)
    all_signals  = await _build_signals(db, all_oids)

    # Build unified video vocabulary
    all_videos   = sorted({v for signals in all_signals.values() for v in signals})
    video_idx    = {v: i for i, v in enumerate(all_videos)}
    n_users      = len(all_oids)
    n_videos     = len(all_videos)

    matrix       = np.zeros((n_users, n_videos), dtype=np.float32)
    uid_idx      = {str(oid): i for i, oid in enumerate(all_oids)}

    for uid, vid_scores in all_signals.items():
        row = uid_idx.get(uid)
        if row is None:
            continue
        for vid, score in vid_scores.items():
            col = video_idx.get(vid)
            if col is not None:
                matrix[row, col] = score

    # ── Cosine similarity between target and neighbours ────────────
    target_row = matrix[0:1]
    sims       = cosine_similarity(target_row, matrix[1:])[0]
    top_k_idx  = np.argsort(sims)[::-1][:TOP_K_USERS]

    # ── Weighted sum of neighbour scores ─────────────────────────
    video_scores: dict[str, float] = defaultdict(float)
    sim_total:    dict[str, float] = defaultdict(float)

    for ki in top_k_idx:
        sim = float(sims[ki])
        if sim <= 0:
            break
        neighbour_oid = str(all_oids[ki + 1])
        neighbour_map = all_signals.get(neighbour_oid, {})
        for vid, score in neighbour_map.items():
            if vid in target_map:        # already seen by target user
                continue
            video_scores[vid] += sim * score
            sim_total[vid]    += sim

    # Normalise
    ranked = [
        (vid, video_scores[vid] / (sim_total[vid] or 1))
        for vid in video_scores
    ]
    ranked.sort(key=lambda x: x[1], reverse=True)

    # ── Fetch top videos from MongoDB ─────────────────────────────
    exclude_set = set(exclude_ids) | set(target_map.keys())
    candidate_ids = [
        ObjectId(vid) for vid, _ in ranked
        if vid not in exclude_set and ObjectId.is_valid(vid)
    ][:limit * 2]

    scores_map = {str(vid): score for vid, score in ranked}

    results = []
    async for doc in db["videos"].find(
        {
            "_id":        {"$in": candidate_ids},
            "status":     "published",
            "visibility": "public",
        },
        {
            "title": 1, "thumbnailUrl": 1, "duration": 1, "viewCount": 1,
            "likeCount": 1, "commentCount": 1, "category": 1, "tags": 1,
            "isShort": 1, "createdAt": 1, "uploader": 1,
        }
    ):
        if len(results) >= limit:
            break

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
            "uploader": {
                "_id":         str(uploader_doc["_id"]) if uploader_doc else "",
                "displayName": uploader_doc.get("displayName", "") if uploader_doc else "",
                "handle":      uploader_doc.get("handle", "") if uploader_doc else "",
                "avatar":      uploader_doc.get("avatar", "") if uploader_doc else "",
            },
            "score":  round(scores_map.get(str(doc["_id"]), 0), 4),
            "source": "collaborative",
        }
        results.append(out)

    # Sort by collaborative score
    results.sort(key=lambda x: x["score"], reverse=True)
    return results