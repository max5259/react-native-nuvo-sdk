
const NuvoSdkAction = {
    login: 'login',
    transfer: 'transfer',
    contract_transfer: 'contract_transfer',
};

interface TransParams {
    from:string,
    to:string,
    value:string,
    data:string,
    chainId:number,
    debug?: boolean;

}

interface ContractTransParams {
    contractAddress:string;
    method:string;
    ABI:string;
    args:any[];
    chainId:number,
    debug?: boolean;
}

interface LoginParams {
    appId: string;
    appKey:string;
    switchAccount?:boolean;
}

interface SdkProps {
    chainId: string;
    appId: string;
    apiHost: string;
    oauthHost: string;
    debug?: boolean;
}

interface LayerProps {
    action: string;
    onCompleted: (data: any) => {};
    data?: LoginParams | SdkProps | any;
}


export { NuvoSdkAction }
export type { TransParams,ContractTransParams, LoginParams, SdkProps, LayerProps };

