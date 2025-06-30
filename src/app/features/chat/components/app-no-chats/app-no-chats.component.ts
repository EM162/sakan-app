import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-no-chats',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="no-chats-container">
      <div class="no-chats-card">
        <div class="icon-section">
          <mat-icon class="chat-icon">chat_bubble_outline</mat-icon>
        </div>

        <div class="content-section">
          <h2 class="primary-message">You don't have any conversations yet</h2>
          <p class="secondary-message">
            Start by discovering listings or go back home.
          </p>

          <div class="actions">
            <button
              mat-stroked-button
              class="secondary-button"
              (click)="onGoHome()"
            >
              <mat-icon>home</mat-icon>
              Go Home
            </button>

            <button
              mat-raised-button
              class="primary-button"
              (click)="onDiscoverListings()"
            >
              <mat-icon>explore</mat-icon>
              Discover Listings
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .no-chats-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 20px;
        background: linear-gradient(
          135deg,
          #f6fafd 0%,
          #e3eaf6 50%,
          #f9f9fb 100%
        );
      }

      .no-chats-card {
        display: flex;
        flex-direction: row;
        align-items: center;
        background: linear-gradient(145deg, #ffffff 0%, #f9f9fb 100%);
        border-radius: 18px;
        padding: 32px 40px;
        max-width: 720px;
        width: 100%;
        box-shadow: 0 4px 20px rgba(9, 28, 70, 0.08),
          0 1px 3px rgba(9, 28, 70, 0.06);
        border: 1px solid rgba(230, 236, 245, 0.6);
        gap: 32px;
      }

      .icon-section {
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f8fa;
        border-radius: 12px;
        padding: 16px;
        height: 80px;
        width: 80px;
        flex-shrink: 0;
      }

      .chat-icon {
        font-size: 48px;
        color: #7b8794;
      }

      .content-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .actions {
        display: flex;
        flex-direction: row;
        gap: 16px;
        flex-wrap: wrap;
      }

      .primary-message {
        font-size: 24px;
        font-weight: 600;
        color: #091c46;
        margin: 0 0 12px 0;
      }

      .secondary-message {
        font-size: 16px;
        color: #7b8794;
        margin-bottom: 24px;
      }

      .primary-button {
        background: linear-gradient(
          135deg,
          #31456e 0%,
          #a2c7f3 100%
        ) !important;
        color: white !important;
        border-radius: 12px !important;
        padding: 10px 24px !important;
        font-weight: 500;
        text-transform: none;
        box-shadow: 0 2px 8px rgba(49, 69, 110, 0.3);
      }

      .primary-button:hover {
        background: linear-gradient(
          135deg,
          #2a3d61 0%,
          #92b8e8 100%
        ) !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(49, 69, 110, 0.4);
      }

      .secondary-button {
        border: 2px solid #e6ecf5 !important;
        color: #2d3748 !important;
        border-radius: 12px !important;
        padding: 10px 24px !important;
        font-weight: 500;
        text-transform: none;
      }

      .secondary-button:hover {
        border-color: #31456e !important;
        color: #31456e !important;
        background: rgba(49, 69, 110, 0.04);
        transform: translateY(-1px);
      }

      .primary-button mat-icon,
      .secondary-button mat-icon {
        margin-right: 8px;
      }

      @media (max-width: 768px) {
        .no-chats-card {
          flex-direction: column;
          text-align: center;
          padding: 24px;
        }

        .actions {
          justify-content: center;
        }
      }
    `,
  ],
})
export class NoChatsComponent {
  constructor(
    private router: Router,
    private dialogRef: MatDialogRef<NoChatsComponent>
  ) {}
  onDiscoverListings(): void {
    console.log('Discover Listings clicked');
    this.router.navigate(['/listings']);
    this.close(false);
  }

  onGoHome(): void {
    console.log('Go Home clicked');
    this.router.navigate(['/']);
    this.close(false);
  }
  close(result: boolean) {
    this.dialogRef.close(result);
  }
  
}
