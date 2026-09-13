/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  // sharp runs in the route handler, keep it external to the bundle
  serverExternalPackages: ['sharp'],
};
