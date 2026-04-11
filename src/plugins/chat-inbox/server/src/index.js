const controllers = {
  inbox: require('./controllers/inbox'),
};

const routes = {
  admin: {
    type: 'admin',
    routes: [
      {
        method: 'GET',
        path: '/conversations',
        handler: 'inbox.listConversations',
      },
      {
        method: 'GET',
        path: '/conversations/:conversationId/messages',
        handler: 'inbox.listMessages',
      },
      {
        method: 'POST',
        path: '/conversations/:conversationId/messages',
        handler: 'inbox.sendMessage',
      },
    ],
  },
};

module.exports = {
  register() {},
  bootstrap() {},
  controllers,
  routes,
  services: {},
  contentTypes: {},
  policies: {},
  middlewares: {},
};