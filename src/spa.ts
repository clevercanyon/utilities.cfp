/**
 * Utility class.
 */

import './resources/init-env.js';

import { $http } from '@clevercanyon/utilities';
import * as $preactꓺssr from '@clevercanyon/utilities/preact/apis/ssr';
import type { core as $cfpꓺcore, FetchEventData as $cfpꓺFetchEventData } from './cfp.js';

/**
 * Defines types.
 */
export type HandleCatchAllRouteOptions = Omit<$preactꓺssr.PrerenderSPAToStringOptions, 'request'>;

/**
 * Handles an SPA's catch-all function route.
 *
 * @param   feData Fetch event data.
 * @param   opts   Options {@see HandleCatchAllRouteOptions}.
 *
 * @returns        Response promise.
 */
export const handleCatchAllRoute = async (feData: $cfpꓺFetchEventData, opts: HandleCatchAllRouteOptions): Promise<$cfpꓺcore.Response> => {
	const { request } = feData;
	const config = $http.responseConfig();

	if (['HEAD', 'GET'].includes(request.method)) {
		config.status = 200;
		config.maxAge = 900;
		config.headers = { 'content-type': 'text/html; charset=utf-8' };
		config.body = await $preactꓺssr.prerenderSPAToString({ request, appManifest: opts.appManifest, App: opts.App });
	}
	return $http.prepareResponse(request, config) as $cfpꓺcore.Response;
};
