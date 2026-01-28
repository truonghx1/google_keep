import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { MainComponent } from './components/main/main.component';
import { NavComponent } from './components/sidenav/sidenav.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { NotesComponent } from './components/notes/notes.component';
import { InputComponent } from './components/input/input.component';
import { ph } from './pipes/ph.pipe';
import { AppRoutingModule } from './app-routing.module';
import { CboxSortPipe } from './pipes/cbox-sort.pipe';
import { CboxDonePipe } from './pipes/cbox-done.pipe';
import { NotesToolsPipe } from './pipes/notes-tools.pipe';
import { AmplifyAuthenticatorModule } from '@aws-amplify/ui-angular';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    NavComponent,
    NavbarComponent,
    NotesComponent,
    InputComponent,
    ph,
    CboxSortPipe,
    CboxDonePipe,
    NotesToolsPipe,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    RouterModule,
    AppRoutingModule,
    FormsModule,
    AmplifyAuthenticatorModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
