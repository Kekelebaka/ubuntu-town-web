/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.ubuntutown.co.za',
  generateRobotsTxt: true,
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
