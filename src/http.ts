/**
 * Utility class.
 */

import '#@init.ts';

import { $http, $obj, $str } from '@clevercanyon/utilities';

/**
 * Defines types.
 */
export type DefaultHeaderOptions = {
    appType: string;
    isC10n?: boolean;
};

/**
 * Prepares default headers file for a Cloudflare Pages site.
 *
 * @param   options Options. Please be sure to pass `appType`, at minimum.
 *
 * @returns         Default headers file for a Cloudflare Pages site.
 */
export const prepareDefaultHeaders = (options: DefaultHeaderOptions): string => {
    const opts = $obj.defaults({}, options, { appType: '', isC10n: false }) as Required<DefaultHeaderOptions>;

    if (!['spa', 'mpa'].includes(opts.appType)) {
        return ''; // Not applicable.
    }
    let securityHeaders = ''; // Initializes security headers.

    for (const [name, value] of Object.entries(opts.isC10n ? $http.c10nSecurityHeaders() : $http.defaultSecurityHeaders())) {
        securityHeaders += (securityHeaders ? '\n  ' : '') + name + ': ' + value;
    }
    return $str.dedent(`
		/*
		  ${securityHeaders}
		  vary: origin, accept, accept-language, accept-encoding

		/assets/*
		  access-control-allow-origin: *
		  cache-control: public, must-revalidate, max-age=31536000, s-maxage=31536000, stale-while-revalidate=604800, stale-if-error=604800

		/sitemaps/*.xml
		  access-control-allow-origin: *
		  cache-control: public, must-revalidate, max-age=86400, s-maxage=86400, stale-while-revalidate=86400, stale-if-error=86400

		/robots.txt
		  access-control-allow-origin: *
		  cache-control: public, must-revalidate, max-age=86400, s-maxage=86400, stale-while-revalidate=86400, stale-if-error=86400

		/sitemap.xml
		  access-control-allow-origin: *
		  cache-control: public, must-revalidate, max-age=86400, s-maxage=86400, stale-while-revalidate=86400, stale-if-error=86400

		https://*.pages.dev/*
		  x-robots-tag: noindex, nofollow
	`);
};
