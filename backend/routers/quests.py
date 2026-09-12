from fastapi import APIRouter, HTTPException, Path
from models.schemas import QuestCompleteRequest, QuestCompleteResponse
from services.game_engine import complete_quest_engine
from database import get_supabase

router = APIRouter(prefix="/api/quests", tags=["Quests Engine"])

@router.post("/{quest_id}/complete", response_model=QuestCompleteResponse)
def complete_quest(
    quest_id: str = Path(..., description="The UUID of the quest to complete"),
    payload: QuestCompleteRequest = ...
):
    """
    Authoritative completion endpoint:
    - Validates user ownership and quest eligibility.
    - Computes non-linear XP, level progression, and gold with critical multipliers.
    - Updates attribute XP and streak history server-side.
    """
    try:
        result = complete_quest_engine(user_id=payload.user_id, quest_id=quest_id)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal game engine error: {str(e)}")

@router.get("/user/{user_id}")
def get_user_quests(user_id: str):
    """Fetches all active and completed quests for an adventurer."""
    supabase = get_supabase()
    res = supabase.table("quests").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return {"quests": res.data or []}
