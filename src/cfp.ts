/**
 * Utility class.
 */

import '#@initialize.ts';

import { $app, $env, $http, $to, $url, type $type } from '@clevercanyon/utilities';

/**
 * Defines types.
 */
export type Context = Parameters<$type.cf.PagesFunction>[0];

export type Environment = {
    readonly D1?: $type.cf.D1Database;
    readonly R2?: $type.cf.R2Bucket;
    readonly KV?: $type.cf.KVNamespace;
    readonly DO?: $type.cf.DurableObjectNamespace;
    readonly [x: string]: unknown;
};
export type Route = (x: FetchEventData) => Promise<$type.cf.Response>;

export type FetchEventData = {
    readonly request: $type.cf.Request;
    readonly env: Environment;
    readonly ctx: Context;
    readonly route: Route;
    readonly url: $type.cf.URL;
};
export type InitialFetchEventData = {
    readonly ctx: Context;
    readonly route: Route;
};

/**
 * Tracks initialization.
 */
let initialized = false;

/**
 * Defines cache to use for HTTP requests.
 */
const cache = (caches as unknown as $type.cf.CacheStorage).default;

/**
 * Handles worker initialization.
 */
const maybeInitialize = async (ifeData: InitialFetchEventData): Promise<void> => {
    if (initialized) return;
    initialized = true;

    const { request } = ifeData.ctx,
        { env } = ifeData.ctx;

    if (request.cf?.pagesHostName) {
        $app.adaptBrand($to.string(request.cf.pagesHostName));
    } else {
        $app.adaptBrand($to.string($url.tryParse(request.url)?.host));
    }
    $env.capture('@global', env);
};

/**
 * Handles fetch events.
 *
 * @param   feData Initial fetch event data.
 *
 * @returns        Response promise.
 */
export const handleFetchEvent = async (ifeData: InitialFetchEventData): Promise<$type.cf.Response> => {
    let { request } = ifeData.ctx;
    const { env } = ifeData.ctx;
    const { ctx, route } = ifeData;

    await maybeInitialize(ifeData); // Brand adaptation, env capture.
    try {
        request = $http.prepareRequest(request, {}) as $type.cf.Request;
        const url = $url.parse(request.url) as $type.cf.URL;
        const feData = { request, env, ctx, route, url };

        return handleFetchCache(route, feData);
        //
    } catch (thrown) {
        if (thrown instanceof Response) {
            return thrown as unknown as $type.cf.Response;
        }
        return $http.prepareResponse(request, { status: 500 }) as $type.cf.Response;
    }
};

/**
 * Handles fetch caching.
 *
 * @param   route  Route handler.
 * @param   feData Fetch event data.
 *
 * @returns        Response promise.
 */
export const handleFetchCache = async (route: Route, feData: FetchEventData): Promise<$type.cf.Response> => {
    const { request, ctx } = feData;
    let cachedResponse; // Initialize.

    if (!$http.requestHasCacheableMethod(request)) {
        return route(feData); // Not applicable.
    }
    if ((cachedResponse = await cache.match(request, { ignoreMethod: true }))) {
        if (!$http.requestNeedsContentBody(request, cachedResponse.status)) {
            cachedResponse = new Response(null /* No response body. */, {
                status: cachedResponse.status,
                statusText: cachedResponse.statusText,
                headers: cachedResponse.headers,
            }) as unknown as $type.cf.Response;
        }
        return cachedResponse;
    }
    const response = await route(feData);

    if ('GET' === request.method && 206 !== response.status && '*' !== response.headers.get('vary') && !response.webSocket) {
        if ($env.isCFWViaMiniflare() && 'no-store' === response.headers.get('cdn-cache-control')) {
            // Miniflare doesn’t currently support `cdn-cache-control`, so we implement basic support for it here.
            response.headers.set('cf-cache-status', 'c10n.miniflare.cdn-cache-control.BYPASS');
        } else {
            // Cloudflare will not actually cache if response headers say not to cache.
            // For further details regarding `cache.put()`; {@see https://o5p.me/gMv7W2}.
            ctx.waitUntil(cache.put(request, response.clone()));
        }
    }
    return response;
};
