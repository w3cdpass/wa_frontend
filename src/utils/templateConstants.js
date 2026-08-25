// Shared constants for WhatsApp template building (frontend)

export const CATEGORIES = [
  {
    value: 'MARKETING',
    title: 'Marketing',
    tagline: 'Promotions & offers',
    description: 'Send promotions, announcements, product launches and re-engagement messages. Requires an opt-out option in practice; Meta reviews these most strictly.',
    examples: '“Diwali sale — flat 50% off”, “New arrivals just dropped”',
  },
  {
    value: 'UTILITY',
    title: 'Utility',
    tagline: 'Transactional updates',
    description: 'Messages triggered by a customer action — order confirmations, shipping updates, refunds, opt-in confirmations. Highest approval rate, sent any time. Warning: if the content contains offers or promotions, Meta now auto-reclassifies it as Marketing before approving, and you pay marketing rates per message.',
    examples: '“Your order {{1}} is confirmed”, “Your refund for {{1}} has been processed”',
  },
  {
    value: 'AUTHENTICATION',
    title: 'Authentication',
    tagline: 'OTP & verification codes',
    description: 'One-time passwords and verification codes. Use the Copy-code or OTP button so users can tap to copy. Zero-promotional content allowed.',
    examples: '“Your login code is {{1}}, valid for 5 minutes”',
  },
];

export const LANGUAGES = [
  { code: 'en_US', label: 'English (US)' },
  { code: 'en_GB', label: 'English (UK)' },
  { code: 'hi', label: 'Hindi' },
  { code: 'mr', label: 'Marathi' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'bn', label: 'Bengali' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'ur', label: 'Urdu' },
  { code: 'ar', label: 'Arabic' },
  { code: 'es', label: 'Spanish' },
  { code: 'pt_BR', label: 'Portuguese (BR)' },
  { code: 'id', label: 'Indonesian' },
];

export const BUTTON_TYPES = [
  {
    type: 'QUICK_REPLY',
    label: 'Quick reply',
    icon: 'chat',
    hint: 'User taps to send a canned reply back. Max 10. Great for “Yes / No / Later”.',
  },
  {
    type: 'URL',
    label: 'Visit website',
    icon: 'link',
    hint: 'Opens a link. Supports one dynamic variable, e.g. https://shop.com/order/{{1}}.',
  },
  {
    type: 'PHONE_NUMBER',
    label: 'Call phone number',
    icon: 'call',
    hint: 'Dials a business number when tapped.',
  },
  {
    type: 'COPY_CODE',
    label: 'Copy offer / OTP code',
    icon: 'content_copy',
    hint: 'Copies a one-tap code to the clipboard — used for OTPs and coupons.',
  },
  {
    type: 'FLOW',
    label: 'Run flow',
    icon: 'account_tree',
    hint: 'Opens a WhatsApp Flow (form) inside the chat. One per template.',
  },
  {
    type: 'CATALOG',
    label: 'View catalog',
    icon: 'storefront',
    hint: 'Shows your linked commerce catalog. One per template, needs catalog + product ID.',
  },
];

// Meta button rules
export const BUTTON_RULES = {
  MAX_TOTAL: 10,
  MAX_NON_QUICK: 3,
};

export const TEMPLATE_TYPES = [
  {
    value: 'standard',
    title: 'Standard',
    description: 'Text message with optional text header and buttons. Best for utility & auth.',
  },
  {
    value: 'media',
    title: 'Media',
    description: 'Adds an image, video or document header above the body. Great for marketing visuals and PDF catalogs.',
  },
  {
    value: 'carousel',
    title: 'Carousel',
    description: '2–10 swipeable cards, each with its own image, body text and buttons. Marketing category only.',
  },
];

export const VARIABLE_PATTERN = /\{\{(\d+)\}\}/g;

export function extractVariables(text) {
  const vars = [];
  let m;
  const re = new RegExp(VARIABLE_PATTERN);
  while ((m = re.exec(text)) !== null) vars.push(m[1]);
  return vars;
}

export const LIMITS = {
  HEADER_TEXT_MAX: 60,
  BODY_MAX: 1024,
  FOOTER_MAX: 60,
  BUTTON_TEXT_MAX: 25,
  CARD_BODY_MAX: 160,
  CAROUSEL_MIN: 2,
  CAROUSEL_MAX: 10,
};
