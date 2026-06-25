# FILE: recommendation/models/trending.py
"""
Trending score = (views + 2*likes + 3*comments) / age_hours^gravity
Inspired by Hacker News ranking.
"""
from datetime import datetime, timezone
from bson import ObjectId


GRAVITY   = 1.5   # higher = older posts decay faster
MIN_VIEWS = 0     # floor so brand-new videos still appear


async def get_trending(db, limit: int = 20, page: int = 1,
                        exclude_ids: list = None, category: str = None,
                        shorts_only: bool = False):
    exclude_ids = exclude_ids or []
    skip = (page - 1) * limit

    match: dict = {
        "status":     "published",
        "visibility": "public",
    }
    if exclude_ids:
        match["_id"] = {"$nin": [ObjectId(i) for i in exclude_ids if ObjectId.is_valid(i)]}
    if category:
        match["category"] = category
    if shorts_only:
        match["isShort"] = True

    pipeline = [
        {"$match": match},
        # Only look at videos from the last 30 days for trending
        {"$match": {"createdAt": {"$gte": datetime.now(timezone.utc).replace(
            tzinfo=None) - __import__("datetime").timedelta(days=30)}}},
        {"$addFields": {
            "ageHours": {
                "$max": [
                    1,
                    {"$divide": [
                        {"$subtract": [datetime.utcnow(), "$createdAt"]},
                        3_600_000  # ms → hours
                    ]}
                ]
            }
        }},
        {"$addFields": {
            "trendScore": {
                "$divide": [
                    {"$add": [
                        "$viewCount",
                        {"$multiply": [2, "$likeCount"]},
                        {"$multiply": [3, "$commentCount"]},
                    ]},
                    {"$pow": ["$ageHours", GRAVITY]}
                ]
            }
        }},
        {"$sort": {"trendScore": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {"$lookup": {
            "from":         "users",
            "localField":   "uploader",
            "foreignField": "_id",
            "as":           "uploaderInfo",
            "pipeline": [{"$project": {"displayName": 1, "handle": 1, "avatar": 1}}]
        }},
        {"$addFields": {"uploaderInfo": {"$arrayElemAt": ["$uploaderInfo", 0]}}},
        {"$project": {
            "title": 1, "thumbnailUrl": 1, "duration": 1,
            "viewCount": 1, "likeCount": 1, "commentCount": 1,
            "category": 1, "tags": 1, "isShort": 1, "createdAt": 1,
            "uploader": "$uploaderInfo",
            "trendScore": 1,
        }},
    ]

    cursor = db["videos"].aggregate(pipeline)
    results = []
    async for doc in cursor:
        doc["_id"]    = str(doc["_id"])
        doc["score"]  = round(doc.pop("trendScore", 0), 4)
        doc["source"] = "trending"
        if doc.get("uploader") and doc["uploader"].get("_id"):
            doc["uploader"]["_id"] = str(doc["uploader"]["_id"])
        results.append(doc)
    return results