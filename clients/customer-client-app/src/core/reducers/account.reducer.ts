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
import * as AccountAction from '../actions/account.action';

export interface State {
	account: {
		accountId: string,
		username: string
	}
}

export const initialState: State = {
	account: {
		accountId: null,
		username: null
	}
}

export function reducer(state = initialState, action: AccountAction.Actions): State {
	switch (action.type) {
	
		case AccountAction.ACCOUNT_LOGIN_SUCCESS: {
		  if (Object.keys(action.payload).length === 0) { return state }
		  return Object.assign(state, {
				state: Object.assign(state.account, action.payload)
		  });
		}

		default: {
		  return state;
		}
	}
}

export const getState = createFeatureSelector<State>('account');
export const getAccount = createSelector(getState, (state: State) => state.account);