/**
 * Utility class.
 */

import '../../init-env.ts';

import { $http, $obj, $preact, type $type } from '@clevercanyon/utilities';
import { $cfp } from '../../../index.ts';

/**
 * Defines types.
 */
export type HandleSPACatchAllRouteOptions = Omit<$preact.iso.PrerenderSPAOptions, 'request'>;
export type HydrativelyRenderSPAOptions = $preact.iso.HydrativelyRenderSPAOptions;

/**
 * Handles an SPA's catch-all function route.
 *
 * @param   feData Fetch event data.
 * @param   opts   Options {@see HandleSPACatchAllRouteOptions}.
 *
 * @returns        Response promise.
 *
 * @note Server-side use only.
 */
export const handleSPACatchAllRoute = async (feData: $cfp.FetchEventData, opts: HandleSPACatchAllRouteOptions): Promise<$type.cf.Response> => {
    const { request } = feData;
    let config = $http.responseConfig();

    if (['HEAD', 'GET'].includes(request.method)) {
        const { httpState, docType, html } = await $preact.iso.prerenderSPA({ ...opts, request });

        config.status = 200; // Potentially overridden by SPA.
        config.headers = { 'content-type': 'text/html; charset=utf-8' };
        config.body = docType + html; // HTML markup; including doctype.

        config = $obj.mergeDeep(config, httpState) as unknown as Required<$http.ResponseConfig>;
    }
    return $http.prepareResponse(request, config) as $type.cf.Response;
};

/**
 * Hydrates SPA component on client-side.
 *
 * @param opts {@see HydrativelyRenderSPAOptions} for details.
 *
 * @note Client-side use only.
 */
export const hydrativelyRenderSPA = $preact.iso.hydrativelyRenderSPA;
