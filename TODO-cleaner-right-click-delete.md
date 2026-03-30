Plan for cleaner right-click delete chat:
- Target: frontend/src/features/cleaner/pages/messages_page.jsx thread list
- Add state: threadContextMenu = {threadId, x, y} or null
- Thread button onContextMenu handler
- JSX menu with Delete option
- handleDelete: Modal.confirm → api.delete(`/messages/booking/${threadId}`) → setThreads(prev => prev.filter(t => t.id !== threadId)) → saveChatThreads → if activeThreadId === threadId set null
