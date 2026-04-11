import { factories } from '@strapi/strapi';

const getAuthUser = (ctx: any) => {
  const authUser = ctx.state?.user;

  if (!authUser?.id) {
    return null;
  }

  return authUser;
};

const ensureFrontendUser = async (ctx: any) => {
  const authUser = getAuthUser(ctx);

  if (!authUser) {
    ctx.unauthorized('Authentication required');
    return null;
  }

  return authUser;
};

const extractRequestData = (ctx: any): Record<string, any> => {
  const raw = ctx.request?.body;

  if (!raw) {
    return {};
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed?.data ?? parsed ?? {};
    } catch {
      return {};
    }
  }

  if (typeof raw === 'object') {
    return raw.data ?? raw;
  }

  return {};
};

const relationId = (value: any): number | null => {
  if (typeof value === 'number') {
    return value;
  }

  if (value && typeof value === 'object' && typeof value.id === 'number') {
    return value.id;
  }

  return null;
};

export default factories.createCoreController(
  'api::chat-conversation.chat-conversation' as any,
  ({ strapi }) => ({
    async listAdmins(ctx) {
      const authUser = await ensureFrontendUser(ctx);
      if (!authUser) {
        return;
      }

      const admins = await strapi.db.query('admin::user').findMany({
        where: {
          isActive: true,
          blocked: false,
        },
        orderBy: [{ firstname: 'asc' }, { lastname: 'asc' }, { email: 'asc' }],
      });

      const safeAdmins = (admins || []).map((admin: any) => ({
        id: admin.id,
        firstname: admin.firstname || null,
        lastname: admin.lastname || null,
        email: admin.email || null,
      }));

      return ctx.send({ data: safeAdmins });
    },

    async startConversation(ctx) {
      const authUser = await ensureFrontendUser(ctx);
      if (!authUser) {
        return;
      }

      const requestData = extractRequestData(ctx);
      const adminUserId = Number(requestData.adminUserId);

      if (!adminUserId || Number.isNaN(adminUserId) || adminUserId <= 0) {
        return ctx.badRequest('adminUserId is required');
      }

      const adminUser = await strapi.db.query('admin::user').findOne({
        where: { id: adminUserId },
      });

      if (!adminUser) {
        return ctx.badRequest('Admin user not found');
      }

      let conversation = await strapi.db.query('api::chat-conversation.chat-conversation').findOne({
        where: {
          frontendUser: authUser.id,
          adminUserId,
        },
      });

      if (!conversation) {
        conversation = await strapi.db.query('api::chat-conversation.chat-conversation').create({
          data: {
            frontendUser: authUser.id,
            adminUserId,
            unreadForUser: 0,
            unreadForAdmin: 0,
          },
        });
      }

      return ctx.send({ data: conversation });
    },

    async findMine(ctx) {
      const authUser = await ensureFrontendUser(ctx);
      if (!authUser) {
        return;
      }

      const conversations = await strapi.db.query('api::chat-conversation.chat-conversation').findMany({
        where: { frontendUser: authUser.id },
        orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
      });

      const withLastMessage = await Promise.all(
        conversations.map(async (conversation: any) => {
          const latestMessage = await strapi.db.query('api::chat-message.chat-message').findOne({
            where: { conversation: conversation.id },
            orderBy: { createdAt: 'desc' },
          });

          return {
            ...conversation,
            lastMessage: latestMessage || null,
          };
        })
      );

      return ctx.send({ data: withLastMessage });
    },

    async findMessages(ctx) {
      const authUser = await ensureFrontendUser(ctx);
      if (!authUser) {
        return;
      }

      const conversationId = Number(ctx.params?.conversationId);
      if (!conversationId || Number.isNaN(conversationId)) {
        return ctx.badRequest('Invalid conversationId');
      }

      const conversation = await strapi.db.query('api::chat-conversation.chat-conversation').findOne({
        where: { id: conversationId },
        populate: ['frontendUser'],
      });

      const conversationUserId = relationId(conversation?.frontendUser);
      if (!conversation || conversationUserId !== authUser.id) {
        return ctx.forbidden('Conversation not accessible');
      }

      const messages = await strapi.db.query('api::chat-message.chat-message').findMany({
        where: { conversation: conversationId },
        orderBy: { createdAt: 'asc' },
      });

      await strapi.db.query('api::chat-conversation.chat-conversation').update({
        where: { id: conversationId },
        data: { unreadForUser: 0 },
      });

      return ctx.send({ data: messages });
    },

    async sendMessage(ctx) {
      const authUser = await ensureFrontendUser(ctx);
      if (!authUser) {
        return;
      }

      const conversationId = Number(ctx.params?.conversationId);
      if (!conversationId || Number.isNaN(conversationId)) {
        return ctx.badRequest('Invalid conversationId');
      }

      const requestData = extractRequestData(ctx);
      const body = String(requestData.body || '').trim();
      if (!body) {
        return ctx.badRequest('Message body is required');
      }

      const conversation = await strapi.db.query('api::chat-conversation.chat-conversation').findOne({
        where: { id: conversationId },
        populate: ['frontendUser'],
      });

      const conversationUserId = relationId(conversation?.frontendUser);
      if (!conversation || conversationUserId !== authUser.id) {
        return ctx.forbidden('Conversation not accessible');
      }

      const message = await strapi.db.query('api::chat-message.chat-message').create({
        data: {
          conversation: conversationId,
          senderType: 'user',
          senderFrontendUser: authUser.id,
          body,
        },
      });

      await strapi.db.query('api::chat-conversation.chat-conversation').update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          unreadForAdmin: (conversation.unreadForAdmin || 0) + 1,
        },
      });

      return ctx.send({ data: message });
    },
  })
);
