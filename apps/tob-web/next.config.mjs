import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  transpilePackages: ['@m5/ui', '@m5/domain'],
  output: 'standalone',
  outputFileTracingRoot: path.join(currentDir, '../..')
};

export default nextConfig;
