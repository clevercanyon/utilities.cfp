/**
 * Utility class.
 */

import '#@initialize.ts';

import { $http, $json, $obj, $person, $str, $time, $url, type $type } from '@clevercanyon/utilities';

/**
 * Defines types.
 */
type PreparationOptions = {
    appType: string;
    baseURL: string;
    brand: $type.Brand;
    isC10n?: boolean;
};
export type PrepareDefaultWellKnownGPCOptions = PreparationOptions;
export type PrepareDefaultWellKnownSecurityOptions = PreparationOptions;
export type PrepareDefaultHeaderOptions = PreparationOptions;
export type PrepareDefaultRedirectOptions = PreparationOptions;
export type PrepareDefaultRouteOptions = PreparationOptions;
export type PrepareDefaultManifestOptions = PreparationOptions;
export type PrepareDefaultAdsTxtOptions = PreparationOptions;
export type PrepareDefaultHumansTxtOptions = PreparationOptions;
export type PrepareDefaultRobotsTxtOptions = PreparationOptions & {
    allow: boolean; // Whether to allow robots.
};

/**
 * Prepares default `/.well-known/gpc.json` file for a Cloudflare Pages site.
 *
 * @param   options Options. Some required; {@see PrepareDefaultWellKnownGPCOptions}.
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
    return $json.stringify(
        {
            gpc: true,
            lastUpdate: $time.now().toYMD(),
        },
        { pretty: true },
    );
};

/**
 * Prepares default `/.well-known/security.txt` file for a Cloudflare Pages site.
 *
 * @param   options Options. Some required {@see PrepareDefaultWellKnownSecurityOptions}.
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
 * @param   options Options. Some required; {@see PrepareDefaultHeaderOptions}.
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
 * @param   options Options. Some required; {@see PrepareDefaultRedirectOptions}.
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
 * @param   options Options. Some required; {@see PrepareDefaultRouteOptions}.
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

/**
 * Prepares default `/manifest.json` file for a Cloudflare Pages site.
 *
 * @param   options Options. Some required; {@see PrepareDefaultManifestOptions}.
 *
 * @returns         Default `/manifest.json` file for a Cloudflare Pages site.
 *
 * @see https://o5p.me/xxZtV7
 */
export const prepareDefaultManifest = (options: PrepareDefaultManifestOptions): string => {
    const opts = $obj.defaults({}, options, { isC10n: false }) as Required<PrepareDefaultManifestOptions>;
    const brand = opts.brand; // Extracts brand from options passed in.

    if (!['spa', 'mpa'].includes(opts.appType)) {
        return ''; // Not applicable.
    }
    return $json.stringify(
        {
            id: $url.toPathQueryHash($url.addQueryVar('utm_source', 'pwa', brand.url)),
            start_url: $url.toPathQueryHash($url.addQueryVar('utm_source', 'pwa', brand.url)),
            scope: $str.rTrim($url.parse(brand.url).pathname, '/') + '/',

            display_override: ['standalone', 'browser'],
            display: 'standalone', // Preferred presentation.

            theme_color: brand.theme.color,
            background_color: brand.theme.color,

            name: brand.name,
            short_name: brand.name,
            description: brand.description,

            icons: [
                // SVGs.
                {
                    type: 'image/svg+xml',
                    src: $url.toPathQueryHash(brand.icon.svg),
                    sizes: String(brand.icon.width) + 'x' + String(brand.icon.height),
                    purpose: 'any maskable',
                },
                {
                    type: 'image/svg+xml',
                    src: $url.toPathQueryHash(brand.icon.svg),
                    sizes: '512x512', // Required size in Chrome.
                    purpose: 'any maskable',
                },
                {
                    type: 'image/svg+xml',
                    src: $url.toPathQueryHash(brand.icon.svg),
                    sizes: '192x192', // Required size in Chrome.
                    purpose: 'any maskable',
                },
                // PNGs.
                {
                    type: 'image/png',
                    src: $url.toPathQueryHash(brand.icon.png),
                    sizes: String(brand.icon.width) + 'x' + String(brand.icon.height),
                    purpose: 'any maskable',
                },
                {
                    type: 'image/png',
                    src: $url.toPathQueryHash(brand.icon.png),
                    sizes: '512x512', // Required size in Chrome.
                    purpose: 'any maskable',
                },
                {
                    type: 'image/png',
                    src: $url.toPathQueryHash(brand.icon.png),
                    sizes: '192x192', // Required size in Chrome.
                    purpose: 'any maskable',
                },
            ],
            screenshots: [
                // Wide.
                {
                    type: 'image/png',
                    form_factor: 'wide',
                    src: $url.toPathQueryHash(brand.ogImage.png),
                    sizes: String(brand.ogImage.width) + 'x' + String(brand.ogImage.height),
                },
                // Narrow.
                {
                    type: 'image/png',
                    form_factor: 'narrow',
                    src: $url.toPathQueryHash(brand.ogImage.png),
                    sizes: String(brand.ogImage.width) + 'x' + String(brand.ogImage.height),
                },
            ],
        },
        { pretty: true },
    );
};

/**
 * Prepares default `/ads.txt` file for a Cloudflare Pages site.
 *
 * @param   options Options. Some required; {@see PrepareDefaultAdsTxtOptions}.
 *
 * @returns         Default `/ads.txt` file for a Cloudflare Pages site.
 *
 * @see https://o5p.me/bIeopu
 */
export const prepareDefaultAdsTxt = (options: PrepareDefaultAdsTxtOptions): string => {
    const opts = $obj.defaults({}, options, { isC10n: false }) as Required<PrepareDefaultAdsTxtOptions>;

    if (!['spa', 'mpa'].includes(opts.appType)) {
        return ''; // Not applicable.
    }
    return ''; // Nothing at this time.
};

/**
 * Prepares default `/humans.txt` file for a Cloudflare Pages site.
 *
 * @param   options Options. Some required; {@see PrepareDefaultHumansTxtOptions}.
 *
 * @returns         Default `/humans.txt` file for a Cloudflare Pages site.
 *
 * @review Can we make this more dynamic wrt to which humans are listed?
 *
 * @see https://o5p.me/3Esxyt
 */
export const prepareDefaultHumansTxt = (options: PrepareDefaultHumansTxtOptions): string => {
    const opts = $obj.defaults({}, options, { isC10n: false }) as Required<PrepareDefaultHumansTxtOptions>;

    const jaswrks = $person.get('@jaswrks');
    const brucewrks = $person.get('@brucewrks');

    if (!['spa', 'mpa'].includes(opts.appType)) {
        return ''; // Not applicable.
    }
    return opts.isC10n
        ? $str.dedent(`
        Hello human! Welcome to our ./humans.txt file.
        Aren't you a clever bag of bones and flesh?

        Our website is built by a small team of engineers, designers,
        researchers, and robots. It is updated continuously and built with
        more tools and technologies than we can list here. If you'd like to
        help us out, please contact one of the fine folks mentioned below.

        ---

        Name: ${jaswrks.name}
        Headline: ${jaswrks.headline}
        Location: ${jaswrks.location}

        NPM: ${jaswrks.socialProfiles.npm}
        GitHub: ${jaswrks.socialProfiles.github}
        Keybase: ${jaswrks.socialProfiles.keybase}
        Twitter: ${jaswrks.socialProfiles.twitter}
        LinkedIn: ${jaswrks.socialProfiles.linkedin}

        Technologies: ES2022, HTML5, CSS4
        Software: JavaScript, Preact, Vite, Cloudflare

        ---

        Name: ${brucewrks.name}
        Headline: ${brucewrks.headline}
        Location: ${brucewrks.location}

        NPM: ${brucewrks.socialProfiles.npm}
        GitHub: ${brucewrks.socialProfiles.github}
        Keybase: ${brucewrks.socialProfiles.keybase}
        Twitter: ${brucewrks.socialProfiles.twitter}
        LinkedIn: ${brucewrks.socialProfiles.linkedin}

        Technologies: ES2022, HTML5, CSS4
        Software: JavaScript, Preact, Vite, Cloudflare
    `)
        : '';
};

/**
 * Prepares default `/robots.txt` file for a Cloudflare Pages site.
 *
 * @param   options Options. Some required; {@see PrepareDefaultRobotsTxtOptions}.
 *
 * @returns         Default `/robots.txt` file for a Cloudflare Pages site.
 *
 * @see https://o5p.me/jYWihV
 */
export const prepareDefaultRobotsTxt = (options: PrepareDefaultRobotsTxtOptions): string => {
    const opts = $obj.defaults({}, options, { isC10n: false }) as Required<PrepareDefaultRobotsTxtOptions>;
    const baseURLResolvedNTS = $str.rTrim(new URL('./', opts.baseURL).toString(), '/');

    if (!['spa', 'mpa'].includes(opts.appType)) {
        return ''; // Not applicable.
    }
    const termly = $str.dedent(`
        user-agent: TermlyBot
        allow: /
    `);
    const sitemap = $str.dedent(`
        sitemap: ${baseURLResolvedNTS}/sitemap.xml
    `);
    const common = opts.isC10n ? termly + '\n\n' + sitemap : sitemap;

    return opts.allow
        ? $str.dedent(`
            user-agent: *
            allow: /

            ${common}
        `)
        : $str.dedent(`
            user-agent: *
            disallow: /

            ${common}
        `);
};
