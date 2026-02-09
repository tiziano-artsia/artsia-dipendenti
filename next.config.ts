import withPWAInit from '@ducanh2912/next-pwa';

const isDev = process.env.NODE_ENV === 'development';
const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

const withPWA = withPWAInit({
    dest: 'public',
    disable: isDev || isCapacitorBuild,
    register: true,
});

type OutputType = 'export' | 'standalone' | undefined;

const nextConfig = {
    output: (isCapacitorBuild ? 'export' : undefined) as OutputType,

    images: {
        unoptimized: isCapacitorBuild
    },

    async rewrites() {
        if (isCapacitorBuild) {
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
    turbopack: {},
} as const;

export default withPWA(nextConfig);
