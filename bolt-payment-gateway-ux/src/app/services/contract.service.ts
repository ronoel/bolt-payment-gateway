import { Observable, throwError } from 'rxjs';
import { WalletService } from './wallet.service';
import {
  AnchorMode, PostConditionMode,
  fetchCallReadOnlyFunction,
  ReadOnlyFunctionOptions,
  ClarityValue,
  PostCondition,
  serializeCVBytes,
} from '@stacks/transactions';
import { bytesToHex } from '@stacks/common';
import { request } from '@stacks/connect';
import { StacksNetworkName } from '@stacks/network';
import { environment } from '../../environments/environment';

export abstract class ContractService {

  // private network: StacksNetworkName = environment.network as StacksNetworkName;

  constructor(
    protected contractName: string,
    protected contractAddress: string,
    protected walletService: WalletService
  ) {

  }

  protected callReadOnlyFunction(functionName: string, functionArgs: ClarityValue[]): Promise<ClarityValue> {
    const options = this.createGenericReadOnlyFunctionOptions(functionName, functionArgs);
    return fetchCallReadOnlyFunction(options);
  }

  protected async callPublicFunction(
    functionName: string,
    functionArgs: ClarityValue[],
    resolve: Function,
    reject: Function,
    postConditions?: (string | PostCondition)[],
    postConditionMode: PostConditionMode = PostConditionMode.Deny
  ): Promise<void> {

    try {
      const postConditionModeName = postConditionMode === PostConditionMode.Allow ? 'allow' : 'deny';
      
      // Convert Clarity values to hex format manually for compatibility
      const hexEncodedArgs = functionArgs.map(arg => `0x${bytesToHex(serializeCVBytes(arg))}`);
      
      const response = await request({
        enableOverrides: false, // Disable automatic compatibility overrides
      }, 'stx_callContract', {
        contract: `${this.contractAddress}.${this.contractName}`,
        functionName: functionName,
        functionArgs: hexEncodedArgs,
        network: environment.network,
        postConditionMode: postConditionModeName,
        postConditions: postConditions,
      });
      
      resolve(response.txid);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (error) {
      reject(error);
    }
  }

  protected async callSponsoredFunction(
    functionName: string,
    functionArgs: ClarityValue[],
    resolve: Function,
    reject: Function,
    postConditions?: (string | PostCondition)[],
    postConditionMode: PostConditionMode = PostConditionMode.Deny
  ): Promise<void> {

    try {
      const postConditionModeName = postConditionMode === PostConditionMode.Allow ? 'allow' : 'deny';
      
      // Convert Clarity values to hex format manually for compatibility
      const hexEncodedArgs = functionArgs.map(arg => `0x${bytesToHex(serializeCVBytes(arg))}`);
      
      // Note: The new API doesn't have specific sponsored transaction support in the same way
      // You may need to implement sponsored transactions differently or use a different approach
      const response = await request({
        enableOverrides: false, // Disable automatic compatibility overrides
      }, 'stx_callContract', {
        contract: `${this.contractAddress}.${this.contractName}`,
        functionName: functionName,
        functionArgs: hexEncodedArgs,
        network: environment.network,
        postConditionMode: postConditionModeName,
        postConditions: postConditions,
        sponsored: true, // Indicate that this is a sponsored transaction
        // Add sponsored transaction specific parameters if supported by the wallet
      });
      
      resolve(response.transaction);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (error) {
      reject(error);
    }
  }

  protected createGenericReadOnlyFunctionOptions(functionName: string, functionArgs: ClarityValue[]): ReadOnlyFunctionOptions {
    return {
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      functionName: functionName,
      functionArgs: functionArgs,
      network: environment.network as StacksNetworkName,
      senderAddress: this.walletService.getSTXAddress() || ''
    };
  }

  protected handleError(error: any): Observable<never> {
    console.error('Error:', error);
    return throwError(() => new Error(`An error occurred: ${error.message}`));
  }
}
