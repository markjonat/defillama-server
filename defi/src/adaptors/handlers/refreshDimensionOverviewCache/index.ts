import { AdapterType } from "@defillama/dimension-adapters/adapters/types";
import { getCachedResponseOnR2 } from "../../utils/storeR2Response";
import { getOverviewCachedResponseKey, IGetOverviewResponseBody, getExtraTypes, DEFAULT_CHART_BY_ADAPTOR_TYPE } from "../getOverviewProcess"
import invokeLambda from "../../../utils/shared/invokeLambda";

// -> /overview/{type}/{chain}
export const handler = async (): Promise<undefined> => {
    // Go over all types
    const res = await Promise.all(Object.values(AdapterType).map(async type => {
        return Promise.all([DEFAULT_CHART_BY_ADAPTOR_TYPE[type], ...getExtraTypes(type)].map(async dataType => {
            // Try to get current cached response
            const key = getOverviewCachedResponseKey(
                type,
                undefined,
                dataType,
                undefined,
                String(false)
            )
            let response = await getCachedResponseOnR2<IGetOverviewResponseBody>(key).catch(e => console.error(`Unable to retrieve cached response for ${type}...`, e))
            // Initializing chains to update array (undefined = all)
            const allChains = [undefined] as (string | undefined)[]
            // If already cached response has been found, add all chains to list of chains
            if (response) allChains.push(...allChains)
            // If not, it will update chain=all so next execution all available chains will be known
            else console.info("Response not found, generating for all chains...")
            // Go through all chains + cache overview response
            return Promise.all(allChains.map((chain) => {
                console.log("Invoking", key)
                return invokeLambda("defillama-prod-getOverviewProcess", {
                    pathParameters: { chain: chain, type: type }
                })
            }))
        }))
    }))
    console.info(JSON.stringify(res))
    return undefined
};

export default handler;
