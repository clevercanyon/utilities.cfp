/**
 * Utility class.
 */

import './resources/init-env.js';

import type { core as $cfpꓺcore, FetchEventData as $cfpꓺFetchEventData } from './cfp.js';

/**
 * Gets geo property.
 *
 * @param   fed Fetch event data.
 *
 * @returns     Geo property value.
 */
export const prop = (fed: $cfpꓺFetchEventData, prop: string): string => {
	const { request } = fed; // Request extraction.
	const r = request as unknown as $cfpꓺcore.Request; // Includes `cf` property.
	return String(r.cf && prop in r.cf ? r.cf[prop as keyof typeof r.cf] || '' : '');
};