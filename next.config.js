const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
	turbopack: {
		root: path.resolve(__dirname),
	},
	allowedDevOrigins: ['10.140.255.197'],
};

module.exports = nextConfig;
