/**
 * Utility class.
 */

import './resources/init-env.ts';

import type { $type } from '@clevercanyon/utilities';
import { $env, $http, $url } from '@clevercanyon/utilities';

const cache = (caches as unknown as $type.cf.CacheStorage).default;

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

    $env.capture('@global', env); // Captures environment vars.

    try {
        request = $http.prepareRequest(request, {}) as $type.cf.Request;
        const url = $url.parse(request.url) as $type.cf.URL;
        const feData = { request, env, ctx, route, url };

        return handleFetchCache(route, feData);
        //
    } catch (error) {
        if (error instanceof Response) {
            return error as unknown as $type.cf.Response;
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

    if ('GET' === request.method && 206 !== response.status && '*' !== response.headers.get('vary')) {
        ctx.waitUntil(cache.put(request, response.clone()));
    }
    return response;
};
