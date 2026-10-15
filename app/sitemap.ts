// app/sitemap.ts
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = "https://urja-fest.vercel.app";

	// Define static routes
	return [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1.0,
		},
		{
			url: `${baseUrl}/about`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
        {
			url: `${baseUrl}/events`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
        {
			url: `${baseUrl}/register`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
        {
			url: `${baseUrl}/leaderboard`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
        {
			url: `${baseUrl}/gallery`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
        {
			url: `${baseUrl}/sponsors`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
        {
			url: `${baseUrl}/pitchroom`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
        {
			url: `${baseUrl}/pitchroom/register`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
        {
			url: `${baseUrl}/hackhive`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
        {
			url: `${baseUrl}/hackhive/registration`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
        {
			url: `${baseUrl}/hackhive/admin`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
        {
			url: `${baseUrl}/passport`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
        {
			url: `${baseUrl}/admin`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
	];
}
