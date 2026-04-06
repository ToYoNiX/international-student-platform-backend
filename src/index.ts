import type { Core } from '@strapi/strapi';

type RoleType = 'public' | 'authenticated' | 'visitor' | 'college-member' | 'admin';

const ROLE_DESCRIPTIONS: Record<RoleType, string> = {
  public: 'Default role for unauthenticated users.',
  authenticated: 'Legacy authenticated role (unused by custom registration).',
  visitor: 'External users without a university ID.',
  'college-member': 'College students/staff users with a university ID.',
  admin: 'Application admin users assigned manually by developers.',
};

const VISITOR_ACTIONS = [
  'plugin::users-permissions.user.me',
  'plugin::users-permissions.user.update',
  'plugin::users-permissions.auth.changePassword',
  'plugin::users-permissions.auth.forgotPassword',
  'plugin::users-permissions.auth.resetPassword',
  'plugin::upload.content-api.upload',
];

const PUBLIC_ACTIONS = [
  'plugin::users-permissions.auth.callback',
  'plugin::users-permissions.auth.register',
  'plugin::users-permissions.auth.forgotPassword',
  'plugin::users-permissions.auth.resetPassword',
];

const flattenActionMap = (actionMap: Record<string, any>): string[] => {
  const actions: string[] = [];

  Object.entries(actionMap).forEach(([scope, entry]) => {
    const controllers = entry?.controllers ?? {};
    Object.entries(controllers).forEach(([controllerName, controllerActions]) => {
      Object.keys(controllerActions || {}).forEach((actionName) => {
        actions.push(`${scope}.${controllerName}.${actionName}`);
      });
    });
  });

  return actions;
};

const ensureRole = async (strapi: Core.Strapi, type: RoleType, name: string) => {
  const existing = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type },
  });

  if (existing) {
    return existing;
  }

  return strapi.db.query('plugin::users-permissions.role').create({
    data: {
      type,
      name,
      description: ROLE_DESCRIPTIONS[type],
    },
  });
};

const setRolePermissions = async (
  strapi: Core.Strapi,
  roleId: number,
  actions: string[]
) => {
  const existingPermissionsCount = await strapi
    .db
    .query('plugin::users-permissions.permission')
    .count({ where: { role: roleId } });

  // Do not rewrite permissions for roles that are already configured.
  if (existingPermissionsCount > 0) {
    return;
  }

  await strapi.db.query('plugin::users-permissions.permission').deleteMany({
    where: { role: roleId },
  });

  await Promise.all(
    actions.map((action) =>
      strapi.db.query('plugin::users-permissions.permission').create({
        data: { role: roleId, action },
      })
    )
  );
};

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const frontendUrl = strapi.config.get('server.frontendUrl', process.env.FRONTEND_URL);

    // Keep permissions list aligned with current routes/actions before assigning role permissions.
    await strapi.plugin('users-permissions').service('users-permissions').syncPermissions();

    const publicRole = await ensureRole(strapi, 'public', 'Public');
    const authenticatedRole = await ensureRole(strapi, 'authenticated', 'Authenticated');
    const visitorRole = await ensureRole(strapi, 'visitor', 'visitor');
    const collegeRole = await ensureRole(strapi, 'college-member', 'college-member');
    const adminRole = await ensureRole(strapi, 'admin', 'admin');

    const actionMap = strapi.plugin('users-permissions').service('users-permissions').getActions();
    const allAvailableActions = flattenActionMap(actionMap);

    const adminActions = allAvailableActions.filter(
      (action) =>
        action.startsWith('api::') ||
        action.startsWith('plugin::upload.') ||
        action.startsWith('plugin::users-permissions.')
    );

    await setRolePermissions(strapi, publicRole.id, PUBLIC_ACTIONS);
    await setRolePermissions(strapi, visitorRole.id, VISITOR_ACTIONS);
    await setRolePermissions(strapi, collegeRole.id, VISITOR_ACTIONS);
    await setRolePermissions(strapi, adminRole.id, adminActions);

    // Explicitly disable legacy authenticated role so custom roles are always used.
    await setRolePermissions(strapi, authenticatedRole.id, []);

    // Keep reset-password links aligned with frontend URL expected by the client app.
    if (frontendUrl) {
      const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
      const advancedSettings =
        ((await pluginStore.get({ key: 'advanced' })) as Record<string, any> | null) || {};
      const emailSettings =
        ((await pluginStore.get({ key: 'email' })) as Record<string, any> | null) || {};

      await pluginStore.set({
        key: 'advanced',
        value: {
          ...advancedSettings,
          email_reset_password: `${frontendUrl}/reset-password`,
        },
      });

      const resetPasswordOptions = emailSettings?.reset_password?.options || {};
      await pluginStore.set({
        key: 'email',
        value: {
          ...emailSettings,
          reset_password: {
            ...(emailSettings?.reset_password || {}),
            options: {
              ...resetPasswordOptions,
              message:
                resetPasswordOptions.message ||
                `<p>Reset your password: <a href="${frontendUrl}/reset-password?token=<%= TOKEN %>">${frontendUrl}/reset-password?token=<%= TOKEN %></a></p>`,
            },
          },
        },
      });
    }
  },
};
