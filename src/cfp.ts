/**
 * Utility class.
 */

import '#@initialize.ts';

import { $app, $env, $error, $http, $mime, $url, type $type } from '@clevercanyon/utilities';
import { Logtail } from '@logtail/edge';

/**
 * Defines types.
 */
export type Context = Parameters<$type.cf.PagesFunction>[0];
export type Logger = ReturnType<Logtail['withExecutionContext']>;

export type Environment = Readonly<{
    D1?: $type.cf.D1Database;
    R2?: $type.cf.R2Bucket;
    KV?: $type.cf.KVNamespace;
    DO?: $type.cf.DurableObjectNamespace;
    [x: string]: unknown;
}>;
export type Route = (x: FetchEventData) => Promise<$type.cf.Response>;

export type FetchEventData = Readonly<{
    request: $type.cf.Request;
    env: Environment;
    ctx: Context;
    route: Route;
    url: $type.cf.URL;
    auditLogger: Logger;
    consentLogger: Logger;
}>;
export type InitialFetchEventData = Readonly<{
    ctx: Context;
    route: Route;
}>;

/**
 * Tracks initialization.
 */
let initialized = false;

/**
 * Defines global base loggers.
 */
let baseAuditLogger: Logtail, baseConsentLogger: Logtail;

/**
 * Defines global cache to use for HTTP.
 */
const cache = (caches as unknown as $type.cf.CacheStorage).default;

/**
 * Initializes worker globals.
 */
const maybeInitialize = async (ifeData: InitialFetchEventData): Promise<void> => {
    if (initialized) return;
    initialized = true;

    const { env } = ifeData.ctx;
    $env.capture('@global', env);

    const auditLoggerSource = $env.get('APP_AUDIT_LOGGER_SOURCE', { type: 'string', require: true }),
        consentLoggerSource = $env.get('APP_CONSENT_LOGGER_SOURCE', { type: 'string', require: true });

    (baseAuditLogger = new Logtail(auditLoggerSource, { contextObjectMaxDepthWarn: false, contextObjectCircularRefWarn: false })),
        (baseConsentLogger = new Logtail(consentLoggerSource, { contextObjectMaxDepthWarn: false, contextObjectCircularRefWarn: false }));
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

    await maybeInitialize(ifeData); // Initializes worker.
    const auditLogger = baseAuditLogger.withExecutionContext(ifeData.ctx),
        consentLogger = baseConsentLogger.withExecutionContext(ifeData.ctx);

    try {
        request = $http.prepareRequest(request, {}) as $type.cf.Request;
        const url = $url.parse(request.url) as $type.cf.URL;
        const feData = { request, env, ctx, route, url, auditLogger, consentLogger };

        return handleFetchCache(route, feData);
        //
    } catch (thrown) {
        if (thrown instanceof Response) {
            void auditLogger.info(String(thrown.status) + ': Response thrown.', { request, thrownResponse: thrown });
            return thrown as unknown as $type.cf.Response;
        }
        const message = $error.safeMessageFrom(thrown, { default: 'KkaDSshK' });
        void auditLogger.warn('500: ' + message, { request, thrown });

        return $http.prepareResponse(request, {
            status: 500, // Failed status in this scenario.
            headers: { 'content-type': $mime.contentType('.txt') },
            body: message, // Safe message from whatever was thrown.
        }) as $type.cf.Response;
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
    let key, cachedResponse; // Initialize.
    const { request, url, ctx } = feData;

    // Populates cache key.

    key = 'v=' + $app.buildTime().unix().toString();
    if (request.headers.has('origin') /* Possibly empty. */) {
        key += '&origin=' + (request.headers.get('origin') || '');
    }
    const keyURL = $url.removeCSOQueryVars(url); // e.g., `ut[mx]_`, `_ck`, etc.
    keyURL.searchParams.set('_ck', key), keyURL.searchParams.sort(); // Optimizes cache.
    const keyRequest = new Request(keyURL.toString(), request as unknown as Request) as unknown as $type.cf.Request;

    // Checks if request is cacheable.

    if (!['HEAD', 'GET'].includes(keyRequest.method) || !$http.requestHasCacheableMethod(keyRequest)) {
        return route(feData); // Not cacheable; use async route.
    }
    // Reads response for this request from HTTP cache.

    if ((cachedResponse = await cache.match(keyRequest, { ignoreMethod: true }))) {
        if (!$http.requestNeedsContentBody(keyRequest, cachedResponse.status)) {
            cachedResponse = new Response(null, cachedResponse) as unknown as $type.cf.Response;
        }
        return cachedResponse;
    }
    // Routes request and writes response to HTTP cache.

    const response = await route(feData); // Awaits response so we can cache.

    if ('GET' === keyRequest.method && 206 !== response.status && '*' !== response.headers.get('vary') && !response.webSocket) {
        if ($env.isCFWViaMiniflare() && 'no-store' === response.headers.get('cdn-cache-control')) {
            // Miniflare doesn’t currently support `cdn-cache-control`, so we implement basic support for it here.
            response.headers.set('cf-cache-status', 'c10n.miniflare.cdn-cache-control.BYPASS');
        } else {
            // Cloudflare will not actually cache if response headers say not to cache.
            // For further details regarding `cache.put()`; {@see https://o5p.me/gMv7W2}.
            ctx.waitUntil(cache.put(keyRequest, response.clone()));
        }
    }
    return response; // Potentially cached async.
};
