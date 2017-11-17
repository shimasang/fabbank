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

export const ACCOUNT_CREATE = '[ACCOUNT] CREATE';
export const ACCOUNT_CREATE_FAILURE = '[ACCOUNT] CREATE FAILURE';
export const ACCOUNT_LOGIN = '[ACCOUNT] LOGIN';
export const ACCOUNT_LOGIN_SUCCESS = '[ACCOUNT] LOGIN SUCCESS';
export const ACCOUNT_LOGIN_FAILURE = '[ACCOUNT] LOGIN FAILURE';
export const ACCOUNT_ADD_TRANSACTION = '[ACCOUNT] ADD TRANSACTION';
export const ACCOUNT_TRANSFER_FUNDS = '[ACCOUNT] TRANSFER FUNDS';
export const ACCOUNT_TRANSFER_FUNDS_TO_EXTERNAL = '[ACCOUNT] TRANSFER FUNDS TO EXTERNAL';

export class AccountCreate implements Action {
  readonly type = ACCOUNT_CREATE;
  constructor(public payload: any) { }
}
export class AccountCreateFailure implements Action {
  readonly type = ACCOUNT_CREATE_FAILURE;
  constructor(public payload: any) { }
}
export class AccountLogin implements Action {
  readonly type = ACCOUNT_LOGIN;
  constructor(public payload: any) { }
}
export class AccountLoginSuccess implements Action {
  readonly type = ACCOUNT_LOGIN_SUCCESS;
  constructor(public payload: any) { }
}
export class AccountLoginFailure implements Action {
  readonly type = ACCOUNT_LOGIN_FAILURE;
  constructor(public payload: any) { }
}
export class AccountAddTransaction implements Action {
  readonly type = ACCOUNT_ADD_TRANSACTION;
  constructor(public payload: any) { }
}
export class AccountTransferFunds implements Action {
  readonly type = ACCOUNT_ADD_TRANSACTION;
  constructor(public payload: any) { }
}
export class AccountTransferFundsToExternal implements Action {
  readonly type = ACCOUNT_ADD_TRANSACTION;
  constructor(public payload: any) { }
}

export type Actions =
  | AccountCreate
  | AccountLogin
  | AccountLoginSuccess
  | AccountLoginFailure
  | AccountAddTransaction
  | AccountTransferFunds
  | AccountTransferFundsToExternal

