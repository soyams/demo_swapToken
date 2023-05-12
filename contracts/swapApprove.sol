//SPDX-License-Identifier:MIT
pragma solidity ^0.8.19;

// import './lib/IERC20.sol';//erc20 interface

 contract swapApprove{

    mapping(address=>mapping(address=>uint)) allowedToken;
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function allowance(address _owner, address spender) public view  returns(uint256 ){//owner allow spender to spend token on behalf of owner
        // require(_owner==msg.sender,'only owner');
        return allowedToken[_owner][spender];
    }
    function approve(address spender,uint _tokenValue) public  returns(bool ){ // approve tokenvalue spend by spender on behalf of owner
        address owner=msg.sender;
        require(owner!=address(0),"owner is not zero/empty address");
        require(spender!=address(0),"spender is not zero/empty address");
       
        allowedToken[owner][spender]=_tokenValue;
        emit Approval(owner,spender,_tokenValue);
        return true;
    }

}

