import { Component, OnInit } from '@angular/core';
import { signOut, getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { AmplifyDataService } from './services/amplify-data.service';

@Component({
  selector: 'app-root',
  template: `
    <!-- Show Authenticator when not logged in and cloud mode is desired -->
    <div *ngIf="showAuthenticator" class="auth-wrapper">
      <amplify-authenticator [hideSignUp]="false">
        <ng-template amplifySlot="header">
          <div class="auth-header">
            <h1>Google Keep Clone</h1>
            <p>Sign in to sync your notes across devices</p>
          </div>
        </ng-template>
        
        <ng-template amplifySlot="authenticated" let-user="user" let-signOut="signOut">
          <!-- After authentication, show main app -->
          <app-main></app-main>
          
          <!-- User menu / logout button in navbar is handled separately -->
        </ng-template>
      </amplify-authenticator>
      
      <div class="local-mode-option">
        <button (click)="useLocalMode()" class="local-btn">
          Use Offline Mode (Local Storage)
        </button>
      </div>
    </div>
    
    <!-- Show main app directly in local mode or when authenticated -->
    <div *ngIf="!showAuthenticator">
      <div class="user-status-bar" *ngIf="isAuthenticated">
        <span class="user-email">{{ userEmail }}</span>
        <button (click)="logout()" class="logout-btn">Sign Out</button>
      </div>
      <div class="offline-indicator" *ngIf="!isAuthenticated && !showAuthenticator">
        <span>Offline Mode</span>
        <button (click)="showLogin()" class="login-btn">Sign In to Sync</button>
      </div>
      <app-main></app-main>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .auth-header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .auth-header h1 {
      color: #5f6368;
      font-size: 28px;
      margin: 0;
    }
    
    .auth-header p {
      color: #80868b;
      margin-top: 8px;
    }
    
    .local-mode-option {
      margin-top: 24px;
    }
    
    .local-btn {
      background: transparent;
      border: 1px solid #5f6368;
      color: #5f6368;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .local-btn:hover {
      background: #f1f3f4;
    }
    
    .user-status-bar {
      position: fixed;
      top: 0;
      right: 0;
      padding: 8px 16px;
      background: #fff;
      border-bottom-left-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 1000;
    }
    
    .user-email {
      color: #5f6368;
      font-size: 13px;
    }
    
    .logout-btn {
      background: #fff;
      border: 1px solid #dadce0;
      color: #5f6368;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }
    
    .logout-btn:hover {
      background: #f1f3f4;
    }
    
    .offline-indicator {
      position: fixed;
      top: 0;
      right: 0;
      padding: 8px 16px;
      background: #fef7e0;
      border-bottom-left-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 1000;
    }
    
    .offline-indicator span {
      color: #5f6368;
      font-size: 13px;
    }
    
    .login-btn {
      background: #1a73e8;
      border: none;
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }
    
    .login-btn:hover {
      background: #1557b0;
    }
  `]
})
export class AppComponent implements OnInit {
  showAuthenticator = false;
  isAuthenticated = false;
  userEmail = '';

  constructor(private amplifyDataService: AmplifyDataService) {}

  ngOnInit() {
    // Listen for auth events
    Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          this.onSignedIn();
          break;
        case 'signedOut':
          this.onSignedOut();
          break;
      }
    });

    // Check initial auth state
    this.checkAuthState();
  }

  private async checkAuthState() {
    try {
      const user = await getCurrentUser();
      if (user) {
        this.isAuthenticated = true;
        this.userEmail = user.signInDetails?.loginId || user.username;
        this.showAuthenticator = false;
        await this.amplifyDataService.onUserLogin();
      } else {
        // Not authenticated - check if we should show local mode or auth
        this.checkLocalModePreference();
      }
    } catch (error) {
      // Not authenticated
      this.checkLocalModePreference();
    }
  }

  private checkLocalModePreference() {
    const preferLocalMode = localStorage.getItem('preferLocalMode');
    if (preferLocalMode === 'true') {
      this.showAuthenticator = false;
      this.isAuthenticated = false;
    } else {
      // Default: show authenticator if Amplify is configured
      // For demo, start in local mode to avoid config errors
      this.showAuthenticator = false;
      this.isAuthenticated = false;
    }
  }

  private async onSignedIn() {
    try {
      const user = await getCurrentUser();
      this.isAuthenticated = true;
      this.userEmail = user.signInDetails?.loginId || user.username;
      this.showAuthenticator = false;
      localStorage.removeItem('preferLocalMode');
      await this.amplifyDataService.onUserLogin();
    } catch (error) {
      console.error('Error getting user after sign in:', error);
    }
  }

  private async onSignedOut() {
    this.isAuthenticated = false;
    this.userEmail = '';
    this.showAuthenticator = false;
    await this.amplifyDataService.onUserLogout();
  }

  async logout() {
    try {
      await signOut();
      this.isAuthenticated = false;
      this.userEmail = '';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  useLocalMode() {
    localStorage.setItem('preferLocalMode', 'true');
    this.showAuthenticator = false;
    this.isAuthenticated = false;
  }

  showLogin() {
    localStorage.removeItem('preferLocalMode');
    this.showAuthenticator = true;
  }
}
