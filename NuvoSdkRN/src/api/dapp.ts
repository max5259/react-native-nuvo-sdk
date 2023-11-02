import http from "../utils/httpRequest";
/**
 * dapp
 * @param params
 */
export function getDappInfo(params: {dapp_id: string|number}) {
    return http.request({
      url: `/api/v1/oauth2/nft/dapp/detail`,
      method: 'get',
      params
    }, {
      canAutoToast: false
    })
  }

/**
 * dapp
 * @param params
 */
export function httpUserInfo(token:any,baseURL:string){
    return http.request({
        url: `api/v1/oauth2/userinfo`,
        method: 'get',
        headers: {
            "access-token": token
        },
        baseURL: baseURL
    }, {
        canAutoToast: false
    });
}