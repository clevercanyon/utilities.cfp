/**
 * Utility class.
 */

import '../../resources/init-env.js';

import type {
	PrerenderSPAOptions as $preactꓺisoꓺPrerenderSPAOptions,
	HydrativelyRenderSPAOptions as $preactꓺisoꓺHydrativelyRenderSPAOptions,
} from '@clevercanyon/utilities/preact/apis/iso';

import type { core as $cfpꓺcore, FetchEventData as $cfpꓺFetchEventData } from '../../cfp.js';
import { responseConfig as $httpꓺresponseConfig, prepareResponse as $httpꓺprepareResponse } from '@clevercanyon/utilities/http';
import { prerenderSPA as $preactꓺisoꓺprerenderSPA, hydrativelyRenderSPA as $preactꓺisoꓺhydrativelyRenderSPA } from '@clevercanyon/utilities/preact/apis/iso';

/**
 * Defines types.
 */
export type HandleSPACatchAllRouteOptions = Omit<$preactꓺisoꓺPrerenderSPAOptions, 'request'>;
export type HydrativelyRenderSPAOptions = $preactꓺisoꓺHydrativelyRenderSPAOptions;

/**
 * Handles an SPA's catch-all function route.
 *
 * @param   feData Fetch event data.
 * @param   opts   Options {@see HandleCatchAllRouteOptions}.
 *
 * @returns        Response promise.
 *
 * @note Server-side use only.
 *
 * @todo Caching of server-side prerenders.
 */
export const handleSPACatchAllRoute = async (feData: $cfpꓺFetchEventData, opts: HandleSPACatchAllRouteOptions): Promise<$cfpꓺcore.Response> => {
	const { request } = feData;
	const config = $httpꓺresponseConfig();

	if (['HEAD', 'GET'].includes(request.method)) {
		const { httpStatus, doctypeHTML } = await $preactꓺisoꓺprerenderSPA({ ...opts, request });

		config.status = httpStatus;
		config.maxAge = 900; // Sets cache max age.
		config.headers = { 'content-type': 'text/html; charset=utf-8' };
		config.body = doctypeHTML; // HTML markup, including doctype.
	}
	return $httpꓺprepareResponse(request, config) as $cfpꓺcore.Response;
};

/**
 * Hydrates SPA component on client-side.
 *
 * @param opts {@see HydrativelyRenderSPAOptions} for details.
 *
 * @note Client-side use only.
 */
export { $preactꓺisoꓺhydrativelyRenderSPA as hydrativelyRenderSPA };
