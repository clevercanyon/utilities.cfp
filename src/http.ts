/**
 * Utility class.
 */

import '#@initialize.ts';

import { $http, $json, $obj, $str, $time, type $type } from '@clevercanyon/utilities';

/**
 * Defines types.
 */
export type PrepareDefaultWellKnownGPCOptions = { appType: string; isC10n?: boolean };
export type PrepareDefaultWellKnownSecurityOptions = { appType: string; brand: $type.Brand; isC10n?: boolean };
export type PrepareDefaultHeaderOptions = { appType: string; isC10n?: boolean };
export type PrepareDefaultRedirectOptions = { appType: string; isC10n?: boolean };
export type PrepareDefaultRouteOptions = { appType: string; isC10n?: boolean };

/**
 * Prepares default `/.well-known/gpc.json` file for a Cloudflare Pages site.
 *
 * @param   options Options. Pass `appType`, at minimum; {@see PrepareDefaultWellKnownGPCOptions}.
 *
 * @returns         Default `/.well-known/gpc.json` file for a Cloudflare Pages site.
 *
 * @see https://o5p.me/IFDw0f
 */
export const prepareDefaultWellKnownGPC = (options: PrepareDefaultWellKnownGPCOptions): string => {
    const opts = $obj.defaults({}, options, { isC10n: false }) as Required<PrepareDefaultWellKnownGPCOptions>;

    if (!['spa', 'mpa'].includes(opts.appType)) {
        return ''; // Not applicable.
    }
    return $json.stringify({
        gpc: true,
        lastUpdate: $time.now().toYMD(),
    });
};

/**
 * Prepares default `/.well-known/security.txt` file for a Cloudflare Pages site.
 *
 * @param   options Options. Pass `appType` and `brand`, at minimum; {@see PrepareDefaultWellKnownSecurityOptions}.
 *
 * @returns         Default `/.well-known/security.txt` file for a Cloudflare Pages site.
 *
 * @see https://o5p.me/6dgJA5
 */
export const prepareDefaultWellKnownSecurity = (options: PrepareDefaultWellKnownSecurityOptions): string => {
    const opts = $obj.defaults({}, options, { isC10n: false }) as Required<PrepareDefaultWellKnownSecurityOptions>;

    const brandContacts = opts.brand.contacts;
    const brandSocialProfiles = opts.brand.socialProfiles;

    const brandFounder = opts.brand.founder;
    const brandFounderSocialProfiles = brandFounder.socialProfiles;

    if (!['spa', 'mpa'].includes(opts.appType)) {
        return ''; // Not applicable.
    }
    return $str.dedent(`
        Contact: mailto:${brandContacts.security.email}
        Contact: ${brandContacts.security.url}
        Contact: ${brandSocialProfiles.keybase || brandFounderSocialProfiles.keybase || brandContacts.admin.url}
        Expires: ${$time.now().add(2, 'y').toYMD()}
        Preferred-Languages: en
    `);
};

/**
 * Prepares default `/_headers` file for a Cloudflare Pages site.
 *
 * @param   options Options. Pass `appType`, at minimum; {@see PrepareDefaultHeaderOptions}.
 *
 * @returns         Default `/_headers` file for a Cloudflare Pages site.
 *
 * @see https://o5p.me/juElYi
 */
export const prepareDefaultHeaders = (options: PrepareDefaultHeaderOptions): string => {
    const opts = $obj.defaults({}, options, { isC10n: false }) as Required<PrepareDefaultHeaderOptions>;

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
 * @param   options Options. Pass `appType`, at minimum; {@see PrepareDefaultRedirectOptions}.
 *
 * @returns         Default `/_redirects` file for a Cloudflare Pages site.
 *
 * @see https://o5p.me/YngZH9
 */
export const prepareDefaultRedirects = (options: PrepareDefaultRedirectOptions): string => {
    const opts = $obj.defaults({}, options, { isC10n: false }) as Required<PrepareDefaultRedirectOptions>;

    if (!['spa', 'mpa'].includes(opts.appType)) {
        return ''; // Not applicable.
    }
    return ''; // None at this time.
};

/**
 * Prepares default `/_routes.json` file for a Cloudflare Pages site.
 *
 * @param   options Options. Pass `appType`, at minimum; {@see PrepareDefaultRouteOptions}.
 *
 * @returns         Default `/_routes.json` file for a Cloudflare Pages site.
 *
 * @see https://o5p.me/6wu3jg
 */
export const prepareDefaultRoutes = (options: PrepareDefaultRouteOptions): string => {
    const opts = $obj.defaults({}, options, { isC10n: false }) as Required<PrepareDefaultRouteOptions>;

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
