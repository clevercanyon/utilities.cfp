/**
 * Utility class.
 */

import '#@initialize.ts';

import { $app, $bytes, $class, $crypto, $env, $error, $http, $is, $obj, $url, type $type } from '@clevercanyon/utilities';
import { cfw, type $cfw } from '@clevercanyon/utilities.cfw';

/**
 * Defines types.
 */
export type ExecutionContext = Readonly<Parameters<$type.cfw.PagesFunction<$cfw.StdEnvironment>>[0]>;
export type Environment = $cfw.StdEnvironment & ExecutionContext['env'];

export type Route = ((rcData: RequestContextData) => Promise<$type.cfw.Response>) & {
    config?: Required<$http.RouteConfig>;
};
export type InitialRequestContextData = Readonly<{
    ctx: ExecutionContext;
    route: Route;
}>;
export type RequestContextData = $cfw.StdRequestContextData &
    Readonly<{
        ctx: ExecutionContext;
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
 * @param ircData Initial request context data.
 */
const maybeInitializeGlobals = async (ircData: InitialRequestContextData): Promise<void> => {
    if (initializedGlobals) return;
    initializedGlobals = true;

    $env.capture(
        '@global', // Captures primitive environment variables.
        Object.fromEntries(
            Object.entries(ircData.ctx.env).filter(([, value]): boolean => {
                // Anything that is not a primitive value; e.g., KV, D1, or other bindings,
                // must be accessed in a request-specific way using {@see RequestContextData}.
                return $is.primitive(value);
            }),
        ),
    );
};

/**
 * Handles fetch events.
 *
 * @param   ircData Initial request context data.
 *
 * @returns         Response promise.
 */
export const handleFetchEvent = async (ircData: InitialRequestContextData): Promise<$type.cfw.Response> => {
    const { ctx, route } = ircData,
        { env } = ctx; // From context data.
    let { request } = ctx; // Extracts writable IRC data.

    await maybeInitializeGlobals(ircData); // Initializes worker globals.

    const Logger = $class.getLogger(), // Initializes base audit and consent loggers.
        baseAuditLogger = new Logger({ endpointToken: $env.get('APP_AUDIT_LOGGER_BEARER_TOKEN', { type: 'string', require: true }) }),
        baseConsentLogger = new Logger({ endpointToken: $env.get('APP_CONSENT_LOGGER_BEARER_TOKEN', { type: 'string', require: true }) });

    // Initializes audit logger early so it’s available for any errors below.
    // However, `request` is potentially rewritten, so reinitialize if it changes.
    let auditLogger = baseAuditLogger.withContext({}, { cfw: { ctx }, request });

    try {
        let originalRequest = request; // Potentially rewritten.
        request = (await $http.prepareRequest(request, {})) as $type.cfw.Request;

        if (request !== originalRequest /* Reinitializes using rewritten request. */) {
            auditLogger = baseAuditLogger.withContext({}, { cfw: { ctx }, request });
        }
        const url = $url.parse(request.url) as $type.cfw.URL,
            consentLogger = baseConsentLogger.withContext({}, { cfw: { ctx }, request }),
            rcData = $obj.freeze({
                ctx,
                env,

                url,
                request,
                route,

                auditLogger,
                consentLogger,
            });
        let response = handleFetchCache(rcData, route);

        if (url.searchParams.has('utx_audit_log')) {
            const token = url.searchParams.get('utx_audit_log') || '',
                validToken = $env.get('APP_AUDIT_LOGGER_BEARER_TOKEN', { type: 'string', require: true }).split(' ', 2)[1] || '';

            if (token && validToken && $crypto.safeEqual(token, validToken)) {
                void auditLogger.log(url.toString(), { response: await response });
            }
        }
        return response;
        //
    } catch (thrown) {
        if ($is.response(thrown)) {
            return thrown as $type.cfw.Response;
        }
        const message = $error.safeMessageFrom(thrown, { default: 'KkaDSshK' });
        void auditLogger.error('500: ' + message, { thrown });

        return $http.prepareResponse(request, {
            status: 500, // Failed status in this scenario.
            body: message, // Safe message from whatever was thrown.
        }) as Promise<$type.cfw.Response>;
    }
};

// ---
// Misc utilities.

/**
 * Handles fetch caching.
 *
 * @param   rcData Request context data.
 * @param   route  Route handler.
 *
 * @returns        Response promise.
 */
const handleFetchCache = async (rcData: RequestContextData, route: Route): Promise<$type.cfw.Response> => {
    const { caches, Request } = cfw,
        { ctx, url, request } = rcData;

    // Populates cache key.

    let key, cachedResponse; // Initialize.

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
    if (
        !['HEAD', 'GET'].includes(keyRequest.method) || //
        !$http.requestHasCacheableMethod(keyRequest) ||
        'none' === route.config?.cacheVersion // Explicitly uncacheable.
    ) {
        return route(rcData); // Not cacheable.
    }
    // Reads response for this request from HTTP cache.

    if ((cachedResponse = await caches.default.match(keyRequest, { ignoreMethod: true }))) {
        return $http.prepareCachedResponse(keyRequest, cachedResponse) as Promise<$type.cfw.Response>;
    }
    // Routes request and writes response to HTTP cache.

    const response = await route(rcData); // Awaits response so we can cache.
    if (
        !response.webSocket &&
        206 !== response.status &&
        'GET' === keyRequest.method &&
        //
        '*' !== response.headers.get('vary') &&
        !(response.headers.get('cdn-cache-control') || '')
            .toLowerCase().split(/\s*,\s*/u).includes('no-store') &&
        //
        response.headers.has('content-length') && // Our own limit is 25 MiB max.
        Number(response.headers.get('content-length')) <= $bytes.inMebibyte * 25 // prettier-ignore
    ) {
        ctx.waitUntil(
            (async (/* Caching occurs in background via `waitUntil()`. */): Promise<void> => {
                // Cloudflare will not actually cache if headers say not to; {@see https://o5p.me/gMv7W2}.
                const responseForCache = (await $http.prepareResponseForCache(keyRequest, response)) as $type.cfw.Response;
                await caches.default.put(keyRequest, responseForCache);
            })(),
        );
        response.headers.set('x-cache-status', 'miss'); // i.e., Cache miss.
    }
    return response; // Potentially cached async via `waitUntil()`.
};
