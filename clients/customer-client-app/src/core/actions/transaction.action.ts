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
import { Action } from '@ngrx/store';
import { Transaction } from '../models/transaction';

export const TRANSACTION_TRANSFER_FUNDS = '[TRANSACTION] TRANSFER FUNDS';
export const TRANSACTION_TRANSFER_FUNDS_SUCCESS = '[TRANSACTION] TRANSFER FUNDS SUCCESS';
export const TRANSACTION_TRANSFER_FUNDS_FAILURE = '[TRANSACTION] TRANSFER FUNDS FAILURE';
export const TRANSACTION_ADD = '[TRANSACTION] ADD';
export const TRANSACTION_INCOMING = '[TRANSACTION] INCOMING';
export const TRANSACTION_HISTORY_ALL = '[TRANSACTION] HISTORY ALL';
export const TRANSACTION_HISTORY = '[TRANSACTION] HISTORY';
export const TRANSACTION_HISTORY_DONE = '[TRANSACTION] TRANSACTION_HISTORY_DONE';
export const TRANSACTION_RESET = '[TRANSACTION] RESET';

export class TransactionTransferFunds implements Action {
	readonly type = TRANSACTION_TRANSFER_FUNDS;
	constructor(public payload: TransferFundsRequest) { }
}
export class TransactionTransferFundsSuccess implements Action {
	readonly type = TRANSACTION_TRANSFER_FUNDS_SUCCESS;
	constructor(public payload: any) { }
}
export class TransactionTransferFundsFailure implements Action {
	readonly type = TRANSACTION_TRANSFER_FUNDS_FAILURE;
	constructor(public payload: any) { }
}
export class TransactionReset implements Action {
	readonly type = TRANSACTION_RESET;
	constructor(public payload: any) { }
}
export class TransactionIncoming implements Action {
	readonly type = TRANSACTION_INCOMING;
	constructor(public payload: Transaction) { }
}
export class TransactionAdd implements Action {
	readonly type = TRANSACTION_ADD;
	constructor(public payload: Transaction) { }
}
export class TransactionHistoryAll implements Action {
	readonly type = TRANSACTION_HISTORY_ALL;
	constructor(public payload: any) { }
}
export class TransactionHistory implements Action {
	readonly type = TRANSACTION_HISTORY;
	constructor(public payload: any) { }
}
export class TransactionHistoryDone implements Action {
	readonly type = TRANSACTION_HISTORY_DONE;
	constructor(public payload: any) { }
}

export interface TransferFundsRequest {
	toBank: string,
	to: string,
	toName: string,
	amount: number
}

export type Actions = TransactionTransferFunds
	| TransactionReset
	| TransactionIncoming
	| TransactionAdd
	| TransactionHistoryAll
	| TransactionHistory
	| TransactionHistoryDone