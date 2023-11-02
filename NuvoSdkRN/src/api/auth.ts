import http from "../utils/httpRequest";
/**
 * token
 * @param params
 * @param oauthHost
 */
export   function getTokenFromCode(params: {
    'app_id': string;
    'app_key': string;
    'code': string
  },oauthHost:string) {
    return http.request({
        baseURL:oauthHost,
      url: '/api/v1/oauth2/access_token',
      method: 'get',
      params
    })
  }