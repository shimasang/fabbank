/**
	Copyright 2017 (C) 2017 Yoshihide Shimada <yoshihide.shimada@ieee.org>

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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';

@Component({
	selector: 'transfer-funds',
	templateUrl: 'transfer.component.html',
	styleUrls: ['transfer.component.css']
})
export class TransferComponent {
	public transferForm: FormGroup;

	constructor(
		private formBuilder: FormBuilder,
		public dialogRef: MatDialogRef<TransferComponent>
	) { }

	ngOnInit() {
		this.transferForm = this.formBuilder.group({
			'toBank': [''],
			'to': ['',Validators.compose([Validators.required])],
			'toName': ['',Validators.compose([Validators.required])],
			'amount': ['',Validators.compose([Validators.required])]
		});
	}
	
	onSubmit(value, isValid) {
		if(isValid) {
			this.dialogRef.close(value);			
		}
	}
}