/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {JSX,useEffect, useRef, useState} from 'react';
import {
    Button,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from 'react-native';

import {
    Colors,
} from 'react-native/Libraries/NewAppScreen';
import RNNuvoSDK from "@nuvosphere.io/react-native-nuvo-sdk";
import {API_HOST, OAUTH_URL, APP_ID, APP_KEY} from "./config";
import {ModalLayers} from 'react-native-modal-layer';
import AsyncStorage from "@react-native-async-storage/async-storage";

function App(): JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const rnNuvoSdkRef = useRef<RNNuvoSDK>(null);

    const [token, setToken] = useState('');
    const [info, setInfo] = useState('');
    const [userInfo, setUserInfo] = useState('');

    const backgroundStyle = {
        backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    }

    useEffect(() => {
        // @ts-ignore
        async function getToken() {
            if (rnNuvoSdkRef.current) {
                const token = await rnNuvoSdkRef.current.getAccessToken();
                setToken(token);
            }
        }

        getToken();
    }, []);

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
}

const styles = StyleSheet.create({
    sectionContainer: {
        marginTop: 32,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
    },
    sectionDescription: {
        marginTop: 8,
        fontSize: 18,
        fontWeight: '400',
    },
    highlight: {
        fontWeight: '700',
    },
});

export default App;
