import ipfsService from '@/lib/services/ipfsService.js';
import { errorResponse } from '@/lib/utils/response.js';

export async function GET(request, { params }) {
  const { cid } = await params;
  const content = ipfsService.getCachedContent(cid);

  if (!content) {
    return errorResponse(`CID ${cid} not found in local content store`, 404);
  }

  return new Response(content.buffer, {
    status: 200,
    headers: {
      'Content-Type': content.mimeType,
      'Content-Disposition': `inline; filename="${cid}"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
