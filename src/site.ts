/**
 * Single source for site identity and navigation.
 * Copy rules enforced by scripts/content-checks.mjs: no em dashes, no hype
 * adjectives, no invented proof.
 */

export const SITE = {
  name: 'ACQI Technologies',
  legalName: 'ACQI Technologies (in formation)',
  domain: 'acqi.tech',
  origin: 'https://acqi.tech',
  tagline: 'Acquisition intelligence, installed in your environment.',
  description:
    'ACQI is enterprise software that reads, consolidates and plans an acquisition target IT estate. Installed on your own infrastructure. Not a hosted service.',
  securityEmail: 'security@acqi.tech',
  privacyEmail: 'privacy@acqi.tech',
  generalEmail: 'hello@acqi.tech',
  supportEmail: 'support@acqi.tech',
  post: 'Registered office to be confirmed on incorporation.',
} as const;

export const PRIMARY_NAV = [
  { href: '/platform/', label: 'Platform' },
  { href: '/services/', label: 'Services' },
  { href: '/support/', label: 'Support' },
  { href: '/company/', label: 'Company' },
  { href: '/contact/', label: 'Contact' },
] as const;

export const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '/platform/', label: 'Platform' },
      { href: '/security/', label: 'Security' },
      { href: '/status/', label: 'Status' },
      { href: '/billing/', label: 'Billing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/company/', label: 'About' },
      { href: '/services/', label: 'Services' },
      { href: '/contact/', label: 'Contact' },
      { href: '/support/', label: 'Support' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/legal/privacy/', label: 'Privacy' },
      { href: '/legal/terms/', label: 'Terms' },
      { href: '/legal/acceptable-use/', label: 'Acceptable use' },
      { href: '/.well-known/security.txt', label: 'security.txt' },
    ],
  },
] as const;
