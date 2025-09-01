import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="toast"
          [ngClass]="toast.type">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') { ✅ }
              @case ('error') { ❌ }
              @case ('warning') { ⚠️ }
              @case ('info') { ℹ️ }
            }
          </div>
          
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            @if (toast.message) {
              <div class="toast-message">{{ toast.message }}</div>
            }
          </div>

          @if (toast.action) {
            <button 
              class="toast-action"
              (click)="handleAction(toast)">
              {{ toast.action.label }}
            </button>
          }

          <button 
            class="toast-close"
            (click)="dismiss(toast.id)">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);
      background: white;
      border-left: 4px solid;
      animation: slideIn 0.3s ease-out;
      position: relative;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast.success {
      border-left-color: #10b981;
      background: #f0fdf4;
    }

    .toast.error {
      border-left-color: #ef4444;
      background: #fef2f2;
    }

    .toast.warning {
      border-left-color: #f59e0b;
      background: #fffbeb;
    }

    .toast.info {
      border-left-color: #3b82f6;
      background: #eff6ff;
    }

    .toast-icon {
      font-size: 20px;
      line-height: 1;
      margin-top: 2px;
    }

    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-weight: 600;
      color: #111827;
      font-size: 14px;
      line-height: 1.4;
    }

    .toast-message {
      color: #6b7280;
      font-size: 13px;
      line-height: 1.4;
      margin-top: 2px;
    }

    .toast-action {
      background: none;
      border: 1px solid;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      margin-top: 2px;
    }

    .toast.success .toast-action {
      border-color: #10b981;
      color: #10b981;
    }

    .toast.error .toast-action {
      border-color: #ef4444;
      color: #ef4444;
    }

    .toast.warning .toast-action {
      border-color: #f59e0b;
      color: #f59e0b;
    }

    .toast.info .toast-action {
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .toast-close {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #9ca3af;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
    }

    .toast-close:hover {
      color: #6b7280;
    }

    @media (max-width: 640px) {
      .toast-container {
        left: 20px;
        right: 20px;
        top: 20px;
        max-width: none;
      }
    }
  `]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}

  dismiss(id: string) {
    this.toastService.dismiss(id);
  }

  handleAction(toast: ToastMessage) {
    if (toast.action) {
      toast.action.handler();
      this.dismiss(toast.id);
    }
  }
}
