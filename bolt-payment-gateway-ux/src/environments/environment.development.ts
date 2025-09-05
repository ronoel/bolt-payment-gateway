export const environment = {
    production: false,
    applicationName: 'sBTC Paytment Gateway',
    network: "testnet", // 'mainnet', 'testnet', 'devnet', 'mocknet'
    // apiUrl: 'http://localhost:4000/apipaymentgateway/v1',
    apiUrl: 'https://test.boltproto.org/apipaymentgateway/v1',
    frontURL: 'http://localhost:4200/tools/payment-gateway/',
    // apiUrl: 'https://test.boltproto.org/api/v1',
    // blockchainAPIUrl: 'http://localhost:3999',
    blockchainAPIUrl: 'https://api.testnet.hiro.so',
    gatewayAddress: 'ST3QZNX3CGT6V7PE1PBK17FCRK1TP1AT02W1N0YJF',
    boltProtocol: {
        // apiUrl: 'http://localhost:3000/api/v1',
        apiUrl: 'https://test.boltproto.org/api/v1',
        contractAddress: 'ST3QZNX3CGT6V7PE1PBK17FCRK1TP1AT02W1N0YJF',
        contractName: 'boltproto-sbtc-rc-2-0-0'
    },
    supportedAsset: {
        sBTC: {
            contractAddress: 'ST3QZNX3CGT6V7PE1PBK17FCRK1TP1AT02W1N0YJF',
            contractName: 'sbtc-token',
            contractToken: 'sbtc-token',
            decimals: 8,
            name: 'sBTC',
            symbol: 'sBTC',
            image: 'https://ipfs.io/ipfs/bafkreiffe46h5voimvulxm2s4ddszdm4uli4rwcvx34cgzz3xkfcc2hiwi',
            fee: 2000 // sats
        }
    }
};