/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ORS_API_KEY: string;
  readonly VITE_BOOKING_AFFILIATE_ID?: string;
  readonly VITE_PITCHUP_AFFILIATE_ID?: string;
  readonly VITE_ACSI_AFFILIATE_CODE?: string;
  readonly VITE_APP_ENV: string;
  readonly VITE_API_TIMEOUT?: string;
  readonly VITE_ENABLE_DEBUG?: string;
  readonly VITE_MOCK_API_RESPONSES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
