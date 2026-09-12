import json
import logging
from typing import Dict, Any, List
from config import settings

logger = logging.getLogger("liferpg.ai_service")

# Try importing Gemini SDK
_gemini_available = False
try:
    import google.generativeai as genai
    if settings.gemini_api_key:
        genai.configure(api_key=settings.gemini_api_key)
        _gemini_available = True
        logger.info("Google Generative AI configured successfully.")
except Exception as e:
    logger.info(f"Gemini API initialization deferred (API key optional): {e}")

FALLBACK_TEMPLATES = [
    {
        "pattern": ["code", "program", "python", "react", "next", "software", "learn", "study", "read"],
        "attribute": "INTELLECT",
        "category": "knowledge",
        "titles": [
            "Decipher the Foundation Scrolls (Day 1 Discovery)",
            "Forge the First Working Artifact (Day 2 Syntax Trial)",
            "Conquer the Logic Labyrinth (Day 3 Problem Solving)",
            "Debug the Spectral Glitches (Day 4 Refinement)",
            "Construct the Grand Module (Day 5 Integration)",
            "The Polish & Documentation Ritual (Day 6 Review)",
            "Ascension: Deploy the Masterwork (Day 7 Mastery)"
        ]
    },
    {
        "pattern": ["workout", "fitness", "run", "gym", "lift", "strength", "pushup", "cardio", "marathon"],
        "attribute": "BRAWN",
        "category": "fitness",
        "titles": [
            "Awakening the Muscle Memory (Day 1 Warmup Rite)",
            "The Iron Conditioning Trial (Day 2 Core Resistance)",
            "The Endurance Pilgrim's Trek (Day 3 Active Cardio)",
            "Elixir of Recovery (Day 4 Mobility & Rest)",
            "Breaking the Peak Boundary (Day 5 High Intensity)",
            "The Warrior's Discipline Form (Day 6 Technique)",
            "The Final Gauntlet of Might (Day 7 Peak Challenge)"
        ]
    },
    {
        "pattern": ["habit", "sleep", "water", "meditate", "clean", "organize", "morning", "routine"],
        "attribute": "SWIFTNESS",
        "category": "habits",
        "titles": [
            "The Dawn Alignment Ceremony (Day 1 Habit Ignition)",
            "Declutter the Inner Sanctum (Day 2 Space Organization)",
            "Taming the Chrono Flow (Day 3 Time-Blocking)",
            "The Mid-Journey Reflection (Day 4 Consistency Check)",
            "Sharpening the Execution Reflex (Day 5 Speed Routine)",
            "Reinforcing the Habit Sigils (Day 6 Resilience)",
            "Master of the Everyday Craft (Day 7 Permanent Form)"
        ]
    }
]

def generate_questline_with_ai(
    goal: str,
    hero_class: str = "warrior",
    duration_days: int = 7,
    daily_time_minutes: int = 30
) -> Dict[str, Any]:
    """
    Translates real-world tasks into RPG questlines.
    Uses Google Gemini if configured, otherwise employs intelligent archetype fallback.
    """
    if _gemini_available and settings.gemini_api_key:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"""
            You are the Legendary Dungeon Master for LifeRPG, a gamified habit platform.
            Convert the following real-world goal into a {duration_days}-day RPG Questline.
            Goal: "{goal}"
            Adventurer Archetype: {hero_class}
            Daily Commitment: ~{daily_time_minutes} minutes

            Return strictly valid JSON with this exact schema:
            {{
                "questline_title": "Epic RPG title",
                "lore_brief": "2 sentence fantasy lore context tailored to a {hero_class}",
                "target_goal": "{goal}",
                "hero_class": "{hero_class}",
                "duration_days": {duration_days},
                "quests": [
                    {{
                        "day": 1,
                        "title": "Inspiring fantasy quest name describing real action",
                        "category": "fitness" | "knowledge" | "habits" | "wellness",
                        "attribute": "BRAWN" | "INTELLECT" | "SWIFTNESS" | "VITALITY",
                        "difficulty": "easy" | "medium" | "hard" | "epic",
                        "xp_reward": 20 to 150,
                        "gold_reward": 10 to 100,
                        "lore_flavor": "1 sentence RPG quest description",
                        "is_priority": false,
                        "is_recurring": false
                    }}
                ]
            }}
            """
            response = model.generate_content(prompt)
            clean_text = response.text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]

            parsed = json.loads(clean_text)
            # Tally total rewards
            quests = parsed.get("quests", [])
            total_xp = sum(q.get("xp_reward", 25) for q in quests)
            total_gold = sum(q.get("gold_reward", 15) for q in quests)
            parsed["total_estimated_xp"] = total_xp
            parsed["total_estimated_gold"] = total_gold
            return parsed
        except Exception as e:
            logger.warning(f"Gemini generation fallback to local template: {e}")

    # Local Intelligent Fallback Generator
    goal_lower = goal.lower()
    chosen_template = FALLBACK_TEMPLATES[0]
    for template in FALLBACK_TEMPLATES:
        if any(keyword in goal_lower for keyword in template["pattern"]):
            chosen_template = template
            break

    attribute = chosen_template["attribute"]
    category = chosen_template["category"]
    sample_titles = chosen_template["titles"]

    quests: List[Dict[str, Any]] = []
    difficulties = ["easy", "easy", "medium", "medium", "hard", "hard", "epic"]

    for d in range(1, duration_days + 1):
        idx = (d - 1) % len(sample_titles)
        diff = difficulties[(d - 1) % len(difficulties)]
        xp = 20 if diff == "easy" else 40 if diff == "medium" else 75 if diff == "hard" else 150
        gold = 10 if diff == "easy" else 25 if diff == "medium" else 50 if diff == "hard" else 100

        title = f"{sample_titles[idx]} ({goal[:25]}...)"
        quests.append({
            "day": d,
            "title": title,
            "category": category,
            "attribute": attribute,
            "difficulty": diff,
            "xp_reward": xp,
            "gold_reward": gold,
            "lore_flavor": f"Day {d} milestone to forge lasting mastery over your objective.",
            "is_priority": d == 1 or diff == "epic",
            "is_recurring": False
        })

    total_xp = sum(q["xp_reward"] for q in quests)
    total_gold = sum(q["gold_reward"] for q in quests)

    return {
        "questline_title": f"The Quest for {goal.title()}",
        "lore_brief": f"An adventurous campaign for the {hero_class.capitalize()} to conquer '{goal}' and gain legendary renown across the realm.",
        "target_goal": goal,
        "hero_class": hero_class,
        "duration_days": duration_days,
        "total_estimated_xp": total_xp,
        "total_estimated_gold": total_gold,
        "quests": quests
    }
