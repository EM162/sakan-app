import { Component } from '@angular/core';
import { AuthService } from '../core/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from '../login/login.component';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  
    selector: 'app-header',
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './header.component.html',
    standalone: true,
    styleUrl: './header.component.css'
})
export class HeaderComponent {
  constructor(private dialog: MatDialog) {}
  public dialogRef: any;

  openLoginDialog() {
    if (this.dialogRef) {
      // If dialog is already open, close it
      this.dialogRef.close();
      this.dialogRef = null;
    } else {
      // Open new dialog
      this.dialogRef = this.dialog.open(LoginComponent, {
        width: '100%',
        maxWidth: '400px',
        panelClass: 'custom-dialog-container',
        backdropClass: 'cdk-overlay-dark-backdrop',
        disableClose: false, // Allow closing by clicking outside
      });

      // Handle dialog closing
      this.dialogRef.afterClosed().subscribe(() => {
        this.dialogRef = null;
      });
    }
  }
}
