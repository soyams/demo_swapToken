//SPDX-License-Identifier:MIT
pragma solidity ^0.8.19;

contract walletBalance{

    function _getBalance(address _address) public view returns(uint _receiverBalance){
        require(_address==msg.sender,'Only owner');
        return (_address.balance); 
    }
   
}
