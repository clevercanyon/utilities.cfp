/**
 * Utility class.
 */

import '#@initialize.ts';

import { $app, $class, $env, $error, $http, $mime, $obj, $url, type $type } from '@clevercanyon/utilities';

/**
 * Defines types.
 */
export type Environment = Readonly<{
    D1?: $type.cf.D1Database;
    R2?: $type.cf.R2Bucket;
    KV?: $type.cf.KVNamespace;
    DO?: $type.cf.DurableObjectNamespace;
    [x: string]: unknown;
}>;
export type Context = Parameters<$type.cf.PagesFunction>[0];
export type Route = (x: FetchEventData) => Promise<$type.cf.Response>;

export type FetchEventData = Readonly<{
    request: $type.cf.Request;
    env: Environment;
    ctx: Context;
    route: Route;
    url: $type.cf.URL;
    auditLogger: $type.LoggerInterface;
    consentLogger: $type.LoggerInterface;
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
let baseAuditLogger: $type.Logger, //
    baseConsentLogger: $type.Logger;

/**
 * Defines global cache to use for HTTP.
 */
const cache = (caches as unknown as $type.cf.CacheStorage).default;

/**
 * Initializes worker globals.
 *
 * @param   ifeData Initial fetch event data.
 *
 * @returns         Void promise.
 */
const maybeInitialize = async (ifeData: InitialFetchEventData): Promise<void> => {
    if (initialized) return;
    initialized = true;

    const { ctx } = ifeData,
        { env, request } = ctx;
    const Logger = $class.getLogger();

    $env.capture('@global', env); // Captures environment variables.

    (baseAuditLogger = new Logger({ endpointToken: $env.get('APP_AUDIT_LOGGER_BEARER_TOKEN', { type: 'string', require: true }) })),
        (baseConsentLogger = new Logger({ endpointToken: $env.get('APP_CONSENT_LOGGER_BEARER_TOKEN', { type: 'string', require: true }) }));

    void baseAuditLogger
        .withContext({}, { request, cfpExecutionContext: ctx }) //
        .info('Worker initialized.', { ifeData });
};

/**
 * Handles fetch events.
 *
 * @param   feData Initial fetch event data.
 *
 * @returns        Response promise.
 */
export const handleFetchEvent = async (ifeData: InitialFetchEventData): Promise<$type.cf.Response> => {
    const { ctx, route } = ifeData,
        { env } = ctx; // From context data.
    let { request } = ctx; // Rewritable.

    await maybeInitialize(ifeData); // Initializes worker.
    const auditLogger = baseAuditLogger.withContext({}, { request, cfpExecutionContext: ctx }),
        consentLogger = baseConsentLogger.withContext({}, { request, cfpExecutionContext: ctx });

    try {
        request = $http.prepareRequest(request, {}) as $type.cf.Request;
        const url = $url.parse(request.url) as $type.cf.URL,
            feData = $obj.freeze({ request, env, ctx, route, url, auditLogger, consentLogger });

        return handleFetchCache(route, feData);
        //
    } catch (thrown) {
        if (thrown instanceof Response) {
            void auditLogger.info(String(thrown.status) + ': Response thrown.', { thrownResponse: thrown });
            return thrown as unknown as $type.cf.Response;
        }
        const message = $error.safeMessageFrom(thrown, { default: 'KkaDSshK' });
        void auditLogger.warn('500: ' + message, { thrown });

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
