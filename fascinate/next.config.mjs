/** @type {import('next').NextConfig} */
const nextConfig = {
    env:{
        GA_ID: process.env.GA_ID,
        WEB_SOCKET_WSS: process.env.WEB_SOCKET_WSS,
    }
};

export default nextConfig;
