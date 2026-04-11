export default {
  routes: [
    {
      method: 'GET',
      path: '/chat/admins',
      handler: 'chat-conversation.listAdmins',
      config: { auth: {} },
    },
    {
      method: 'GET',
      path: '/chat/conversations',
      handler: 'chat-conversation.findMine',
      config: { auth: {} },
    },
    {
      method: 'POST',
      path: '/chat/conversations/start',
      handler: 'chat-conversation.startConversation',
      config: { auth: {} },
    },
    {
      method: 'GET',
      path: '/chat/conversations/:conversationId/messages',
      handler: 'chat-conversation.findMessages',
      config: { auth: {} },
    },
    {
      method: 'POST',
      path: '/chat/conversations/:conversationId/messages',
      handler: 'chat-conversation.sendMessage',
      config: { auth: {} },
    }
  ],
};