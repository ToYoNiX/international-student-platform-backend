import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
	'users-permissions': {
		config: {
			jwt: {
				expiresIn: env('JWT_EXPIRES_IN', '7d'),
			},
			register: {
				allowedFields: [
					'displayName',
					'universityId',
					'userType',
					'bio',
					'phoneNumber',
					'preferences',
				],
			},
		},
	},
	'tree-menus': {
		config: {
			fieldSchema: {
				attributes: [
					{
						id: 'title',
						label: 'Title',
						placeholder: 'Enter item title',
						type: 'text',
						validationType: 'string',
						required: true,
						validations: [
							{ type: 'required', params: ['Title is required'] },
							{
								type: 'max',
								params: [100, 'Title cannot exceed 100 characters'],
							},
							{ type: 'default', params: ['New Item'] },
						],
					},
					{
						id: 'url',
						label: 'URL',
						placeholder: 'Enter URL (e.g. /about)',
						type: 'text',
						validationType: 'string',
						required: true,
						validations: [
							{ type: 'required', params: ['URL is required'] },
							{
								type: 'max',
								params: [200, 'URL cannot exceed 200 characters'],
							},
							{ type: 'default', params: ['/'] },
						],
					},
					{
						id: 'target',
						label: 'Link Target',
						type: 'select',
						validationType: 'mixed',
						value: '_self',
						required: false,
						validations: [
							{
								type: 'oneOf',
								params: [['_blank', '_self'], 'Must be _blank or _self'],
							},
							{ type: 'default', params: ['_self'] },
						],
						options: [
							{
								key: '_self',
								value: '_self',
								metadatas: {
									intlLabel: {
										id: 'tree-menus.target.options._self',
										defaultMessage: 'Same window (_self)',
									},
									disabled: false,
									hidden: false,
								},
							},
							{
								key: '_blank',
								value: '_blank',
								metadatas: {
									intlLabel: {
										id: 'tree-menus.target.options._blank',
										defaultMessage: 'New window (_blank)',
									},
									disabled: false,
									hidden: false,
								},
							},
						],
					},
					{
						id: 'isProtected',
						label: 'Protected (requires login)',
						type: 'bool',
						validationType: 'boolean',
						value: false,
						required: false,
						validations: [{ type: 'default', params: [false] }],
					},
				],
			},
		},
	},
	email: {
		config: {
			provider: 'nodemailer',
			providerOptions: {
				host: env('SMTP_HOST'),
				port: env.int('SMTP_PORT', 587),
				auth: {
					user: env('SMTP_USER'),
					pass: env('SMTP_PASS'),
				},
			},
			settings: {
				defaultFrom: env('EMAIL_FROM'),
				defaultReplyTo: env('EMAIL_FROM'),
			},
		},
	},
});

export default config;
