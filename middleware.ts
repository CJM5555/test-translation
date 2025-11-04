import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextResponse, NextRequest } from "next/server";

const limiter = new RateLimiterMemory({
  points: 5, // Number of requests
  duration: 60, // Per 60 seconds
});

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Only apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    try {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "127.0.0.1";
      await limiter.consume(ip);
      return NextResponse.next();
    } catch (error) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }
  }
  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: "/api/:path*",
};
