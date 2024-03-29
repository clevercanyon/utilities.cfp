/**
 * Utility class.
 */

import { $cfp } from '#index.ts';
import { $class, $env, $http, $mime, $preact, type $type } from '@clevercanyon/utilities';

/**
 * Defines types.
 */
export type HydrativelyRenderSPAOptions = $preact.iso.HydrativelyRenderSPAOptions;
export type HandleSPACatchAllRouteOptions = Omit<$preact.iso.PrerenderSPAOptions, 'request' | 'cfw'>;

/**
 * Defines logger class.
 */
const Logger = $class.getLogger();

/**
 * Hydratively renders SPA component on client-side.
 *
 * @param options Required; {@see HydrativelyRenderSPAOptions}.
 *
 * @requiredEnv web -- This utility must only be used client-side.
 *
 * @note An `auditLogger` is prepared before hydratively rendering,
 *       such that it’s capable of recording uncaught hydration errors.
 */
export async function hydrativelyRenderSPA(options: HydrativelyRenderSPAOptions): Promise<void> {
    const auditLogger = // Audit logger creation.
        options.props?.auditLogger || // Preserves existing, if passed in props.
        new Logger({ endpointToken: $env.get('APP_AUDIT_LOGGER_BEARER_TOKEN', { type: 'string', require: true }) });

    void $preact.iso.hydrativelyRenderSPA({ ...options, props: { ...options.props, auditLogger } });
}

/**
 * Handles an SPA's catch-all function route.
 *
 * @param   rcData  Request context data.
 * @param   route   Underlying route; {@see $cfp.Route}.
 * @param   options Required; {@see HandleSPACatchAllRouteOptions}.
 *
 * @returns         Promise of a {@see $type.cfw.Response}.
 *
 * @requiredEnv ssr -- This utility must only be used server-side.
 */
export async function handleSPACatchAllRoute(rcData: $cfp.RequestContextData, route: $cfp.Route, options: HandleSPACatchAllRouteOptions): Promise<$type.cfw.Response> {
    const { request } = rcData, // Request extraction.
        config = await $http.responseConfig({ ...handleSPACatchAllRoute.config, ...route.config });

    if (['HEAD', 'GET'].includes(request.method)) {
        const {
            httpState,
            docType,
            html,
        } = // Prerenders single-page application.
            await $preact.iso.prerenderSPA({
                ...options,
                request,
                cfw: rcData,
            });
        config.status = httpState.status || 200;
        config.headers = { 'content-type': $mime.contentType('.html') };
        config.body = docType + html; // HTML markup; including doctype.
    }
    return $http.prepareResponse(request, config) as Promise<$type.cfw.Response>;
}
handleSPACatchAllRoute.config = $http.routeConfig({ enableCORs: false, varyOn: [] });
