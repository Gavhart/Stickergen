/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Publishable key (`pk_…`) from enter.pollinations.ai for Pollinations image generation */
  readonly VITE_POLLINATIONS_API_KEY?: string
  /** Same as VITE_POLLINATIONS_API_KEY (optional alias) */
  readonly VITE_POLLINATIONS_PUBLISHABLE_KEY?: string
}
