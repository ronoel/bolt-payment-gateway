import { Injectable, inject } from '@angular/core';
import { from, Observable, switchMap, map } from 'rxjs';
import { WalletService } from './wallet.service';
import { environment } from '../../environments/environment';
import {
    Cl,
    PostConditionMode,
    FungiblePostCondition,
    AssetString,
    cvToJSON,
    cvToValue,
} from '@stacks/transactions';
import { ContractService } from './contract.service';
import { sBTCTokenService } from './sbtc-token.service';

export interface BoltTransactionResponse {
    // success: boolean;
    txid?: string;
    error?: string | any;
}

@Injectable({
    providedIn: 'root'
})
export class BoltContractSBTCService extends ContractService {

    constructor(
        walletService: WalletService
    ) {
        super(
            environment.boltProtocol.contractName,
            environment.boltProtocol.contractAddress,
            walletService
        );
    }

    getFee(): number {
        return environment.supportedAsset.sBTC.fee;
    }

    getContractAddress(): `${string}.${string}` {
        return `${this.contractAddress}.${this.contractName}`;
    }

    public transferBoltToBolt(
        amount: number,
        recipientAddress: string,
        memo: string = '' // Add optional memo parameter with default empty string
    ): Observable<string> {
        const memoParam = memo ? Cl.some(Cl.bufferFromAscii(memo)) : Cl.none();

        return from(new Promise<any>((resolve, reject) => {

            this.callSponsoredFunction(
                'transfer-bolt-to-bolt',
                [
                    Cl.uint(amount),
                    Cl.principal(recipientAddress),
                    memoParam,
                    Cl.uint(this.getFee())
                ],
                // (tx: any) => this.transactionService.sendTransaction(tx).subscribe({
                //     next: (txid: string) => resolve(txid),
                //     error: reject
                // }),
                (tx: any) => 
                    {
                        console.log(tx);
                        resolve(tx);
                    },
                reject,
                [],
                PostConditionMode.Deny
            );
        }));
    }


    getWalletData(address: string): Observable<any> {
        return from(this.callReadOnlyFunction(
            'get-wallet-data',
            [
                Cl.principal(address)
            ]
        )).pipe(
            map((result: any) => {
                const data = cvToValue(result);
                console.log('get-wallet-data', data);
                console.log('balance', cvToValue(data['balance']));
                if (result.value) {
                    return {
                        balance: cvToValue(data['balance']),
                        withdrawRequestedAmount: cvToValue(data['withdraw-requested-amount']),
                        withdrawRequestedBlock: cvToValue(data['withdraw-requested-block'])
                    };
                }
                return null;
            })
        );
    }

}
