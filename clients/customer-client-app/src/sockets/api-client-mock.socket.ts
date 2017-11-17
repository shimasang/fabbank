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
import { Config } from '../app/app.config';
import { Observable } from 'rxjs/Observable';
import { TransferFundsRequest } from '../core/actions/transaction.action';
import { Transaction } from '../core/models/transaction';

@Injectable()
export class ApiClientMockSocket {
	private TAG: string = 'APIService:';
	private ws;

	constructor() {
	}

	public createAccount(credential) {
		console.log(this.TAG + 'createAccount');
		return Observable.create((ob) => ob.next({ 'accountId': credential.accountId, 'username': credential.username }))
	}

	public login(accountId): Observable<any> {
		console.log(this.TAG + 'login');
		return Observable.create((ob) => ob.next({ status: 'success', message: { 'accountId': '000000', 'username': 'Yoshi' }}   ));
	}

	public transferFunds(transaction: TransferFundsRequest) {
		console.log(this.TAG + 'transferFunds');
		return Observable.create((ob) => ob.next());
	}

	public retrieveHistory(argument) {
		console.log(this.TAG + 'retrieveHistory');
		return Observable.create((ob) => ob.next([]));

  }
  
  public retrieveHistoryAll(){
    console.log(this.TAG + 'retrieveHistoryAll')
    return Observable.create((ob) => ob.next(mock))
  }


}


const mock = {
  status: 'success',
  message: [
    {
      txId: 'abcIDxxxxx012345',
      timestamp: 1510498800,
      value: {
        fromBank: 'aaaaa',
        from: 'from001',
        fromName: 'from name',
        toBank: 'bbbbb',
        to: 'to001',
        toName: 'to name',
        amount: 100,
        balance: 500
      }  
    },
    {
      txId: 'abcIDxxxxx987656',
      timestamp: 1510499800,
      value: {
        fromBank: 'aaaaa',
        from: 'from001',
        fromName: 'from name',
        toBank: 'bbbbb',
        to: 'a',
        toName: 'to name',
        amount: 100,
        balance: 200
      }  
    },
  ]
}