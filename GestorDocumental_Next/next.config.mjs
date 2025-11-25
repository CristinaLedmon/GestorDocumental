/** @type {import('next').NextConfig} */

import { config } from "dotenv";

config();

const isProd = process.env.NODE_ENV === "production";

const nextConfig = {};

export default nextConfig;
