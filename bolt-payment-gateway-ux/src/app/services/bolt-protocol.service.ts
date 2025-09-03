import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface WalletBalance {
  address: string;
  balance: bigint;
}

@Injectable({
  providedIn: 'root'
})
export class BoltProtocolService {
  private http = inject(HttpClient);
  private apiUrl = environment.boltProtocol.apiUrl;

  getWalletBalance(address: string, token: string): Observable<WalletBalance> {
    return this.http.get<any>(`${this.apiUrl}/wallet/${address}/${token}/balance`).pipe(
      map(response => ({
        address: response.address,
        balance: BigInt(response.balance)
      }))
    );
  }

}