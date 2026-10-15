// app/robots.txt.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: "", // Block paths you don't want indexed
		},
		sitemap: "https://urja-fest.vercel.app", // Replace with your production domain
	};
}
