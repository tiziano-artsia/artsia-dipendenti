// next.config.js
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
}

module.exports = nextConfig;
