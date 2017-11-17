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
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Actions, toPayload } from '@ngrx/effects';
import * as AccountAction from '../../core/actions/account.action';
import * as AccountReducer from '../../core/reducers/account.reducer';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import { NotificationsService } from 'angular2-notifications';

@Component({
	selector: 'sign-up',
	templateUrl: './sign-up.component.html',
	styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent {  
	private TAG: string = 'SignUpComponent:';
	public signUpForm: FormGroup;
	public submitted: boolean;
	public options = {
		position: ["top", "right"],
		timeOut: 5000,
		lastOnBottom: true}
	private onDestroy = new Subject();

	constructor(
		private router: Router,
		private formBuilder: FormBuilder,
		private _store: Store<AccountReducer.State>,
		private actions$: Actions,
		private _service: NotificationsService,
	) {
	}
  
	ngOnInit() {
		console.log(this.TAG + "ngOnInit");
		this.signUpForm = this.formBuilder.group({
			'accountId': ['',Validators.compose([Validators.required])],
			'username': ['',Validators.compose([Validators.required])]
		});
	}

	ngOnDestroy() {
		console.log(this.TAG + "ngOnDestroy")
		this.onDestroy.next();
	}

	onSignUp(value,isValid) {
		console.log(this.TAG + "onSignUp");
		if(isValid) {
			this.actions$
			.ofType(AccountAction.ACCOUNT_LOGIN_SUCCESS)
			.takeUntil(this.onDestroy)
			.subscribe(action => {
				this.router.navigate(['/dashboard']);
			});
	  
		  this.actions$
			.ofType(AccountAction.ACCOUNT_CREATE_FAILURE)
			.takeUntil(this.onDestroy)
			.map(toPayload)
			.subscribe(payload => {
			  this._service.error('Error', payload.payload.message);
			  this.onDestroy.next();
			});

			this._store.dispatch(new AccountAction.AccountCreate(value));
		}
	}
}