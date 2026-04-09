type TreeMenusPlugin = {
	contentTypes?: {
		menu?: {
			schema?: {
				pluginOptions?: Record<string, any>;
				attributes?: Record<string, any>;
			};
		};
	};
};

export default (plugin: TreeMenusPlugin) => {
	const schema = plugin.contentTypes?.menu?.schema;

	if (!schema) {
		return plugin;
	}

	if (schema.pluginOptions?.i18n) {
		delete schema.pluginOptions.i18n;
	}

	const attributes = schema.attributes ?? {};
	for (const attributeName of ['items', 'slug', 'title']) {
		const attribute = attributes[attributeName];
		if (attribute?.pluginOptions?.i18n) {
			delete attribute.pluginOptions.i18n;
		}
	}

	delete attributes.locale;
	delete attributes.localizations;

	return plugin;
};
