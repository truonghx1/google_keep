import { Component } from '@angular/core';
import { AuthenticatorService } from '@aws-amplify/ui-angular';

@Component({
  selector: 'app-root',
  template: `
    <amplify-authenticator>
      <ng-template amplifySlot="authenticated" let-user="user" let-signOut="signOut">
        <app-main></app-main>
        <button class="sign-out-btn" (click)="signOut()">Sign Out</button>
      </ng-template>
    </amplify-authenticator>
  `,
  styles: [`
    .sign-out-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px 20px;
      background-color: #5f6368;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      z-index: 1000;
    }
    .sign-out-btn:hover {
      background-color: #3c4043;
    }
  `]
})
export class AppComponent {
  constructor(public authenticator: AuthenticatorService) {}
}
