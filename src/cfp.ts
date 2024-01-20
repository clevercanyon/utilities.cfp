/**
 * Utility class.
 */

import '#@initialize.ts';

import { $app, $class, $env, $error, $http, $is, $mime, $obj, $url, type $type } from '@clevercanyon/utilities';
import { type $cfw } from '@clevercanyon/utilities.cfw';

/**
 * Defines types.
 */
export type Context = Readonly<Parameters<$type.cf.PagesFunction<$cfw.StdEnvironment>>[0]>;
export type Environment = $cfw.StdEnvironment & Context['env'];
export type Route = (feData: FetchEventData) => Promise<$type.cf.Response>;

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
            headers: { 'content-type': $mime.contentType('.txt') },
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
    const { ctx, url, request, caches, Request, auditLogger } = feData;

    // Populates cache key.

    // @review There is no reason to shard the cache if `enableCORs` is not `true`,
    // because in such a case, we don’t send back any headers that would actually vary.

    key = 'v=' + $app.buildTime().unix().toString();
    if (request.headers.has('origin') /* Possibly empty. */) {
        key += '&origin=' + (request.headers.get('origin') || '');
    }
    const keyURL = $url.removeCSOQueryVars(url); // e.g., `ut[mx]_`, `_ck`, etc.
    keyURL.searchParams.set('_ck', key), keyURL.searchParams.sort(); // Optimizes cache.
    const keyRequest = new Request(keyURL.toString(), request);

    // Checks if request is cacheable.

    if (!['HEAD', 'GET'].includes(keyRequest.method) || !$http.requestHasCacheableMethod(keyRequest)) {
        return route(feData); // Not cacheable; use async route.
    }
    // Reads response for this request from HTTP cache.

    if ((cachedResponse = await caches.default.match(keyRequest, { ignoreMethod: true }))) {
        void auditLogger.log('Serving response from cache.', { cachedResponse });
        return $http.prepareCachedResponse(keyRequest, cachedResponse) as Promise<$type.cf.Response>;
    }
    // Routes request and writes response to HTTP cache.

    const response = await route(feData); // Awaits response so we can cache.

    if ('GET' === keyRequest.method && 206 !== response.status && '*' !== response.headers.get('vary') && !response.webSocket)
        if ($env.isCFWViaMiniflare() && 'no-store' === response.headers.get('cdn-cache-control')) {
            // Miniflare doesn’t support `cdn-cache-control` so we implement basic support here.
            response.headers.set('cf-cache-status', 'c10n.miniflare.cdn-cache-control.BYPASS');
        } else
            ctx.waitUntil(
                (async (/* Caching occurs in background via `waitUntil()`. */): Promise<void> => {
                    // Cloudflare will not actually cache if headers say not to; {@see https://o5p.me/gMv7W2}.
                    const responseForCache = (await $http.prepareResponseForCache(keyRequest, response)) as $type.cf.Response;
                    void auditLogger.log('Caching response server-side.', { responseForCache });
                    return caches.default.put(keyRequest, responseForCache);
                })(),
            );
    return response; // Potentially cached async via `waitUntil()`.
};
