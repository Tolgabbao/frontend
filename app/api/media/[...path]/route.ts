import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const path = params.path.join("/");
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  try {
    // Pass along cookies for authentication
    const headers = new Headers();
    const cookie = request.headers.get("cookie");
    if (cookie) {
      headers.set("cookie", cookie);
    }

    // Forward the request to the backend
    const response = await fetch(`${apiBaseUrl}/media/${path}`, {
      headers,
    });

    if (!response.ok) {
      return new Response("Image not found", { status: 404 });
    }

    // Forward the response from the backend
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const blob = await response.blob();

    return new Response(blob, {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=31536000, immutable", // Cache for 1 year
      },
    });
  } catch (error) {
    console.error("Error proxying media request:", error);
    return new Response("Error loading image", { status: 500 });
  }
}
