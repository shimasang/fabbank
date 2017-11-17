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
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions, toPayload } from '@ngrx/effects';
import { Subject } from 'rxjs/Subject';
import * as AccountReducer from '../../core/reducers/account.reducer';
import * as TransactionAction from '../../core/actions/transaction.action';
import * as TransactionReducer from '../../core/reducers/transaction.reducer';
import { NotificationsService } from 'angular2-notifications';
import { MatDialog, MatDialogRef } from '@angular/material';
import { TransferComponent } from '../transfer/transfer.component';
import { Transaction } from '../../core/models/transaction';
import { DashboardListComponent } from '../dashboard-list/dashboard-list.component';

@Component({
	selector: 'dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
	private TAG: string = 'DashboardComponent:';
	public account$;
	public transactions$;
	public accountId;
	public options = {
		position: ["top", "right"],
		timeOut: 5000,
		lastOnBottom: true
	}
	private onDestroy = new Subject();

	constructor(
		private _accountStore: Store<AccountReducer.State>,
		private _txStore: Store<TransactionReducer.State>,
		private _service: NotificationsService,
		private dialog: MatDialog,
		private actions$: Actions
	) { }

	ngOnInit() {
		this.account$ = this._accountStore.select(AccountReducer.getAccount);
		this.transactions$ = this._txStore.select(TransactionReducer.getTransaction);

		this._accountStore.select(AccountReducer.getAccount).subscribe((accountState) => this.accountId = accountState.accountId);
		this.actions$
			.ofType(TransactionAction.TRANSACTION_INCOMING)
			.map(toPayload)
			.subscribe(payload => {
				console.log(this.TAG,payload);
				if(this.accountId == payload.to) {
					this._service.info('Transaction', `You have got $${payload.amount}.00 from ${payload.from}.`);
				}
			});
	}

	ngOnDestroy() {
		console.log(this.TAG + "ngOnDestroy")
		this.onDestroy.next();
	}

	onTransfer() {
		console.log(this.TAG + 'onTransfer');
		let dialogRef = this.dialog.open(TransferComponent);
		dialogRef.afterClosed().subscribe(
			(result) => {
				this._service.info('Transfer Funds', `You will transfer $${result.amount}.00 to ${result.toName}.`);

				this.actions$
					.ofType(TransactionAction.TRANSACTION_TRANSFER_FUNDS_SUCCESS)
					.takeUntil(this.onDestroy)
					.subscribe(action => {
						this._service.success('SUCCESS');
						this.onDestroy.next();
					});

				this.actions$
					.ofType(TransactionAction.TRANSACTION_TRANSFER_FUNDS_FAILURE)
					.takeUntil(this.onDestroy)
					.map(toPayload)
					.subscribe(payload => {

						if(payload && payload.payload) {
							  this._service.error('Error', payload.payload.message);
						}else{
							this._service.error('Error', payload)
						}
						this.onDestroy.next();
					});

				this._txStore.dispatch(new TransactionAction.TransactionTransferFunds(result));
			}
		);
	}
}