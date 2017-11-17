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

type Bank struct {
	ObjectType string `json:"docType"`
	Bankcode   string `json:"bankcode"`
	Bankname   string `json:"bankname"`
	Banktype   string `json:"banktype"`
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

	err := putBank(stub, SETTLEMENT, Bank{ObjectType: "bank", Bankcode: SETTLEMENT, Bankname: SETTLEMENT, Banktype: "admin"})
	if err != nil {
		return shim.Error(fmtErr("EXCEPTION", err.Error()))
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
	} else if function == "get_bank" {
		return get_bank(stub, args)
	} else if function == "get_banks" {
		return get_banks(stub, args)
	} else if function == "register_bank" {
		return register_bank(stub, args)
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

func get_bank(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	fmt.Println("get_bank Start")
	var bank Bank
	var err error
	
	if len(args) != 1 {
		return shim.Error(fmtErr("INVALID_PARAMETER","Incorrect arguments. Expecting a key"))
	}

	bank, err = getBank(stub, args[0])
	if err != nil {
		shim.Error(fmtErr("NOT_FOUND", "Failed to get bank"))
	}

	valueAsBytes, err := json.Marshal(bank)
	if err != nil {
		shim.Error(fmtErr("EXCEPTION", err.Error()))
	}

	fmt.Println("get_bank End")
	return shim.Success(valueAsBytes)
}

func get_banks(stub shim.ChaincodeStubInterface, args []string) peer.Response{
	fmt.Println("getBanks start")
	var banks []Bank
	memberBankResultsIterator, err := stub.GetStateByPartialCompositeKey("memberbank", []string{"bank"})
	if err != nil {
		return shim.Error(fmtErr("EXCEPTION", err.Error()))
	}
	defer memberBankResultsIterator.Close()

	// Iterate through result set and for each marble found, transfer to newOwner
	var i int
	for i = 0; memberBankResultsIterator.HasNext(); i++ {
		// Note that we don't get the value (2nd return variable), we'll just get the marble name from the composite key
		responseRange, err := memberBankResultsIterator.Next()
		if err != nil {
			return shim.Error(fmtErr("EXCEPTION", err.Error()))
		}

		// get the color and name from color~name composite key
		_, compositeKeyParts, err := stub.SplitCompositeKey(responseRange.Key)
		if err != nil {
			return shim.Error(fmtErr("EXCEPTION", err.Error()))
		}
		bankcode := compositeKeyParts[1]
		
		bank, err := getBank(stub, bankcode)
		if err != nil {
			return shim.Error(fmtErr("EXCEPTION", err.Error()))
		}

		banks = append(banks,bank)
	}

	banksAsBytes, _ := json.Marshal(banks)  

	fmt.Println("getBanks end")
	return shim.Success(banksAsBytes)
}

func register_bank(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	fmt.Println("create_bank Start")
	var bankcode, bankname string
	var bank Bank
	var err error

	if len(args) != 2 {
		return shim.Error(fmtErr("INVALID_PARAMETER","Incorrect number of arguments. Expecting 2. Key and user name."))
	}

	// input sanitation
	err = sanitize_arguments(args)
	if err != nil {
		return shim.Error(fmtErr("INVALID_PARAMETER",err.Error()))
	}

	bankcode = args[0]
	bankname = args[1]

	if AUDIT == bankcode || SETTLEMENT == bankcode{
		return shim.Error(fmtErr("BANK_NAME_NOT_AVAILABLE","The bank code is reserved."))
	}
	bank, err = getBank(stub, bankcode)
	if err != nil {
		return shim.Error(err.Error())
	}
	if bank.ObjectType == "bank" {
		return shim.Error(fmtErr("BANK_NAME_NOT_AVAILABLE","Bank is not available"))
	}

	bank = Bank{
		ObjectType: "bank",
		Bankcode: bankcode,
		Bankname: bankname,
		Banktype: "member",
	}

	err = putBank(stub, bankcode, bank)
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("create_bank End")
	return shim.Success(nil)
}

/**
 * @params args[0] string source bank code of sender
 *	args[1] string accountAddress of sender
 *	args[2] string name of sender
 *  args[3] string destination bank code of recipient
 *  args[4] string accountAddress of recipient
 *  args[5] string name of recipient
 *	args[6] int amount of transfer
 */
func transfer_funds(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	fmt.Println("transfer_funds Start")
	var sourceBankcode, destinationBankcode string
	var source, destination Bank
	var senderAddress, senderName, recipientAddress, recipientName string
	var transferAmount int
	var err error

	if len(args) != 7 {
		return shim.Error(fmtErr("INVALID_PARAMETER", "Incorrect number of arguments. Expecting 7."))
	}

	sourceBankcode = args[0]
	senderAddress = args[1]
	senderName = args[2]
	destinationBankcode = args[3]
	recipientAddress = args[4]
	recipientName = args[5]
	transferAmount, err = strconv.Atoi(args[6])
	if err != nil {
		return shim.Error(fmtErr("INVALID_PARAMETER", "Invalid type of augument. Expecting number type"))
	}

	source, err = getBank(stub, sourceBankcode)
	if err != nil || source.ObjectType != "bank" {
		return shim.Error(fmtErr("BANK_NOT_FOUND","Source Bank Not Found."))
	}

	destination, err = getBank(stub, destinationBankcode)
	if err != nil || destination.ObjectType != "bank" {
		return shim.Error(fmtErr("BANK_NOT_FOUND","Destination Bank Not Found."))
	}

	err = move_funds(stub,
		sourceBankcode, sourceBankcode, senderAddress, senderName,
		destinationBankcode, destinationBankcode, recipientAddress, recipientName,
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

func transfer_funds_to_external(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	fmt.Println("transfer_funds_to_external Start")
	var sourceBankcode, destinationBankcode string
	var source, destination Bank
	var senderAddress, senderName, recipientAddress, recipientName string
	var transferAmount int
	var err error

	if len(args) != 7 {
		return shim.Error(fmtErr("INVALID_PARAMETER", "Incorrect number of arguments. Expecting 7."))
	}

	sourceBankcode = args[0]
	senderAddress = args[1]
	senderName = args[2]
	destinationBankcode = args[3]
	recipientAddress = args[4]
	recipientName = args[5]
	transferAmount, err = strconv.Atoi(args[6])
	if err != nil {
		return shim.Error(fmtErr("INVALID_PARAMETER", "Invalid type of augument. Expecting number type"))
	}

	source, err = getBank(stub, sourceBankcode)
	if err != nil || source.ObjectType != "bank" {
		return shim.Error(fmtErr("BANK_NOT_FOUND","Source Bank Not Found."))
	}

	destination, err = getBank(stub, SETTLEMENT)
	if err != nil || destination.ObjectType != "bank" {
		return shim.Error(fmtErr("BANK_NOT_FOUND","Destination Bank Not Found."))
	}

	err = move_funds(stub,
		destinationBankcode, destinationBankcode, senderAddress, senderName,
		SETTLEMENT, destinationBankcode, recipientAddress, recipientName,
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
	var sourceBankcode, destinationBankcode string
	var source, destination Bank
	var senderAddress, senderName, recipientAddress, recipientName string
	var transferAmount int
	var err error

	if len(args) != 7 {
		return shim.Error(fmtErr("INVALID_PARAMETER", "Incorrect number of arguments. Expecting 7."))
	}

	sourceBankcode = args[0]
	senderAddress = args[1]
	senderName = args[2]
	destinationBankcode = args[3]
	recipientAddress = args[4]
	recipientName = args[5]
	transferAmount, err = strconv.Atoi(args[6])
	if err != nil {
		return shim.Error(fmtErr("INVALID_PARAMETER", "Invalid type of augument. Expecting number type"))
	}

	source, err = getBank(stub, SETTLEMENT)
	if err != nil || source.ObjectType != "bank" {
		return shim.Error(fmtErr("BANK_NOT_FOUND","Source Bank Not Found."))
	}

	destination, err = getBank(stub, destinationBankcode)
	if err != nil || destination.ObjectType != "bank" {
		return shim.Error(fmtErr("Bank_NOT_FOUND","Destination Bank Not Found."))
	}

	err = move_funds(stub,
		SETTLEMENT, sourceBankcode, senderAddress, senderName,
		destinationBankcode, destinationBankcode, recipientAddress, recipientName,
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
	fmt.Println("getHistoryFrom start")
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
	fmt.Println("getHistoryFrom end")
	return shim.Success(historyAsBytes)
}

func getAuditHistory(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	fmt.Println("getHistory start")
	type AuditHistory struct {
		TxId      string      `json:"txId"`
		Timestamp int64       `json:"timestamp"`
		Value     Transaction `json:"value"`
	}
	var history []AuditHistory;
	var transaction Transaction
	var offset,limit int
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
	fmt.Println("getHistory end")
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

func putBank(stub shim.ChaincodeStubInterface, bankcode string, bank Bank) error {
	fmt.Println("putBank: key -> " + bankcode)
	valueAsBytes, err := json.Marshal(bank)
	if err != nil {
		return err
	}
	err = stub.PutState("ACC_" + bankcode, []byte(valueAsBytes))
	if err != nil {
		return err
	}

	if bank.Banktype == "member" {
		indexName := "memberbank"
		memberBankIndexKey, err := stub.CreateCompositeKey(indexName, []string{"bank", bank.Bankcode})
		if err != nil {
			return err
		}
		value := []byte{0x00}
		stub.PutState(memberBankIndexKey, value)
	}
	
	return nil
}

func getBank(stub shim.ChaincodeStubInterface, bankcode string) (Bank, error){
	var bank Bank
	fmt.Println("getBank: " + bankcode)
	valueAsBytes, err := stub.GetState("ACC_" + bankcode)
	if err != nil {
		return bank, err
	}
	json.Unmarshal(valueAsBytes, &bank)
	return bank, nil
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