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
package main

import (
	"fmt"
	"encoding/json"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

type SimpleChaincode struct {
	
}

type Bank struct {
	ObjectType string `json:"docType"`
	Bankcode   string `json:"bankcode"`
	Bankname   string `json:"bankname"`
	External   bool `json:"external"`
}

func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) peer.Response {
	fmt.Println("Bank Init start")
	var bankcode, bankname string

	args := stub.GetStringArgs()
	if len(args) != 2 {
		return shim.Error(fmtErr("INVALID_PARAMETER","Incorrect arguments. Expecting two."))
	}

	bankcode = args[0]
	bankname = args[1]

	myBank := Bank{ ObjectType: "bank", Bankcode: bankcode, Bankname: bankname, External: false }
	usBank := Bank{ ObjectType: "bank", Bankcode: "USBANK", Bankname: "US Bank", External: true }
	hsBank := Bank{ ObjectType: "bank", Bankcode: "HSBCBANK", Bankname: "HSBC Bank", External: true }

	putBank(stub, myBank.Bankcode, myBank)
	putBank(stub, usBank.Bankcode, usBank)
	putBank(stub, hsBank.Bankcode, hsBank)

	fmt.Println("Bank Init end")
	return shim.Success(nil)
}

func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	fmt.Println("Invoke start")
	function, args := stub.GetFunctionAndParameters()

	if function == "get_bank" {
		return retrieveBank(stub, args)
	} else if function == "get_external_bank" {
		return getExternalBanks(stub, args)
	} else if function == "register_bank" {

	} else if function == "delete_bank" {

	} else {

	}

	fmt.Println("Invoke snd")
	return shim.Success(nil)
}

func retrieveBank(stub shim.ChaincodeStubInterface, args []string) peer.Response{
	fmt.Println("Bank getBank start")

	if len(args) != 1 {
		return shim.Error(fmtErr("INVALID_PARAMETER","Incorrect arguments. Expecting a key"))
	}

	valueAsBytes, err := stub.GetState("BANK_" + args[0])
	if err != nil {
		return shim.Error(fmtErr("EXCEPTION",err.Error()))
	}
	if valueAsBytes == nil {
		return shim.Error(fmtErr("NOT_FOUND", args[0] + " not found."))
	}
	
	fmt.Println("Bank getBank end")
	return shim.Success(valueAsBytes)
}

func getExternalBanks(stub shim.ChaincodeStubInterface, args []string) peer.Response{
	fmt.Println("Bank getExternalBanks start")
	var banks []Bank
	externalBankResultsIterator, err := stub.GetStateByPartialCompositeKey("external~bankcode", []string{"external"})
	if err != nil {
		return shim.Error(fmtErr("EXCEPTION", err.Error()))
	}
	defer externalBankResultsIterator.Close()

	// Iterate through result set and for each marble found, transfer to newOwner
	var i int
	for i = 0; externalBankResultsIterator.HasNext(); i++ {
		// Note that we don't get the value (2nd return variable), we'll just get the marble name from the composite key
		responseRange, err := externalBankResultsIterator.Next()
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

	fmt.Println("Bank getExternalBanks end")
	return shim.Success(banksAsBytes)
}

func registerBank(stub shim.ChaincodeStubInterface, args []string) peer.Response{
	return shim.Success(nil)
}

func getBank(stub shim.ChaincodeStubInterface, bankcode string) (Bank, error){
	fmt.Println("Bank getBank start")
	var bank Bank
	valueAsBytes, err := stub.GetState("BANK_" + bankcode)
	if err != nil {
		return bank, err
	}

	json.Unmarshal(valueAsBytes, &bank)
	
	fmt.Println("Bank getBank end")
	return bank, nil
}

func putBank(stub shim.ChaincodeStubInterface, bankcode string, bank Bank) error {
	valueAsBytes, err := json.Marshal(bank)
	if err != nil {
		return err
	}
	err = stub.PutState("BANK_" + bankcode, []byte(valueAsBytes))
	if err != nil {
		return err
	}

	if bank.External {
		indexName := "external~bankcode"
		externalBankIndexKey, err := stub.CreateCompositeKey(indexName, []string{"external", bank.Bankcode})
		if err != nil {
			return err
		}
		value := []byte{0x00}
		stub.PutState(externalBankIndexKey, value)
	}

	return nil
}

func fmtErr(code string, msg string) string {
	return "{code:\""+ code +"\",message:\"" + msg + "\"}"
}

func main() {
	if err := shim.Start(new(SimpleChaincode)); err != nil {
		fmt.Printf("Error starting SimpleChaincode chaincode: %s", err)
	}
}