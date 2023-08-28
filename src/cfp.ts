/**
 * Utility class.
 */

import './resources/init-env.js';

import { $env, $http, $url } from '@clevercanyon/utilities';
import type * as core from '@cloudflare/workers-types/experimental';

/**
 * Defines types.
 */
export type Context = Parameters<core.PagesFunction>[0];

export type Environment = {
	readonly D1?: core.D1Database;
	readonly R2?: core.R2Bucket;
	readonly KV?: core.KVNamespace;
	readonly DO?: core.DurableObjectNamespace;
	readonly [x: string]: unknown;
};
export type Route = (x: FetchEventData) => Promise<core.Response>;

export type FetchEventData = {
	readonly request: core.Request;
	readonly env: Environment;
	readonly ctx: Context;
	readonly route: Route;
	readonly url: core.URL;
};
export type InitialFetchEventData = {
	readonly ctx: Context;
	readonly route: Route;
};
export type { core };

/**
 * Handles fetch events.
 *
 * @param   feData Initial fetch event data.
 *
 * @returns        Response promise.
 */
export const handleFetchEvent = async (ifeData: InitialFetchEventData): Promise<core.Response> => {
	let { request } = ifeData.ctx;
	let url: core.URL | null = null;
	const { env } = ifeData.ctx;
	const { ctx, route } = ifeData;

	$env.capture('@global', env); // Captures environment vars.

	try {
		request = $http.prepareRequest(request, {}) as core.Request;
		url = $url.parse(request.url) as core.URL;

		const feData = { request, env, ctx, route, url };
		return route(feData); // CFP function route.
		//
	} catch (error) {
		if (error instanceof Response) {
			return error as unknown as core.Response;
		}
		return $http.prepareResponse(request, { status: 500 }) as core.Response;
	}
};
