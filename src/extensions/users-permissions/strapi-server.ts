import type { Core } from '@strapi/strapi';
import authControllerFactory from './controllers/auth';
import jwtServiceFactory from './services/jwt';

type PluginController = ((args: { strapi: Core.Strapi }) => any) | Record<string, any>;
type PluginService = ((args: { strapi: Core.Strapi }) => any) | Record<string, any>;

type UsersPermissionsPlugin = {
  controllers: {
    auth: PluginController;
    user: PluginController;
    [key: string]: PluginController;
  };
  services: {
    jwt: PluginService;
    [key: string]: PluginService;
  };
  [key: string]: any;
};

const resolveModule = (
  candidate: PluginController | PluginService,
  strapi: Core.Strapi
): Record<string, any> => {
  if (typeof candidate === 'function') {
    return candidate({ strapi });
  }

  return candidate;
};

export default (plugin: UsersPermissionsPlugin) => {
  const originalAuthController = plugin.controllers.auth;
  const originalUserController = plugin.controllers.user;
  const originalJwtService = plugin.services.jwt;

  plugin.controllers.auth = ({ strapi }: { strapi: Core.Strapi }) => {
    const original = resolveModule(originalAuthController, strapi);

    const custom = authControllerFactory({
      strapi,
      defaultRegister: original.register.bind(original),
    });

    return {
      ...original,
      register: custom.register.bind(custom),
    };
  };

  plugin.controllers.user = ({ strapi }: { strapi: Core.Strapi }) => {
    const original = resolveModule(originalUserController, strapi);
    const custom = authControllerFactory({
      strapi,
      defaultRegister: async () => undefined,
    });

    return {
      ...original,
      me: custom.me.bind(custom),
    };
  };

  plugin.services.jwt = ({ strapi }: { strapi: Core.Strapi }) => {
    const original = resolveModule(originalJwtService, strapi);
    const custom = jwtServiceFactory({
      strapi,
      defaultIssue: original.issue.bind(original),
    });

    return {
      ...original,
      issue: custom.issue.bind(custom),
    };
  };

  return plugin;
};
