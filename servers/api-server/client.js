const io = require('socket.io-client');
const socket = io('http://localhost:12001');

// const login = function(accountId) {
// 	socket.emit('login', {'accountId': accountId}, (res) => {
// 		console.log(JSON.stringify(res));
// 		socket.emit('transfer', {"to": "DAQ", "amount": "323"},(res) => {
// 			console.log(JSON.stringify(res));
			
// 		});
// 	});
// }

// const createAccount = function(accountId, username) {
// 	socket.emit('create', {'accountId': accountId, 'username': username}, (res) => {console.log("response", res);});
// }

const getInfo = function() {
	socket.emit('get_info',null,(response) => {
		console.log(JSON.stringify(response));
	});
}

const audit = function() {
	socket.emit('audit',null,(response) => {
		console.log(JSON.stringify(response));
	});
}

const auditFrom = function() {
	let args = {txId: 'db97f186154d463cb0299ec7f52991e99987734df9064f3c7494002c25e3a98e'};
	socket.emit('all_transfer_history_from',args,(response) => {
		console.log(JSON.stringify(response));
	});
}

const registerBank = function() {
	let bank  = {
		'bankcode': 'JPBANK',
		'bankname': 'jpbank'
	};
	socket.emit('register_bank', bank, (res) => {
		console.log(JSON.stringify(res));
	});
}

const getBank = function() {
	let bank  = {
		'bankcode': 'JPBANK',
	};
	socket.emit('get_bank', bank, (res) => {
		console.log(JSON.stringify(res));
	});
}

socket.on('connect', () => {
	console.log("connected");

//	getInfo();
//	registerBank();
	audit();
	auditFrom();
//	getBank();
});

// socket.on('transaction', (data) => {
// 	console.log(JSON.stringify(data));
// });