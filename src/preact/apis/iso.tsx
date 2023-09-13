/**
 * Utility class.
 */

import '../../resources/init-env.ts';

import type { $type } from '@clevercanyon/utilities';
import type { ResponseConfig as $httpꓺResponseConfig } from '@clevercanyon/utilities/http';
import { prepareResponse as $httpꓺprepareResponse, responseConfig as $httpꓺresponseConfig } from '@clevercanyon/utilities/http';
import { mergeDeep as $objꓺmergeDeep } from '@clevercanyon/utilities/obj';
import type {
	HydrativelyRenderSPAOptions as $preactꓺisoꓺHydrativelyRenderSPAOptions,
	PrerenderSPAOptions as $preactꓺisoꓺPrerenderSPAOptions,
} from '@clevercanyon/utilities/preact/apis/iso';
import { hydrativelyRenderSPA as $preactꓺapisꓺisoꓺhydrativelyRenderSPA, prerenderSPA as $preactꓺapisꓺisoꓺprerenderSPA } from '@clevercanyon/utilities/preact/apis/iso';
import type { FetchEventData as $cfpꓺFetchEventData } from '../../cfp.ts';

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
 */
export const handleSPACatchAllRoute = async (feData: $cfpꓺFetchEventData, opts: HandleSPACatchAllRouteOptions): Promise<$type.cf.Response> => {
	const { request } = feData;
	let config = $httpꓺresponseConfig();

	if (['HEAD', 'GET'].includes(request.method)) {
		const { httpState, docType, html } = await $preactꓺapisꓺisoꓺprerenderSPA({ ...opts, request });

		config.status = 200; // Potentially overridden by SPA.
		config.headers = { 'content-type': 'text/html; charset=utf-8' };
		config.body = docType + html; // HTML markup; including doctype.

		config = $objꓺmergeDeep(config, httpState) as unknown as Required<$httpꓺResponseConfig>;
	}
	return $httpꓺprepareResponse(request, config) as $type.cf.Response;
};

/**
 * Hydrates SPA component on client-side.
 *
 * @param opts {@see HydrativelyRenderSPAOptions} for details.
 *
 * @note Client-side use only.
 */
export { $preactꓺapisꓺisoꓺhydrativelyRenderSPA as hydrativelyRenderSPA };
