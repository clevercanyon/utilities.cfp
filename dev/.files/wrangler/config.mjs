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
import { $obj, $obp } from '../../../node_modules/@clevercanyon/utilities/dist/index.js';
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
     */
    const baseConfig = {
        // Compatibility settings.

        compatibility_date: settings.compatibilityDate,
        compatibility_flags: settings.compatibilityFlags,

        // Metric settings.

        send_metrics: settings.defaultSendMetricsEnable,

        // Upper limit on CPU time.

        limits: { cpu_ms: settings.defaultCPULimitTime },

        // Smart placement settings.

        placement: { mode: settings.defaultPlacementMode },

        // Local development settings.
        dev: {
            ip: settings.defaultLocalIP,
            host: settings.defaultLocalHostname,
            port: Number(settings.defaultLocalPort),
            local_protocol: settings.defaultLocalProtocol,
            upstream_protocol: settings.defaultUpstreamProtocol,
        },
        // Dev env, for automated or local testing.
        env: {
            dev: {
                ...(['cfp'].includes(targetEnv) && !['spa', 'mpa'].includes(appType)
                    ? {
                          assets: {
                              binding: 'ASSETS', // For `@clevercanyon/utilities.cfp/test`.
                              directory: './' + path.relative(projDir, settings.defaultPagesStaticDir),
                          },
                      }
                    : {}),
            }, // A `dev` key must exist for `@clevercanyon/utilities.(cfw|cfp)/test`,
            // even if it's simply an empty object. The environment just needs to exist.
        },
        // Bundling rules; {@see <https://o5p.me/JRHxfC>}.
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
                type: 'CompiledWasm', //
                globs: extensions.asNoBraceGlobstars([
                    ...extensions.byCanonical.wasm, //
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
        ],
    };

    /**
     * Defines worker config.
     */
    const workerConfig = {
        ...(['cma'].includes(appType) && ['cfw'].includes(targetEnv)
            ? {
                  // Worker account ID.

                  account_id: settings.defaultAccountId,

                  // Worker name.

                  name: settings.defaultWorkerName,

                  // Worker main entry file path.

                  main: './' + path.relative(projDir, settings.defaultWorkerMainEntryFile),

                  // Worker subdomains; i.e., `*.workers.dev`.

                  workers_dev: settings.defaultWorkersDevEnable,
                  preview_urls: settings.defaultWorkersDevPreviewURLsEnable,

                  // Worker observability for internal logging.

                  observability: {
                      enabled: settings.defaultWorkerObservabilityEnabled,
                      head_sampling_rate: settings.defaultWorkerObservabilityHeadSamplingRate,
                  },
                  // Worker logpush for external logging.

                  logpush: settings.defaultWorkerLogpush, // Requires paid plan.

                  // Worker default route.
                  route: {
                      zone_name: settings.defaultWorkerZoneName,
                      pattern: settings.defaultWorkersDomain + '/' + settings.defaultWorkerShortName + '/*',
                  },
                  // Worker environments.
                  env: {
                      // `$ madrun tests`, `$ madrun wrangler dev` environment for local testing.
                      dev: {
                          route: {
                              zone_name: settings.defaultLocalHostname,
                              pattern: settings.defaultLocalHostname + '/' + settings.defaultWorkerShortName + '/*',
                          },
                      },
                      // `$ madrun wrangler deploy --env=stage` environment.
                      stage: {
                          route: {
                              zone_name: settings.defaultWorkerZoneName,
                              pattern: settings.defaultWorkersDomain + '/' + settings.defaultWorkerStageShortName + '/*',
                          },
                      },
                  },
              }
            : {}),
    };

    /**
     * Defines pages config.
     */
    const pagesConfig = {
        ...(['spa', 'mpa'].includes(appType) && ['cfp'].includes(targetEnv)
            ? {
                  // Pages account ID.

                  account_id: settings.defaultAccountId,

                  // Pages project name.

                  name: settings.defaultPagesProjectName,

                  // Pages build output directory.

                  pages_build_output_dir: './' + path.relative(projDir, settings.defaultPagesBuildOutputDir),

                  // Pages environments.
                  env: {
                      // `$ madrun tests`, `$ madrun wrangler pages dev` environment for local testing.
                      dev: {}, // Nothing to add at this time.

                      // `$ madrun wrangler pages deploy --branch=(stage|!=production)` environment.
                      preview: {}, // Nothing to add at this time.
                  },
              }
            : {}),
    };

    /**
     * Composition.
     */
    return $obj.mergeDeep(baseConfig, workerConfig, pagesConfig);
};
