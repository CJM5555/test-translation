import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const sitemapUrl = `${origin}/sitemap.xml`;

  const txt = `User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`;

  return new NextResponse(txt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
