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
    };

    /**
     * Defines worker project config.
     */
    const workerProjectConfig = {
        ...(['cma'].includes(appType) && ['cfw'].includes(targetEnv)
            ? {
                  // Worker account ID.

                  account_id: settings.defaultAccountId,

                  // Worker name.

                  name: settings.defaultWorkerName,

                  // Worker main entry file path and rules.

                  main: './' + path.relative(projDir, settings.defaultWorkerMainEntryFile),
                  rules: settings.defaultWorkerRules,

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
     * Defines pages project config.
     */
    const pagesProjectConfig = {
        ...(['spa', 'mpa'].includes(appType) && ['cfp'].includes(targetEnv)
            ? {
                  // Pages project account ID.
                  //   Not supported by `$ madrun wrangler pages deploy`.
                  //   Instead, `account_id` is filled and cached by a CLI prompt.
                  // account_id: settings.defaultAccountId

                  // Pages project name.

                  name: settings.defaultPagesProjectName,

                  // Pages project build output directory.

                  pages_build_output_dir: './' + path.relative(projDir, settings.defaultPagesBuildOutputDir),

                  // Pages project should include source maps?

                  upload_source_maps: settings.defaultPagesUploadSourceMaps,

                  // Pages project environments.
                  //   We don't typically use separate environments for pages projects.
                  //   However, if the need arises (e.g., a desire to deploy a stage branch),
                  //   the following template and details will be very helpful when setting things up.
                  /* env: {
                      // `$ madrun tests`, `$ madrun wrangler pages dev` environment for local testing.
                      //   For pages projects, an explicit `dev` environment is not supported by `$ madrun wrangler pages deploy`.
                      //   The only valid environment keys are `production` and `preview`. So instead of `dev`, top-level keys are `dev` keys.
                      //   Remember, miniflare writes to local storage anyway, so having a separate `dev` environment is not 100% necessary.
                      //   What is necessary is that miniflare knows the names of the bindings we need, so it can populate those for tests.

                      // `$ madrun wrangler pages deploy` to production environment.
                      // production: {}, // If undefined, top-level keys are used for production.

                      // `$ madrun wrangler pages deploy --branch=[!=production]` environment.
                      // preview: {}, // If undefined, top-level keys are used for non-production branches.
                  }, */
              }
            : {}),
    };

    /**
     * Defines non-pages project test config.
     */
    const nonPagesProjectTestConfig = {
        // For non-pages projects, an `{ env: { dev: {} } }` key must exist for vitest `poolOptions.workers.wrangler.environment`.
        // An empty object is OK, so long as the key exists; i.e., so miniflare can find the environment we test with, which is `dev`.
        ...(!(['spa', 'mpa'].includes(appType) && ['cfp'].includes(targetEnv))
            ? {
                  env: {
                      dev: {
                          ...(['cfp', 'any'].includes(targetEnv) // For example, utilities or a library potentially targeting `cfp`.
                              ? // For non-pages projects, we need to explicitly define an assets binding for `@clevercanyon/utilities.cfp/test`.
                                {
                                    assets: {
                                        binding: 'ASSETS', // For `@clevercanyon/utilities.cfp/test`.
                                        directory: './' + path.relative(projDir, settings.defaultPagesAssetsDir),
                                    },
                                }
                              : {}),
                      },
                  },
              }
            : {}),
    };

    /**
     * Composition.
     */
    return $obj.mergeDeep(baseConfig, workerProjectConfig, pagesProjectConfig, nonPagesProjectTestConfig);
};
