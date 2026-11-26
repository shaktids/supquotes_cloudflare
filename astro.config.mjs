// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://supquotes.com",
  output: "server",
  adapter: cloudflare({ imageService: "passthrough" }),
});
