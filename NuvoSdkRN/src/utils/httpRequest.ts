import axios from 'axios'
import { handlerPromise } from './index';
import MyStorage from './myStorage';
// import { getDvaApp } from 'umi';
// import ENCookies from 'cUtils/GCookies';
// import Message from './Message'
// import {getChainInfo} from 'cConfig/chain'
// const TokenKey = ENCookies.TokenKey;
const CancelToken = axios.CancelToken;
type AdvOptions = {
  canAutoToast?: boolean;
  fullLoading?: boolean;
  cantBeInterrupt?: boolean;
  skipResponseInter?: boolean;
  checkLogin?:boolean;
}
const defaultAdvOptions = {
  canAutoToast: true, // auto toasts
  fullLoading: false, // full loading
  cantBeInterrupt: false, // can not interrupt
  skipResponseInter: false, //
  checkLogin:false,
};

class HttpRequest {
  queue: { [propName: string]: any; };
  loadingQueue: { [propName: string]: any; };
  cancelHttp: [];
  dispatch: any;
  constructor() {
    this.queue = {};
    this.loadingQueue = {}; // loading queue
    this.cancelHttp = []; // inter queue
    this.dispatch = null;
  }
  /**
   * Process uploaded data by default
   * @param options
   */
  combineData(options: {}) {
  }
  // Custom Spin
  mySpinShow() {
    // this.dispatch({type: 'app/setLoading', payload: true})
  }
  // Two error modes 1.Server return error 2.The server is not responding[There are two types: one is that the server is not responding, One is beyond 200]
  interceptors(instance: { interceptors: any }, url: string, advOptions: AdvOptions) {
    // Request to intercept
    instance.interceptors.request.use(
      async(config: any) => {
        const self = this
        // this.dispatch = getDvaApp()._store.dispatch
        // Loading of the global... The interface is invoked only if it is enabled
        if (advOptions.fullLoading) {
          this.loadingQueue[url] = true
          this.mySpinShow()
        }
        this.queue[url] = true
        // has token
        const token = await MyStorage._load(MyStorage.keyMap.TOKEN)
        if (token) {
          config.headers['Access-Token'] = `${token}`
          config.headers['Authorization'] = `${token}`
        } else {
        }
         // add chain id to header
         config.headers['chainid'] = 599
        // Used to request a queue interrupt
        if (!advOptions.cantBeInterrupt) {
          config.cancelToken = new CancelToken((c) => {
            // console.log('[axios] regiest cancel', self.cancelHttp)
            if (self.cancelHttp.length >= 10) {
              self.cancelHttp.shift()
            }
            // @ts-ignore
            self.cancelHttp.push(c)
          })
        }
        return config
      },
        (error: any) => {
        // do something with request error
        return Promise.reject(error)
      }
    )
    // The response to intercept
    instance.interceptors.response.use(
        (response: { data: {[propName: string]:any}; }) => {
        let self = this
        // Destroys a URL in the queue
        this.destroy(url, advOptions)
        const res:any = response?.data ?? ''
        if (!advOptions.skipResponseInter) res.url = url
          // Skip the default response interceptor but there may be an error, and when an error occurs there is still a uniform structure, so determine whether status exists
        if (advOptions.skipResponseInter && !res) {
          return Promise.resolve(res)
        }
        //  res.status.code === 200 is success
        if (res.code !== 200 && res.code !== undefined) {
            console.warn(`[ajax] code:${res.code},url:${url},${JSON.stringify(res)}`)
          // Check whether system error messages are displayed automatically based on parameters
          const loginState = (res.code === 450 || res.code === 454 || res.code === 20009||res.code===401||res.code===20026 || res.code === 402)
          if (advOptions.canAutoToast && !loginState) {
            // System error pop-up window
            // Message.error(res.msg || 'Error')
          }
          // 450
          // 454
          if (loginState) {
            this.interrupt()
            // if(ENV !== 'prod') {
            //   console.log(`request url:${url} token unvalid.`)
            // }
            self.dispatch({type: 'user/resetToken'})
            if(advOptions.canAutoToast){
            //   Message.error('please connect your wallet first')
            }
            if(advOptions.checkLogin){
            //   window.location.href = '/'
            }
          }
          // 403
          if (res.code === 403) {
            this.interrupt()
            // router.replace({ path: '/401' })
          }
          return Promise.reject(res)
        } else {
          return Promise.resolve(res)
        }
      },
        (error: string) => {
        //   if(ENV !== 'prod') {
        //     console.log('[err]' + error + ';[url]' + url) // for debug
        //   }
        this.destroy(url, advOptions)
        if (advOptions.canAutoToast && !axios.isCancel(error)) {
        //   Message.error(error?.message ?? error)
        }
        return Promise.reject(error)
      }
    )
  }

  destroy(url: string, advOptions: AdvOptions) {
    delete this.queue[url]
    if(advOptions.fullLoading) {
      delete this.loadingQueue[url]
      this.dispatch({type: 'app/setLoading', payload: false})
    }
  }

  getInsideConfig() {
    const config = {
      baseURL: 'https://api.nuvosphere.io', // url = base url + request url
      withCredentials: false, // send cookies when cross-domain requests
      headers: {
        // 'Content-Type': 'application/json'
      },
      timeout: 60000 // request timeout
    }
    return config
  }

  /**
   *
   * @param {Object} options
   * @param {Object} advOptions
   * @param {Boolean} advOptions.canAutoToast
   * @param {Boolean} advOptions.fullLoading  loading
   * @param {Boolean} advOptions.cantBeInterrupt
   * @param {Boolean} advOptions.skipResponseInter
   * @param {Boolean} hasHandle promise
   * @returns {*}
   */
  request(options:any, advOptions?: AdvOptions, hasHandle= true) {
    console.log('[axios] request')
    this.combineData(options)
    advOptions = Object.assign({}, defaultAdvOptions, advOptions)
    const instance = axios.create()
    options = Object.assign(this.getInsideConfig(), options)
    this.interceptors(instance, options.url, advOptions)
    if (hasHandle) {
      return handlerPromise(instance(options))
    } else {
      return instance(options)
    }
  }
  /**
   *
   */
  interrupt() {
    const httpLength = this.cancelHttp.length ?? 0
    if (httpLength > 0) {
      console.log('[axios] cancel', httpLength)
      this.cancelHttp.forEach((item:any) => {
        item('axios:interrupt')
      })
      this.cancelHttp = []
    }
  }
}

const http = new HttpRequest()
export default http
