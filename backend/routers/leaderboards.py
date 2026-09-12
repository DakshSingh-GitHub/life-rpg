from typing import Optional
from fastapi import APIRouter, Query
from models.schemas import LeaderboardResponse, LeaderboardEntry
from database import get_supabase

router = APIRouter(prefix="/api/leaderboards", tags=["Leaderboards & Social"])

@router.get("", response_model=LeaderboardResponse)
def get_leaderboards(
    limit: int = Query(25, ge=1, le=100, description="Max entries to return"),
    sort_by: Optional[str] = Query("level", description="level, streak, or quests")
):
    """
    Computes real-time rankings across all adventurers in the realm.
    Identifies class champions and top performers.
    """
    supabase = get_supabase()

    # Fetch top progressions
    order_col = "streak_days" if sort_by == "streak" else "total_quests_completed" if sort_by == "quests" else "level"
    prog_res = supabase.table("user_progression").select("*").order(order_col, desc=True).limit(limit).execute()
    progressions = prog_res.data or []

    # Fetch corresponding profiles for usernames and avatar classes
    user_ids = [p["user_id"] for p in progressions if "user_id" in p]
    profiles_map = {}
    if user_ids:
        prof_res = supabase.table("profiles").select("id, username, full_name, avatar_class").in_("id", user_ids).execute()
        for prof in (prof_res.data or []):
            profiles_map[prof["id"]] = prof

    rankings = []
    for idx, p in enumerate(progressions):
        uid = p.get("user_id")
        prof = profiles_map.get(uid, {})
        rankings.append(LeaderboardEntry(
            rank=idx + 1,
            user_id=uid,
            username=prof.get("username", "Adventurer"),
            full_name=prof.get("full_name"),
            avatar_class=prof.get("avatar_class", "warrior"),
            level=p.get("level", 1),
            current_xp=p.get("current_xp", 0),
            streak_days=p.get("streak_days", 0),
            gold=p.get("gold", 0),
            total_quests_completed=p.get("total_quests_completed", 0)
        ))

    # Attribute Champions
    brawn_champ = max(progressions, key=lambda x: x.get("brawn_xp", 0), default=None)
    intellect_champ = max(progressions, key=lambda x: x.get("intellect_xp", 0), default=None)
    swift_champ = max(progressions, key=lambda x: x.get("swiftness_xp", 0), default=None)
    vital_champ = max(progressions, key=lambda x: x.get("vitality_xp", 0), default=None)

    def format_champ(p, attr_key):
        if not p:
            return None
        prof = profiles_map.get(p.get("user_id"), {})
        return {
            "username": prof.get("username", "Adventurer"),
            "avatar_class": prof.get("avatar_class", "warrior"),
            "score": p.get(attr_key, 0)
        }

    return LeaderboardResponse(
        period="all-time",
        total_adventurers=len(rankings),
        rankings=rankings,
        attribute_champions={
            "brawn": format_champ(brawn_champ, "brawn_xp"),
            "intellect": format_champ(intellect_champ, "intellect_xp"),
            "swiftness": format_champ(swift_champ, "swiftness_xp"),
            "vitality": format_champ(vital_champ, "vitality_xp")
        }
    )
