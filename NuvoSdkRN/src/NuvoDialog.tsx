
//layer
import React, {useRef, useState} from "react";
import {handlerPromise, parseUrlParam} from "./utils";
import {Button, DeviceEventEmitter, Dimensions, Linking, Platform, View} from "react-native";
import {getTokenFromCode} from "./api/auth";
import MyStorage from "./utils/myStorage";
import {PolisClient} from "@metis.io/middleware-client";
import {WebView} from "react-native-webview";
import {NuvoSdkAction,LayerProps,LoginParams,TransParams} from "./types";
import {platform} from "process";

var hadLoading = false;
const NuvoDialog =function (layerProps: LayerProps) {
    console.log('layer props2', layerProps)
    const webRef = useRef(null);
    const [openUrl, setOpenUrl] = useState('');
    const polisClientRef = useRef({});
    const listenUrlRef = useRef(null);

    const APP_ID = layerProps.data.appId;
    const apiHost = layerProps.data.apiHost;
    const oauthHost = layerProps.data.oauthHost;
    const RETURN_URL = 'nuvodapp://';
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
    const handleIfLoad = function (request:any) {
        // Only allow navigating within this website
        const url = request.url;
        const parseUrl = parseUrlParam(url);
        if (url.indexOf('wc') >= 0) {
            // let metaMaskUrl = 'metamask://wc?uri=' + encodeURIComponent(url);
            let metaMaskUrl = url;
            console.log('[wc] metaMask url', metaMaskUrl);
            Linking.openURL(metaMaskUrl);
            return false;
        }
        switch (layerProps.action) {
            case NuvoSdkAction.login:
                handleStepLogin(url);
                console.log("test test 111");

                return true;
                break;
            case NuvoSdkAction.transfer:
                break;
        }
        return true;
    };
    const handleStepLogin = async function (url: string) {
        //if get SCHEME_URL and code to login
        const parseUrl = parseUrlParam(url);
        console.log('[web] parse url', parseUrl);
        if (parseUrl.code) {
            // to login
            console.log('[auth] to login');
            const [err, res] = await getTokenFromCode({
                app_id: layerProps.data.appId,
                code: parseUrl.code,
                app_key: layerProps.data.appKey,
            },"");
            console.log('[auth]', err, res);
            layerProps.onCompleted &&
            layerProps.onCompleted({
                type: NuvoSdkAction.login,
                info: res.data.accessToken,
            });
            // must to storage asscessToken
            MyStorage._sava(MyStorage.keyMap.TOKEN, res.data.accessToken);
            console.log(
                '[storage] token',
                await MyStorage._load(MyStorage.keyMap.TOKEN),
            );
        }
    };
    const handleOpenWebView = async function (data:LoginParams) {
        let url: any = await handleToAuth(true);
        console.log("set open url:",url)
        // if(!hadLoading){
            hadLoading = true;
            setOpenUrl(url);
        // }
    };
    const handleToAuth = async function (onlyLink = false) {
        const switchAccount = true;
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
    const handleTransfer = async function (tx:TransParams){
        initPolisClient();
        const polisClient:any = polisClientRef.current;
        polisClient.connect(await MyStorage._load(MyStorage.keyMap.TOKEN));
        //test erc20
        let daiAddress = '0x70E45aD1d427532d8E7A86bC2037be0fd00e4829';
        let daiAbi = ['function transfer(address to,uint256 amount)'];
        let daiContract2 = polisClient.getContract(daiAddress, daiAbi);
        //
        let [err, res] = await handlerPromise(
            daiContract2.transfer(
                '0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4',
                1000000000000,
            ),
        );
        layerProps.onCompleted &&
        layerProps.onCompleted({
            action: NuvoSdkAction.transfer,
            info: res?res:err,
        });
        console.log('[sdk] contractPay', err, res);
    };

    const getInjectableJSMessage = function(message:any) {
        return `
          (function() {
            document.dispatchEvent(new MessageEvent('message', {
              data: ${JSON.stringify(message)}
            }));
          })();
        `;
    }
    const initPolisClient = function () {
        var opts = {
            appId: layerProps.data.appId,  // '611cc74139481700e8885bc5',
            chainId: layerProps.data.chainId,
            apiHost: layerProps.data.apiHost,
            authHost: layerProps.data.oauthHost,
            debug: false,
            openLink(link: any, data: any) {
                console.log('[sdk]', link, data);
                console.log('[sdk]', layerProps.data.oauthHost + '/#/oauth2/bridge', data);
                setOpenUrl(layerProps.data.oauthHost + '/#/oauth2/bridge');
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
        polisClientRef.current = new PolisClient(opts);
        // console.log('get polisClient', polisClientRef.current)
    };
    const handleOnMessage = function (data: any) {
        if (layerProps.action !== NuvoSdkAction.transfer) {
            return;
        }
        if (data.type === 'openLink' && Platform.OS === 'android') {
            Linking.openURL('MetaMask://');
        }
        // is old message of result
        if (data.data && data.status) {
            DeviceEventEmitter.emit('SDK_RESULT', data);
        }
    };
    switch (layerProps.action) {
        case NuvoSdkAction.login:
            handleOpenWebView(layerProps.data);
            break;
        case NuvoSdkAction.transfer:
            handleTransfer(layerProps.data);
            break;
    }
    const handleLoadEnd = function (syntheticEvent:any) {
        if (layerProps.action !== NuvoSdkAction.transfer) {
            return;
        }
        // to post
        // this to post data
        console.log('[event] web loaded');
        const {nativeEvent} = syntheticEvent;
        if (nativeEvent.url) {
            DeviceEventEmitter.emit('SDK_URL_LOADED');
        }
    };
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
                    javaScriptCanOpenWindowsAutomatically={true}
                    onLoadStart={handleWebLoadStart}
                    onLoadEnd={handleLoadEnd}
                    onOpenWindow={(syntheticEvent:any) => {
                        const {nativeEvent} = syntheticEvent;
                        const {targetUrl} = nativeEvent;
                        console.log('Intercepted OpenWindow for', targetUrl);
                    }}
                    originWhitelist={['*']}
                    source={{uri: openUrl}}
                    onShouldStartLoadWithRequest={handleIfLoad}
                    mixedContentMode={'always'}
                    onMessage={event => {
                        // console.log('receive message', event.nativeEvent.data)
                        let data = JSON.parse(event.nativeEvent.data);
                        console.log('[message] receive message', data);
                        handleOnMessage(data);
                    }}
                />
                <View>
                    <Button onPress={() => handleReload()} title="refresh reload" />
                </View>
            </View>
        </>
    );
};

export default NuvoDialog;