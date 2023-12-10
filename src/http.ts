/**
 * Utility class.
 */

import '#@initialize.ts';

import { $http, $json, $obj, $str } from '@clevercanyon/utilities';

/**
 * Defines types.
 */
export type DefaultHeaderOptions = {
    appType: string;
    isC10n?: boolean;
};
export type DefaultRedirectOptions = {
    appType: string;
    isC10n?: boolean;
};
export type DefaultRouteOptions = {
    appType: string;
    isC10n?: boolean;
};

/**
 * Prepares default `/_headers` file for a Cloudflare Pages site.
 *
 * @param   options Options. Please be sure to pass `appType`, at minimum.
 *
 * @returns         Default `/_headers` file for a Cloudflare Pages site.
 *
 * @see https://o5p.me/juElYi
 */
export const prepareDefaultHeaders = (options: DefaultHeaderOptions): string => {
    const opts = $obj.defaults({}, options, { appType: '', isC10n: false }) as Required<DefaultHeaderOptions>;

    if (!['spa', 'mpa'].includes(opts.appType)) {
        return ''; // Not applicable.
    }
    const separator = '\n    '; // Line break + indentation.
    let _securityHeaders = []; // Initializes security headers.

    for (const [name, value] of Object.entries(opts.isC10n ? $http.c10nSecurityHeaders() : $http.defaultSecurityHeaders())) {
        _securityHeaders.push(name + ': ' + value);
    }
    const securityHeaders = _securityHeaders.join(separator);
    const allowAnyOriginHeader = ['access-control-allow-origin: *'].join(separator);

    const seoRelatedCacheControlHeaders = [
        'cache-control: public, must-revalidate, max-age=86400, s-maxage=86400, stale-while-revalidate=86400, stale-if-error=86400',
        'cdn-cache-control: public, must-revalidate, max-age=86400, stale-while-revalidate=86400, stale-if-error=86400',
    ].join(separator);

    const staticCacheControlHeaders = [
        'cache-control: public, must-revalidate, max-age=31536000, s-maxage=31536000, stale-while-revalidate=604800, stale-if-error=604800',
        'cdn-cache-control: public, must-revalidate, max-age=31536000, stale-while-revalidate=604800, stale-if-error=604800',
    ].join(separator);

    return $str.dedent(`
        /*
            ${securityHeaders}
            vary: origin

        /.well-known/*
            ${allowAnyOriginHeader}
            ${seoRelatedCacheControlHeaders}

        /assets/*
            ${allowAnyOriginHeader}
            ${staticCacheControlHeaders}

        /sitemaps/*.xml
            ${allowAnyOriginHeader}
            ${seoRelatedCacheControlHeaders}

        /sitemap.xml
            ${allowAnyOriginHeader}
            ${seoRelatedCacheControlHeaders}

        /manifest.json
            ${allowAnyOriginHeader}
            ${seoRelatedCacheControlHeaders}

        /ads.txt
            ${allowAnyOriginHeader}
            ${seoRelatedCacheControlHeaders}

        /humans.txt
            ${allowAnyOriginHeader}
            ${seoRelatedCacheControlHeaders}

        /robots.txt
            ${allowAnyOriginHeader}
            ${seoRelatedCacheControlHeaders}

        /favicon.ico
            ${allowAnyOriginHeader}
            ${seoRelatedCacheControlHeaders}

        https://*.pages.dev/*
            x-robots-tag: noindex, nofollow
    `);
};

/**
 * Prepares default `/_redirects` file for a Cloudflare Pages site.
 *
 * @param   options Options. Please be sure to pass `appType`, at minimum.
 *
 * @returns         Default `/_redirects` file for a Cloudflare Pages site.
 *
 * @see https://o5p.me/YngZH9
 */
export const prepareDefaultRedirects = (options: DefaultRedirectOptions): string => {
    const opts = $obj.defaults({}, options, { appType: '', isC10n: false }) as Required<DefaultRedirectOptions>;

    if (!['spa', 'mpa'].includes(opts.appType)) {
        return ''; // Not applicable.
    }
    return ''; // None at this time.
};

/**
 * Prepares default `/_routes.json` file for a Cloudflare Pages site.
 *
 * @param   options Options. Please be sure to pass `appType`, at minimum.
 *
 * @returns         Default `/_routes.json` file for a Cloudflare Pages site.
 *
 * @see https://o5p.me/6wu3jg
 */
export const prepareDefaultRoutes = (options: DefaultRouteOptions): string => {
    const opts = $obj.defaults({}, options, { appType: '', isC10n: false }) as Required<DefaultRouteOptions>;

    if (!['spa', 'mpa'].includes(opts.appType)) {
        return ''; // Not applicable.
    }
    return $json.stringify(
        {
            version: 1, // Cloudflare `/_routes.json` file version.
            include: ['/*'], // Default is a blanket over all paths, which we treat as dynamic routes to functions.
            exclude: [
                // Now, exclude all static paths from the default blanket over all paths.
                '/.well-known/*',
                '/assets/*',
                '/sitemaps/*',
                '/sitemap.xml',
                '/manifest.json',
                '/ads.txt',
                '/humans.txt',
                '/robots.txt',
                '/favicon.ico',
                '/404.html',
            ],
        },
        { pretty: true },
    );
};
