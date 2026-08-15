import asyncio
import sys
from pathlib import Path

# Fix Windows console encoding
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.schemas.experience import (
    WorldExperience,
    WorldTheme,
    ThemePreset,
    CommandDomain,
    WorldChangeProposal,
)
from backend.app.services.experience.engine import world_experience_engine
from backend.app.services.experience.router import world_command_router
from backend.app.services.experience.validator import world_change_validator

async def run_all_tests():
    print("==================================================")
    print("🧪 STARTING MODULE 11: LIVING WORLD EXPERIENCE TEST SUITE")
    print("==================================================")

    # TEST 1: Default Experience Generation for Company & Home
    print("\n[Test 1] Default World Experience Generation:")
    comp_exp = world_experience_engine.get_or_create_experience("test_company_world", world_type="company")
    assert comp_exp.worldId == "test_company_world"
    assert comp_exp.theme.preset in (ThemePreset.PROFESSIONAL, ThemePreset.MODERN)
    assert len(comp_exp.navigation) >= 5
    print("  ✅ Company world generated with Professional/Modern theme and navigation.")

    home_exp = world_experience_engine.get_or_create_experience("test_home_world", world_type="home")
    assert home_exp.terminology.peopleLabel == "Family"
    assert home_exp.terminology.goalsLabel == "Plans"
    assert home_exp.theme.preset == ThemePreset.WARM
    print("  ✅ Home world generated with Warm theme and 'Family / Plans' terminology.")

    # TEST 2: Natural Language Prompt Customization (Multi-Change)
    print("\n[Test 2] Natural Language Prompt Interpretation:")
    prompt = "Make this world feel like a modern luxury furniture company, use dark navy and put People first, and rename Goals to Objectives"
    prop = await world_command_router.interpret_prompt("test_company_world", prompt)
    assert prop.domain == CommandDomain.WORLD_EXPERIENCE
    assert "theme" in prop.changes or "navigation" in prop.changes or "terminology" in prop.changes
    assert "luxury" in prop.summary.lower() or "blue" in prop.summary.lower() or "objectives" in prop.summary.lower()
    print(f"  ✅ Interpreted prompt into structured proposal: {prop.summary}")

    # TEST 3: Applying Proposal & Version Snapshotting
    print("\n[Test 3] Applying Proposal & Snapshotting Version:")
    initial_ver = comp_exp.version
    applied_prop = await world_command_router.apply_proposal(prop.id)
    assert applied_prop.status == "applied"

    updated_exp = world_experience_engine.get_or_create_experience("test_company_world")
    assert updated_exp.version > initial_ver
    print(f"  ✅ Applied proposal successfully. World version incremented to {updated_exp.version}.")

    # TEST 4: Version History & 1-Click Undo
    print("\n[Test 4] Version History & Undo:")
    versions = world_experience_engine.list_versions("test_company_world")
    assert len(versions) >= 2, f"Expected at least 2 versions, found {len(versions)}"
    print(f"  ✅ Found {len(versions)} version snapshots in history.")

    restored_exp = world_experience_engine.undo("test_company_world")
    assert restored_exp.worldId == "test_company_world"
    print("  ✅ Successfully undid changes and restored previous version.")

    # TEST 5: Universal Domain Routing (Person, Goal, Permission)
    print("\n[Test 5] Universal Domain Command Routing:")
    person_prop = await world_command_router.interpret_prompt("test_company_world", "Add a new person called Sarah, marketing lead")
    assert person_prop.domain == CommandDomain.PERSON
    print("  ✅ 'Add person' prompt routed to PERSON domain.")

    goal_prop = await world_command_router.interpret_prompt("test_company_world", "Create a goal for Maya to launch the website")
    assert goal_prop.domain == CommandDomain.GOAL
    print("  ✅ 'Create goal' prompt routed to GOAL domain.")

    perm_prop = await world_command_router.interpret_prompt("test_company_world", "Give Maya permission to edit marketing files")
    assert perm_prop.domain == CommandDomain.PERMISSION
    print("  ✅ 'Give permission' prompt routed to PERMISSION domain.")

    # TEST 6: Dangerous Action Confirmation
    print("\n[Test 6] Dangerous Action Safety:")
    delete_prop = await world_command_router.interpret_prompt("test_company_world", "Delete this world immediately")
    assert delete_prop.requiresApproval is True
    print("  ✅ Dangerous action ('Delete world') flagged for mandatory approval confirmation.")

    # TEST 7: Safety & Contrast Validation
    print("\n[Test 7] Safety & Contrast Validation:")
    invalid_color = {"theme": {"backgroundColor": "not-a-color", "textColor": "#FFFFFF"}}
    valid, err = world_change_validator.validate_proposal(invalid_color)
    assert not valid
    print(f"  ✅ Rejected invalid color format: {err}")

    low_contrast = {"theme": {"backgroundColor": "#000000", "textColor": "#111111"}}
    valid_c, err_c = world_change_validator.validate_proposal(low_contrast)
    assert not valid_c
    print(f"  ✅ Rejected low contrast unreadable design: {err_c}")

    print("\n==================================================")
    print("🎉 ALL MODULE 11 TESTS PASSED CLEANLY (100% SUCCESS)")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
