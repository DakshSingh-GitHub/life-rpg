from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Body
from models.schemas import AIGenerateQuestlineRequest, AIGenerateQuestlineResponse, AIQuestItem
from services.ai_service import generate_questline_with_ai
from database import get_supabase

router = APIRouter(prefix="/api/ai", tags=["AI Dungeon Master"])

@router.post("/generate-questline", response_model=AIGenerateQuestlineResponse)
def generate_questline(payload: AIGenerateQuestlineRequest):
    """
    Translates any real-world goal or habit into an authentic RPG quest sequence.
    Powered by Gemini AI with intelligent lore generation and attribute balance.
    """
    try:
        questline = generate_questline_with_ai(
            goal=payload.goal,
            hero_class=payload.hero_class or "warrior",
            duration_days=payload.duration_days or 7,
            daily_time_minutes=payload.daily_time_minutes or 30
        )
        return questline
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate questline: {str(e)}")

@router.post("/enroll-questline")
def enroll_questline(
    user_id: str = Body(..., embed=True),
    quests: List[Dict[str, Any]] = Body(..., embed=True)
):
    """
    Batch inserts an AI-generated questline directly into the player's active Quest Log.
    """
    supabase = get_supabase()
    to_insert = []
    for q in quests:
        to_insert.append({
            "user_id": user_id,
            "title": q.get("title", "Hero Quest"),
            "category": q.get("category", "habits"),
            "attribute": q.get("attribute", "SWIFTNESS"),
            "difficulty": q.get("difficulty", "medium"),
            "xp_reward": q.get("xp_reward", 40),
            "gold_reward": q.get("gold_reward", 25),
            "is_priority": q.get("is_priority", False),
            "is_recurring": q.get("is_recurring", False),
            "completed": False
        })

    if not to_insert:
        raise HTTPException(status_code=400, detail="No quests provided to enroll.")

    res = supabase.table("quests").insert(to_insert).execute()
    return {
        "success": True,
        "enrolled_count": len(res.data) if res.data else len(to_insert),
        "message": f"Successfully forged {len(to_insert)} legendary quests into your Quest Log!"
    }
