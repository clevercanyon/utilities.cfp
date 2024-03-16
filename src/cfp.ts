/**
 * Utility class.
 */

import '#@initialize.ts';

import { $class, $crypto, $env, $error, $http, $is, $url, type $type } from '@clevercanyon/utilities';
import { $cfw, cfw } from '@clevercanyon/utilities.cfw';

/**
 * Defines types.
 */
export type ExecutionContext = Readonly<Parameters<$type.cfw.PagesFunction<$type.$cfw.Environment>>[0] & { request: $type.cfw.Request }>;
export type Environment = $type.$cfw.Environment & Readonly<ExecutionContext['env']>;

export type Route = $type.$cfw.Route<RequestContextData>;
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
        subrequestCounter = request.c10n?.serviceBinding?.subrequestCounter || { value: 0 };

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
        let response = $cfw.handleRouteCache(rcData, route);

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
