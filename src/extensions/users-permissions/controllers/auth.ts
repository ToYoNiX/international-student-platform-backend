import type { Core } from '@strapi/strapi';
import utils from '@strapi/utils';

const { ApplicationError, ForbiddenError } = utils.errors;

type RoleShape = {
  id: number;
  name: string;
  type: string;
};

type UserShape = {
  id: number;
  email: string;
  username: string;
  role?: RoleShape | null;
  [key: string]: unknown;
};

const toRolePayload = (role: RoleShape) => ({
  id: role.id,
  name: role.name,
  type: role.type,
});

const sanitizeUser = async (strapi: Core.Strapi, user: unknown, ctx: any) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel('plugin::users-permissions.user');

  return strapi.contentAPI.sanitize.output(user, userSchema, { auth });
};

const withFrontendUserAliases = (user: Record<string, unknown>) => {
  const name = (user.displayName as string | null | undefined) ||
    (user.username as string | null | undefined) ||
    null;
  const collegeId = (user.universityId as string | null | undefined) || null;

  return {
    ...user,
    displayName: name,
    name,
    universityId: collegeId,
    collegeId,
  };
};

type AuthControllerFactoryArgs = {
  strapi: Core.Strapi;
  defaultRegister: (ctx: any) => Promise<void>;
  defaultCallback?: (ctx: any) => Promise<void>;
};

const authControllerFactory = ({ strapi, defaultRegister, defaultCallback }: AuthControllerFactoryArgs) => ({

  async callback(ctx: any) {
    if (!defaultCallback) {
      throw new ApplicationError('Default callback handler is unavailable');
    }

    let defaultResponse: any;
    const originalSend = ctx.send.bind(ctx);
    ctx.send = (payload: unknown) => {
      defaultResponse = payload;
      return payload;
    };

    await defaultCallback(ctx);
    ctx.send = originalSend;

    const userPayload = defaultResponse?.user
      ? withFrontendUserAliases(defaultResponse.user as Record<string, unknown>)
      : defaultResponse?.user;

    return ctx.send({
      ...defaultResponse,
      user: userPayload,
    });
  },

  async register(ctx: any) {
    const body = ctx.request.body || {};
    const requestedRole = typeof body.role === 'string' ? body.role.trim() : '';

    if (!requestedRole) {
      throw new ForbiddenError('Invalid role');
    }

    if (!['visitor', 'college-member'].includes(requestedRole)) {
      throw new ForbiddenError('Invalid role');
    }

    const universityId =
      typeof body.universityId === 'string' ? body.universityId.trim() : body.universityId;

    if (requestedRole === 'college-member' && !universityId) {
      return ctx.badRequest('universityId is required for college-member users');
    }

    // Strapi's default register action rejects unknown parameters like role.
    delete body.role;
    ctx.request.body = body;

    let defaultResponse: any;
    const originalSend = ctx.send.bind(ctx);
    ctx.send = (payload: unknown) => {
      defaultResponse = payload;
      return payload;
    };

    await defaultRegister(ctx);
    ctx.send = originalSend;

    const createdUserId = defaultResponse?.user?.id;

    if (!createdUserId) {
      throw new ApplicationError('Unable to identify registered user');
    }

    const role = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: requestedRole },
    });

    if (!role) {
      throw new ApplicationError(`Role not found for role: ${requestedRole}`);
    }

    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: createdUserId },
      data: {
        role: role.id,
        universityId: requestedRole === 'college-member' ? universityId : null,
      },
    });

    const userWithRole = (await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: createdUserId },
      populate: ['role', 'avatar'],
    })) as UserShape;

    if (!userWithRole) {
      throw new ApplicationError('Unable to load registered user');
    }

    const sanitizedUser = await sanitizeUser(strapi, userWithRole, ctx);
    const userPayload = withFrontendUserAliases(sanitizedUser as Record<string, unknown>);
    const jwt = strapi.plugin('users-permissions').service('jwt').issue({
      id: userWithRole.id,
      email: userWithRole.email,
      role: userWithRole.role ? toRolePayload(userWithRole.role) : null,
    });
    return ctx.send({ jwt, user: userPayload });
  },

  async me(ctx: any) {
    const authUser = ctx.state.user;

    if (!authUser) {
      return ctx.unauthorized();
    }

    const user = (await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: authUser.id },
      populate: ['role', 'avatar'],
    })) as UserShape | null;

    if (!user) {
      return ctx.notFound('User not found');
    }

    const {
      password,
      resetPasswordToken,
      confirmationToken,
      ...safeUser
    } = user as Record<string, unknown>;

    void password;
    void resetPasswordToken;
    void confirmationToken;

    ctx.body = withFrontendUserAliases({
      ...safeUser,
      role: user.role ? toRolePayload(user.role) : null,
    });
  },
});

export = authControllerFactory;
