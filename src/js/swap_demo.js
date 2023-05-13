const Web3=require('web3')
var web3;
App = {
  web3Provider: null,
  account:'0x0',

  _init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    if(window.ethereum){
      App.web3Provider=window.ethereum
      Promise.resolve(window.ethereum.request({method:'eth_requestAccounts'})).then(function(_acc){
        window.ethereum.defaultAccount=_acc[0];
        console.log(window.ethereum.defaultAccount);
      }).catch(function(err){console.log(err);});
    }
    else if(window.web3){
      App.web3Provider=window.web3.currentProvider;
    }
    else{
      App.web3Provider=new Web3.providers.HttpProvider("http://127.0.0.1:8545");
    }
    web3=new Web3(App.web3Provider);
    return App.get_account();
  },

  get_account:function(){
   web3.eth.getAccounts(function(err,_acc){
      web3.eth.defaultAccount=_acc[0];
      return App.get_account_info();
    });
  },
  get_account_info:function(_account=web3.eth.defaultAccount){
    document.getElementById("accountText").style.display="block";
    document.getElementById('connectedAccountAddress').innerHTML=web3.eth.defaultAccount;
    document.getElementById('connect').innerHTML="connected";
    document.getElementById('toAddress').disabled=false;
    document.getElementById('toAddress').value=web3.eth.defaultAccount;
    document.getElementById('toAddress').disabled=true;
    
    App.getTokenList();
  },
  getTokenList:function(){//use api
    var url="https://tokens.coingecko.com/uniswap/all.json"
    $.get(url).then(res=>{
      console.log(res.tokens)
      this._addList(res.tokens);
    })
  },
  _addList:function (tokenList) { //working

    _ptag1=document.getElementById("fromToken");
    _br=document.createElement('br')
   
    for(i=0;i<tokenList.length;i++){

      _options=document.createElement("option");
      _options.value=tokenList[i].symbol

      _img=document.createElement("img")
      _img.src=tokenList[i].logoURI;

      _dataValue=" "+tokenList[i].symbol
      // _dataValue=tokenList[i].name+" - "+tokenList[i].symbol
      _dataNode=document.createTextNode(_dataValue);
      
      _options.appendChild(_img)
      _options.appendChild(_dataNode)

      _ptag1.appendChild(_options);
      _ptag1.appendChild(_br)

    }
    _ptag2=document.getElementById("toToken");
    for(i=0;i<tokenList.length;i++){

      _options=document.createElement("option");
      _options.value=tokenList[i].symbol

      _img=document.createElement("img")
      _img.src=tokenList[i].logoURI;

      _dataValue=" "+tokenList[i].symbol
      // _dataValue=tokenList[i].name+" - "+tokenList[i].symbol
      _dataNode=document.createTextNode(_dataValue);
      
      _options.appendChild(_img)
      _options.appendChild(_dataNode)

      _ptag2.appendChild(_options);
      _ptag2.appendChild(_br)

    }

  },
  _getEstimate:async function(){

    _fromToken=document.getElementById('fromToken').value;
    _toToken=document.getElementById('toToken').value;
    _amount=document.getElementById('amount').value;
    _amountInWei=web3.toWei(_amount,'ether')

    _slippagePercentage=(document.getElementById('slippage_percent').value)/100
    _taker=document.getElementById('toAddress').value;

    var chainId=await Promise.resolve(window.ethereum.request({'method':'eth_chainId'})).then(chainId=>{return chainId})
    console.log(chainId)
    let testnet="";
    if(chainId!='0x1'){
        _testnet="goerli"
        testnet=_testnet.concat(".")
    }
    if(_amount>0){
        if(_taker!=""){
          if(_fromToken.length>0 && _toToken.length>0 && _fromToken!=_toToken)
          {
            var url="https://"+testnet+"api.0x.org/swap/v1/price?sellToken="+_fromToken+"&buyToken="+_toToken+"&sellAmount="+_amountInWei+"&slippagePercentage="+_slippagePercentage+"&takerAddress="+_taker
            
            Promise.resolve($.get(url)).then(_response=>{
                console.log(_response)
                alert("Estimate Exchange Values fetched!! Go for Swap..")
                document.getElementById('swapToken').disabled=false
                document.getElementById('swapInfo').style.display="block"
                document.getElementById('_estimateGas').style.display="block"
                document.getElementById('estimate_gas').innerHTML=_response.estimatedGas;
                document.getElementById('_currentPrice').style.display="block"
                document.getElementById('currentPrice').innerHTML=_response.price;
                document.getElementById('hr').style.marginTop="10px";
            }).catch(err=>{
            console.log(err)  
            })
        }
        else{
        alert("Required detail missing.")
        }
    }
    else{
        alert("connect with wallet.")
    }
    }
    else{
        alert("amount must be greater than 0.")
    }
  },
 
  _swapToken:async function(){//api for trADING

    _fromToken=document.getElementById('fromToken').value;
    _toToken=document.getElementById('toToken').value;
    _amount=document.getElementById('amount').value;
    _amountInWei=web3.toWei(_amount,'ether')

    _slippagePercentage=(document.getElementById('slippage_percent').value)/100//default=0.01%
    _taker=document.getElementById('toAddress').value;

    var chainId=await Promise.resolve(window.ethereum.request({'method':'eth_chainId'})).then(chainId=>{return chainId})

    let testnet="";
    let _skipValidate=false;
    if(chainId!='0x1'){
        _testnet="goerli"
        testnet=_testnet.concat(".")
        _skipValidate=true
    }
    if(_amount>0){
        if(_taker!=""){
            if(_fromToken.length>0 && _toToken.length>0 && _fromToken!=_toToken)
            {
                var swapUrl="https://"+testnet+"api.0x.org/swap/v1/quote?sellToken="+_fromToken+"&buyToken="+_toToken+"&sellAmount="+_amountInWei+"&slippagePercentage="+_slippagePercentage+"&takerAddress="+_taker+"&skipValidation="+_skipValidate
                const header={
                        '0x-api-key':'bf3504fe-ea6b-4970-bbe0-1d0bfeb61b0d'
                    }
                Promise.resolve($.get(swapUrl,header)).then(async response=>{//,header
                    console.log(response)
                    alert("Get Exchange Quotes Details!!! Ready for Approval..")
                    await App._swapApproval(response);
                }).catch(err=>{
                    console.log(err)
                })
            }
            else{
                alert("Required detail missing.")
            }
        }
        else{
            alert("connect with wallet")
        }
    }
    else{
        alert("amount must be greater than 0.")
    }
  },
  _swapApproval:async function(response){

    const _fromTokenAddress=response.sellTokenAddress
    const _maxApproval=response.sellAmount
    const _allowanceTarget=response.allowanceTarget
    const _taker=response.from

    const erc20=[
        {
            "constant": true,
            "inputs": [],
            "name": "name",
            "outputs": [
                {
                    "name": "",
                    "type": "string"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_spender",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "approve",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "totalSupply",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_from",
                    "type": "address"
                },
                {
                    "name": "_to",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "transferFrom",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "decimals",
            "outputs": [
                {
                    "name": "",
                    "type": "uint8"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "_owner",
                    "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                    "name": "balance",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "symbol",
            "outputs": [
                {
                    "name": "",
                    "type": "string"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_to",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "transfer",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "_owner",
                    "type": "address"
                },
                {
                    "name": "_spender",
                    "type": "address"
                }
            ],
            "name": "allowance",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "payable": true,
            "stateMutability": "payable",
            "type": "fallback"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "owner",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "name": "spender",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "name": "value",
                    "type": "uint256"
                }
            ],
            "name": "Approval",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "from",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "name": "to",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "name": "value",
                    "type": "uint256"
                }
            ],
            "name": "Transfer",
            "type": "event"
        }
    ];        

    const tokenContract= web3.eth.contract(erc20).at(_fromTokenAddress)
    try{
        await tokenContract.approve(_allowanceTarget,_maxApproval,async (err,txId)=>{
            console.log(txId)
            if(txId!=undefined)
            {
                // await web3.eth.getTransactionReceipt(txId,async (err,txReceipt)=>{
                //     console.log(txReceipt)
                //     if(txReceipt){
                        await web3.eth.sendTransaction(response,async(err,swapTxId)=>{ //gas:"0x40b28", gasPrice:"0x5f5e100"
                            console.log(swapTxId)
                            if(swapTxId!=undefined){
                                alert("Swap Token Transaction Done!!! Wait a While & Check you balance..")
                                    // await web3.eth.getTransactionReceipt(swapTxId,_isSwap=>{
                                //     console.log(_isSwap)
                                //     if(_isSwap!=null){
                                //         alert("Swap Token Transaction Done!!! Check you balance..")
                                //     }
                                //     else{
                                //         alert("Token couldn't be swapped..Transaction revert.")
                                //     }
                                // })
                            }
                            else{
                                alert("Token couldn't be swapped..Transaction revert.")
                            }
                            
                        })
                //     }
                //     else{
                //         console.log("tx receipt transaction reverted")
                //     }   
                // })
            }
            else{
                console.log("Transaction Approval Revert");
                alert("Transaction Approval Revert");
            }
           
        });
    }catch(err){
        console.log(err)
        return false;
    }
},
 
_clear:function(){
  document.getElementById('fromToken').value=""
  document.getElementById('toToken').value=""
  document.getElementById('amount').value=""
  document.getElementById('slippage_percent').value="1"
  document.getElementById('toAddress').value=""
  document.getElementById('estimate_gas').innerHTML=0;
  document.getElementById('currentPrice').innerHTML=0
}

};
