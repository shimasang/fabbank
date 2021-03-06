/**
	Copyright (C) 2017 Yoshihide Shimada <yoshihide.shimada@ieee.org>

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

		http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
 */
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  MatButtonModule,
  MatCardModule,
  MatFormFieldModule, 
  MatInputModule,
  MatListModule, 
  MatToolbarModule, 
  MatIconModule,
  MatDialogModule
} from '@angular/material';
import {MatGridListModule} from '@angular/material/grid-list';

import { Socket } from './socket';
import { AppComponent } from './app.component';
import { DashboardComponent} from './dashboard.component';
import { RegisterBankComponent} from './register-bank.component';


import 'hammerjs';

const appRoutes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    RegisterBankComponent
  ],
  imports: [
    BrowserModule, BrowserAnimationsModule,
    FormsModule, ReactiveFormsModule,
    RouterModule.forRoot(appRoutes),
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule, 
    MatInputModule,
    MatListModule, 
    MatToolbarModule, 
    MatIconModule,
    MatGridListModule,
    MatDialogModule
  ],
  providers: [Socket],
  entryComponents: [
    RegisterBankComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
