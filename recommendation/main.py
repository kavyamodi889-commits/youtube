# FILE: recommendation/main.py
"""
AURA Recommendation Microservice
Run: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Endpoints:
  GET  /health
  POST /recommend               → personalised home feed
  POST /recommend/next          → "up next" sidebar (watch page)
  POST /recommend/shorts/next   → next short in shorts page
  GET  /recommend/trending      → global trending, no auth required
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from collections import Counter
import os

from database import connect_db, close_db, get_db
from models.trending      import get_trending
from models.content_based import get_content_based
from models.collaborative  import get_collaborative


# ─── Lifespan ─────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(title="AURA Recommendations", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173",
                   os.getenv("CLIENT_URL", "")],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Schemas ──────────────────────────────────────────────────────
class FeedRequest(BaseModel):
    userId:   Optional[str] = None
    limit:    int = 20
    page:     int = 1
    category: Optional[str] = None


class NextRequest(BaseModel):
    videoId:  str
    userId:   Optional[str] = None
    limit:    int = 15


class ShortsNextRequest(BaseModel):
    currentShortId: str
    userId:         Optional[str] = None
    limit:          int = 20


# ─── Helper: merge ranked lists, no duplicates ────────────────────
def _merge(*lists, limit: int):
    seen   = set()
    merged = []
    for lst in lists:
        for item in lst:
            vid = str(item.get("_id", ""))
            if vid and vid not in seen:
                seen.add(vid)
                merged.append(item)
                if len(merged) >= limit:
                    return merged
    return merged


# ─── Rich user profile: all signals from DB ───────────────────────
async def _get_user_profile(db, user_id: str) -> dict:
    """
    Fetches the full user signal profile:
    - watched video ids + categories/tags (watch history)
    - liked / disliked / saved / watchLater / downloaded / notInterested video ids
    - subscribed channel ids
    - shared video ids (from interactions)
    - preferred language (from user.language)
    - inferred preferred categories (from watch history + likes)
    - inferred preferred tags
    """
    from bson import ObjectId

    if not ObjectId.is_valid(user_id):
        return _empty_profile()

    uid = ObjectId(user_id)

    # ── Load user doc ──────────────────────────────────────────────
    user = await db["users"].find_one(
        {"_id": uid},
        {
            "likedVideos": 1, "dislikedVideos": 1, "savedVideos": 1,
            "watchLater": 1, "downloadedVideos": 1, "notInterestedVideos": 1,
            "subscriptions": 1, "hiddenChannels": 1, "language": 1,
            "interests": 1,
        }
    )
    if not user:
        return _empty_profile()

    liked_ids       = [str(i) for i in user.get("likedVideos",          [])]
    disliked_ids    = [str(i) for i in user.get("dislikedVideos",        [])]
    saved_ids       = [str(i) for i in user.get("savedVideos",           [])]
    watch_later_ids = [str(i) for i in user.get("watchLater",            [])]
    downloaded_ids  = [str(i) for i in user.get("downloadedVideos",      [])]
    not_interested  = [str(i) for i in user.get("notInterestedVideos",   [])]
    hidden_channels = [str(i) for i in user.get("hiddenChannels",        [])]
    subscriptions   = [str(i) for i in user.get("subscriptions",         [])]
    user_language   = user.get("language", "en")
    raw_interests   = user.get("interests", [])  # signup interest IDs e.g. ['tech','music']

    # ── Watch history (last 200) ───────────────────────────────────
    watched_ids = []
    async for doc in db["watchhistories"].find(
        {"user": uid}, {"video": 1, "progressPercent": 1}
    ).sort("lastWatchedAt", -1).limit(200):
        watched_ids.append(str(doc["video"]))

    # ── Shared videos from interactions ───────────────────────────
    shared_ids = []
    async for doc in db["interactions"].find(
        {"user": uid, "targetType": "Video", "action": "share"},
        {"targetId": 1}
    ).sort("createdAt", -1).limit(50):
        shared_ids.append(str(doc["targetId"]))

    # ── Infer preferred categories & tags from engagement ─────────
    # Give higher weight to: liked > saved/downloaded > watched > watch_later > shared
    positive_ids = list(set(liked_ids + saved_ids + downloaded_ids + watched_ids[:50]))
    positive_oids = [ObjectId(i) for i in positive_ids if ObjectId.is_valid(i)]

    tag_counter = Counter()
    cat_counter = Counter()

    # Weight: liked/saved get 3x, watched gets 1x
    liked_set = set(liked_ids) | set(saved_ids) | set(downloaded_ids)

    async for doc in db["videos"].find(
        {"_id": {"$in": positive_oids}},
        {"tags": 1, "category": 1, "language": 1}
    ):
        vid_str = str(doc["_id"])
        weight  = 3 if vid_str in liked_set else 1
        cat = doc.get("category", "General")
        cat_counter[cat] += weight
        for tag in doc.get("tags", []):
            tag_counter[tag] += weight

    # Maps signup interest IDs → video category strings
    INTEREST_TO_CATEGORY = {
        "tech": "Technology", "gaming": "Gaming", "music": "Music",
        "sports": "Sports", "comedy": "Comedy", "edu": "Education",
        "food": "Food", "travel": "Travel", "anime": "Anime",
        "news": "News", "science": "Science", "fashion": "Fashion",
        "health": "Health", "business": "Business", "movies": "Movies",
    }
    signup_categories = [
        INTEREST_TO_CATEGORY[i] for i in raw_interests
        if i in INTEREST_TO_CATEGORY
    ]

    behavioural_cats = [c for c, _ in cat_counter.most_common(5)]
    top_tags         = [t for t, _ in tag_counter.most_common(15)]

    # Merge: behavioural categories take priority when available,
    # signup interests fill the gaps for cold-start users with no history
    seen_cats = set(behavioural_cats)
    top_categories = list(behavioural_cats)
    for cat in signup_categories:
        if cat not in seen_cats:
            top_categories.append(cat)
            seen_cats.add(cat)
    top_categories = top_categories[:8]

    # Cold-start: if user has no watch history, use signup interests as seed tags too
    if not positive_ids and signup_categories:
        top_tags = list(set(top_tags + signup_categories))

    return {
        "liked_ids":        liked_ids,
        "disliked_ids":     disliked_ids,
        "saved_ids":        saved_ids,
        "watch_later_ids":  watch_later_ids,
        "downloaded_ids":   downloaded_ids,
        "not_interested":   not_interested,
        "hidden_channels":  hidden_channels,
        "subscriptions":    subscriptions,
        "watched_ids":      watched_ids,
        "shared_ids":       shared_ids,
        "language":         user_language,
        "top_categories":   top_categories,
        "top_tags":         top_tags,
        "signup_interests": signup_categories,   # kept for logging/debug
    }


def _empty_profile():
    return {
        "liked_ids": [], "disliked_ids": [], "saved_ids": [],
        "watch_later_ids": [], "downloaded_ids": [], "not_interested": [],
        "hidden_channels": [], "subscriptions": [], "watched_ids": [],
        "shared_ids": [], "language": "en",
        "top_categories": [], "top_tags": [], "signup_interests": [],
    }


def _all_seen_ids(profile: dict) -> list:
    """All video ids the user has already strongly engaged with (seen = exclude from feed)."""
    seen = set(
        profile["liked_ids"] +
        profile["disliked_ids"] +
        profile["not_interested"] +
        profile["watched_ids"][:100]   # only last 100 watched, so older videos can resurface
    )
    return list(seen)


# ─── Routes ───────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "aura-recommendations", "version": "2.0.0"}


@app.post("/recommend")
async def recommend_feed(body: FeedRequest):
    """
    Home feed — personalised for logged-in users, trending for guests.

    Signal priority (logged-in):
    1. Collaborative filtering (users with similar taste)
    2. Subscribed channel videos (fresh uploads from channels user follows)
    3. Content-based (matches user's preferred tags/categories)
    4. Trending fills the rest

    Guest: trending only.
    """
    from bson import ObjectId

    db    = get_db()
    limit = min(body.limit, 50)

    if not body.userId:
        # Anonymous → trending only
        results = await get_trending(db, limit=limit, page=body.page, category=body.category)
        return {"success": True, "results": results, "count": len(results)}

    profile    = await _get_user_profile(db, body.userId)
    exclude    = _all_seen_ids(profile)

    # Filter out disliked / not-interested / hidden channels at DB level
    # We pass these to each model for exclusion

    collab_results   = []
    sub_results      = []
    content_results  = []

    # 1. Collaborative filtering
    collab_results = await get_collaborative(
        db, body.userId, exclude_ids=exclude, limit=limit
    )
    exclude += [v["_id"] for v in collab_results]

    # 2. Subscribed channels — recent uploads from subscribed channels
    if profile["subscriptions"]:
        sub_oids = [ObjectId(i) for i in profile["subscriptions"] if ObjectId.is_valid(i)]
        sub_cursor = db["videos"].find(
            {
                "_id":        {"$nin": [ObjectId(i) for i in exclude if ObjectId.is_valid(i)]},
                "uploader":   {"$in": sub_oids},
                "status":     "published",
                "visibility": "public",
            },
            {
                "title": 1, "thumbnailUrl": 1, "duration": 1, "viewCount": 1,
                "likeCount": 1, "commentCount": 1, "category": 1, "tags": 1,
                "isShort": 1, "createdAt": 1, "uploader": 1,
            }
        ).sort("createdAt", -1).limit(limit // 2)

        async for doc in sub_cursor:
            ch = await db["users"].find_one(
                {"_id": doc["uploader"]},
                {"displayName": 1, "handle": 1, "avatar": 1}
            )
            sub_results.append(_format_video(doc, ch, source="subscribed", score=3.0))
            exclude.append(str(doc["_id"]))

    # 3. Content-based on user's taste profile
    if len(collab_results) + len(sub_results) < limit:
        content_results = await get_content_based(
            db,
            seed_tags=profile["top_tags"],
            seed_category=profile["top_categories"][0] if profile["top_categories"] else None,
            exclude_ids=exclude,
            limit=limit,
        )
        exclude += [v["_id"] for v in content_results]

    # 4. Trending fills remainder
    trending_results = await get_trending(
        db, limit=limit, page=body.page,
        exclude_ids=exclude, category=body.category
    )

    merged = _merge(collab_results, sub_results, content_results, trending_results, limit=limit)

    # Post-filter: remove hidden channels and not-interested
    hidden_set      = set(profile["hidden_channels"])
    not_int_set     = set(profile["not_interested"])
    disliked_set    = set(profile["disliked_ids"])

    merged = [
        v for v in merged
        if str(v.get("uploader", {}).get("_id", "")) not in hidden_set
        and v["_id"] not in not_int_set
        and v["_id"] not in disliked_set
    ]

    return {"success": True, "results": merged, "count": len(merged)}


@app.post("/recommend/next")
async def recommend_next(body: NextRequest):
    """
    Watch page 'Up Next' sidebar.
    Priority:
    1. Content-based on current video (same tags/category)
    2. Collaborative (what similar users watched after this)
    3. From subscribed channels
    4. Trending fallback
    """
    db    = get_db()
    limit = min(body.limit, 30)

    profile = await _get_user_profile(db, body.userId) if body.userId else _empty_profile()
    exclude = [body.videoId] + _all_seen_ids(profile)

    # 1. Content-based on seed video
    content_results = await get_content_based(
        db, seed_video_id=body.videoId,
        exclude_ids=exclude, limit=limit
    )
    exclude += [v["_id"] for v in content_results]

    # 2. Collaborative if user logged in
    collab_results = []
    if body.userId and len(content_results) < limit:
        collab_results = await get_collaborative(
            db, body.userId, exclude_ids=exclude,
            limit=limit - len(content_results)
        )
        exclude += [v["_id"] for v in collab_results]

    # 3. Subscribed channels
    sub_results = []
    if body.userId and profile["subscriptions"] and len(content_results) + len(collab_results) < limit:
        from bson import ObjectId
        sub_oids = [ObjectId(i) for i in profile["subscriptions"] if ObjectId.is_valid(i)]
        sub_cursor = db["videos"].find(
            {
                "_id":        {"$nin": [ObjectId(i) for i in exclude if ObjectId.is_valid(i)]},
                "uploader":   {"$in": sub_oids},
                "status":     "published",
                "visibility": "public",
                "isShort":    {"$ne": True},
            },
            {
                "title": 1, "thumbnailUrl": 1, "duration": 1, "viewCount": 1,
                "likeCount": 1, "commentCount": 1, "category": 1, "tags": 1,
                "isShort": 1, "createdAt": 1, "uploader": 1,
            }
        ).sort("createdAt", -1).limit(10)

        async for doc in sub_cursor:
            ch = await db["users"].find_one(
                {"_id": doc["uploader"]},
                {"displayName": 1, "handle": 1, "avatar": 1}
            )
            sub_results.append(_format_video(doc, ch, source="subscribed", score=1.5))

    # 4. Trending fallback
    trending_results = await get_trending(db, limit=limit, exclude_ids=exclude)

    merged = _merge(content_results, collab_results, sub_results, trending_results, limit=limit)

    # Post-filter hidden channels & not interested
    hidden_set  = set(profile["hidden_channels"])
    not_int_set = set(profile["not_interested"])
    merged = [
        v for v in merged
        if str(v.get("uploader", {}).get("_id", "")) not in hidden_set
        and v["_id"] not in not_int_set
    ]

    return {"success": True, "results": merged, "count": len(merged)}


@app.post("/recommend/shorts/next")
async def recommend_shorts_next(body: ShortsNextRequest):
    """
    Shorts page — next shorts to show after the current one.
    Content-based on current short + user taste, then trending shorts.
    """
    db    = get_db()
    limit = min(body.limit, 30)

    profile = await _get_user_profile(db, body.userId) if body.userId else _empty_profile()
    exclude = [body.currentShortId] + _all_seen_ids(profile)

    # Content-based on current short
    content_results = await get_content_based(
        db, seed_video_id=body.currentShortId,
        exclude_ids=exclude, limit=limit,
        shorts_only=True
    )
    exclude += [v["_id"] for v in content_results]

    # Collaborative for logged-in users
    collab_results = []
    if body.userId and len(content_results) < limit:
        all_collab = await get_collaborative(
            db, body.userId, exclude_ids=exclude, limit=limit
        )
        collab_results = [v for v in all_collab if v.get("isShort")]

    # Trending shorts as fallback
    trending_results = await get_trending(
        db, limit=limit, exclude_ids=exclude, shorts_only=True
    )

    merged = _merge(content_results, collab_results, trending_results, limit=limit)

    hidden_set  = set(profile["hidden_channels"])
    not_int_set = set(profile["not_interested"])
    merged = [
        v for v in merged
        if str(v.get("uploader", {}).get("_id", "")) not in hidden_set
        and v["_id"] not in not_int_set
    ]

    return {"success": True, "results": merged, "count": len(merged)}


@app.get("/recommend/trending")
async def recommend_trending(
    limit:    int = Query(20, ge=1, le=50),
    page:     int = Query(1,  ge=1),
    category: Optional[str] = Query(None),
):
    db      = get_db()
    results = await get_trending(db, limit=limit, page=page, category=category)
    return {"success": True, "results": results, "count": len(results)}


# ─── Utility ──────────────────────────────────────────────────────
def _format_video(doc: dict, uploader_doc: dict, source: str, score: float) -> dict:
    return {
        "_id":          str(doc["_id"]),
        "title":        doc.get("title", ""),
        "thumbnailUrl": doc.get("thumbnailUrl", ""),
        "duration":     doc.get("duration", 0),
        "viewCount":    doc.get("viewCount", 0),
        "likeCount":    doc.get("likeCount", 0),
        "commentCount": doc.get("commentCount", 0),
        "category":     doc.get("category", ""),
        "tags":         doc.get("tags", []),
        "isShort":      doc.get("isShort", False),
        "createdAt":    doc.get("createdAt"),
        "uploader": {
            "_id":         str(uploader_doc["_id"]) if uploader_doc else "",
            "displayName": uploader_doc.get("displayName", "") if uploader_doc else "",
            "handle":      uploader_doc.get("handle", "")      if uploader_doc else "",
            "avatar":      uploader_doc.get("avatar", "")      if uploader_doc else "",
        },
        "score":  score,
        "source": source,
    }