//@ts-check
import {
    Text,
    Linking,
    View,
    Dimensions,
    DeviceEventEmitter, Platform, Button,
} from 'react-native';
import React, {useEffect, useState, useRef} from 'react';
import MyStorage from './utils/myStorage';

import {getDappInfo, httpUserInfo} from './api/dapp';
import {ModalLayerController, ModalLayerFactory, ModalLayers} from "react-native-modal-layer";
import {ContractTransParams, LayerProps, LoginParams, NuvoSdkAction, Params, TransParams} from "./types";
import {handlerPromise, parseUrlParam} from "./utils";
import {getTokenFromCode} from "./api/auth";
import {PolisClient} from "@metis.io/middleware-client";
import {WebView} from "react-native-webview";
// import {BN} from 'react-native-bignumber';

export default class RNNuvoSDK extends React.Component {

    clientOpts: any;
    // eventOnCompleted: (data: any) => {};
    layer: ModalLayerController | null = null;
    state = {
        accessToken: '',
        webRef: View,
        listenUrlRef: null,
        OpenUrl: '',
        result: '',
        userInfo: null
    };

    constructor(props: {
        appId: string;
        apiHost: string;
        oauthHost: string;
        chainId?: number;
    }) {
        super(props);
        if (!props.appId) {
            throw new Error('Missing required parameter: chainId');
        }
        this.clientOpts = props;
        // this.initPolisClient(props)
    }

    componentDidMount() {
        MyStorage._getStorage();
        console.log("componentDidMount")
        this.layer = ModalLayerFactory.create(NuvoDialog);

    }

    componentWillUnmount() {
        // ModalLayerFactory.delete(this.state.layer)
    }

    async getAccessToken() {
        if (this.state.accessToken) {
            return
            return this.state.accessToken;
        } else {
            const token = await MyStorage._load(MyStorage.keyMap.TOKEN);
            return token ? token : null;
        }
    }

    _handleInfo(obj: any) {
        this.layer?.hide();
        switch (obj.type) {
            case NuvoSdkAction.login:
                this.setState({"accessToken": obj.info});
                break;
            case NuvoSdkAction.transfer:
                // setInfo(JSON.stringify(obj.info));
                break;
        }
    };

    // open login window
    Login(loginParams: LoginParams) {
        const params = Object.assign({}, this.clientOpts, loginParams);
        if (!loginParams.appId || !loginParams.appKey) {
            throw Error("no appid or appkey");
        }

        return new Promise((resolve, reject) => {
            const refThis = this;
            this.layer?.show({
                action: NuvoSdkAction.login,
                data: params,
                onCompleted: function (res: any) {
                    // console.log("login completed:", res);
                    if (res.error) {
                        reject(res.error)
                    } else {
                        resolve(res.info)
                    }
                    refThis.layer?.hide();
                }
            });
        });
    };

    // method
    async getUserInfo() {
        const token = await MyStorage._load(MyStorage.keyMap.TOKEN);
        const [err, res] = await httpUserInfo(token, this.clientOpts.apiHost);
        return [err, res]
    };

    contractTransfer(tx: ContractTransParams) {
        tx = Object.assign(tx, {
            appId: this.clientOpts.appId,
            apiHost: this.clientOpts.apiHost,
            oauthHost: this.clientOpts.oauthHost,
        })
        return new Promise((resolve, reject) => {
            const refThis = this;
            this.layer?.show({
                action: NuvoSdkAction.contract_transfer, onCompleted: function (res: any) {
                    // console.log("contractTransfer completed:", res);
                    if (res.error) {
                        reject(res.error)
                    } else {
                        resolve(res.info)
                    }
                    refThis.layer?.hide();
                }, data: tx
            });
        });
    }

    getBalance(params: Params) {
        const refThis = this;
        refThis.layer?.hide();
        return new Promise((resolve, reject) => {
            const refThis = this;
            this.layer?.show({
                action: NuvoSdkAction.balanceOf, onCompleted: function (res: any) {
                    // console.log("contractTransfer completed:", res);
                    if (res.error) {
                        reject(res.error)
                    } else {
                            const value = res.info.toString()
                            console.log("value:",value);
                            resolve(value);
                    }

                }, data: params
            });
        });
    }

    transfer(tx: TransParams) {
        tx = Object.assign(tx, {
            appId: this.clientOpts.appId,
            apiHost: this.clientOpts.apiHost,
            oauthHost: this.clientOpts.oauthHost,
        })
        return new Promise((resolve, reject) => {
            const refThis = this;
            this.layer?.show({
                action: NuvoSdkAction.transfer, onCompleted: function (res: any) {
                    console.log("transfer completed:", res);
                    if (res.error) {
                        reject(res.error)
                    } else {
                        resolve(res.info)
                    }
                    refThis.layer?.hide();
                }, data: tx
            });
        });
    };

    render() {
        return (
            <>
                {/*<Text>token: {this.state.accessToken}</Text>*/}
                {/*<Text>result: {this.state.result}</Text>*/}
                {/*<Text>user info:{this.state.userInfo}</Text>*/}
            </>
        );
    }


}


const NuvoDialog = function (layerProps: LayerProps) {
    console.log('layer props', layerProps)
    const webRef = useRef(null);
    const [openUrl, setOpenUrl] = useState('');
    const polisClientRef = useRef({});
    const listenUrlRef = useRef(null);
    const [token, setToken] = useState('');
    const [webLoadError, setWebLoadError] = useState(false);
    const [blankUrl, setBlankUrl] = useState('about:blank');
    const APP_ID = layerProps.data.appId;
    const apiHost = layerProps.data.apiHost;
    const oauthHost = layerProps.data.oauthHost;
    const RETURN_URL = 'nuvodapp://';

    //when load resource event:onLoadStart
    const handleWebLoadStart = async function (syntheticEvent: any) {
        let url = syntheticEvent.nativeEvent.url;
        console.log('[web] load start:', url);
        switch (layerProps.action) {
            case NuvoSdkAction.login:
                break;
            case NuvoSdkAction.transfer:
                break;
        }
    };
    //after onLoadStart event:onShouldStartLoadWithRequest return true/false
    const handleShouldLoadRequest = function (request: any) {
        // Only allow navigating within this website
        const url = request.url;
        console.log('[web] should load:', url);
        // const parseUrl = parseUrlParam(url);
        if (url.indexOf('wc') >= 0) {
            let metaMaskUrl = url;
            if (Platform.OS === 'android') {
                metaMaskUrl = 'metamask://wc?uri=' + encodeURIComponent(url);
            }
            console.log('[wc] metaMask url', metaMaskUrl);
            Linking.openURL(metaMaskUrl);
            return false;
        }

        switch (layerProps.action) {
            case NuvoSdkAction.login:
                handleStepLogin(url);
                return false;
                break;
            case NuvoSdkAction.transfer:
                break;
        }
        return true;
    };
    //go login
    const handleStepLogin = async function (url: string) {
        //if get SCHEME_URL and code to login
        const parseUrl = parseUrlParam(url);
        if (parseUrl.code) {
            // to login
            console.log("oauth host:", oauthHost)
            const [err, res] = await getTokenFromCode({
                app_id: layerProps.data.appId,
                code: parseUrl.code,
                app_key: layerProps.data.appKey,
            }, apiHost);
            //
            console.log('[auth]', err, res);
            if (res) {
                layerProps.onCompleted &&
                layerProps.onCompleted({
                    action: NuvoSdkAction.login,
                    info: res.data.accessToken,
                    error: err
                });
                // must to storage asscessToken
                MyStorage._sava(MyStorage.keyMap.TOKEN, res.data.accessToken);

                return res.data.accessToken;
            }
            layerProps.onCompleted &&
            layerProps.onCompleted({
                action: NuvoSdkAction.login,
                info: '',
                error: 'unkown err'
            });
            return null;
            setOpenUrl(blankUrl);
        }
        return null;

    };
    const handleOpenWebView = async function (data: LoginParams) {
        let url: any = await getAuthUrl(data, true);
        console.log("set open url:", url)
        // if(!hadLoading){
        // hadLoading = true;
        setOpenUrl(url);
        // }
    };
    const getAuthUrl = async function (loginParams: LoginParams, onlyLink = false) {
        const switchAccount = loginParams.switchAccount;
        const appId = APP_ID;
        const authUrl = `${oauthHost}/#/oauth2-login?return_url=${encodeURIComponent(
            RETURN_URL + APP_ID,
        )}&switch_account=${switchAccount}&app_id=${appId}`;
        console.log('[link] open link:', authUrl);
        if (onlyLink) {
            return authUrl;
        }
        let [err, res] = await handlerPromise(Linking.openURL(authUrl));
        if (err) {
            console.log('[link] open err:', err);
            return false;
        }
        // be aroused
        Linking.getInitialURL()
            .then(url => {
                if (url) {
                    console.log('[link] be aroused:' + url);
                }
            })
            .catch(err => {
                console.warn('[link] arouse err:', err);
            });
    };

    const handleReload = function () {
        webRef?.current.reload();
    };
    const getInjectableJSMessage = function (message: any) {
        return `
          (function() {
            document.dispatchEvent(new MessageEvent('message', {
              data: ${JSON.stringify(message)}
            }));
          })();
        `;
    }
    const sdkClientError = function (err: any) {
        console.log('[sdk] error', err);
    }
    const sdkClientDebugLog = function (res: any) {
        console.log('[sdk] debug', res);
    }

    const checkIsNotTransfer = function () {
        return layerProps.action !== NuvoSdkAction.transfer && layerProps.action !== NuvoSdkAction.contract_transfer;
    }
    const handleOnMessage = function (data: any) {
        if (!checkIsNotTransfer()) {
            return;
        }
        if (data.type === 'openLink' && Platform.OS === 'android') {
            Linking.openURL('MetaMask://');
        }
        // is old message of result
        if ((data.data && data.status) || data.message) {
            DeviceEventEmitter.emit('SDK_RESULT', data);
        }
    };

    const handleLoadEnd = function (syntheticEvent: any) {
        console.log('[web] load end ', layerProps.action);
        if (checkIsNotTransfer()) {
            return;
        }
        // to post
        // this to post data

        const {nativeEvent} = syntheticEvent;
        if (nativeEvent.url) {
            DeviceEventEmitter.emit('SDK_URL_LOADED');
        }
        console.log('[web] load end emit ', nativeEvent.url);
        // webRef.current.clearCache(true);
    };

    const handleError = function () {
        console.log('[web] load error');
        setWebLoadError(true)
    }
    const initPolisClient = function () {
        console.log("initPolisClient:", layerProps)
        var opts = {
            appId: layerProps.data.appId,  // '611cc74139481700e8885bc5',
            chainId: layerProps.data.chainId,
            apiHost: layerProps.data.apiHost,
            oauthHost: layerProps.data.oauthHost,
            debug: false,
            openLink(link: any, data: any, walletType: string) {
                // console.log('[sdk]', layerProps.data.oauthHost + '/#/oauth2/bridge', data);
                const urlObj = new URL(link);
                // console.log("urlObj:", urlObj.searchParams);
                const searchParams = urlObj.searchParams;
                //
                searchParams.append("client", "reactapp");
                link = urlObj.toString();
                console.log('[sdk]', link, data);
                setOpenUrl(link);
                listenUrlRef.current = DeviceEventEmitter.addListener(
                    'SDK_URL_LOADED',
                    () => {
                        const message = JSON.stringify(data);
                        console.log('[web] postmessage', JSON.stringify(data));
                        // webRef.current.postMessage(JSON.stringify(data),'*');
                        const script = getInjectableJSMessage(message);
                        webRef.current?.injectJavaScript(script);
                        listenUrlRef.current?.remove();
                    },
                );
                return new Promise((resolve, reject) => {
                    // this if getMessage by Result must handle
                    DeviceEventEmitter.addListener('SDK_RESULT', data => {
                        if (
                            data.status === 'ERROR' ||
                            data.status === 'DECLINE' ||
                            data.status === 'FAILED'
                        ) {
                            reject(data);
                        } else {
                            layerProps.onCompleted &&
                            layerProps.onCompleted({
                                type: NuvoSdkAction.transfer,
                                info: JSON.stringify(data),
                            });
                            resolve(data);
                        }
                    });
                });
            },
        };
        console.log("client opts:", opts);

        var client = new PolisClient(opts);
        client.on('error', sdkClientError);
        // client.on('debug', sdkClientDebugLog);
        // client.on('tx-confirm-dialog', (data:any) => {
        //     console.log('[sdk] tx-confirm-dialog',data);
        // })
        // client.on('tx-confirm', (data:any) => {
        //     console.log('[sdk] connected',data);
        // })
        polisClientRef.current = client;
        // console.log('get polisClient', polisClientRef.current)
    };

    const handleTransfer = async function (tx: TransParams) {
        initPolisClient();
        const polisClient: any = polisClientRef.current;
        await polisClient.connect(await MyStorage._load(MyStorage.keyMap.TOKEN));
        const value = '0x' + BigInt(tx.value).toString(16);
        console.log("transfer tx:", tx, value);

        let [err, res] = await handlerPromise(polisClient.web3Provider.getSigner().sendTransaction({
            "from": tx.from,
            "to": tx.to,
            "value": value,
            "data": tx.data
        }))

        layerProps.onCompleted &&
        layerProps.onCompleted({
            action: NuvoSdkAction.transfer,
            info: res,
            error: err,
        });
        console.log('[sdk] handleTransfer', err, res);
        // setOpenUrl(blankUrl);
    };

    const handleContractTransfer = async function (tx: ContractTransParams) {
        initPolisClient();
        const polisClient: any = polisClientRef.current;
        await polisClient.connect(await MyStorage._load(MyStorage.keyMap.TOKEN));
        //test erc20
        let daiAddress = tx.contractAddress;
        // let daiAbi = ['function transfer(address to,uint256 amount)'];
        let daiAbi = [tx.ABI];
        let daiContract2 = polisClient.getContract(daiAddress, daiAbi);
        //
        let [err, res] = await handlerPromise(
            daiContract2[tx.method](...tx.args)
        );
        layerProps.onCompleted &&
        layerProps.onCompleted({
            action: NuvoSdkAction.contract_transfer,
            info: res,
            error: err
        });
        console.log('[sdk] ContractTransfer', err, res);
    };
    const getBalance = async function (params: Params) {
        initPolisClient();
        const polisClient: any = polisClientRef.current;
        let [err, res] = await handlerPromise(
            polisClient.web3Provider.getBalance(params.address)
        )
        layerProps.onCompleted &&
        layerProps.onCompleted({
            action: NuvoSdkAction.balanceOf,
            info: res,
            error: err
        });
    }

    switch (layerProps.action) {
        case NuvoSdkAction.login:
            handleOpenWebView(layerProps.data);
            break;
        case NuvoSdkAction.transfer:
            handleTransfer(layerProps.data);
            break;
        case NuvoSdkAction.contract_transfer:
            handleContractTransfer(layerProps.data);
            break;
        case NuvoSdkAction.balanceOf:
            getBalance(layerProps.data);
            break;
    }
    useEffect(() => {
        MyStorage._getStorage();
    }, []);
    return (
        <>
            <View
                style={{
                    width: Dimensions.get('screen').width * 0.9,
                    flex: 0.8,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                <WebView
                    style={{width: Dimensions.get('screen').width * 0.9, flex: 1}}
                    ref={webRef}
                    key={new Date().getTime()}
                    cacheEnabled={false}
                    startInLoadingState={true}
                    androidCacheMode="LOAD_NO_CACHE"
                    javaScriptCanOpenWindowsAutomatically={true}
                    onLoadStart={handleWebLoadStart}
                    onLoadEnd={handleLoadEnd}
                    onOpenWindow={(syntheticEvent: any) => {
                        const {nativeEvent} = syntheticEvent;
                        const {targetUrl} = nativeEvent;
                        console.log('Intercepted OpenWindow for', targetUrl);
                    }}
                    originWhitelist={['*']}
                    source={{uri: openUrl}}
                    onShouldStartLoadWithRequest={handleShouldLoadRequest}
                    mixedContentMode={'always'}
                    onMessage={event => {
                        // console.log('receive message', event.nativeEvent.data)
                        let data = JSON.parse(event.nativeEvent.data);
                        console.log('[message] receive message', data);
                        handleOnMessage(data);
                    }}
                    onError={handleError}
                    renderError={(errorDomain: string, errorCode: number, errorDesc: string) => {
                        if (webLoadError) {
                            return (
                                <View>
                                    <Text>Load Fail,Please retry.</Text>
                                </View>
                            );
                        }
                    }}
                />
                <View>
                    <Button onPress={() => handleReload()} title="refresh reload"/>
                </View>
            </View>
        </>
    );
};
