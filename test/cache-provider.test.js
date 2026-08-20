import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import factory from '../dist/cache/provider.js';

// The provider interface marks its members optional; this one implements them all,
// and a missing member fails the suite loudly rather than being skipped.
const provider = /** @type {Required<ReturnType<typeof factory>>} */ (factory(undefined));
const dummyRequest = new Request('https://example.appwrite.network/products/123');

/** Make `response` behave like a relayed one, whose headers are immutable. */
function freezeHeaders(response) {
	Object.defineProperty(response, 'headers', {
		value: new Proxy(response.headers, {
			get(target, property) {
				if (property === 'set') {
					return () => {
						throw new TypeError('immutable');
					};
				}
				const value = Reflect.get(target, property);
				return typeof value === 'function' ? value.bind(target) : value;
			},
		}),
	});
	return response;
}

/** Run a request through `onRequest`, rendering `response`. */
function render(response, { provider: instance = provider } = {}) {
	const request = dummyRequest;
	return instance.onRequest({ request, url: new URL(request.url) }, async () => response);
}

describe('Appwrite cache provider', () => {
	it('has the correct provider name', () => {
		assert.equal(provider.name, 'appwrite');
	});

	describe('setHeaders', () => {
		it('sets Appwrite-CDN-Cache-Control with public and max-age', () => {
			const headers = provider.setHeaders({ maxAge: 300 }, dummyRequest);
			assert.equal(headers.get('Appwrite-CDN-Cache-Control'), 'public, max-age=300');
		});

		it('includes stale-while-revalidate', () => {
			const headers = provider.setHeaders({ maxAge: 300, swr: 60 }, dummyRequest);
			assert.equal(
				headers.get('Appwrite-CDN-Cache-Control'),
				'public, max-age=300, stale-while-revalidate=60',
			);
		});

		it('sets public even without maxAge or swr', () => {
			const headers = provider.setHeaders({ tags: ['foo'] }, dummyRequest);
			assert.equal(headers.get('Appwrite-CDN-Cache-Control'), 'public');
		});

		it('does not set CDN-Cache-Control (only Appwrite-specific)', () => {
			const headers = provider.setHeaders({ maxAge: 300 }, dummyRequest);
			assert.equal(headers.get('CDN-Cache-Control'), null);
		});

		it('sets Appwrite-CDN-Cache-Key with the tags, space-separated', () => {
			const headers = provider.setHeaders(
				{ maxAge: 60, tags: ['products', 'featured'] },
				dummyRequest,
			);
			assert.equal(headers.get('Appwrite-CDN-Cache-Key'), 'products featured');
		});

		it('normalizes tags into keys the CDN can purge', () => {
			const headers = provider.setHeaders({ maxAge: 60, tags: ['two words'] }, dummyRequest);
			assert.equal(headers.get('Appwrite-CDN-Cache-Key'), 'two%20words');
		});

		it('does not add a path key: Appwrite purges a path natively', () => {
			const headers = provider.setHeaders({ maxAge: 60 }, dummyRequest);
			assert.equal(headers.get('Appwrite-CDN-Cache-Key'), null);
		});

		it('does not set generic Cache-Tag (only Appwrite-specific)', () => {
			const headers = provider.setHeaders({ maxAge: 60, tags: ['foo'] }, dummyRequest);
			assert.equal(headers.get('Cache-Tag'), null);
		});

		it('sets Last-Modified header', () => {
			const date = new Date('2026-04-15T12:00:00Z');
			const headers = provider.setHeaders({ maxAge: 60, lastModified: date }, dummyRequest);
			assert.equal(headers.get('Last-Modified'), 'Wed, 15 Apr 2026 12:00:00 GMT');
		});

		it('sets ETag header', () => {
			const headers = provider.setHeaders({ maxAge: 60, etag: '"v1"' }, dummyRequest);
			assert.equal(headers.get('ETag'), '"v1"');
		});
	});

	describe('onRequest', () => {
		it('returns the rendered response', async () => {
			const rendered = new Response('hello');
			assert.equal(await render(rendered), rendered);
		});

		it('marks a response with no cache intent as no-store', async () => {
			const response = await render(new Response('hello'));
			assert.equal(response.headers.get('Appwrite-CDN-Cache-Control'), 'no-store');
		});

		it('leaves a cached response alone', async () => {
			const cached = new Response('hello', {
				headers: { 'Appwrite-CDN-Cache-Control': 'public, max-age=60' },
			});
			const response = await render(cached);
			assert.equal(response.headers.get('Appwrite-CDN-Cache-Control'), 'public, max-age=60');
		});

		it('leaves a response that sets its own Cache-Control alone', async () => {
			const response = await render(
				new Response('hello', { headers: { 'Cache-Control': 'public, max-age=60' } }),
			);
			assert.equal(response.headers.get('Appwrite-CDN-Cache-Control'), null);
		});

		it('still marks a response that only sets CDN-Cache-Control, which Astro strips', async () => {
			const response = await render(
				new Response('hello', { headers: { 'CDN-Cache-Control': 'public, max-age=60' } }),
			);
			assert.equal(response.headers.get('Appwrite-CDN-Cache-Control'), 'no-store');
		});

		it('skips the no-store default when it is turned off', async () => {
			const response = await render(new Response('hello'), {
				provider: /** @type {Required<ReturnType<typeof factory>>} */ (factory({ noStore: false })),
			});
			assert.equal(response.headers.get('Appwrite-CDN-Cache-Control'), null);
		});

		it('marks a response with immutable headers, on a copy of it', async () => {
			const immutable = freezeHeaders(
				new Response('hello', { status: 201, statusText: 'Created', headers: { 'X-Kept': 'yes' } }),
			);

			const response = await render(immutable);
			assert.notEqual(response, immutable);
			assert.equal(response.headers.get('Appwrite-CDN-Cache-Control'), 'no-store');
			assert.equal(response.headers.get('X-Kept'), 'yes');
			assert.equal(response.status, 201);
			assert.equal(response.statusText, 'Created');
			assert.equal(await response.text(), 'hello');
		});

		it('marks a relayed redirect, which carries no body to copy', async () => {
			const response = await render(
				freezeHeaders(Response.redirect('https://example.appwrite.network/products', 302)),
			);
			assert.equal(response.headers.get('Appwrite-CDN-Cache-Control'), 'no-store');
			assert.equal(response.status, 302);
			assert.equal(response.headers.get('Location'), 'https://example.appwrite.network/products');
		});

		it('serves a response it cannot copy as-is', async () => {
			// A network error response: its status is outside the constructible range
			const unconstructible = freezeHeaders(Response.error());
			assert.equal(await render(unconstructible), unconstructible);
		});
	});
});
