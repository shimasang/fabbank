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
import { environment } from '../environments/environment'
import { Observable } from 'rxjs/Observable';

@Injectable()
export class Socket {
	private TAG: string = 'APIService:';
	private ws;
	private subscribers = {
		'info': null
	};

	constructor(
	) {
		
	}

	public subscribe(name, cb) {
		this.subscribers[name] = cb;
	}

	public connect() {
		this.ws = SocketIO('http://localhost:10001');
		this.ws.on('connect', (data) => {
			this.getInfo();
			this.getBanks();
		});

		this.ws.on('transaction', (data) => {
			console.log('transaction is coming!!' + JSON.stringify(data));
		});
	}

	public getInfo() {
		this.ws.emit('get_info', null, (response) => {
			console.log('getInfo:', response);
			this.subscribers['info'](response);
		});
	}

	public getBanks() {
		this.ws.emit('get_banks', null, (response) => {
			console.log('getBanks', response);
			this.subscribers['bank'](response);
		});
	}

	public createBank(credential, cb) {
		console.log(this.TAG + 'createBank:' + JSON.stringify(credential));
		this.ws.emit('register_bank', credential, (response) => {
			console.log(JSON.stringify(response));
			cb(response);
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