import math
import random
from datetime import date, datetime, timedelta
import zoneinfo
from typing import Dict, Any, Tuple
from config import settings
from database import get_supabase

def get_xp_required_for_level(level: int) -> int:
    """Non-linear XP curve matching LifeRPG tabletop progression."""
    if level <= 1:
        return 100
    return round(100 * (level ** 1.35))

def get_difficulty_rewards(difficulty: str) -> Tuple[int, int]:
    diff = difficulty.lower().strip()
    rewards = {
        "easy": (20, 10),
        "medium": (40, 25),
        "hard": (75, 50),
        "epic": (150, 100)
    }
    return rewards.get(diff, (25, 15))

def get_today_str() -> str:
    try:
        tz = zoneinfo.ZoneInfo(settings.timezone)
        return datetime.now(tz).strftime("%Y-%m-%d")
    except Exception:
        return date.today().isoformat()

def roll_critical_hit() -> Tuple[bool, float]:
    """15% chance for a critical chore execution with 1.25x Gold bounty multiplier."""
    is_crit = random.random() < 0.15
    multiplier = 1.25 if is_crit else 1.0
    return is_crit, multiplier

def complete_quest_engine(user_id: str, quest_id: str) -> Dict[str, Any]:
    supabase = get_supabase()

    # 1. Fetch Quest
    quest_res = supabase.table("quests").select("*").eq("id", quest_id).eq("user_id", user_id).execute()
    if not quest_res.data or len(quest_res.data) == 0:
        raise ValueError("Quest not found or does not belong to user.")
    quest = quest_res.data[0]

    today_str = get_today_str()

    # Check if already completed today
    if quest.get("completed"):
        if not quest.get("is_recurring") or quest.get("last_completed_date") == today_str:
            raise ValueError("Quest has already been completed today!")

    # 2. Fetch User Progression
    prog_res = supabase.table("user_progression").select("*").eq("user_id", user_id).execute()
    if not prog_res.data or len(prog_res.data) == 0:
        # Create default progression record if missing
        default_prog = {
            "user_id": user_id,
            "level": 1,
            "current_xp": 0,
            "gold": 50,
            "streak_days": 0,
            "brawn_xp": 0,
            "intellect_xp": 0,
            "swiftness_xp": 0,
            "vitality_xp": 0,
            "total_quests_completed": 0
        }
        supabase.table("user_progression").insert(default_prog).execute()
        prog = default_prog
    else:
        prog = prog_res.data[0]

    # 3. Calculate Rewards & Attribute XP
    base_xp, base_gold = get_difficulty_rewards(quest.get("difficulty", "medium"))
    is_crit, multiplier = roll_critical_hit()
    xp_earned = base_xp
    gold_earned = round(base_gold * multiplier)

    # 4. Attribute Allocation
    attribute = quest.get("attribute", "SWIFTNESS").upper()
    brawn_xp = prog.get("brawn_xp", 0)
    intellect_xp = prog.get("intellect_xp", 0)
    swiftness_xp = prog.get("swiftness_xp", 0)
    vitality_xp = prog.get("vitality_xp", 0)

    if attribute == "BRAWN":
        brawn_xp += xp_earned
    elif attribute == "INTELLECT":
        intellect_xp += xp_earned
    elif attribute == "SWIFTNESS":
        swiftness_xp += xp_earned
    elif attribute == "VITALITY":
        vitality_xp += xp_earned
    else:
        swiftness_xp += xp_earned

    # 5. Level & XP Progression
    current_xp = prog.get("current_xp", 0) + xp_earned
    level = prog.get("level", 1)
    leveled_up = False

    while True:
        req_xp = get_xp_required_for_level(level)
        if current_xp >= req_xp:
            current_xp -= req_xp
            level += 1
            leveled_up = True
        else:
            break

    # 6. Streak Logic
    streak_days = prog.get("streak_days", 0)
    last_active = prog.get("last_active_date")
    streak_incremented = False

    if not last_active:
        streak_days = 1
        streak_incremented = True
    elif last_active == today_str:
        # Already active today, maintain
        pass
    else:
        try:
            last_date = datetime.strptime(last_active, "%Y-%m-%d").date()
            today_date = datetime.strptime(today_str, "%Y-%m-%d").date()
            diff_days = (today_date - last_date).days

            if diff_days == 1:
                streak_days += 1
                streak_incremented = True
            else:
                # Broken streak
                streak_days = 1
                streak_incremented = True
        except Exception:
            streak_days = 1
            streak_incremented = True

    new_gold = prog.get("gold", 50) + gold_earned
    total_completed = prog.get("total_quests_completed", 0) + 1

    # 7. Persist to Supabase atomically
    # A. Update Progression
    supabase.table("user_progression").update({
        "level": level,
        "current_xp": current_xp,
        "gold": new_gold,
        "streak_days": streak_days,
        "last_active_date": today_str,
        "brawn_xp": brawn_xp,
        "intellect_xp": intellect_xp,
        "swiftness_xp": swiftness_xp,
        "vitality_xp": vitality_xp,
        "total_quests_completed": total_completed,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("user_id", user_id).execute()

    # B. Update Quest State
    supabase.table("quests").update({
        "completed": True,
        "completed_at": datetime.utcnow().isoformat(),
        "last_completed_date": today_str
    }).eq("id", quest_id).execute()

    # C. Audit Log into quest_history
    supabase.table("quest_history").insert({
        "user_id": user_id,
        "quest_id": quest_id,
        "quest_title": quest.get("title"),
        "attribute": attribute,
        "xp_earned": xp_earned,
        "gold_earned": gold_earned,
        "completed_at": datetime.utcnow().isoformat()
    }).execute()

    # D. Audit Log into streak_records if incremented
    if streak_incremented:
        supabase.table("streak_records").insert({
            "user_id": user_id,
            "streak_count": streak_days,
            "activity_date": today_str,
            "tasks_completed_count": 1,
            "action": "increment"
        }).execute()

    next_level_xp = get_xp_required_for_level(level)

    return {
        "quest_id": quest_id,
        "quest_title": quest.get("title"),
        "attribute": attribute,
        "xp_earned": xp_earned,
        "gold_earned": gold_earned,
        "is_critical_hit": is_crit,
        "bonus_multiplier": multiplier,
        "new_level": level,
        "current_xp": current_xp,
        "next_level_xp": next_level_xp,
        "level_up": leveled_up,
        "new_gold": new_gold,
        "new_streak": streak_days,
        "streak_incremented": streak_incremented,
        "attribute_xp": {
            "brawn": brawn_xp,
            "intellect": intellect_xp,
            "swiftness": swiftness_xp,
            "vitality": vitality_xp
        },
        "completed_at": datetime.utcnow().isoformat()
    }
