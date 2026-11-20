/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_CF_BEACON_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
