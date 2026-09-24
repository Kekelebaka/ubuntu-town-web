/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.ubuntutown.co.za',
  generateRobotsTxt: true,

  // Preserve the password-recovery route in generated sitemap output.
  // This route exists at runtime but is not reliably discovered by
  // next-sitemap from the production build manifest.
  additionalPaths: async (config) => [
    await config.transform(config, '/forgot-password'),
  ],

  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
      },
      {
        userAgent: 'Applebot-Extended',
        allow: '/',
      },
      {
        userAgent: 'CCBot',
        allow: '/',
      },
      {
        userAgent: 'Bytespider',
        allow: '/',
      },
      {
        userAgent: 'meta-externalagent',
        allow: '/',
      },
    ],
    additionalSitemaps: [
      'https://www.ubuntutown.co.za/sitemap.xml',
    ],
  },
};
