import type { Core } from '@strapi/strapi';

type RoleType = 'public' | 'visitor' | 'college-member';

const ROLE_DESCRIPTIONS: Record<RoleType, string> = {
  public: 'Default role for unauthenticated users.',
  visitor: 'External users without a university ID.',
  'college-member': 'College students/staff users with a university ID.',
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
    if (existing.name !== name || existing.description !== ROLE_DESCRIPTIONS[type]) {
      await strapi.db.query('plugin::users-permissions.role').update({
        where: { id: existing.id },
        data: {
          name,
          description: ROLE_DESCRIPTIONS[type],
        },
      });
    }

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
  const existingPermissions = await strapi
    .db
    .query('plugin::users-permissions.permission')
    .findMany({ where: { role: roleId } });

  const desiredActions = [...new Set(actions)].sort();
  const currentActions = (existingPermissions || [])
    .map((permission: any) => permission.action)
    .sort();

  if (
    desiredActions.length === currentActions.length &&
    desiredActions.every((action, index) => action === currentActions[index])
  ) {
    return;
  }

  await strapi.db.query('plugin::users-permissions.permission').deleteMany({
    where: { role: roleId },
  });

  await Promise.all(
    desiredActions.map((action) =>
      strapi.db.query('plugin::users-permissions.permission').create({
        data: { role: roleId, action },
      })
    )
  );
};

const removeDashboardAuthorRole = async (strapi: Core.Strapi) => {
  const authorRole = await strapi.db.query('admin::role').findOne({
    where: {
      $or: [{ code: 'strapi-author' }, { name: 'Author' }],
    } as any,
  });

  if (!authorRole) {
    return;
  }

  await strapi.db.query('admin::permission').deleteMany({
    where: { role: authorRole.id },
  });

  const hasUsersRolesLinkTable = await strapi.db.connection.schema.hasTable('admin_users_roles_lnk');
  if (hasUsersRolesLinkTable) {
    await strapi.db.connection('admin_users_roles_lnk').where({ role_id: authorRole.id }).delete();
  }

  await strapi.db.query('admin::role').delete({
    where: { id: authorRole.id },
  });
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

    await removeDashboardAuthorRole(strapi);

    // Keep permissions list aligned with current routes/actions before assigning role permissions.
    await strapi.plugin('users-permissions').service('users-permissions').syncPermissions();

    const publicRole = await ensureRole(strapi, 'public', 'public');
    const visitorRole = await ensureRole(strapi, 'visitor', 'visitor');
    const collegeRole = await ensureRole(strapi, 'college-member', 'college-member');

    const actionMap = strapi.plugin('users-permissions').service('users-permissions').getActions();
    const allAvailableActions = flattenActionMap(actionMap);
    const apiActions = allAvailableActions.filter((action) => action.startsWith('api::'));

    const visitorAndCollegeActions = [...VISITOR_ACTIONS, ...apiActions];

    const legacyAuthenticatedRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });

    if (legacyAuthenticatedRole) {
      await strapi.db.query('plugin::users-permissions.permission').deleteMany({
        where: { role: legacyAuthenticatedRole.id },
      });

      await strapi.db.query('plugin::users-permissions.role').delete({
        where: { id: legacyAuthenticatedRole.id },
      });
    }

    await setRolePermissions(strapi, publicRole.id, PUBLIC_ACTIONS);
    await setRolePermissions(strapi, visitorRole.id, visitorAndCollegeActions);
    await setRolePermissions(strapi, collegeRole.id, visitorAndCollegeActions);

    // Strapi register requires a valid default role in plugin advanced settings.
    const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
    const advancedSettings =
      ((await pluginStore.get({ key: 'advanced' })) as Record<string, any> | null) || {};

    await pluginStore.set({
      key: 'advanced',
      value: {
        ...advancedSettings,
        default_role: 'visitor',
      },
    });

    // Keep reset-password links aligned with frontend URL expected by the client app.
    if (frontendUrl) {
      const emailSettings =
        ((await pluginStore.get({ key: 'email' })) as Record<string, any> | null) || {};

      await pluginStore.set({
        key: 'advanced',
        value: {
          ...advancedSettings,
          default_role: 'visitor',
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
