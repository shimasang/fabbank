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
import * as TransactionAction from '../actions/transaction.action';
import * as TransactionReducer from '../reducers/transaction.reducer';
// import { ApiClientMockSocket } from '../../sockets/api-client-mock.socket';
import { ApiClientSocket } from '../../sockets/api-client.socket';
import { Transaction } from '../models/transaction';

@Injectable()
export class TransactionEffects {
	private TAG: string = 'TransactionEffects:';

	constructor(
		private _txStore: Store<TransactionReducer.State>,
		private actions$: Actions,
		private api: ApiClientSocket
	) { }

	@Effect() transfer$: Observable<Action> = this.actions$
		.ofType(TransactionAction.TRANSACTION_TRANSFER_FUNDS)
		.map(toPayload)
		.switchMap(payload => {
			return this.api.transferFunds(payload)
				.map((response) => {
          console.log(JSON.stringify(response));
					if (response.status && response.status == 'success') {
						return new TransactionAction.TransactionTransferFundsSuccess(response);
					} else {
						return new TransactionAction.TransactionTransferFundsFailure(response.message);
					}
				})
		});

	@Effect() transactionIncome$: Observable<Action> = this.actions$
		.ofType(TransactionAction.TRANSACTION_INCOMING)
		.map(toPayload)
		.map(payload => {
			console.log("TransactionEffect:TransactionAction.TRANSACTION_INCOMING");
			let latestTx = null;
			this._txStore.select(TransactionReducer.getTransaction).subscribe((transactions) => latestTx = transactions[0]);
			console.log(JSON.stringify(latestTx));
			return new TransactionAction.TransactionHistory(latestTx.txId);
		});

	@Effect() historyAll$: Observable<Action> = this.actions$
		.ofType(TransactionAction.TRANSACTION_HISTORY_ALL)
		.map(toPayload)
		.switchMap(payload =>
			this.api.retrieveHistoryAll().map((response) => {
				let txs = [];
				if (response.status == 'success') {

					if (!Array.isArray(response.message)) { return; }

					for (let tx of response.message) {
						let transaction = new Transaction(
							tx.txId, tx.timestamp,
							tx.value.fromBank, tx.value.from, tx.value.fromName,
							tx.value.toBank, tx.value.to, tx.value.toName,
							tx.value.amount, tx.value.balance
						);

						txs.push(transaction);
					}
				}

				return new TransactionAction.TransactionReset(txs);
			}));

	@Effect() history$: Observable<Action> = this.actions$
		.ofType(TransactionAction.TRANSACTION_HISTORY)
		.map(toPayload)
		.switchMap(payload => {
			return Observable.create((ob) => {
				console.log(TransactionAction.TRANSACTION_HISTORY);
				this.api.retrieveHistory(payload).subscribe((response) => {
					console.log('transactions:', response.message);
					if (response.status == 'success') {

						if (!Array.isArray(response.message)) { return; }

						for (let tx of response.message) {
							let transaction = new Transaction(
								tx.txId, tx.timestamp,
								tx.value.fromBank, tx.value.from, tx.value.fromName,
								tx.value.toBank, tx.value.to, tx.value.toName,
								tx.value.amount, tx.value.balance
							);

							this._txStore.dispatch(new TransactionAction.TransactionAdd(transaction));
						}
					}

					ob.next(new TransactionAction.TransactionHistoryDone(payload));

				}, (e) => ob.next(new TransactionAction.TransactionHistoryDone(payload)));
			})
		});
	}