import type { Core } from '@strapi/strapi';

type JwtIssuePayload = {
  id?: number;
  userId?: number;
  [key: string]: unknown;
};

type RoleShape = {
  id: number;
  name: string;
  type: string;
};

type UserWithRole = {
  id: number;
  email: string;
  userType?: string;
  role?: RoleShape | null;
};

type JwtFactoryArgs = {
  strapi: Core.Strapi;
  defaultIssue: (payload: JwtIssuePayload, jwtOptions?: Record<string, unknown>) => unknown;
};

const jwtServiceFactory = ({ strapi, defaultIssue }: JwtFactoryArgs) => ({
  async issue(payload: JwtIssuePayload, jwtOptions: Record<string, unknown> = {}) {
    const userId = payload?.id ?? payload?.userId;

    if (!userId) {
      return defaultIssue(payload, jwtOptions);
    }

    const user = (await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      populate: ['role'],
    })) as UserWithRole | null;

    if (!user || !user.role) {
      return defaultIssue(payload, jwtOptions);
    }

    const nextPayload = {
      ...payload,
      id: user.id,
      email: user.email,
      userType: user.userType,
      role: {
        id: user.role.id,
        name: user.role.name,
        type: user.role.type,
      },
    };

    return defaultIssue(nextPayload, jwtOptions);
  },
});

export default jwtServiceFactory;
