import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSignal = signal<ToastMessage[]>([]);
  
  // Expose as readonly signal
  toasts = this.toastsSignal.asReadonly();

  constructor() {}

  show(toast: Omit<ToastMessage, 'id'>): string {
    const id = this.generateId();
    const fullToast: ToastMessage = {
      id,
      ...toast,
      duration: toast.duration ?? 5000
    };
    
    // Add toast to the signal array
    this.toastsSignal.update(toasts => [...toasts, fullToast]);
    
    // Auto dismiss after duration
    if (fullToast.duration && fullToast.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, fullToast.duration);
    }
    
    return id;
  }

  success(title: string, message?: string, duration?: number): string {
    return this.show({ type: 'success', title, message, duration });
  }

  error(title: string, message?: string, duration?: number): string {
    return this.show({ type: 'error', title, message, duration });
  }

  info(title: string, message?: string, duration?: number): string {
    return this.show({ type: 'info', title, message, duration });
  }

  warning(title: string, message?: string, duration?: number): string {
    return this.show({ type: 'warning', title, message, duration });
  }

  dismiss(id: string): void {
    console.log(`Dismissing toast ${id}`);
    this.toastsSignal.update(toasts => toasts.filter(toast => toast.id !== id));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
