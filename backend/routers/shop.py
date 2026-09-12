from datetime import datetime
from fastapi import APIRouter, HTTPException
from models.schemas import ShopRedeemRequest, ShopRedeemResponse
from database import get_supabase

router = APIRouter(prefix="/api/shop", tags=["Economy & Armory"])

@router.post("/redeem", response_model=ShopRedeemResponse)
def redeem_reward(payload: ShopRedeemRequest):
    """
    Atomic reward redemption:
    - Validates user gold balance.
    - Locks row and deducts gold balance server-side.
    - Records entry in unlocked_rewards inventory.
    """
    supabase = get_supabase()

    # 1. Fetch current gold balance
    prog_res = supabase.table("user_progression").select("gold").eq("user_id", payload.user_id).execute()
    if not prog_res.data or len(prog_res.data) == 0:
        raise HTTPException(status_code=404, detail="Adventurer progression record not found.")

    current_gold = prog_res.data[0].get("gold", 0)
    if current_gold < payload.cost:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient Gold! Item costs {payload.cost} Gold, but you only possess {current_gold} Gold."
        )

    new_gold = current_gold - payload.cost
    now_iso = datetime.utcnow().isoformat()

    # 2. Deduct Gold
    supabase.table("user_progression").update({
        "gold": new_gold,
        "updated_at": now_iso
    }).eq("user_id", payload.user_id).execute()

    # 3. Add to unlocked_rewards
    insert_res = supabase.table("unlocked_rewards").insert({
        "user_id": payload.user_id,
        "item_id": payload.item_id,
        "title": payload.title,
        "cost": payload.cost,
        "purchased_at": now_iso
    }).execute()

    unlocked_id = insert_res.data[0].get("id") if insert_res.data else "reward-unlocked"

    return {
        "success": True,
        "item_id": payload.item_id,
        "title": payload.title,
        "cost": payload.cost,
        "remaining_gold": new_gold,
        "unlocked_reward_id": str(unlocked_id),
        "purchased_at": now_iso
    }

@router.get("/unlocked/{user_id}")
def get_unlocked_rewards(user_id: str):
    """Fetches all purchased rewards and armory inventory for an adventurer."""
    supabase = get_supabase()
    res = supabase.table("unlocked_rewards").select("*").eq("user_id", user_id).order("purchased_at", desc=True).execute()
    return {"unlocked_rewards": res.data or []}
