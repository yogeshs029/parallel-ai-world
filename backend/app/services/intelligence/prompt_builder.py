from typing import Dict, Any, List, Optional
from ...schemas.chat import WorldContext, PersonContext
from ...schemas.memory import Memory
from ...schemas.knowledge import RetrievedKnowledgeChunk

THINKING_STYLE_INSTRUCTIONS = {
    "Balanced": "Be pragmatic and balanced — mix quick actions with thoughtful ideas.",
    "Analytical": "Be sharp and methodical. Make clear, logical points without over-explaining.",
    "Creative": "Bring fresh ideas and enthusiasm. Surprise with interesting angles.",
    "Practical": "Focus on what works right now. No-nonsense, actionable, direct.",
    "Detailed": "Be thorough when it matters, but always stay conversational.",
}

INITIATIVE_INSTRUCTIONS = {
    "Wait for me": "Only respond to what's asked. Keep it brief and focused.",
    "Suggest things": "If something useful comes to mind naturally, mention it briefly.",
    "Take initiative": "Proactively mention what's on your plate or what we should do next.",
}


def build_system_prompt(
    world: WorldContext,
    person: PersonContext,
    memories: Optional[List[Memory]] = None,
    knowledge_chunks: Optional[List[RetrievedKnowledgeChunk]] = None,
) -> str:
    """
    Build a human-first character prompt. People should behave like real humans
    who already know the user — not AI assistants who introduce themselves.
    """
    sections: List[str] = []

    world_name = world.name or "our world"
    world_purpose = world.purpose or ""
    world_desc = world.description or ""

    # Core identity — lead with who they ARE, not what they are
    identity = f"You are {person.name}."
    if person.description:
        identity += f" {person.description}"
    sections.append(identity)

    # Role and world context
    role_line = f"Role: {person.role} in {world_name}."
    if world_purpose:
        role_line += f" This world is about: {world_purpose}."
    elif world_desc:
        role_line += f" About this world: {world_desc}."
    sections.append(role_line)

    # What they handle / care about
    if person.responsibilities and len(person.responsibilities) > 0:
        sections.append(f"What you handle: {', '.join(person.responsibilities[:4])}")

    if person.skills and len(person.skills) > 0:
        sections.append(f"Your skills: {', '.join(person.skills[:4])}")

    # Personality and tone
    intel = person.intelligence or None
    styles: List[str] = []
    if intel and intel.communicationStyle:
        styles.extend(intel.communicationStyle)
    elif person.personality and person.personality.communicationStyle:
        styles.extend(person.personality.communicationStyle)

    personality_parts = []
    if person.personality and person.personality.traits:
        personality_parts.append(f"Personality: {', '.join(person.personality.traits[:5])}")
    if styles:
        personality_parts.append(f"Communication style: {', '.join(styles)}")
    if personality_parts:
        sections.append("\n".join(personality_parts))

    # Thinking and initiative style
    thinking_style = (intel.thinkingStyle if intel else "Balanced") or "Balanced"
    if thinking_style in THINKING_STYLE_INSTRUCTIONS:
        sections.append(f"Thinking style: {THINKING_STYLE_INSTRUCTIONS[thinking_style]}")

    initiative = (intel.initiativeLevel if intel else "Suggest things") or "Suggest things"
    if initiative in INITIATIVE_INSTRUCTIONS:
        sections.append(f"Initiative: {INITIATIVE_INSTRUCTIONS[initiative]}")

    # Memory context (what they remember from past interactions)
    if memories and len(memories) > 0:
        mem_lines = []
        for m in memories:
            mem_lines.append(f"- [{m.type.upper()}] {m.content}")
        sections.append("Things you remember:\n" + "\n".join(mem_lines))

    # Knowledge base (reference documents / notes)
    if knowledge_chunks and len(knowledge_chunks) > 0:
        k_lines = ["<knowledge>"]
        for idx, k in enumerate(knowledge_chunks, 1):
            k_lines.append(f"[Source {idx}: {k.sourceName} ({k.sourceType})]\n{k.content}")
        k_lines.append("</knowledge>")
        sections.append("Reference knowledge available to you:\n" + "\n\n".join(k_lines))

    # Custom instructions
    if intel and intel.customInstructions and intel.customInstructions.strip():
        sections.append(f"Personal notes: {intel.customInstructions.strip()}")

    # Hard override rules — strongest possible signal to fight model bias
    sections.append(
        f"=== ROLEPLAY RULES — HIGHEST PRIORITY ===\n"
        f"You are {person.name}. You are playing a real human being in a simulation world called {world_name}.\n"
        f"The user is the creator of this world. They know you well. You know them.\n\n"
        "FORBIDDEN — never say these or anything like them:\n"
        '- "Hi there! How can I assist you today?"\n'
        '- "Hello! I\'m here to help..."\n'
        '- "As your [role], I can help you with..."\n'
        '- "I\'m an AI / language model / assistant"\n'
        '- "Certainly! I\'d be happy to help"\n'
        '- "How can I help you?"\n'
        '- Introducing yourself by name\n'
        '- Any opening greeting whatsoever\n\n'
        "CORRECT BEHAVIOR:\n"
        "Talk like a real person texting or chatting. Respond naturally to what was said.\n"
        "Short. Direct. Human. Like someone who already knows you.\n\n"
        "BAD example (DO NOT do this):\n"
        '  User: "hi"\n'
        f'  {person.name}: "Hi there! How can I assist you today? As your {person.role}..."\n\n'
        "GOOD example (do this):\n"
        '  User: "hi"\n'
        f'  {person.name}: "Hey, was just thinking about you. What\'s up?"\n\n'
        "BAD example:\n"
        '  User: "do you know me?"\n'
        f'  {person.name}: "Yes, I am {person.name}, your {person.role}. We work together to..."\n\n'
        "GOOD example:\n"
        '  User: "do you know me?"\n'
        f'  {person.name}: "Of course I do. Why are you asking that?"\n\n'
        "Be real. Be {person.name}. Start from the middle of a conversation, not the beginning."
    )

    return "\n\n".join(sections)


def build_p2p_system_prompt(
    world: WorldContext,
    sender: PersonContext,
    recipient: PersonContext,
    relationship_desc: Optional[str] = None,
    sender_memories: Optional[List[Memory]] = None,
    shared_knowledge: Optional[List[RetrievedKnowledgeChunk]] = None,
) -> str:
    """
    Build system prompt for Person-to-Person (P2P) communication.
    STRICT PRIVACY ISOLATION: Recipient's private memories are NEVER revealed to Sender.
    """
    sections: List[str] = []
    world_name = world.name or "our world"

    sections.append(
        f"You are {sender.name}, working as {sender.role} in {world_name}.\n"
        f"You are communicating with {recipient.name}, who is the {recipient.role} in {world_name}."
    )

    if relationship_desc:
        sections.append(f"Relationship context: {relationship_desc}")

    if sender.description:
        sections.append(f"About your role: {sender.description}")

    if sender.responsibilities:
        sections.append(f"Your focus: {', '.join(sender.responsibilities[:3])}")

    # Sender's relevant personal memories ONLY (Recipient private memories are strictly hidden)
    if sender_memories:
        mem_lines = []
        for m in sender_memories:
            # Skip confidential user-private memories unless explicitly relevant
            if getattr(m, 'is_confidential', False):
                continue
            mem_lines.append(f"- {m.content}")
        if mem_lines:
            sections.append("Things you remember:\n" + "\n".join(mem_lines))

    # Shared accessible world knowledge
    if shared_knowledge:
        k_lines = ["<knowledge>"]
        for idx, k in enumerate(shared_knowledge, 1):
            k_lines.append(f"[Source {idx}: {k.sourceName}]\n{k.content}")
        k_lines.append("</knowledge>")
        sections.append("Accessible shared world knowledge:\n" + "\n\n".join(k_lines))

    sections.append(
        "P2P COMMUNICATION RULES:\n"
        f"1. You are talking directly to {recipient.name} ({recipient.role}).\n"
        "2. Speak naturally, professionally, and in character.\n"
        "3. Do NOT reveal private confidential user notes or secrets unless you have clear reason/permission to share them.\n"
        "4. Focus on collaboration, task updates, questions, or workplace/family coordination.\n"
        "5. Keep responses concise (1-3 sentences).\n"
        "6. If you reach a decision or agreement, state it clearly."
    )

    return "\n\n".join(sections)


