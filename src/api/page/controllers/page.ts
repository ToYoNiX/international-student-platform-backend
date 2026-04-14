/**
 * page controller
 */

import { factories } from '@strapi/strapi';

type AccessRole = 'public' | 'visitor' | 'college-member';

const buildDefaultPagePopulate = () => ({
	seo: {
		populate: ['shareImage'],
	},
	blocks: {
		on: {
			'shared.media': {
				populate: ['file'],
			},
			'shared.quote': true,
			'shared.rich-text': true,
			'shared.slider': {
				populate: ['files'],
			},
			'shared.table': {
				populate: {
					columns: {
						populate: ['values'],
					},
				},
			},
		},
	},
});

const applyDefaultPopulateWhenWildcard = (ctx: any): void => {
	const currentPopulate = ctx?.query?.populate;
	const shouldApplyPopulate =
		!currentPopulate ||
		currentPopulate === '*' ||
		(Array.isArray(currentPopulate) && currentPopulate.includes('*'));

	if (!shouldApplyPopulate) {
		return;
	}

	ctx.query = {
		...ctx.query,
		populate: buildDefaultPagePopulate(),
	};
};

const canAccessPage = (requiredRole: AccessRole | undefined, requesterRole: string): boolean => {
	if (!requiredRole || requiredRole === 'public') {
		return true;
	}

	if (requiredRole === 'visitor') {
		return requesterRole === 'visitor' || requesterRole === 'college-member';
	}

	return requesterRole === 'college-member';
};

const getRequesterRole = async (strapi: any, ctx: any): Promise<string> => {
	const authUser = ctx.state?.user;

	if (!authUser?.id) {
		return 'public';
	}

	const user = await strapi.db.query('plugin::users-permissions.user').findOne({
		where: { id: authUser.id },
		populate: ['role'],
	});

	return user?.role?.type || 'public';
};

export default factories.createCoreController('api::page.page' as any, ({ strapi }) => ({
	async find(ctx) {
		applyDefaultPopulateWhenWildcard(ctx);
		const response = (await super.find(ctx)) as any;
		const requesterRole = await getRequesterRole(strapi, ctx);

		const filteredData = (response?.data || []).filter((entry: any) => {
			const requiredRole = entry?.accessRole as AccessRole | undefined;
			return canAccessPage(requiredRole, requesterRole);
		});

		if (response?.meta?.pagination) {
			response.meta.pagination.total = filteredData.length;
			response.meta.pagination.pageCount = Math.max(
				1,
				Math.ceil(filteredData.length / response.meta.pagination.pageSize)
			);
		}

		response.data = filteredData;
		return response;
	},

	async findOne(ctx) {
		applyDefaultPopulateWhenWildcard(ctx);
		const response = (await super.findOne(ctx)) as any;
		const requesterRole = await getRequesterRole(strapi, ctx);
		const requiredRole = response?.data?.accessRole as AccessRole | undefined;

		if (!canAccessPage(requiredRole, requesterRole)) {
			return ctx.forbidden('You do not have permission to access this page');
		}

		return response;
	},
}));
