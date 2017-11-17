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
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import { Action, Store } from '@ngrx/store';
import { Actions, Effect, toPayload } from '@ngrx/effects';
import * as AccountAction from '../actions/account.action';
import * as TransactionAction from '../actions/transaction.action';
import * as TransactionReducer from '../reducers/transaction.reducer';
// import { ApiClientMockSocket } from '../../sockets/api-client-mock.socket';
import { ApiClientSocket } from '../../sockets/api-client.socket';

@Injectable()
export class AccountEffects {
	private TAG: string = 'AccountEffects:';

	constructor(
		private actions$: Actions,
		private api: ApiClientSocket,
		private _txStore: Store<TransactionReducer.State>
	) { }

	@Effect() create$: Observable<Action> = this.actions$
		.ofType(AccountAction.ACCOUNT_CREATE)
		.map(toPayload)
		.switchMap(payload =>
			this.api.createAccount(payload)
				.map((response) => {
					if (response.status && response.status == 'success') {
						console.log("SUCCESS!!");
						this._txStore.dispatch(new TransactionAction.TransactionHistoryAll(null));
						return new AccountAction.AccountLoginSuccess(payload);

					} else {
						console.log("ERROR!!");
						return new AccountAction.AccountCreateFailure(response.message);

					}
				})
		);

	@Effect() login$: Observable<Action> = this.actions$
		.ofType(AccountAction.ACCOUNT_LOGIN)
		.map(toPayload)
		.switchMap(payload =>
			this.api.login(payload)
				.map((response) => {
					console.log(AccountAction.ACCOUNT_LOGIN);
					if (response.status && response.status == 'success' && response.message) {
						this._txStore.dispatch(new TransactionAction.TransactionHistoryAll(null));
						return new AccountAction.AccountLoginSuccess({
							accountId: payload.accountId,
							username: response.message.username
						});

					} else {
						return new AccountAction.AccountLoginFailure(response.message);

					}

				})
		);
}