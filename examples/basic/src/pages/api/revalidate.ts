import type { APIRoute } from 'astro';

/**
 * Purges the Appwrite CDN.
 *
 * Invalidating from inside a request is the path worth copying: the provider
 * picks up the dynamic API key from the `x-appwrite-key` header that the
 * Appwrite Sites runtime attaches, and purges the domain the request arrived
 * on. Nothing has to be configured or stored in the build output.
 *
 *   curl -X POST http://localhost:4321/api/revalidate \
 *     -H 'content-type: application/json' \
 *     -d '{"tags":["products"]}'
 */
export const POST: APIRoute = async ({ request, cache }) => {
	// This route must never be cached itself.
	cache.set(false);

	const { tags, path } = (await request.json()) as { tags?: string[]; path?: string };

	if (!tags?.length && !path) {
		return Response.json({ error: 'Pass `tags`, `path`, or both.' }, { status: 400 });
	}

	try {
		await cache.invalidate({ tags, path });
	} catch (error) {
		// A missing `proxy.invalidations.write` scope on the site's dynamic API
		// key surfaces here, as does a domain the project does not own.
		return Response.json({ error: (error as Error).message }, { status: 502 });
	}

	return Response.json({ purged: { tags, path } });
};
