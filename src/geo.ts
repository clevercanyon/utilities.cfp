/**
 * Utility class.
 */

import './resources/init.ts';

import type { $type } from '@clevercanyon/utilities';
import { $cfp } from './index.ts';

/**
 * Gets geo property.
 *
 * @param   fed Fetch event data.
 *
 * @returns     Geo property value.
 */
export const prop = (fed: $cfp.FetchEventData, prop: string): string => {
    const { request } = fed; // Request extraction.
    const r = request as unknown as $type.cf.Request; // Includes `cf` property.
    return String(r.cf && prop in r.cf ? r.cf[prop as keyof typeof r.cf] || '' : '');
};
