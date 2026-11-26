declare namespace Cloudflare {
  interface Env {
    TURSO_DATABASE_URL: string;
    TURSO_AUTH_TOKEN?: string;
    ADMIN_TOKEN: string;
    MEDIA_BASE_URL: string;
    OG_BASE_URL: string;
    SITE_TZ: string;
    CONTENT_BASE_URL?: string;
    CONTENT_TOKEN?: string;
  }
}
