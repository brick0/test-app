import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';


import { AppComponent } from './app.component';
import { ThreeDisplayComponent } from './three-display/three-display.component';
import { GoDisplayComponent } from './go-display/go-display.component';


const appRoutes: Routes = [
  { path: 'go', component: GoDisplayComponent },
  { path: 'three',      component: ThreeDisplayComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    ThreeDisplayComponent,
    GoDisplayComponent
  ],
  imports: [
    BrowserModule,
      RouterModule.forRoot(appRoutes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

