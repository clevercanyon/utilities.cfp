/**
 * Utility class.
 */

import '#@initialize.ts';

import { $http, $json, $obj, $profile, $str, $time, $url, type $type } from '@clevercanyon/utilities';

/**
 * Defines types.
 */
type PreparationOptions = {
    appType: string;
    baseURL: string;
    brand: $type.Brand;
    isC10n?: boolean;
};
export type PrepareDefaultWellKnownGPCJSONOptions = PreparationOptions;
export type PrepareDefaultWellKnownGPGTxtOptions = PreparationOptions;
export type PrepareDefaultWellKnownSecurityTxtOptions = PreparationOptions;
export type PrepareDefaultHeaderOptions = PreparationOptions;
export type PrepareDefaultRedirectOptions = PreparationOptions;
export type PrepareDefaultRoutesJSONOptions = PreparationOptions;
export type PrepareDefaultManifestJSONOptions = PreparationOptions;
export type PrepareDefaultAdsTxtOptions = PreparationOptions;
export type PrepareDefaultHumansTxtOptions = PreparationOptions;
export type PrepareDefaultRobotsTxtOptions = PreparationOptions & { allow: boolean };
export type PrepareDefaultDefaultSitemapsForRobotsTxtOptions = PreparationOptions;

/**
 * Prepares default `/.well-known/gpc.json` file for a Cloudflare Pages site.
 *
 * @param   options Options. Some required; {@see PrepareDefaultWellKnownGPCJSONOptions}.
 *
 * @returns         Default `/.well-known/gpc.json` file for a Cloudflare Pages site.
 *
 * @see https://o5p.me/IFDw0f
 */
export const prepareDefaultWellKnownGPCJSON = (options: PrepareDefaultWellKnownGPCJSONOptions): string => {
    const opts = $obj.defaults({}, options, { isC10n: false }) as Required<PrepareDefaultWellKnownGPCJSONOptions>;

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
 * Prepares default `/.well-known/gpg.txt` file for a Cloudflare Pages site.
 *
 * @param   options Options. Some required {@see PrepareDefaultWellKnownGPGTxtOptions}.
 *
 * @returns         Default `/.well-known/gpg.txt` file for a Cloudflare Pages site.
 *
 * @note `./security.txt` references this file. By default, it contains Clever Canyon’s GPG key.
 */
export const prepareDefaultWellKnownGPGTxt = (options: PrepareDefaultWellKnownGPGTxtOptions): string => {
    const opts = $obj.defaults({}, options, { isC10n: false }) as Required<PrepareDefaultWellKnownGPGTxtOptions>;

    if (!['spa', 'mpa'].includes(opts.appType)) {
        return ''; // Not applicable.
    }
    return $str.dedent(`
        -----BEGIN PGP PUBLIC KEY BLOCK-----

        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
        =7MJh
        -----END PGP PUBLIC KEY BLOCK-----
    `);
};

/**
 * Prepares default `/.well-known/security.txt` file for a Cloudflare Pages site.
 *
 * @param   options Options. Some required {@see PrepareDefaultWellKnownSecurityTxtOptions}.
 *
 * @returns         Default `/.well-known/security.txt` file for a Cloudflare Pages site.
 *
 * @see https://o5p.me/6dgJA5
 */
export const prepareDefaultWellKnownSecurityTxt = (options: PrepareDefaultWellKnownSecurityTxtOptions): string => {
    const opts = $obj.defaults({}, options, { isC10n: false }) as Required<PrepareDefaultWellKnownSecurityTxtOptions>;

    const brandPolicies = opts.brand.policies,
        brandContacts = opts.brand.contacts;

    if (!['spa', 'mpa'].includes(opts.appType)) {
        return ''; // Not applicable.
    }
    return $str.dedent(`
        Contact: mailto:${brandContacts.security.email}
        Contact: ${brandContacts.security.url}
        Policy: ${brandPolicies.security}
        Encryption: ${new URL('./.well-known/gpg.txt', opts.baseURL).toString()}
        Expires: ${$time.now().add(2, 'y').toYMD()}
        Preferred-Languages: en
    `);
};

/**
 * Prepares default `/_headers` file for a Cloudflare Pages site.
 *
 * These headers apply only to static paths. Please {@see prepareDefaultRoutesJSON()} and {@see https://o5p.me/juElYi}
 * regarding Cloudflare’s handling of the `_headers` file as it pertains to static paths.
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
    const separator = '\n    ', // Line break + indentation.
        httpSecurityHeaders = opts.isC10n //
            ? $http.c10nSecurityHeaders({ enableCORs: true })
            : $http.defaultSecurityHeaders({ enableCORs: true });

    let securityHeadersArr = []; // Initializes security headers.
    for (const [name, value] of Object.entries(httpSecurityHeaders)) {
        securityHeadersArr.push(name + ': ' + value);
    }
    const securityHeaders = securityHeadersArr.join(separator),
        //
        staticCacheControlHeaders = [
            'cache-control: public, must-revalidate, max-age=31536000, s-maxage=31536000, stale-while-revalidate=604800, stale-if-error=604800',
            'cdn-cache-control: public, must-revalidate, max-age=31536000, stale-while-revalidate=604800, stale-if-error=604800',
        ].join(separator),
        //
        seoRelatedCacheControlHeaders = [
            '! cache-control',
            '! cdn-cache-control',
            'cache-control: public, must-revalidate, max-age=86400, s-maxage=86400, stale-while-revalidate=86400, stale-if-error=86400',
            'cdn-cache-control: public, must-revalidate, max-age=86400, stale-while-revalidate=86400, stale-if-error=86400',
        ].join(separator);

    return $str.dedent(`
        /*
            ${securityHeaders}
            ${staticCacheControlHeaders}

        /.well-known/*
            ${seoRelatedCacheControlHeaders}

        /sitemaps/*.xml
            ${seoRelatedCacheControlHeaders}

        /sitemap.xml
            ${seoRelatedCacheControlHeaders}

        /manifest.json
            ${seoRelatedCacheControlHeaders}

        /ads.txt
            ${seoRelatedCacheControlHeaders}

        /humans.txt
            ${seoRelatedCacheControlHeaders}

        /robots.txt
            ${seoRelatedCacheControlHeaders}

        /favicon.ico
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
 * @param   options Options. Some required; {@see PrepareDefaultRoutesJSONOptions}.
 *
 * @returns         Default `/_routes.json` file for a Cloudflare Pages site.
 *
 * @see https://o5p.me/6wu3jg
 */
export const prepareDefaultRoutesJSON = (options: PrepareDefaultRoutesJSONOptions): string => {
    const opts = $obj.defaults({}, options, { isC10n: false }) as Required<PrepareDefaultRoutesJSONOptions>;

    if (!['spa', 'mpa'].includes(opts.appType)) {
        return ''; // Not applicable.
    }
    return $json.stringify(
        {
            version: 1, // Cloudflare `/_routes.json` file version.
            include: ['/*'], // Default is a blanket over all paths, which we treat as dynamic routes to functions.
            exclude: [
                // Now, exclude all static paths from the default blanket over all paths.
                // We want these common requests to immediately bypass any dynamics, for performance.
                '/.well-known/*',
                '/assets/*',
                '/sitemaps/*',
                '/vite/*',
                '/sitemap.xml',
                '/manifest.json',
                '/ads.txt',
                '/humans.txt',
                '/robots.txt',
                '/favicon.ico',
                '/404.html',

                // Also exclude all known redirects.
                // We want `_redirects` to control these.
                '/r/*',
            ],
        },
        { pretty: true },
    );
};

/**
 * Prepares default `/manifest.json` file for a Cloudflare Pages site.
 *
 * @param   options Options. Some required; {@see PrepareDefaultManifestJSONOptions}.
 *
 * @returns         Default `/manifest.json` file for a Cloudflare Pages site.
 *
 * @see https://o5p.me/xxZtV7
 */
export const prepareDefaultManifestJSON = (options: PrepareDefaultManifestJSONOptions): string => {
    const opts = $obj.defaults({}, options, { isC10n: false }) as Required<PrepareDefaultManifestJSONOptions>,
        brand = opts.brand; // Extracts brand from options passed in.

    if (!['spa', 'mpa'].includes(opts.appType)) {
        return ''; // Not applicable.
    }
    return $json.stringify(
        {
            id: $url.toPathQueryHash($url.addQueryVar('utm_source', 'pwa', opts.baseURL)),
            start_url: $url.toPathQueryHash($url.addQueryVar('utm_source', 'pwa', opts.baseURL)),
            scope: $str.rTrim($url.parse(opts.baseURL).pathname, '/') + '/',

            display_override: ['standalone', 'browser'],
            display: 'standalone', // Preferred presentation.

            theme_color: brand.theme.color,
            background_color: brand.theme.color,

            name: brand.name,
            short_name: brand.name,
            description: brand.description,

            icons: [
                // SVGs (any).
                {
                    type: 'image/svg+xml',
                    src: brand.icon.svg,
                    sizes: String(brand.icon.width) + 'x' + String(brand.icon.height),
                    purpose: 'any',
                },
                {
                    type: 'image/svg+xml',
                    src: brand.icon.svg,
                    sizes: '512x512',
                    purpose: 'any',
                },
                {
                    type: 'image/svg+xml',
                    src: brand.icon.svg,
                    sizes: '192x192',
                    purpose: 'any',
                },
                // SVGs (maskable).
                {
                    type: 'image/svg+xml',
                    src: brand.icon.svg,
                    sizes: String(brand.icon.width) + 'x' + String(brand.icon.height),
                    purpose: 'maskable',
                },
                {
                    type: 'image/svg+xml',
                    src: brand.icon.svg,
                    sizes: '512x512',
                    purpose: 'maskable',
                },
                {
                    type: 'image/svg+xml',
                    src: brand.icon.svg,
                    sizes: '192x192',
                    purpose: 'maskable',
                },
                // PNGs (any).
                {
                    type: 'image/png',
                    src: brand.icon.png,
                    sizes: String(brand.icon.width) + 'x' + String(brand.icon.height),
                    purpose: 'any',
                },
                {
                    type: 'image/png',
                    src: brand.icon.png,
                    sizes: '512x512',
                    purpose: 'any',
                },
                {
                    type: 'image/png',
                    src: brand.icon.png,
                    sizes: '192x192',
                    purpose: 'any',
                },
                // PNGs (maskable).
                {
                    type: 'image/png',
                    src: brand.icon.png,
                    sizes: String(brand.icon.width) + 'x' + String(brand.icon.height),
                    purpose: 'maskable',
                },
                {
                    type: 'image/png',
                    src: brand.icon.png,
                    sizes: '512x512',
                    purpose: 'maskable',
                },
                {
                    type: 'image/png',
                    src: brand.icon.png,
                    sizes: '192x192',
                    purpose: 'maskable',
                },
            ],
            screenshots: [
                // Wide on desktop.
                {
                    type: 'image/png',
                    form_factor: 'wide',
                    src: brand.ogImage.png,
                    sizes: String(brand.ogImage.width) + 'x' + String(brand.ogImage.height),
                },
                {
                    type: 'image/png',
                    form_factor: 'wide',
                    src: brand.screenshots.desktop['1'].png,
                    sizes: String(brand.screenshots.desktop.width) + 'x' + String(brand.screenshots.desktop.height),
                },
                {
                    type: 'image/png',
                    form_factor: 'wide',
                    src: brand.screenshots.desktop['2'].png,
                    sizes: String(brand.screenshots.desktop.width) + 'x' + String(brand.screenshots.desktop.height),
                },
                {
                    type: 'image/png',
                    form_factor: 'wide',
                    src: brand.screenshots.desktop['3'].png,
                    sizes: String(brand.screenshots.desktop.width) + 'x' + String(brand.screenshots.desktop.height),
                },
                // Narrow on mobile.
                {
                    type: 'image/png',
                    form_factor: 'narrow',
                    src: brand.screenshots.mobile['1'].png,
                    sizes: String(brand.screenshots.mobile.width) + 'x' + String(brand.screenshots.mobile.height),
                },
                {
                    type: 'image/png',
                    form_factor: 'narrow',
                    src: brand.screenshots.mobile['2'].png,
                    sizes: String(brand.screenshots.mobile.width) + 'x' + String(brand.screenshots.mobile.height),
                },
                {
                    type: 'image/png',
                    form_factor: 'narrow',
                    src: brand.screenshots.mobile['3'].png,
                    sizes: String(brand.screenshots.mobile.width) + 'x' + String(brand.screenshots.mobile.height),
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
 * @see https://o5p.me/3Esxyt
 */
export const prepareDefaultHumansTxt = (options: PrepareDefaultHumansTxtOptions): string => {
    const opts = $obj.defaults({}, options, { isC10n: false }) as Required<PrepareDefaultHumansTxtOptions>;

    const jaswrks = $profile.get('@jaswrks'),
        brucewrks = $profile.get('@brucewrks');

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

    if (!['spa', 'mpa'].includes(opts.appType)) {
        return ''; // Not applicable.
    }
    const termly = $str.dedent(`
        user-agent: TermlyBot
        allow: /
    `);
    const common = opts.isC10n ? termly : '';

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

/**
 * Prepares default sitemaps for a `/robots.txt` file in a Cloudflare Pages site.
 *
 * @param   options Options. Some required; {@see PrepareDefaultDefaultSitemapsForRobotsTxtOptions}.
 *
 * @returns         Default sitemaps for a `/robots.txt` file in a Cloudflare Pages site.
 *
 * @see https://o5p.me/jYWihV
 */
export const prepareDefaultSitemapsForRobotsTxt = (options: PrepareDefaultDefaultSitemapsForRobotsTxtOptions): string => {
    const opts = $obj.defaults({}, options, { isC10n: false }) as Required<PrepareDefaultDefaultSitemapsForRobotsTxtOptions>,
        baseURLResolvedNTS = $str.rTrim(new URL('./', opts.baseURL).toString(), '/');

    if (!['spa', 'mpa'].includes(opts.appType)) {
        return ''; // Not applicable.
    }
    const sitemaps = $str.dedent(`
        sitemap: ${baseURLResolvedNTS}/sitemap.xml
    `);
    return sitemaps;
};
