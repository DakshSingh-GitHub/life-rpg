from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# ==============================================================================
# Quest Engine Schemas
# ==============================================================================

class QuestCompleteRequest(BaseModel):
    user_id: str = Field(..., description="The authenticating user UUID")

class QuestCompleteResponse(BaseModel):
    quest_id: str
    quest_title: str
    attribute: str
    xp_earned: int
    gold_earned: int
    is_critical_hit: bool
    bonus_multiplier: float
    new_level: int
    current_xp: int
    next_level_xp: int
    level_up: bool
    new_gold: int
    new_streak: int
    streak_incremented: bool
    attribute_xp: Dict[str, int]
    completed_at: str

# ==============================================================================
# Shop & Economy Schemas
# ==============================================================================

class ShopRedeemRequest(BaseModel):
    user_id: str = Field(..., description="The authenticating user UUID")
    item_id: str = Field(..., description="Unique slug for the shop reward")
    title: str = Field(..., description="Display title of the reward item")
    cost: int = Field(..., gt=0, description="Gold cost of the reward")

class ShopRedeemResponse(BaseModel):
    success: bool
    item_id: str
    title: str
    cost: int
    remaining_gold: int
    unlocked_reward_id: str
    purchased_at: str

# ==============================================================================
# AI Dungeon Master Schemas
# ==============================================================================

class AIGenerateQuestlineRequest(BaseModel):
    goal: str = Field(..., min_length=3, max_length=300, description="Real life objective or chore habit to transform")
    hero_class: Optional[str] = Field("warrior", description="warrior, mage, rogue, or druid")
    duration_days: Optional[int] = Field(7, ge=1, le=30, description="Total days for the quest chain")
    daily_time_minutes: Optional[int] = Field(30, ge=5, le=360, description="Target daily commitment in minutes")

class AIQuestItem(BaseModel):
    day: int
    title: str
    category: str  # fitness, knowledge, habits, wellness
    attribute: str  # BRAWN, INTELLECT, SWIFTNESS, VITALITY
    difficulty: str  # easy, medium, hard, epic
    xp_reward: int
    gold_reward: int
    lore_flavor: str
    is_priority: bool = False
    is_recurring: bool = False

class AIGenerateQuestlineResponse(BaseModel):
    questline_title: str
    lore_brief: str
    target_goal: str
    hero_class: str
    duration_days: int
    total_estimated_xp: int
    total_estimated_gold: int
    quests: List[AIQuestItem]

# ==============================================================================
# Leaderboard & Social Schemas
# ==============================================================================

class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    username: str
    full_name: Optional[str] = None
    avatar_class: str
    level: int
    current_xp: int
    streak_days: int
    gold: int
    total_quests_completed: int

class LeaderboardResponse(BaseModel):
    period: str
    total_adventurers: int
    rankings: List[LeaderboardEntry]
    attribute_champions: Dict[str, Any]

# ==============================================================================
# Cron & Maintenance Schemas
# ==============================================================================

class CronResetResponse(BaseModel):
    status: str
    recurring_tasks_reset_count: int
    streaks_audited_count: int
    streaks_broken_count: int
    timestamp: str
