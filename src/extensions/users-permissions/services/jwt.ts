import type { Core } from '@strapi/strapi';

type JwtIssuePayload = {
  id?: number;
  userId?: number;
  email?: string;
  role?: {
    id: number;
    name: string;
    type: string;
  };
  [key: string]: unknown;
};

type JwtFactoryArgs = {
  strapi: Core.Strapi;
  defaultIssue: (payload: JwtIssuePayload, jwtOptions?: Record<string, unknown>) => unknown;
};

const jwtServiceFactory = ({ strapi, defaultIssue }: JwtFactoryArgs) => ({
  issue(payload: JwtIssuePayload, jwtOptions: Record<string, unknown> = {}) {
    // Keep this override synchronous: users-permissions controllers call issue() without await.
    const nextPayload = {
      ...payload,
    };

    return defaultIssue(nextPayload, jwtOptions);
  },
});

export default jwtServiceFactory;
