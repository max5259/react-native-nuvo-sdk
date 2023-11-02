import http from "../utils/httpRequest";
/**
 *  polis dapp
 * @param data
 */
export function getDappInfoFromPolisApi(data: {dapp_id_list: any,nft_address_list: any}) {
    return http.request({
      url: `/api/v1/oauth2/nft/dapp/info-list`,
      method: 'post',
      data
    })
  }

  /**
   * 
   * @returns 
   */
export function getEstimateTrans(data:any) {
  return http.request({
    url: `api/rpc/v1`,
    method: 'post',
    data
  })
}