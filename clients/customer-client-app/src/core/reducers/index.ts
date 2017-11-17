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
import { ActionReducerMap } from '@ngrx/store';
import * as fromAccount from './account.reducer';
import * as fromTransaction from './transaction.reducer';

export interface State {
	account: fromAccount.State,
	transactions: fromTransaction.State
}

export const reducers: ActionReducerMap<State> = {
	account: fromAccount.reducer,
	transactions: fromTransaction.reducer
};