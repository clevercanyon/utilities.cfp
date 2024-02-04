/**
 * Utility class.
 */

import '#@initialize.ts';

import { $app, $class, $env, $error, $fsize, $http, $is, $obj, $url, type $type } from '@clevercanyon/utilities';
import { type $cfw } from '@clevercanyon/utilities.cfw';

/**
 * Defines types.
 */
export type Context = Readonly<Parameters<$type.cf.PagesFunction<$cfw.StdEnvironment>>[0]>;
export type Environment = $cfw.StdEnvironment & Context['env'];
export type Route = ((feData: FetchEventData) => Promise<$type.cf.Response>) & {
    config?: Required<$http.RouteConfig>;
};
export type InitialFetchEventData = Readonly<{
    ctx: Context;
    route: Route;
}>;
export type FetchEventData = $cfw.StdFetchEventData &
    Readonly<{
        ctx: Context;
        env: Environment;
        route: Route;
    }>;

/**
 * Tracks global init.
 */
let initializedGlobals = false;

/**
 * Initializes worker globals.
 *
 * @param ifeData Initial fetch event data.
 */
const maybeInitializeGlobals = async (ifeData: InitialFetchEventData): Promise<void> => {
    if (initializedGlobals) return;
    initializedGlobals = true;

    $env.capture(
        '@global', // Captures primitive environment variables.
        Object.fromEntries(
            Object.entries(ifeData.ctx.env).filter(([, value]): boolean => {
                // Anything that is not a primitive value; e.g., KV, D1, or other bindings,
                // must be accessed in a request-specific way using {@see FetchEventData}.
                return $is.primitive(value);
            }),
        ),
    );
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

    await maybeInitializeGlobals(ifeData); // Initializes worker globals.

    const Logger = $class.getLogger(), // Initializes base audit and consent loggers.
        baseAuditLogger = new Logger({ endpointToken: $env.get('APP_AUDIT_LOGGER_BEARER_TOKEN', { type: 'string', require: true }) }),
        baseConsentLogger = new Logger({ endpointToken: $env.get('APP_CONSENT_LOGGER_BEARER_TOKEN', { type: 'string', require: true }) });

    // Initializes audit logger early so it’s available for any errors below.
    // However, `request` is potentially rewritten, so reinitialize if it changes.
    let auditLogger = baseAuditLogger.withContext({}, { cfwContext: ctx, request });

    try {
        let originalRequest = request; // Potentially rewritten.
        request = (await $http.prepareRequest(request, {})) as $type.cf.Request;

        if (request !== originalRequest /* Reinitializes using rewritten request. */) {
            auditLogger = baseAuditLogger.withContext({}, { cfwContext: ctx, request });
        }
        const url = $url.parse(request.url) as $type.cf.URL,
            consentLogger = baseConsentLogger.withContext({}, { cfwContext: ctx, request }),
            feData = $obj.freeze({
                ctx,
                env,

                url,
                request,
                route,

                auditLogger,
                consentLogger,

                URL: globalThis.URL as unknown as typeof $type.cf.URL,
                fetch: globalThis.fetch as unknown as typeof $type.cf.fetch,
                caches: globalThis.caches as unknown as typeof $type.cf.caches,
                Request: globalThis.Request as unknown as typeof $type.cf.Request,
                Response: globalThis.Response as unknown as typeof $type.cf.Response,
                AbortSignal: globalThis.AbortSignal as unknown as typeof $type.cf.AbortSignal,
            });
        return handleFetchCache(route, feData);
        //
    } catch (thrown) {
        if ($is.response(thrown)) {
            return thrown as $type.cf.Response;
        }
        const message = $error.safeMessageFrom(thrown, { default: 'KkaDSshK' });
        void auditLogger.error('500: ' + message, { thrown });

        return $http.prepareResponse(request, {
            status: 500, // Failed status in this scenario.
            body: message, // Safe message from whatever was thrown.
        }) as Promise<$type.cf.Response>;
    }
};

// ---
// Misc utilities.

/**
 * Handles fetch caching.
 *
 * @param   route  Route handler.
 * @param   feData Fetch event data.
 *
 * @returns        Response promise.
 */
const handleFetchCache = async (route: Route, feData: FetchEventData): Promise<$type.cf.Response> => {
    let key, cachedResponse; // Initialize.
    const { ctx, url, request, caches, Request } = feData;

    // Populates cache key.

    const varyOn = new Set(route.config?.varyOn || []);
    for (const v of varyOn) if (!request.headers.has(v)) varyOn.delete(v);

    if ((!route.config || route.config.enableCORs) && request.headers.has('origin')) {
        varyOn.add('origin'); // CORs requires us to vary on origin.
    } else varyOn.delete('origin'); // Must not vary on origin.

    key = 'v=' + (route.config?.cacheVersion || $app.buildTime().toStamp()).toString();
    for (const v of varyOn) key += '&' + v + '=' + (request.headers.get(v) || '');

    const keyURL = $url.removeCSOQueryVars(url); // e.g., `ut[mx]_`, `_ck`, etc.
    keyURL.searchParams.set('_ck', key), keyURL.searchParams.sort(); // Optimizes cache.
    const keyRequest = new Request(keyURL.toString(), request);

    // Checks if request is cacheable.

    if (!['HEAD', 'GET'].includes(keyRequest.method) || !$http.requestHasCacheableMethod(keyRequest)) {
        return route(feData); // Not cacheable; use async route.
    }
    // Reads response for this request from HTTP cache.

    if ((cachedResponse = await caches.default.match(keyRequest, { ignoreMethod: true }))) {
        return $http.prepareCachedResponse(keyRequest, cachedResponse) as Promise<$type.cf.Response>;
    }
    // Routes request and writes response to HTTP cache.

    const response = await route(feData); // Awaits response so we can cache.
    if (
        !response.webSocket &&
        206 !== response.status &&
        'GET' === keyRequest.method &&
        //
        '*' !== response.headers.get('vary') &&
        !(response.headers.get('cdn-cache-control') || '')
            .toLowerCase().split(/,\s*/u).includes('no-store') &&
        //
        response.headers.has('content-length') && // Our own limit is 25 MiB max.
        Number(response.headers.get('content-length')) <= $fsize.bytesInMebibyte * 25 // prettier-ignore
    ) {
        ctx.waitUntil(
            (async (/* Caching occurs in background via `waitUntil()`. */): Promise<void> => {
                // Cloudflare will not actually cache if headers say not to; {@see https://o5p.me/gMv7W2}.
                const responseForCache = (await $http.prepareResponseForCache(keyRequest, response)) as $type.cf.Response;
                await caches.default.put(keyRequest, responseForCache);
            })(),
        );
        response.headers.set('x-cache-status', 'miss'); // i.e., Cache miss.
    }
    return response; // Potentially cached async via `waitUntil()`.
};
