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
import SocketIO from 'socket.io-client';
import { environment } from '../environments/environment';
import { NotificationsService } from 'angular2-notifications';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private ws;
  public transactions = [];
  public options = {
		position: ["top", "right"],
		timeOut: 5000,
		lastOnBottom: true
  }
  
  constructor(private notify: NotificationsService) {

  }

  ngOnInit() {
    console.log(environment.apiEndpoint)
    this.ws = SocketIO(environment.apiEndpoint);
    this.ws.on('connect', (data) => {
      console.log(`connected to ${environment.apiEndpoint}`);
      this.initTransactionHistory();
    });

    this.ws.on('transaction', (data) => {
      console.log('transaction is coming!!' + JSON.stringify(data));
      this.notify.info('Transaction', `transfer $${data[3]}.00 to ${data[2]} from ${data[1]}.`);
      this.getLatestTransaction();
    });
  }

  initTransactionHistory() {
    console.log('initTransactionHistory');
    this.ws.emit('all_transfer_history', null,(response) => {
      console.log('console:', response);
      this.transactions = response.message;
    });
  }

  getLatestTransaction() {
    console.log('getLatestTransaction');
    if(this.transactions.length == 0) {
      this.initTransactionHistory();
    }

    let latest = this.transactions[0];
    let args = {
      txId: latest.txId,
      limit: 100
    };
    console.log('latest tx:', args);
    this.ws.emit('all_transfer_history_from', args,(response) => {
      console.log('console:', response);
      if(Array.isArray(response.message)) {
        for(let tx of response.message) {
          this.transactions.unshift(tx);
        }
      }
    });
  }
  
  ngOnDestroy() {
    this.ws.close();
  }

}
