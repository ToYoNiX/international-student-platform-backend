import { mergeConfig, type UserConfig } from 'vite';

export default (config: UserConfig) => {
  return mergeConfig(config, {
    resolve: { alias: { '@': '/src' } },
    optimizeDeps: {
      esbuildOptions: { define: { global: 'globalThis' } },
    },
  });
};