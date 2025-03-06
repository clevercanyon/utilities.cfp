/**
 * Test utilities.
 */

import '#@initialize.ts';

import { $cfp } from '#index.ts';
import { $app, $http, $json, type $type } from '@clevercanyon/utilities';
import { cfw } from '@clevercanyon/utilities.cfw';
import { createPagesEventContext, waitOnExecutionContext } from 'cloudflare:test';

/**
 * Tests a function in a request context.
 *
 * @param fn Test function.
 */
export const rc = async (fn: (rcData: $cfp.RequestContextData) => Promise<unknown>) => {
    const { Request } = cfw,
        pages = {
            ctx: createPagesEventContext({
                data: {},
                params: {},
                request: new Request($app.baseURL(), {
                    cf: { httpProtocol: 'HTTP/2' }, // An "incoming" request type.
                }) as $type.cfw.Request<unknown, $type.cfw.IncomingRequestCfProperties>,
            }) as $cfp.ExecutionContext, // As our own execution context flavor.

            onRequest: async (ctx: $cfp.ExecutionContext): Promise<$type.cfw.Response> => {
                return $cfp.handleFetchEvent({
                    ctx,
                    route: async (rcData: $cfp.RequestContextData): Promise<$type.cfw.Response> => {
                        return $http.prepareResponse(
                            rcData.request,
                            await $http.responseConfig({
                                enableCORs: false,
                                cacheVersion: 'none',
                                varyOn: [],

                                status: 200,
                                maxAge: 0,
                                headers: { 'content-type': $json.contentType() },
                                body: $json.stringify((await fn(rcData)) || {}),
                            }),
                        ) as Promise<$type.cfw.Response>;
                    },
                });
            },
        };
    const response = await pages.onRequest(pages.ctx),
        responseData = response.json(); // Reads response body.

    await waitOnExecutionContext(pages.ctx); // i.e., .waitUntil() calls.

    return responseData;
};
