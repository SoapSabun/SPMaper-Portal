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
    
    // Clean filename for content-disposition
    let cleanName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    cleanName = cleanName.replace(/[/\\?%*:|"<>]/g, '_').trim();
    
    // ASCII fallback so mobile browsers don't save raw percent-encoded %20 in the file name
    const asciiSafeName = cleanName.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, "'");
    const utf8EncodedName = encodeURIComponent(cleanName);

    return new NextResponse(data, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${asciiSafeName}"; filename*=UTF-8''${utf8EncodedName}`,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (err: any) {
    return new NextResponse(`Download error: ${err.message}`, { status: 500 });
  }
}
