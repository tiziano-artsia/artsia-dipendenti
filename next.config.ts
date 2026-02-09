/** @type {import('next').NextConfig} */
const nextConfig = {
    output: process.env.CAPACITOR_BUILD === 'true' ? 'export' : undefined,

    images: {
        unoptimized: process.env.CAPACITOR_BUILD === 'true'
    },

    // Rewrites solo per dev
    async rewrites() {
        if (process.env.CAPACITOR_BUILD === 'true') {
            return [];
        }
        return [
            {
                source: '/',
                destination: '/login',
            },
        ];
    },

    trailingSlash: true,
};

export default nextConfig;
