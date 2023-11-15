This is a Nuvo SDK react native

# Getting Started


##  1 install package

```bash

# OR using Yarn
yarn add  @nuvosphere.io/react-native-nuvo-sdk
# beta
yarn add  @nuvosphere.io/react-native-nuvo-sdk@beta

yarn add  "react-native-webview@12.1.0"

yarn add "@react-native-async-storage/async-storage@1.19.3"

yarn add  "react-native-modal-layer@1.0.8",

```
## 2 package.json
js package adapted to react-native

```json
{
  "script": {
    "postinstall": "rn-nodeify --install buffer,crypto,stream,util,process,vm,assert,bn --hack --yarn"
  }
}

```

## 3 APP.tsx
Use ModalLayers to wrap the outermost layer of the application
```tsx
import {ModalLayers} from 'react-native-modal-layer';

function App(): JSX.Element {
    return (
        <>
            <ModalLayers>
                xxxxx
            </ModalLayers>
        </>
    );
}
```

## RNNuvoSDK
### login
```js
Login(loginParams: LoginParams):Promise<any>;
```
### get token
```js
getAccessToken();
```

### Get user information
```js
getUserInfo();
```

### transfer
```js
transfer(tx:TransParams):Promise<any>;
```

### contract transfer
```js
contractTransfer(tx:ContractTransParams):Promise<any>;

```

### getBalance(params:Params)
```js
getBalance({address:"",chainId:599})
```
## Use Example


### For Android

```bash
function getBalance(){
        rnNuvoSdkRef.current.getBalance({"address":"0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4",chainId:599})
            .then((res: any) => {
                console.log("balance success:", res); // 1000000000000000000
                setBalance(res);
            })
            .catch((err: any) => {
                console.log("exec err:", err)
                setInfo(JSON.stringify(err));
            });
    }
  function handleToLogin() {
        rnNuvoSdkRef.current.Login({
            appId: APP_ID,
            appKey: APP_KEY,
            switchAccount:false
        }).then((res: any) => {
            console.log("login success:", res);setToken
            setToken(res);
        }).catch((err: any) => {
            console.log("exec err:", err)``
            setToken(JSON.stringify(err));
        });
    }

    function getUserInfo() {
        rnNuvoSdkRef.current.getUserInfo().then((res: any) => {
            console.log("getUserInfo success:", res);
            setUserInfo(JSON.stringify(res));
        });
    }

    function handleToTransfer() {
        rnNuvoSdkRef.current.transfer({
            "from": "0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4",
            "to": "0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4",
            "value": "1000000000000",
            "data": "0x",
            "chainId": 599
        }).then((res: any) => {
            console.log("transfer success:", res);
            setInfo(JSON.stringify(res));
        })
            .catch((err: any) => {
                console.log("exec err:", err)
                setInfo(JSON.stringify(err));
            });
        ;
    }

    function handleToContractTransfer() {
        rnNuvoSdkRef.current.contractTransfer({
            "contractAddress": "0x70E45aD1d427532d8E7A86bC2037be0fd00e4829",
            "ABI": "function transfer(address to,uint256 amount)",
            "method": "transfer",
            "args": ['0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4', '100000000000'],
            "chainId": 599
        }).then((res: any) => {
            console.log("handleToContractTransfer success:", res);
            setInfo(JSON.stringify(res));
        })
            .catch((err: any) => {
                console.log("exec err:", err)
                setInfo(JSON.stringify(err));
            });
    }

    return (
        <>
            <ModalLayers>
                <View>
                    <Button title="to Login" onPress={() => handleToLogin()}/>
                    <Text>token: {token}</Text>
                    {token && (
                        <>
                            <Button
                                onPress={() => handleToContractTransfer()}
                                title=" contract Payable Method"
                            />
                            <Text>result: {info}</Text>
                            <Button
                                onPress={() => handleToTransfer()}
                                title=" transfer Method"
                            />
                            <Text>result: {info}</Text>
                        </>

                    )}
                    <Button title="Get User Info" onPress={() => getUserInfo()}/>
                    <Text>user info:{userInfo}</Text>
                    <RNNuvoSDK
                        ref={rnNuvoSdkRef}
                        appId={APP_ID}
                        apiHost={API_HOST}
                        oauthHost={OAUTH_URL}
                    >
                    </RNNuvoSDK>
                </View>
            </ModalLayers>
        </>
    );
```
