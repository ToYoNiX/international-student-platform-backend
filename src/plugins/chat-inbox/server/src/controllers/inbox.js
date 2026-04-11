const relationId = (value) => {
  if (typeof value === 'number') {
    return value;
  }

  if (value && typeof value === 'object' && typeof value.id === 'number') {
    return value.id;
  }

  return null;
};

module.exports = {
  async listConversations(ctx) {
    const adminUser = ctx.state?.user;

    if (!adminUser?.id) {
      return ctx.unauthorized('Admin authentication required');
    }

    const conversations = await strapi.db.query('api::chat-conversation.chat-conversation').findMany({
      where: { adminUserId: adminUser.id },
      populate: ['frontendUser'],
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
    });

    const data = await Promise.all(
      (conversations || []).map(async (conversation) => {
        const latestMessage = await strapi.db.query('api::chat-message.chat-message').findOne({
          where: { conversation: conversation.id },
          orderBy: { createdAt: 'desc' },
        });

        return {
          ...conversation,
          frontendUser: conversation.frontendUser
            ? {
                id: relationId(conversation.frontendUser),
                username: conversation.frontendUser.username || null,
                email: conversation.frontendUser.email || null,
                displayName: conversation.frontendUser.displayName || null,
              }
            : null,
          lastMessage: latestMessage || null,
        };
      })
    );

    return ctx.send({ data });
  },

  async listMessages(ctx) {
    const adminUser = ctx.state?.user;

    if (!adminUser?.id) {
      return ctx.unauthorized('Admin authentication required');
    }

    const conversationId = Number(ctx.params?.conversationId);
    if (!conversationId || Number.isNaN(conversationId)) {
      return ctx.badRequest('Invalid conversationId');
    }

    const conversation = await strapi.db.query('api::chat-conversation.chat-conversation').findOne({
      where: { id: conversationId },
    });

    if (!conversation || conversation.adminUserId !== adminUser.id) {
      return ctx.forbidden('Conversation not accessible');
    }

    const messages = await strapi.db.query('api::chat-message.chat-message').findMany({
      where: { conversation: conversationId },
      orderBy: { createdAt: 'asc' },
    });

    await strapi.db.query('api::chat-conversation.chat-conversation').update({
      where: { id: conversationId },
      data: { unreadForAdmin: 0 },
    });

    return ctx.send({ data: messages });
  },

  async sendMessage(ctx) {
    const adminUser = ctx.state?.user;

    if (!adminUser?.id) {
      return ctx.unauthorized('Admin authentication required');
    }

    const conversationId = Number(ctx.params?.conversationId);
    if (!conversationId || Number.isNaN(conversationId)) {
      return ctx.badRequest('Invalid conversationId');
    }

    const requestData = ctx.request?.body?.data ?? ctx.request?.body ?? {};
    const body = String(requestData.body || '').trim();
    if (!body) {
      return ctx.badRequest('Message body is required');
    }

    const conversation = await strapi.db.query('api::chat-conversation.chat-conversation').findOne({
      where: { id: conversationId },
      populate: ['frontendUser'],
    });

    if (!conversation || conversation.adminUserId !== adminUser.id) {
      return ctx.forbidden('Conversation not accessible');
    }

    const message = await strapi.db.query('api::chat-message.chat-message').create({
      data: {
        conversation: conversationId,
        senderType: 'admin',
        senderAdminUserId: adminUser.id,
        body,
      },
    });

    await strapi.db.query('api::chat-conversation.chat-conversation').update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        unreadForUser: (conversation.unreadForUser || 0) + 1,
      },
    });

    return ctx.send({ data: message });
  },
};