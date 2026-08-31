import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://selinunal.com',
  integrations: [sitemap()],
  build: { format: 'file' },
});
