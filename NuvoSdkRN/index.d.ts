
import {TransParams,LoginParams,ContractTransParams} from "./src/types"
import React from "react";

export {TransParams,LoginParams,ContractTransParams}

declare class NuvoSdkRN extends React.Component {
    constructor(props: {
        appId: string;
        apiHost: string;
        oauthHost: string;
        chainId?:number;
    });
    Login(loginParams: LoginParams):Promise<any>;
    getUserInfo();
    transfer(tx:TransParams):Promise<any>;
    contractTransfer(tx:ContractTransParams):Promise<any>;
    getAccessToken();
}
export default NuvoSdkRN;