import { computed, Signal, WritableSignal, signal, Injectable, inject } from '@angular/core';
import { connect, disconnect, isConnected, getLocalStorage, request } from '@stacks/connect';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

const myAppName = 'BoltProto'; // shown in wallet pop-up
const myAppIcon = 'https://storage.googleapis.com/bitfund/boltproto-icon.png'; // shown in wallet pop-up
/**
 * Service responsible for managing the user's wallet and authentication status.
 */
@Injectable({
  providedIn: 'root'
})
export class WalletService {

  readonly isLoggedInSignal = signal(false);
  readonly userAddressSignal: WritableSignal<string | null> = signal<string | null>(null);
  readonly network = environment.network;
  private router = inject(Router);

  readonly walletAddressSignal: Signal<string | null> = computed(() => {
    return this.userAddressSignal();
  });

  constructor() {
    this.checkAuth();
    console.log('Wallet Service environment', environment.network);
  }

  /**
   * Checks if the user is authenticated and updates the `isLoggedInSignal` accordingly.
   */
  private checkAuth() {
    const connected = isConnected();
    this.isLoggedInSignal.set(connected);
    
    if (connected) {
      const data = getLocalStorage();
      // Get the STX address from the stored data
      const stxAddress = data?.addresses?.stx?.[0]?.address || null;
      this.userAddressSignal.set(stxAddress);
    } else {
      this.userAddressSignal.set(null);
    }
  }

  /**
   * Initiates the sign-in process for the user.
   * If the user is already signed in, it logs a message and returns.
   * If the user is not signed in, it shows a connect pop-up and updates the `isLoggedInSignal` when finished.
   */
  public async signIn() {
    if (this.isLoggedInSignal()) {
      return;
    }
    
    try {
      const response = await connect();
      this.isLoggedInSignal.set(true);
      
      // Get the STX address from the response
      const stxAddress = response?.addresses?.find(addr => addr.address.startsWith('S'))?.address || null;
      this.userAddressSignal.set(stxAddress);
    } catch (error) {
      console.log('User cancelled or error occurred:', error);
    }
  }

  /**
   * Signs out the user if they are signed in.
   * If the user is not signed in, it logs a message and returns.
   */
  public signOut() {
    if (!this.isLoggedInSignal()) {
      return;
    }
    
    disconnect();
    this.isLoggedInSignal.set(false);
    this.userAddressSignal.set(null);
    this.router.navigate(['/']);
  }

  /**
   * Checks if the user is currently signed in.
   * @returns `true` if the user is signed in, `false` otherwise.
   */
  public isLoggedIn() {
    return this.isLoggedInSignal();
  }

  /**
   * Retrieves the wallet connection data.
   * @returns The local storage data or null if not connected.
   */
  public getWalletData() {
    return getLocalStorage();
  }

  /**
   * Retrieves the identity address of the currently signed-in user.
   * In v8, this returns the STX address as identity address is deprecated.
   * @returns The STX address.
   */
  public getIdentityAddress() {
    return this.userAddressSignal();
  }

  /**
   * Retrieves the STX address of the currently signed-in user.
   * @returns The STX address.
   */
  public getSTXAddress() {
    return this.userAddressSignal();
  }

  /**
   * Retrieves the STX address or throws an error if not available.
   * @returns The STX address.
   * @throws Error if user is not connected or address is not available.
   */
  public getSTXAddressOrThrow(): string {
    const address = this.userAddressSignal();
    if (!address) {
      throw new Error('STX address not available. User may not be connected.');
    }
    return address;
  }

  public getNetwork() {
    return this.network;
  }

  public getApiUrl() {
    return environment.blockchainAPIUrl;
  }

  /**
   * Retrieves the balance of STX tokens in the user's wallet.
   * @returns An Observable that emits the balance of STX tokens.
   */
  public getSTXBalance(): Observable<number> {
    const address = this.getSTXAddress();
    return new Observable<number>((observer) => {
      fetch(`${this.getApiUrl()}/v2/accounts/${address}`)
        .then(response => response.json())
        .then((data) => {
          observer.next(data.balance);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  /**
   * Signs a message using the user's wallet.
   * @param message The message to sign.
   * @returns A Promise that resolves to the signature data containing signature and publicKey.
   */
  public async signMessage(message: string): Promise<{ signature: string, publicKey: string }> {
    if (!this.isLoggedIn()) {
      throw new Error('User is not logged in');
    }

    try {
      const response = await request('stx_signMessage', {
        message
      });
      
      return {
        signature: response.signature,
        publicKey: response.publicKey
      };
    } catch (error) {
      throw new Error('User cancelled message signing or an error occurred');
    }
  }

}
