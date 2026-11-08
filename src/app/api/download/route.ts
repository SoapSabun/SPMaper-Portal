import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const filename = request.nextUrl.searchParams.get('name') || 'paper.pdf';

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return new NextResponse('Failed to fetch file from source', { status: res.status });
    }

    const data = await res.arrayBuffer();
    let cleanName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    // Clean filename for content-disposition
    cleanName = cleanName.replace(/[/\\?%*:|"<>]/g, '_');

    return new NextResponse(data, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(cleanName)}"; filename*=UTF-8''${encodeURIComponent(cleanName)}`,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (err: any) {
    return new NextResponse(`Download error: ${err.message}`, { status: 500 });
  }
}
