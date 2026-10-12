/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'images.unsplash.com',
            port: '',
            pathname: '**',
          },
        ],
      },
};

//domains : ['images.unsplash.com','a0.muscache.com'],

export default nextConfig;
