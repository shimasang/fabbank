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

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { 
  MatButtonModule, 
  MatCardModule, 
  MatCheckboxModule, 
  MatDialogModule,
  MatFormFieldModule, 
  MatInputModule,
  MatListModule, 
  MatToolbarModule, 
  MatIconModule,
  MatGridListModule } from '@angular/material';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { Config } from './app.config';
import { ApiClientSocket } from '../sockets/api-client.socket';
import { ApiClientMockSocket } from '../sockets/api-client-mock.socket';
import { effects } from '../core/effects';
import { reducers } from '../core/reducers';

import { AppComponent } from './app.component';
import { DashboardComponent } from '../components/dashboard/dashboard.component';
import { GHeaderComponent } from '../components/common/g-header.component';
import { LoginComponent } from '../components/login/login.component';
import { SignUpComponent } from '../components/sign-up/sign-up.component';
import { TransferComponent } from '../components/transfer/transfer.component';

import { SimpleNotificationsModule, NotificationsService } from 'angular2-notifications';
import { DashboardListComponent } from '../components/dashboard-list/dashboard-list.component';


const appRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'sign_up', component: SignUpComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    GHeaderComponent,
    LoginComponent,
    SignUpComponent,
    TransferComponent,
    DashboardListComponent,
  ],
  imports: [
    BrowserModule, BrowserAnimationsModule,
    FormsModule, ReactiveFormsModule,
    RouterModule.forRoot(appRoutes),
    MatButtonModule, MatCardModule, MatCheckboxModule, 
    MatDialogModule, MatFormFieldModule, MatInputModule, MatListModule, MatGridListModule,
    MatToolbarModule,
    StoreModule.forRoot(reducers),
    EffectsModule.forRoot(effects),
    SimpleNotificationsModule.forRoot()
  ],
  providers: [
    ApiClientSocket, ApiClientMockSocket, NotificationsService
  ],
  entryComponents: [
    TransferComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
