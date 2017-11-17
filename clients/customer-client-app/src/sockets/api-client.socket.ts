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
import SocketIO from 'socket.io-client';
import { Config } from '../app/app.config';
import { environment } from '../environments/environment'
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { TransferFundsRequest, TransactionIncoming } from '../core/actions/transaction.action';
import * as TransactionAction from '../core/actions/transaction.action';
import * as TransactionReducer from '../core/reducers/transaction.reducer';
import { Transaction } from '../core/models/transaction';

@Injectable()
export class ApiClientSocket {
	private TAG: string = 'APIService:';
	private ws;

	constructor(
		private _txStore: Store<TransactionReducer.State>
	) {
		this.ws = SocketIO(environment.apiEndpoint);
		this.ws.on('connect', (data) => {});

		this.ws.on('transaction', (data) => {
			console.log('transaction is coming!!' + JSON.stringify(data));
			let transaction = new Transaction(
				data.transactionId, data.timestamp, 
				"", data.from, "", 
				"", data.to, "",
				data.amount, 0
			);
			this._txStore.dispatch(new TransactionAction.TransactionIncoming(transaction));
		});
	}

	public createAccount(credential) {
		console.log(this.TAG + 'createAccount:' + JSON.stringify(credential));
		return Observable.create((ob) => {
			this.ws.emit('create', credential, (response) => {
				console.log(JSON.stringify(response));
				ob.next(response);
			});
		});
	}

	public login(credential) {
		console.log(this.TAG + 'login:' + JSON.stringify(credential));
		let args = {
			accountId: credential.accountId
		};
		return Observable.create((ob) => {
			this.ws.emit('login', args, (response) => {
				console.log(this.TAG + 'login:' + JSON.stringify(response));
				ob.next(response);				
			});
		});
	}

	public transferFunds(transaction: TransferFundsRequest) {
		console.log(this.TAG + 'transferFunds:' + JSON.stringify(transaction));

		if(transaction.toBank) {
			let args = {
				toBank: transaction.toBank,
				to: transaction.to,
				toName: transaction.toName,
				amount: transaction.amount
			};
			return Observable.create((ob) => {
				this.ws.emit('transfer_to_external', args, (response) => {
					ob.next(response);
				});
			});

		}else{
			let args = {
				to: transaction.to,
				amount: transaction.amount
			};
			return Observable.create((ob) => {
				this.ws.emit('transfer', args, (response) => {
					ob.next(response);
				});
			});
		}
	}

	public retrieveHistoryAll() {
		console.log(this.TAG + 'retrieveHistoryAll');
		return Observable.create((ob) => {
			this.ws.emit('history',null,(response) => {
				console.log(this.TAG + 'history response', response);
				ob.next(response);
			});
		});
	}

	public retrieveHistory(latestTxId) {
		console.log(this.TAG + 'retrieveHistory#' + latestTxId);
		let args = {
			transactionId: latestTxId
		}
		return Observable.create((ob) => {
			this.ws.emit('history_from',args,(response) => {
				console.log(this.TAG + 'history response', response);
				ob.next(response);
			});
		});
	}
}