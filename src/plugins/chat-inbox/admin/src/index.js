import pluginPkg from '../../package.json';
import PluginIcon from './components/PluginIcon';
import pluginId from './pluginId';

const name = pluginPkg.strapi.name;

export default {
  register(app) {
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: 'Chat Inbox',
      },
      permissions: [],
      Component: async () => {
        const component = await import('./pages/App');
        return component;
      },
    });

    app.registerPlugin({
      id: pluginId,
      name,
    });
  },

  bootstrap() {},

  async registerTrads({ locales }) {
    return locales.map((locale) => ({ data: {}, locale }));
  },
};
