import { defineConfig } from 'astro/config';

// ACQI Technologies public site.
// Static output. The only server-side code is under api/ (Azure Static Web Apps
// managed functions), which sits outside the Astro build.
export default defineConfig({
  site: 'https://acqi.tech',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  devToolbar: { enabled: false },
});
