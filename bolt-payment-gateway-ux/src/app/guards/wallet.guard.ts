import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { WalletService } from '../services/wallet.service';

@Injectable({
  providedIn: 'root'
})
export class WalletGuard implements CanActivate {
  private walletService = inject(WalletService);
  private router = inject(Router);

  canActivate(): boolean {
    if (this.walletService.isLoggedInSignal()) {
      return true;
    }
    
    this.router.navigate(['/']);
    return false;
  }
}
