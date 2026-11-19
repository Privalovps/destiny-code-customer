import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  // Parent directories may contain unrelated npm projects.
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  async headers(){return ['/result','/report/:path*','/readings','/checkout/:path*','/access/:path*','/api/:path*','/dev/:path*'].map(source=>({source,headers:[{key:'Cache-Control',value:'private, no-store'},{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Robots-Tag',value:'noindex, nofollow'}]}));},
};
export default nextConfig;
