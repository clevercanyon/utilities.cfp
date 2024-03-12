/**
 * Utility class.
 */

import '#@initialize.ts';

import { $app, $bytes, $class, $crypto, $env, $error, $http, $is, $url, type $type } from '@clevercanyon/utilities';
import { $cfw, cfw } from '@clevercanyon/utilities.cfw';

/**
 * Defines types.
 */
export type ExecutionContext = Readonly<Parameters<$type.cfw.PagesFunction<$type.$cfw.Environment>>[0]>;
export type Environment = $type.$cfw.Environment & Readonly<ExecutionContext['env']>;

export type Route = ((rcData: RequestContextData) => Promise<$type.cfw.Response>) & {
    config?: Required<$http.RouteConfig>;
};
export type InitialRequestContextData = Readonly<{
    ctx: ExecutionContext;
    route: Route;
}>;
export type RequestContextData = $type.$cfw.RequestContextData &
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
 * @returns         Promise of a {@see $type.cfw.Response}.
 */
export const handleFetchEvent = async (ircData: InitialRequestContextData): Promise<$type.cfw.Response> => {
    let { request } = ircData.ctx;

    const { fetch, caches } = cfw,
        { ctx, route } = ircData,
        { env } = ctx, // From context.
        subrequestCounter = { value: 0 };

    await maybeInitializeGlobals(ircData); // Initializes worker globals.

    const Logger = $class.getLogger(), // Initializes base audit and consent loggers.
        //
        auditLoggerBearerToken = $env.get('APP_AUDIT_LOGGER_BEARER_TOKEN', { type: 'string', require: true }),
        consentLoggerBearerToken = $env.get('APP_CONSENT_LOGGER_BEARER_TOKEN', { type: 'string', require: true }),
        //
        baseAuditLogger = new Logger({ cfw: { ctx, subrequestCounter }, endpointToken: auditLoggerBearerToken }),
        baseConsentLogger = new Logger({ cfw: { ctx, subrequestCounter }, endpointToken: consentLoggerBearerToken });

    let auditLogger = baseAuditLogger.withContext({}, { request });

    try {
        let originalRequest = request; // Potentially rewritten.
        request = (await $http.prepareRequest(request, {})) as $type.cfw.Request;

        if (request !== originalRequest /* Reinitializes audit logger. */) {
            auditLogger = baseAuditLogger.withContext({}, { request });
        }
        const url = $url.parse(request.url) as $type.cfw.URL,
            originalURL = $url.parse(originalRequest.url) as $type.cfw.URL,
            consentLogger = baseConsentLogger.withContext({}, { request }),
            rcData = $cfw.rcDataPrepare({
                ctx,
                env,

                url,
                request,
                route,

                fetch,
                caches,

                auditLogger,
                consentLogger,
                subrequestCounter,
            });
        let response = handleFetchCache(rcData, route);

        if (originalURL.searchParams.has('utx_audit_log')) {
            const token = originalURL.searchParams.get('utx_audit_log') || '',
                validToken = auditLoggerBearerToken.split(' ', 2)[1] || '';

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
