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
package main

import (
	"fmt"
	"errors"
	"strconv"
	"encoding/json"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

const AUDIT string = "AUDIT"
const SETTLEMENT string = "SETTLEMENT"

type SimpleChaincode struct {

}

type Account struct {
	ObjectType string `json:"docType"`
	Username   string `json:"username"`
}

type Transaction struct {
	ObjectType string `json:"docType"`
	FromBank string   `json:"fromBank"`
	From string       `json:"from"`
	FromName string   `json:"fromName"`
	ToBank string     `json:"toBank"`
	To string         `json:"to"`
	ToName string   `json:"toName"`
	Amount int        `json:"amount"`
	Balance int       `json:"balance"`	
}

func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) peer.Response {
	fmt.Println("Account Init Start")

	settlementAccount := Account{ObjectType: "account", Username: "Settlement Account"}
	err := putAccount(stub, SETTLEMENT, settlementAccount)
	if err != nil {
		return shim.Error(fmtErr("EXCEPTION",err.Error()))
	}

	fmt.Println("Account Init End")
	return shim.Success(nil)
}

func initialize(stub shim.ChaincodeStubInterface,  args []string) peer.Response {
	return shim.Success(nil)
}

func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	fmt.Println("Account Invoke Start")
	function, args := stub.GetFunctionAndParameters()

	if function == "init" {
		return initialize(stub, args)
	} else if function == "get_account" {
		return get_account(stub, args)
	} else if function == "create_account" {
		return create_account(stub, args)
	} else if function == "transfer_funds" {
		return transfer_funds(stub, args)
	} else if function == "transfer_funds_to_external" {
		return transfer_funds_to_external(stub, args)
	} else if function == "transfer_funds_from_external" {
		return transfer_funds_from_external(stub, args)
	} else if function == "transfer_history" {
		return getHistory(stub, args)
	} else if function == "transfer_history_from" {
		return getHistoryFrom(stub, args)
	} else if function == "all_transfer_history" {
		return getAuditHistory(stub, args)
	} else if function == "all_transfer_history_from" {
		return getAuditHistoryFrom(stub, args)
	}

	fmt.Println("Account Invoke End")
	return shim.Error(fmtErr("FUNCTION_NOT_FOUND","function is not implemented."))
}

func get_account(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	fmt.Println("get_account Start")
	var account Account
	var err error
	
	if len(args) != 1 {
		return shim.Error(fmtErr("INVALID_PARAMETER","Incorrect arguments. Expecting a key"))
	}

	account, err = getAccount(stub, args[0])
	if err != nil {
		shim.Error(fmtErr("NOT_FOUND", "Failed to get asset"))
	}

	valueAsBytes, err := json.Marshal(account)
	if err != nil {
		shim.Error(fmtErr("EXCEPTION", err.Error()))
	}

	fmt.Println("get_account End")
	return shim.Success(valueAsBytes)
}

func create_account(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	fmt.Println("create_account Start")
	var key, username string
	var genesisTransaction Transaction
	var account Account
	var err error

	if len(args) != 2 {
		return shim.Error(fmtErr("INVALID_PARAMETER","Incorrect number of arguments. Expecting 2. Key and user name."))
	}

	// input sanitation
	err = sanitize_arguments(args)
	if err != nil {
		return shim.Error(fmtErr("INVALID_PARAMETER",err.Error()))
	}

	key = args[0]
	username = args[1]

	if AUDIT == key || SETTLEMENT == key{
		return shim.Error(fmtErr("ACCOUNT_NAME_NOT_AVAILABLE","The key is reserved."))
	}
	account, err = getAccount(stub, key)
	if err != nil {
		return shim.Error(err.Error())
	}
	if account.ObjectType == "account" {
		return shim.Error(fmtErr("ACCOUNT_NAME_NOT_AVAILABLE","Account is not available"))
	}else{
		fmt.Println("Account: " + account.ObjectType + ", Username" + account.Username)
	}

	account = Account{
		ObjectType: "account",
		Username: username,
	}

	err = putAccount(stub, key, account)
	if err != nil {
		return shim.Error(err.Error())
	}

	genesisTransaction = Transaction{
		ObjectType: "transaction",
		From: "GENESIS",
		FromName: "genesis",
		To: key,
		ToName: username,
		Amount: 10000,
		Balance: 10000,
	}
	err = putTransaction(stub, key, genesisTransaction)
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("create_account End")
	return shim.Success(nil)
}

/**
 * @params args[0] string accountAddress of sender
 *	args[1] string accountAddress of recipient
 *	args[2] int amount of transfer
 */
func transfer_funds(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	fmt.Println("transfer_funds Start")
	var sender, recipient Account
	var senderAddress, recipientAddress string
	var transferAmount int
	var err error

	if len(args) != 3 {
		return shim.Error(fmtErr("INVALID_PARAMETER", "Incorrect number of arguments. Expecting 4. senderAddress, recipientAddress, transferAmount"))
	}

	senderAddress = args[0]
	recipientAddress = args[1]
	transferAmount, err = strconv.Atoi(args[2])
	if err != nil {
		return shim.Error(fmtErr("INVALID_PARAMETER", "Invalid type of augument. Expecting number type"))
	}

	sender, err = getAccount(stub, senderAddress)
	fmt.Println("ObjectType: " + sender.ObjectType);
	if err != nil || sender.ObjectType != "account" {
		fmt.Println(sender)
		return shim.Error(fmtErr("ACCOUNT_NOT_FOUND","Sender Not Found."))
	}

	recipient, err = getAccount(stub, recipientAddress)
	if err != nil || recipient.ObjectType != "account" {
		return shim.Error(fmtErr("ACCOUNT_NOT_FOUND","Recipient Not Found."))
	}

	err = move_funds(stub,
		senderAddress, "", senderAddress, sender.Username,
		recipientAddress, "", recipientAddress, recipient.Username,
		transferAmount)
	if err != nil {
		return shim.Error(fmtErr("EXCEPTION", err.Error()))
	}

	return shim.Success(nil)
}

func move_funds(stub shim.ChaincodeStubInterface, 
	senderKey string, senderBankcode string, senderAddress string, senderName string,
	recipientKey string, recipientBankcode string, recipientAddress string, recipientName string,
	transferAmount int) error {

		var senderTransaction, recipientTransaction Transaction
		var valueAsBytes []byte
		var err error;

		valueAsBytes, err = stub.GetState("TX_" + senderKey)
		if err != nil {
			return errors.New(fmtErr("EXCEPTION", err.Error()))
		}
		json.Unmarshal(valueAsBytes, &senderTransaction)
	
		if senderTransaction.ObjectType != "transaction" {
			senderTransaction.ObjectType = "transaction"
			senderTransaction.Balance = 0
		}
		senderTransaction.From = senderAddress
		senderTransaction.FromBank = senderBankcode
		senderTransaction.FromName = senderName
		senderTransaction.To = recipientAddress
		senderTransaction.ToBank = recipientBankcode
		senderTransaction.ToName = recipientName
		senderTransaction.Amount = transferAmount
		senderTransaction.Balance -= transferAmount
	
		err = putTransaction(stub, senderKey, senderTransaction)
		if err != nil {
			return errors.New(fmtErr("EXCEPTION", err.Error()))
		}
	
		valueAsBytes, err = stub.GetState("TX_" + recipientKey)
		if err != nil {
			return errors.New(fmtErr("EXCEPTION", err.Error()))
		}
		json.Unmarshal(valueAsBytes, &recipientTransaction)
		
		if recipientTransaction.ObjectType != "transaction" {
			recipientTransaction.ObjectType = "transaction"
			recipientTransaction.Balance = 0
		}
		recipientTransaction.From = senderAddress
		recipientTransaction.FromBank = senderBankcode
		recipientTransaction.FromName = senderName
		recipientTransaction.To = recipientAddress
		recipientTransaction.ToBank = recipientBankcode
		recipientTransaction.ToName = recipientName
		recipientTransaction.Amount = transferAmount
		recipientTransaction.Balance += transferAmount
	
		err = putTransaction(stub, recipientKey, recipientTransaction)
		if err != nil {
			return errors.New(fmtErr("EXCEPTION", err.Error()))
		}
	
		// Writes the transaction for auditors.
		senderTransaction.Balance = 0
		err = putTransaction(stub, AUDIT, senderTransaction)
		if err != nil {
			return errors.New(fmtErr("EXCEPTION", err.Error()))
		}

		return nil
}

/**
 * @params args[0] string accountAddress of sender
 *	args[1] string accountAddress of recipient
 *  args[2] string bank code of destination bank
 *	args[3] int amount of transfer
 */
 func transfer_funds_to_external(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	fmt.Println("transfer_funds_to_external Start")
	var sender, recipient Account
	var senderAddress, recipientAddress, recipientName, destinationBank string
	var transferAmount int
	var err error

	if len(args) != 5 {
		return shim.Error(fmtErr("INVALID_PARAMETER", "Incorrect number of arguments. Expecting 5. senderAddress, recipientAddress, recipientBank, transferAmount"))
	}

	senderAddress = args[0]
	recipientAddress = args[1]
	recipientName = args[2]
	destinationBank = args[3]
	transferAmount, err = strconv.Atoi(args[4])
	if err != nil {
		return shim.Error(fmtErr("INVALID_PARAMETER", "Invalid type of augument. Expecting number type"))
	}

	sender, err = getAccount(stub, senderAddress)
	if err != nil || sender.ObjectType != "account" {
		return shim.Error(fmtErr("ACCOUNT_NOT_FOUND","Sender Not Found."))
	}

	recipient, err = getAccount(stub, SETTLEMENT)
	if err != nil || recipient.ObjectType != "account" {
		return shim.Error(fmtErr("ACCOUNT_NOT_FOUND","Recipient Not Found."))
	}

	err = move_funds(stub,
		senderAddress, "", senderAddress, sender.Username,
		SETTLEMENT, destinationBank, recipientAddress, recipientName,
		transferAmount)
	if err != nil {
		return shim.Error(fmtErr("EXCEPTION", err.Error()))
	}

	fmt.Println("transfer_funds_to_external end")
	return shim.Success(nil)
}

/**
 * @params args[0] string accountAddress of sender
 *	args[1] string accountAddress of recipient
 *  args[2] string bank code of source bank
 *	args[3] int amount of transfer
 */
 func transfer_funds_from_external(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	fmt.Println("transfer_funds_from_external Start")
	var sender, recipient Account
	var senderAddress, senderName, recipientAddress, sourceBank string
	var transferAmount int
	var err error

	if len(args) != 5 {
		return shim.Error(fmtErr("INVALID_PARAMETER", "Incorrect number of arguments. Expecting 5. senderAddress, recipientAddress, recipientBank, transferAmount"))
	}

	senderAddress = args[0]
	senderName = args[1]
	recipientAddress = args[2]
	sourceBank = args[3]
	transferAmount, err = strconv.Atoi(args[4])
	if err != nil {
		return shim.Error(fmtErr("INVALID_PARAMETER", "Invalid type of augument. Expecting number type"))
	}

	sender, err = getAccount(stub, SETTLEMENT)
	if err != nil || sender.ObjectType != "account" {
		return shim.Error(fmtErr("ACCOUNT_NOT_FOUND","Sender Not Found."))
	}

	recipient, err = getAccount(stub, recipientAddress)
	if err != nil || recipient.ObjectType != "account" {
		return shim.Error(fmtErr("ACCOUNT_NOT_FOUND","Recipient Not Found."))
	}

	err = move_funds(stub,
		SETTLEMENT, sourceBank, senderAddress, senderName,
		recipientAddress, "", recipientAddress, recipient.Username,
		transferAmount)
	if err != nil {
		return shim.Error(fmtErr("EXCEPTION", err.Error()))
	}

	fmt.Println("transfer_funds_from_external end")
	return shim.Success(nil)
}

func getHistory(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	fmt.Println("getHistory start")
	type AuditHistory struct {
		TxId      string      `json:"txId"`
		Timestamp int64       `json:"timestamp"`
		Value     Transaction `json:"value"`
	}
	var history []AuditHistory;
	var transaction Transaction

	if len(args) != 1 {
		return shim.Error(fmtErr("INVALID_PARAMETER", "Incorrect number of arguments. Expecting 1"))
	}

	key := args[0]
	fmt.Printf("- start getHistoryForTransaction: %s\n", key)

	// Get History
	resultsIterator, err := stub.GetHistoryForKey("TX_" + key)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	for resultsIterator.HasNext() {
		historyData, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		var tx AuditHistory
		tx.TxId = historyData.TxId
		tx.Timestamp = historyData.Timestamp.Seconds
		json.Unmarshal(historyData.Value, &transaction)
		if historyData.Value == nil {
			var emptyTransaction Transaction
			tx.Value = emptyTransaction
		} else {
			json.Unmarshal(historyData.Value, &transaction)
			tx.Value = transaction
		}
		history = append([]AuditHistory{tx}, history...)
	}

	historyAsBytes, _ := json.Marshal(history)
	fmt.Println("getHistory end")
	return shim.Success(historyAsBytes)
}

func getHistoryFrom(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	fmt.Println("getHistory start")
	type AuditHistory struct {
		TxId      string      `json:"txId"`
		Timestamp int64       `json:"timestamp"`
		Value     Transaction `json:"value"`
	}
	var history []AuditHistory;
	var transaction Transaction

	if len(args) != 2 {
		return shim.Error(fmtErr("INVALID_PARAMETER", "Incorrect number of arguments. Expecting 2. Account Id and Transaction ID"))
	}

	key := args[0]
	latestTxId := args[1]
	fmt.Printf("- start getHistoryForTransaction: %s\n", key)

	// Get History
	resultsIterator, err := stub.GetHistoryForKey("TX_" + key)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	var ignore bool = true;
	for resultsIterator.HasNext() {
		historyData, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		fmt.Println(historyData.TxId)
		fmt.Println(historyData.Timestamp.Seconds)

		if ignore {
			fmt.Printf("Skip %s\n", historyData.TxId)
			if historyData.TxId == latestTxId {
				ignore = false
			}
		
		}else{
			var tx AuditHistory
			tx.TxId = historyData.TxId
			tx.Timestamp = historyData.Timestamp.Seconds
			json.Unmarshal(historyData.Value, &transaction)
			if historyData.Value == nil {
				var emptyTransaction Transaction
				tx.Value = emptyTransaction
			} else {
				json.Unmarshal(historyData.Value, &transaction)
				tx.Value = transaction
			}
			history = append(history, tx)
		}
	}

	historyAsBytes, _ := json.Marshal(history)
	fmt.Println("getHistory end")
	return shim.Success(historyAsBytes)
}

func getAuditHistory(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	fmt.Println("getAuditHistory start")
	type AuditHistory struct {
		TxId      string      `json:"txId"`
		Timestamp int64       `json:"timestamp"`
		Value     Transaction `json:"value"`
	}
	var history []AuditHistory;
	var transaction Transaction
	var offset, limit int
	var err error

	if len(args) != 2 {
		return shim.Error(fmtErr("INVALID_PARAMETER", "Incorrect number of arguments. Expecting 2"))
	}

	offset, err = strconv.Atoi(args[0])
	if err != nil {
		return shim.Error(fmtErr("INVALID_PARAMETER", "Invalid type of augument. Expecting number type"))
	}
	limit, err = strconv.Atoi(args[1])
	if err != nil {
		return shim.Error(fmtErr("INVALID_PARAMETER", "Invalid type of augument. Expecting number type"))
	}

	// Get History
	resultsIterator, err := stub.GetHistoryForKey("TX_" + AUDIT)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	for resultsIterator.HasNext() {
		historyData, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		var tx AuditHistory
		tx.TxId = historyData.TxId
		tx.Timestamp = historyData.Timestamp.Seconds
		json.Unmarshal(historyData.Value, &transaction)
		if historyData.Value == nil {
			var emptyTransaction Transaction
			tx.Value = emptyTransaction
		} else {
			json.Unmarshal(historyData.Value, &transaction)
			tx.Value = transaction
		}
		history = append([]AuditHistory{tx}, history...)
	
	}
	
	if len(history) < limit {
		limit = len(history)
	}

	historyAsBytes, _ := json.Marshal(history[offset:limit])
	fmt.Println("getAuditHistory end")
	return shim.Success(historyAsBytes)
}

func getAuditHistoryFrom(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	fmt.Println("getAuditHistory start")
	type AuditHistory struct {
		TxId      string      `json:"txId"`
		Timestamp int64       `json:"timestamp"`
		Value     Transaction `json:"value"`
	}
	var history []AuditHistory;
	var transaction Transaction
	var latestTxId string
	var limit int
	var err error
	var ignore bool = true;

	if len(args) != 2 {
		return shim.Error(fmtErr("INVALID_PARAMETER", "Incorrect number of arguments. Expecting 2"))
	}

	latestTxId = args[0]
	limit, err = strconv.Atoi(args[1])
	if err != nil {
		return shim.Error(fmtErr("INVALID_PARAMETER", "Invalid type of augument. Expecting number type"))
	}

	// Get History
	resultsIterator, err := stub.GetHistoryForKey("TX_" + AUDIT)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	for resultsIterator.HasNext() {
		historyData, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		if ignore {
			fmt.Printf("Skip %s\n", historyData.TxId)
			if historyData.TxId == latestTxId {
				ignore = false
			}

		}else if len(history) > limit {
			break;

		}else{
			var tx AuditHistory
			tx.TxId = historyData.TxId
			tx.Timestamp = historyData.Timestamp.Seconds
			json.Unmarshal(historyData.Value, &transaction)
			if historyData.Value == nil {
				var emptyTransaction Transaction
				tx.Value = emptyTransaction
			} else {
				json.Unmarshal(historyData.Value, &transaction)
				tx.Value = transaction
			}
			history = append(history,tx)
		}
	}

	historyAsBytes, _ := json.Marshal(history)
	fmt.Println("getAuditHistory end")
	return shim.Success(historyAsBytes)
}

func putAccount(stub shim.ChaincodeStubInterface, addressKey string, account Account) error {
	fmt.Println("putAccount: key -> " + addressKey)
	valueAsBytes, err := json.Marshal(account)
	if err != nil {
		return err
	}
	err = stub.PutState("ACC_" + addressKey, []byte(valueAsBytes))
	if err != nil {
		return err
	}

	return nil
}

func getAccount(stub shim.ChaincodeStubInterface, addressKey string) (Account, error){
	var account Account
	fmt.Println("getAccount: " + addressKey)
	valueAsBytes, err := stub.GetState("ACC_" + addressKey)
	if err != nil {
		return account, err
	}
	json.Unmarshal(valueAsBytes, &account)
	fmt.Println("getAccount: " + account.ObjectType + ", Username: " + account.Username)
	return account, nil
}

func putTransaction(stub shim.ChaincodeStubInterface, addressKey string, tx Transaction) error {
	valueAsBytes, err := json.Marshal(tx)
	if err != nil {
		return err
	}
	err = stub.PutState("TX_" + addressKey, []byte(valueAsBytes))
	if err != nil {
		return err
	}

	return nil
}

func sanitize_arguments(strs []string) error{
	for i, val:= range strs {
		if len(val) <= 0 {
			return errors.New("Argument " + strconv.Itoa(i) + " must be a non-empty string")
		}
		if len(val) > 32 {
			return errors.New("Argument " + strconv.Itoa(i) + " must be <= 32 characters")
		}
	}
	return nil
}

func fmtErr(code string, msg string) string {
	return "{\"code\":\""+ code +"\",\"message\":\"" + msg + "\"}"
}

func main() {
	if err := shim.Start(new(SimpleChaincode)); err != nil {
		fmt.Printf("Error starting SimpleChaincode chaincode: %s", err)
	}
}