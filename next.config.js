/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Enable Cross-Origin Isolation
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
            { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          ],
        },
      ];
    },
    experimental: {
        serverComponentsExternalPackages: [
            '@remotion/bundler',
            '@remotion/renderer',
            '@remotion/compositor-darwin-arm64',
        ],
    },
}

module.exports = nextConfig