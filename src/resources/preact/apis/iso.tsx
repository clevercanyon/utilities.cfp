/**
 * Utility class.
 */

import { $cfp } from '#index.ts';
import { $class, $env, $http, $preact, type $type } from '@clevercanyon/utilities';

const Logger = $class.getLogger(); // Logger class.

/**
 * Defines types.
 */
export type HydrativelyRenderSPAOptions = $preact.iso.HydrativelyRenderSPAOptions;
export type HandleSPACatchAllRouteOptions = Omit<$preact.iso.PrerenderSPAOptions, 'request'>;

/**
 * Hydratively renders SPA component on client-side.
 *
 * @param options Options; {@see HydrativelyRenderSPAOptions}.
 *
 * @requiredEnv web -- This utility must only be used client-side.
 *
 * @note An `auditLogger` is prepared before hydratively rendering,
 *       such that it’s capable of recording uncaught errors during hydration.
 */
export const hydrativelyRenderSPA = async (options: HydrativelyRenderSPAOptions): Promise<void> => {
    const auditLogger =
        options.props?.auditLogger || // Preserves existing, if passed in props.
        new Logger({ endpointToken: $env.get('APP_AUDIT_LOGGER_BEARER_TOKEN', { type: 'string', require: true }) });

    return $preact.iso.hydrativelyRenderSPA({ ...options, props: { ...options.props, auditLogger } });
};

/**
 * Handles an SPA's catch-all function route.
 *
 * @param   feData  Fetch event data.
 * @param   options Options {@see HandleSPACatchAllRouteOptions}.
 *
 * @returns         Response promise.
 *
 * @requiredEnv ssr -- This utility must only be used server-side.
 */
export const handleSPACatchAllRoute = async (feData: $cfp.FetchEventData, options: HandleSPACatchAllRouteOptions): Promise<$type.cf.Response> => {
    const { request } = feData;
    let config = $http.responseConfig();

    if (['HEAD', 'GET'].includes(request.method)) {
        const { httpState, docType, html } = await $preact.iso.prerenderSPA({ ...options, request });

        config.status = httpState.status || 200;
        config.headers = { 'content-type': 'text/html; charset=utf-8' };
        config.body = docType + html; // HTML markup; including doctype.
    }
    return $http.prepareResponse(request, config) as $type.cf.Response;
};
