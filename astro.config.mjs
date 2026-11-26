// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import { buildContent, CONTENT_DIR } from "./scripts/build-content.mjs";

/** Builds generated/content.json from content/ on start, and again whenever content/ changes in dev. */
const contentIntegration = {
  name: "supquotes-content",
  hooks: {
    "astro:config:setup": ({ logger }) => {
      const { stats, warnings } = buildContent();
      for (const w of warnings) logger.warn(w);
      logger.info(`${stats.quotes} quotes, ${stats.wishes} wishes, ${stats.festivals} festival dates, ${stats.templates} templates`);
    },
    "astro:server:setup": ({ server, logger }) => {
      server.watcher.add(CONTENT_DIR);
      let timer;
      server.watcher.on("all", (_event, file) => {
        if (!file.startsWith(CONTENT_DIR)) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          try {
            const { stats, warnings } = buildContent();
            for (const w of warnings) logger.warn(w);
            logger.info(`content rebuilt: ${stats.quotes} quotes, ${stats.wishes} wishes`);
          } catch (e) {
            logger.error(e instanceof Error ? e.message : String(e)); // keep serving the last good content
          }
        }, 150);
      });
    },
  },
};

export default defineConfig({
  site: "https://supquotes.com",
  output: "server",
  adapter: cloudflare({ imageService: "passthrough" }),
  integrations: [contentIntegration],
});
