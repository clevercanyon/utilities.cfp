/**
 * Utility class.
 */

import './resources/init-env.js';
import type { $type } from '@clevercanyon/utilities';
import { $env, $http, $url } from '@clevercanyon/utilities';

/**
 * Defines types.
 */
export type Context = Parameters<$type.cf.PagesFunction>[0];

export type Environment = {
	readonly D1?: $type.cf.D1Database;
	readonly R2?: $type.cf.R2Bucket;
	readonly KV?: $type.cf.KVNamespace;
	readonly DO?: $type.cf.DurableObjectNamespace;
	readonly [x: string]: unknown;
};
export type Route = (x: FetchEventData) => Promise<$type.cf.Response>;

export type FetchEventData = {
	readonly request: $type.cf.Request;
	readonly env: Environment;
	readonly ctx: Context;
	readonly route: Route;
	readonly url: $type.cf.URL;
};
export type InitialFetchEventData = {
	readonly ctx: Context;
	readonly route: Route;
};

/**
 * Handles fetch events.
 *
 * @param   feData Initial fetch event data.
 *
 * @returns        Response promise.
 */
export const handleFetchEvent = async (ifeData: InitialFetchEventData): Promise<$type.cf.Response> => {
	let { request } = ifeData.ctx;
	const { env } = ifeData.ctx;
	const { ctx, route } = ifeData;

	$env.capture('@global', env); // Captures environment vars.

	try {
		request = $http.prepareRequest(request, {}) as $type.cf.Request;
		const url = $url.parse(request.url) as $type.cf.URL;

		const feData = { request, env, ctx, route, url };
		return route(feData); // CFP function route.
		//
	} catch (error) {
		if (error instanceof Response) {
			return error as unknown as $type.cf.Response;
		}
		return $http.prepareResponse(request, { status: 500 }) as $type.cf.Response;
	}
};
