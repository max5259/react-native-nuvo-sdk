export function handlerPromise(promise: Promise<any>): Promise<any>{
  return promise.then(data => [null, data]).catch(err => [err === '' ? 'no' : err])
}
export function parseUrlParam(url: string) {
  const param: any = {};
  const indexQuery = url.indexOf("?");
  if (indexQuery > 0) {
      url = url.substring(indexQuery + 1);
      if (url) {
          const arr = url.split("&");
          const arrLen = arr.length;
          
          for (let i = 0; i < arrLen; i++) {
              
              const indexEqual = arr[i].indexOf("=");
              if (indexEqual > 0) {
                  let val = arr[i].substring(indexEqual + 1);
                  if (i == arrLen - 1) {
                      const tmpIndex = val.indexOf("#/");
                      if (tmpIndex == 0) {
                          val = "";
                      } else if (tmpIndex > 0) {
                          val = val.substring(0, tmpIndex);
                      }
                  }
                  param[arr[i].substring(0, indexEqual)] = val;
              }
          }
      }
  }
  return param;
}