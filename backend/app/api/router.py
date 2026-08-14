from .endpoints import (
    health,
    chat,
    memory,
    knowledge,
    runtime,
    tasks,
    notifications,
    approvals,
    permissions,
    conversation,
    voice,
    relationships,
    conversations,
)

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(memory.router, prefix="", tags=["Memory"])
api_router.include_router(knowledge.router, prefix="", tags=["Knowledge"])

# Module 6: World Runtime
api_router.include_router(runtime.router, prefix="/runtime", tags=["Runtime"])
api_router.include_router(tasks.router, prefix="", tags=["Tasks"])
api_router.include_router(notifications.router, prefix="", tags=["Notifications"])
api_router.include_router(approvals.router, prefix="", tags=["Approvals"])
api_router.include_router(permissions.router, prefix="", tags=["Permissions"])
api_router.include_router(conversation.router, prefix="", tags=["Conversation"])

# Module 7: Voice & Presence
api_router.include_router(voice.router, prefix="", tags=["Voice"])

# Module 8: Relationships & Communication
api_router.include_router(relationships.router, prefix="", tags=["Relationships"])
api_router.include_router(conversations.router, prefix="", tags=["P2P Conversations"])

