const nextConfig = {
  env: {
    LASTFM_API_KEY: process.env.LASTFM_API_KEY,
  },
  images: {
    domains: ["i.scdn.co"],
  },
  reactStrictMode: false,
};

module.exports = nextConfig;
