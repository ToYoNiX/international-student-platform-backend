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
