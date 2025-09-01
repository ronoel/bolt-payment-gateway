import { Injectable, signal } from '@angular/core';
import { connect, disconnect, isConnected, getLocalStorage } from '@stacks/connect';
import { environment } from './../../environments/environment';
import { Observable } from 'rxjs';

const myAppName = 'Bolt Gateway'; // shown in wallet pop-up
const myAppIcon = 'https://storage.googleapis.com/bitfund/boltproto-icon.png'; // shown in wallet pop-up
// const myAppIcon = 'https://boostaid.net/images/logo/boostaid-logo.png'; // shown in wallet pop-up

/**
 * Service responsible for managing the user's wallet and authentication status.
 */
@Injectable({
  providedIn: 'root'
})
export class WalletService {

  private readonly isLoggedInSignal = signal(false);
  private readonly network = environment.network;

  constructor() {
    this.checkAuth();
    console.log('Wallet Service environment', environment.network);
  }

  /**
   * Checks if the user is authenticated and updates the `isLoggedInSignal` accordingly.
   */
  private checkAuth() {
    const connected = isConnected();
    const hasAddress = this.getSTXAddressSafe() !== undefined;
    this.isLoggedInSignal.set(connected && hasAddress);
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
      await connect();
      this.isLoggedInSignal.set(true);
    } catch (error) {
      console.error('User cancelled connection:', error);
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
  }

  /**
   * Checks if the user is currently signed in.
   * @returns `true` if the user is signed in and has an address, `false` otherwise.
   */
  public isLoggedIn() {
    const connected = isConnected();
    const hasAddress = this.getSTXAddressSafe() !== undefined;
    const loggedIn = connected && hasAddress;
    
    // Update the signal if it's different
    if (this.isLoggedInSignal() !== loggedIn) {
      this.isLoggedInSignal.set(loggedIn);
    }
    
    return loggedIn;
  }

  /**
   * Retrieves the local storage data.
   * @returns The local storage data or null if not connected.
   */
  public getUserData() {
    return getLocalStorage();
  }

  /**
   * Retrieves the identity address of the currently signed-in user.
   * @returns The identity address.
   */
  public getIdentityAddress() {
    const userData = this.getUserData();
    return userData?.addresses?.stx?.[0]?.address;
  }

  public getPublicKey() {
    // Note: In the new API, public keys are not directly available from local storage
    // You may need to request them separately or use a different approach
    const userData = this.getUserData();
    return userData?.addresses?.stx?.[0]?.address; // Return address for now
  }

  /**
   * Retrieves the STX address of the currently signed-in user.
   * @returns The STX address or throws an error if not connected.
   */
  public getSTXAddress(): string {
    const userData = this.getUserData();
    const address = userData?.addresses?.stx?.[0]?.address;
    
    if (!address) {
      throw new Error('No STX address found. Please connect your wallet first.');
    }
    
    return address;
  }

  /**
   * Retrieves the STX address of the currently signed-in user safely.
   * @returns The STX address or undefined if not connected.
   */
  public getSTXAddressSafe(): string | undefined {
    const userData = this.getUserData();
    return userData?.addresses?.stx?.[0]?.address;
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
        .then(data => {
          observer.next(data.balance); // Convert from microSTX to STX
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }
}
