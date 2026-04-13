export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Sticker {
  id: string
  user_id: string
  prompt: string
  style: string
  color: string
  provider: 'gemini' | 'pollinations'
  image_url: string
  created_at: string
}

export type StickerStyle =
  | 'grunge' | 'metal' | 'tattoo' | 'chrome'
  | 'gothic' | 'neon' | 'pixel' | 'street' | 'minimal'

export type ColorMood =
  | 'dark' | 'blood' | 'chrome' | 'neon' | 'toxic' | 'void' | 'gold'

export type Provider = 'gemini' | 'pollinations'

export interface StyleOption {
  id: StickerStyle
  label: string
  index: string
  prompt: string
}

export interface ColorOption {
  id: ColorMood
  label: string
  prompt: string
}

export const STYLE_OPTIONS: StyleOption[] = [
  { id: 'grunge',  label: 'Grunge',   index: '01', prompt: 'grunge distressed sticker art, scratched rough texture, gritty aesthetic, worn edges, high contrast' },
  { id: 'metal',   label: 'Metal',    index: '02', prompt: 'heavy metal sticker art, sharp angular design, metallic sheen, aggressive bold lines, rock and roll' },
  { id: 'tattoo',  label: 'Tattoo',   index: '03', prompt: 'traditional tattoo flash art style sticker, bold black outlines, classic tattoo palette, bold shading' },
  { id: 'chrome',  label: 'Chrome',   index: '04', prompt: 'shiny chrome metallic sticker, reflective liquid metal surface, sleek futuristic, mirror finish' },
  { id: 'gothic',  label: 'Gothic',   index: '05', prompt: 'gothic dark art sticker, ornate details, dark fantasy, intricate baroque elements, occult aesthetic' },
  { id: 'neon',    label: 'Neon',     index: '06', prompt: 'dark neon sticker art, pitch black background, bright glowing neon colors, cyberpunk, electric outlines' },
  { id: 'pixel',   label: 'Pixel',    index: '07', prompt: 'pixel art sticker, 16-bit retro game style, chunky bold pixels, limited dark color palette' },
  { id: 'street',  label: 'Street',   index: '08', prompt: 'street art graffiti sticker style, spray paint texture, bold urban design, raw energy' },
  { id: 'minimal', label: 'Minimal',  index: '09', prompt: 'stark minimalist sticker, pure black and white, single bold graphic element, no decoration, clean' },
]

export const COLOR_OPTIONS: ColorOption[] = [
  { id: 'dark',      label: 'SMOKE',     prompt: 'soft smoke gray and warm off-white palette, airy balanced contrast, clean modern sticker colors, light and approachable' },
  { id: 'blood',     label: 'BERRY',     prompt: 'juicy berry red and coral pop, bright cherry highlights, lively saturated reds, upbeat and punchy' },
  { id: 'chrome',    label: 'CHROME',    prompt: 'bright silver chrome and pale gray, crisp white reflections, glossy light metallic, fresh and sleek' },
  { id: 'neon',      label: 'NEON',      prompt: 'electric neon pink cyan and lime, vivid glow, bright high-key background or soft pastel base, festival energy' },
  { id: 'toxic',     label: 'CITRUS',    prompt: 'fresh citrus lime and chartreuse, sunny yellow-green, zesty spring palette, playful and bright' },
  { id: 'void',      label: 'NOVA',      prompt: 'soft lavender lilac and cosmic violet pastels, airy purple gradients, dreamy light galaxy tones' },
  { id: 'gold',      label: 'HONEY',     prompt: 'warm honey gold and soft amber sunshine, light metallic gleam, cheerful golden highlights' },
]

export const QUICK_TAGS = ['cosmic', 'retro', 'sparkles', 'chill', 'bold', 'stars', 'coffee', 'waves']

export const POLLINATIONS_MODELS: Partial<Record<StickerStyle, string>> = {
  grunge: 'flux-realism', metal: 'flux-realism', tattoo: 'flux-realism',
  chrome: 'flux', gothic: 'flux', neon: 'flux',
  pixel: 'flux', street: 'flux-realism', minimal: 'flux',
}
