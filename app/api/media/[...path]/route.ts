import { NextRequest, NextResponse } from 'next/server';

// Helper function to get content type based on file extension
const getContentType = (path: string): string => {
  const extension = path.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
};

// Define the types for the context param
export type Context = {
  params: {
    path: string[];
  };
};

// This function handles GET requests to /api/media/[...path]
export async function GET(
  request: NextRequest,
  // Using the explicit Promise-based params type as suggested
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    // Extract the path from the Promise-based params
    const paramsResolved = await context.params;
    const path = paramsResolved.path.join('/');

    // Get the API URL from environment variable
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // Create the URL to fetch from backend
    const url = `${apiBaseUrl}/media/${path}`;

    // Fetch the file from the backend
    const response = await fetch(url, {
      method: 'GET',
      // Avoid sending credentials for media files
      credentials: 'omit',
    });

    if (!response.ok) {
      return new NextResponse(null, {
        status: response.status,
        statusText: response.statusText,
      });
    }

    // Get the file content
    const arrayBuffer = await response.arrayBuffer();

    // Determine the content type
    const contentType = getContentType(path);

    // Return the file as a response with appropriate content type
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error fetching media file:', error);
    return new NextResponse(null, { status: 500 });
  }
}
