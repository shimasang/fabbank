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
import { Action, createSelector, createFeatureSelector } from '@ngrx/store';
import * as TransactionAction from '../actions/transaction.action';
import { Transaction } from '../models/transaction';

export interface State {
	balance: number,
	transactions: Array<Transaction>
}

export const initialState: State = {
	balance: 0,
	transactions: []
}

export function reducer(state = initialState, action: TransactionAction.Actions): State {
	switch (action.type) {
	
		case TransactionAction.TRANSACTION_RESET: {
			console.log(TransactionAction.TRANSACTION_RESET);
			console.log('payload', action.payload);
			state.transactions.length = 0;
			for(let tx of action.payload) {
				state.transactions.push(tx);
			}
			if( state.transactions.length > 0) {
				console.log('balance update');
				state.balance += state.transactions[state.transactions.length - 1].balance;
				console.log('balance: ' + state.balance);
			}
		  return state;
		}

		case TransactionAction.TRANSACTION_ADD: {
			if (!action.payload) { return state }
			state.transactions.unshift(action.payload);
			state.balance = action.payload.balance;
			return state;
		}

		default: {
		  return state;
		}
	}
}

export const getState = createFeatureSelector<State>('transactions');
export const getTransaction = createSelector(getState, (state: State) => state.transactions);
export const getBalance = createSelector(getState, (state: State) => state.balance);
