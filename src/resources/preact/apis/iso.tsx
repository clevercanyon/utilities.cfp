/**
 * Utility class.
 */

import { $cfp } from '#index.ts';
import { $http, $preact, type $type } from '@clevercanyon/utilities';

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
 */
export const hydrativelyRenderSPA = async (options: HydrativelyRenderSPAOptions): Promise<void> => {
    return $preact.iso.hydrativelyRenderSPA(options);
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
