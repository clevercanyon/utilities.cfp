#!/usr/bin/env node
/**
 * Wrangler config file.
 *
 * Wrangler is not aware of this config file's location.
 *
 * The underlying `../../../wrangler.toml` file can be recompiled using:
 *
 *     $ madrun update wrangler
 *     or: $ madrun update dotfiles
 *
 * The underlying `../../../wrangler.toml` file can be partially tested using:
 *
 *     $ madrun wrangler types ... outputs: `./worker-configuration.d.ts`.
 *
 * @note PLEASE DO NOT EDIT THIS FILE!
 * @note This entire file will be updated automatically.
 * @note Instead of editing here, please review <https://github.com/clevercanyon/skeleton>.
 *
 * @see https://developers.cloudflare.com/workers/wrangler/configuration/
 */

import path from 'node:path';
import { $fs } from '../../../node_modules/@clevercanyon/utilities.node/dist/index.js';
import { $obp, $path } from '../../../node_modules/@clevercanyon/utilities/dist/index.js';
import extensions from '../bin/includes/extensions.mjs';
import u from '../bin/includes/utilities.mjs';
import wranglerSettings from './settings.mjs';

const __dirname = $fs.imuDirname(import.meta.url);
const projDir = path.resolve(__dirname, '../../..');

const pkg = await u.pkg(); // `./package.json`.
const appType = $obp.get(pkg, 'config.c10n.&.build.appType');
const targetEnv = $obp.get(pkg, 'config.c10n.&.build.targetEnv');

/**
 * Defines Wrangler configuration.
 */
export default async () => {
    /**
     * Gets settings.
     */
    const settings = await wranglerSettings();

    /**
     * Defines base config.
     *
     * A few settings, like `send_metrics`, `compatibility_date`, `compatibility_flags`, are potentially relevant to any
     * app, because they also configure miniflare through Vitest for testing. So they are always defined, regardless.
     */
    const baseConfig = {
        // Platform settings.

        send_metrics: false, // Don't share usage.

        // Compatibility settings.

        compatibility_date: settings.compatibilityDate,
        compatibility_flags: settings.compatibilityFlags,

        // The rest of these settings are applied conditionally.

        ...(['cma', 'spa', 'mpa'].includes(appType) && ['cfw', 'cfp'].includes(targetEnv)
            ? {
                  // Worker account ID.

                  account_id: settings.defaultAccountId,

                  ...(['spa', 'mpa'].includes(appType)
                      ? // Cloudflare pages site.
                        {
                            // Nothing more for now.
                        }
                      : // Cloudflare worker.
                        {
                            // We don’t use.

                            workers_dev: false,

                            // Worker name.

                            name: settings.defaultWorkerName,

                            // App main entry configuration.

                            main: './' + path.relative(projDir, './dist/index.js'),

                            // Bundling configuration; {@see <https://o5p.me/JRHxfC>}.

                            rules: [
                                {
                                    type: 'ESModule',
                                    globs: extensions.asNoBraceGlobstars([
                                        ...extensions.byDevGroup.sJavaScript, //
                                        ...extensions.byDevGroup.sJavaScriptReact,

                                        ...extensions.byDevGroup.mJavaScript,
                                        ...extensions.byDevGroup.mJavaScriptReact,
                                    ]),
                                    fallthrough: false,
                                },
                                {
                                    type: 'CommonJS',
                                    globs: extensions.asNoBraceGlobstars([
                                        ...extensions.byDevGroup.cJavaScript, //
                                        ...extensions.byDevGroup.cJavaScriptReact,
                                    ]),
                                    fallthrough: false,
                                },
                                {
                                    type: 'Text',
                                    globs: extensions.asNoBraceGlobstars(
                                        [...extensions.byVSCodeLang.codeTextual].filter(
                                            (ext) =>
                                                ![
                                                    ...extensions.byDevGroup.sJavaScript, //
                                                    ...extensions.byDevGroup.sJavaScriptReact,

                                                    ...extensions.byDevGroup.mJavaScript,
                                                    ...extensions.byDevGroup.mJavaScriptReact,

                                                    ...extensions.byDevGroup.cJavaScript,
                                                    ...extensions.byDevGroup.cJavaScriptReact,

                                                    ...extensions.byCanonical.wasm,
                                                    ...extensions.byDevGroup.allTypeScript,
                                                    // Omit TypeScript also, because it causes Wrangler to choke. Apparently, Wrangler’s build system incorporates TypeScript middleware files.
                                                    // Therefore, we omit all TypeScript such that Wrangler’s build system can add TS files without them inadvertently being classified as text by our rules.
                                                    // We don’t expect TypeScript to be present in our `./dist` anyway, so this is harmless, and probably a good idea in general to omit TypeScript here.
                                                ].includes(ext),
                                        ),
                                    ),
                                    fallthrough: false,
                                },
                                {
                                    type: 'Data',
                                    globs: extensions.asNoBraceGlobstars(
                                        [...extensions.byVSCodeLang.codeTextBinary].filter(
                                            (ext) =>
                                                ![
                                                    ...extensions.byDevGroup.sJavaScript, //
                                                    ...extensions.byDevGroup.sJavaScriptReact,

                                                    ...extensions.byDevGroup.mJavaScript,
                                                    ...extensions.byDevGroup.mJavaScriptReact,

                                                    ...extensions.byDevGroup.cJavaScript,
                                                    ...extensions.byDevGroup.cJavaScriptReact,

                                                    ...extensions.byCanonical.wasm,
                                                    ...extensions.byDevGroup.allTypeScript,
                                                ].includes(ext),
                                        ),
                                    ),
                                    fallthrough: false,
                                },
                                { type: 'CompiledWasm', globs: extensions.asNoBraceGlobstars([...extensions.byCanonical.wasm]), fallthrough: false },
                            ],
                            // Custom build configuration.

                            build: {
                                cwd: './' + path.relative(projDir, './'),
                                watch_dir: './' + path.relative(projDir, './src'),
                                command: 'npx @clevercanyon/madrun build --mode=prod',
                            },
                            // Worker sites; i.e., bucket configuration.

                            site: {
                                bucket: './' + path.relative(projDir, './dist/assets'),
                                exclude: [
                                    ...$path.defaultNPMIgnores(),
                                    '/a16s', // A16s (top-level only).
                                ],
                            },
                            // Worker service bindings.

                            ...('hop-gdn-utilities' !== settings.defaultWorkerName
                                ? {
                                      services: {
                                          binding: 'UT',
                                          service: 'hop-gdn-utilities',
                                          environment: 'production',
                                      },
                                  }
                                : {}),
                            // Worker route configuration.

                            route: {
                                zone_name: settings.defaultWorkerZoneName,
                                pattern: settings.defaultWorkersDomain + '/' + settings.defaultWorkerShortName + '/*',
                            },

                            // `$ madrun wrangler dev` settings.
                            dev: {
                                local_protocol: settings.defaultLocalProtocol,
                                ip: settings.defaultLocalIP, // e.g., `0.0.0.0`.
                                port: Number(settings.defaultLocalPort),
                            },

                            // Environments used by this worker.
                            env: {
                                // `$ madrun wrangler dev` environment, for local testing.
                                dev: {
                                    route: {
                                        zone_name: settings.defaultLocalHostname,
                                        pattern: settings.defaultLocalHostname + '/' + settings.defaultWorkerShortName + '/*',
                                    },
                                    vars: settings.miniflareEnvVarAsObject,

                                    ...('hop-gdn-utilities' !== settings.defaultWorkerName
                                        ? {
                                              services: {
                                                  binding: 'UT',
                                                  service: 'hop-gdn-utilities',
                                                  environment: 'dev',
                                              },
                                          }
                                        : {}),
                                    build: {
                                        cwd: './' + path.relative(projDir, './'),
                                        watch_dir: './' + path.relative(projDir, './src'),
                                        command: 'VITE_WRANGLER_MODE=dev npx @clevercanyon/madrun build --mode=dev',
                                    },
                                },
                                // `$ madrun wrangler deploy --env=stage`.
                                stage: {
                                    route: {
                                        zone_name: settings.defaultWorkerZoneName,
                                        pattern: settings.defaultWorkersDomain + '/' + settings.defaultWorkerStageShortName + '/*',
                                    },
                                    ...('hop-gdn-utilities' !== settings.defaultWorkerName
                                        ? {
                                              services: {
                                                  binding: 'UT',
                                                  service: 'hop-gdn-utilities',
                                                  environment: 'stage',
                                              },
                                          }
                                        : {}),
                                    build: {
                                        cwd: './' + path.relative(projDir, './'),
                                        watch_dir: './' + path.relative(projDir, './src'),
                                        command: 'npx @clevercanyon/madrun build --mode=stage',
                                    },
                                },
                            },
                        }),
              }
            : {}),
    };

    /**
     * Composition.
     */
    return {
        ...baseConfig,
    };
};
