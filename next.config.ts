import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    swSrc: 'service-worker.js',
    swDest: 'public/sw.js',
    register: true,
    skipWaiting: true,
    runtimeCaching: [
        {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'images',
                expiration: {
                    maxEntries: 64,
                    maxAgeSeconds: 30 * 24 * 60 * 60
                }
            }
        },
        {
            urlPattern: /\/api\/notifications.*/i,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'api-notifications',
                networkTimeoutSeconds: 10
            }
        }
    ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/',
                destination: '/login',
            },
        ]
    },
};

export default withPWA(nextConfig);
