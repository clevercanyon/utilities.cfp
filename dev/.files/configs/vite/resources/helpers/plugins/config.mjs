/**
 * Plugins configuration.
 *
 * Vite is not aware of this config file's location.
 *
 * @note PLEASE DO NOT EDIT THIS FILE!
 * @note This entire file will be updated automatically.
 * @note Instead of editing here, please review <https://github.com/clevercanyon/skeleton>.
 *
 * @see https://vite.dev/config/shared-options.html#plugins
 */

import c10nBrandConfigPluginConfig from '../../plugins/c10n/brand-config/config.mjs';
import c10nCloudflareEmailPluginConfig from '../../plugins/c10n/cloudflare-email/config.mjs';
import c10nCloudflareSocketsPluginConfig from '../../plugins/c10n/cloudflare-sockets/config.mjs';
import c10nCloudflareWorkersPluginConfig from '../../plugins/c10n/cloudflare-workers/config.mjs';
import c10nCloudflareWorkflowsPluginConfig from '../../plugins/c10n/cloudflare-workflows/config.mjs';
import c10nHTMLTransformsPluginConfig from '../../plugins/c10n/html-transforms/config.mjs';
import c10nModulePreloadPluginConfig from '../../plugins/c10n/module-preload/config.mjs';
import c10nPostProcessingPluginConfig from '../../plugins/c10n/post-processing/config.mjs';
import c10nPreProcessingPluginConfig from '../../plugins/c10n/pre-processing/config.mjs';
import c10nSideEffectsPluginConfig from '../../plugins/c10n/side-effects/config.mjs';
import dtsPluginConfig from '../../plugins/dts/config.mjs';
import ejsPluginConfig from '../../plugins/ejs/config.mjs';
import mdxPluginConfig from '../../plugins/mdx/config.mjs';
import minifyPluginConfig from '../../plugins/minify/config.mjs';
import prefreshPluginConfig from '../../plugins/prefresh/config.mjs';
import unpluginIconsPluginConfig from '../../plugins/unplugin-icons/config.mjs';

/**
 * Configures plugins.
 *
 * @param   props Props from vite config file driver.
 *
 * @returns       Plugins configuration.
 */
export default async ({ mode, command, isSSRBuild, wranglerMode, env, staticDefs, appBaseURL, appType, targetEnv, inProdLikeMode, minifyEnable, prefreshEnable, pkgUpdates }) => {
    return {
        pluginsConfig: [
            await c10nSideEffectsPluginConfig({}),
            await c10nModulePreloadPluginConfig({ appType, isSSRBuild }),

            await unpluginIconsPluginConfig({}),
            await c10nBrandConfigPluginConfig({ mode, appBaseURL }),

            await c10nCloudflareEmailPluginConfig({ mode, command }),
            await c10nCloudflareSocketsPluginConfig({ mode, command }),
            await c10nCloudflareWorkersPluginConfig({ mode, command }),
            await c10nCloudflareWorkflowsPluginConfig({ mode, command }),
            // ... `cloudflare:test` provided by Vitest config.

            await mdxPluginConfig({}),
            await ejsPluginConfig({ mode, env }),
            await c10nHTMLTransformsPluginConfig({ staticDefs }),

            await minifyPluginConfig({ minifyEnable }),
            await dtsPluginConfig({ isSSRBuild }),

            await c10nPreProcessingPluginConfig({ command, isSSRBuild, appType }),
            await c10nPostProcessingPluginConfig({
                mode, wranglerMode, inProdLikeMode, command, isSSRBuild,
                env, appBaseURL, appType, targetEnv, staticDefs, pkgUpdates
            }), // prettier-ignore

            ...(prefreshEnable ? [await prefreshPluginConfig({})] : []),
        ],
    };
};
