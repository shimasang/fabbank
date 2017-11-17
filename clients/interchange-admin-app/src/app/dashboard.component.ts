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
import { Socket } from './socket';
import { MatDialog, MatDialogRef } from '@angular/material';
import { RegisterBankComponent } from './register-bank.component';

@Component({
	selector: 'dashboard',
	templateUrl: 'dashboard.component.html',
	styleUrls: ['dashboard.component.css']
})
export class DashboardComponent {

	public info = null;
	public channels = [];
	public peers = [];
	public users = [];
	public banks = [];
	public text = "";

	constructor(
		private socket: Socket,
		private dialog: MatDialog,
	) {

	}

	ngOnInit() {
		this.socket.subscribe('info', (response) =>this.updateInfo(response));
		this.socket.subscribe('bank', (response) => this.updateBank(response));
		this.socket.connect();
	}

	updateInfo(info) {
		console.log('updateInfo', info);
		this.info = info.payload;
		let count = 0;
		let rows = 1;

		this.channels = [];
		for(let c of info.payload.channels) {
			this.channels.push({
				'cols': 1, 'rows': 1, 'channel': c
			});			
		}

		this.peers = [];		
		for(let p of info.payload.peers) {
			this.peers.push({
				'cols': 1, 'rows': 1, 'peer': p
			});
		}

		count = 1;
		rows = 1;
		this.users = [];
		for(let user of info.payload.users) {
			if(count > 3) { rows += 1; count = 1; }
			this.users.push({
				'cols': 1, 'rows': rows, 'user': user
			});
		}
	}

	updateBank(response) {
		if(response.payload) {
			for(let bank of response.payload) {
				this.banks.push({
					'cols': 1, 'rows': 1, 'bank': bank
				});
			}
		}
	}

	onRegisterBank() {
		let dialogRef = this.dialog.open(RegisterBankComponent);
		dialogRef.afterClosed().subscribe(
			(result) => {
				if(result) {
					this.socket.createBank(result, (response) => this.registerBankResponseHandler(response, result));
				}
			}
		);
	}

	registerBankResponseHandler(response, result) {
		console.log('registerBankResponseHandler:', response);
		if(response.status == 'success' && response.payload.transactionId &&
			!response.payload.transactionId.match(/Failed/)) {

			this.banks.push({
				'cols': 1, 'rows': 1, 'bank': result});
		}
	}
}