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
      }).catch(function(err){
        console.log(err);
        alert('No selected account found..User rejected the request')
    });
    }
    else if(window.web3){
      App.web3Provider=window.web3.currentProvider;
    }
    else{
      App.web3Provider=new Web3.providers.HttpProvider("http://127.0.0.1:8545");
    }
    web3=new Web3(App.web3Provider);
    window.ethereum.on('chainChanged',(_chainId)=>{
        App._clear();
        App.get_account();
    })
    window.ethereum.on('accountsChanged',(_account)=>{
        App._clear();
        App.get_account();
    })
    App.get_account();

  },

  get_account:function(){
   web3.eth.getAccounts(async function(err,_acc){
      web3.eth.defaultAccount=_acc[0];
      await window.ethereum.request({'method':'eth_chainId'}).then(_id=>{
        alert("Connected Chain Id: "+_id+" & Connected Account: "+web3.eth.defaultAccount)
      })
      return App.get_account_info();
    });
  },
  get_account_info:async function(){
    document.getElementById("accountText").style.display="block";
    document.getElementById('connectedAccountAddress').innerHTML=web3.eth.defaultAccount;
    document.getElementById('connect').innerHTML="connected";
    document.getElementById('toAddress').disabled=false;
    document.getElementById('toAddress').value=web3.eth.defaultAccount;
    document.getElementById('toAddress').disabled=true;
    await web3.eth.getBalance(web3.eth.defaultAccount,(err,currentBalance)=>{
        document.getElementById("walletBalance").innerHTML=web3.fromWei(JSON.parse(currentBalance),'ether')+'Eth'
      })
    App.getTokenList();
  },
  getTokenList:async function(){//use api

    var chainId=await window.ethereum.request({'method':'eth_chainId'}).then(_id=>{
      return _id
    })
    console.log(chainId)
    
    if(chainId=='0x1'){
      document.getElementById('mainnet_div_fromToken').style.display='block';
      document.getElementById('mainnet_div_toToken').style.display='block';
      document.getElementById('testnet_div_fromToken').style.display='none';
      document.getElementById('testnet_div_toToken').style.display='none';
      document.getElementById('testnet__fromToken').style.display='none';
      document.getElementById('testnet__toToken').style.display='none';

      var url="https://tokens.coingecko.com/uniswap/all.json"
      _list=await $.get(url).then(res=>{
        console.log(res.tokens)
        this._addList(res.tokens);
        return res.tokens;
      })
    }
    else if(chainId=='0x5'){
        document.getElementById('mainnet_div_fromToken').style.display='none';
        document.getElementById('mainnet_div_toToken').style.display='none';
        document.getElementById('testnet_div_fromToken').style.display='block';
        document.getElementById('testnet_div_toToken').style.display='block';
        document.getElementById('testnet__fromToken').style.display='none';
        document.getElementById('testnet__toToken').style.display='none';
        _list=await $.get("https://tokens.coingecko.com/uniswap/all.json").then(_res=>{
        return _res.tokens;
        })

    }
    else{
        document.getElementById('mainnet_div_fromToken').style.display='none';
        document.getElementById('mainnet_div_toToken').style.display='none';
        document.getElementById('testnet_div_fromToken').style.display='none';
        document.getElementById('testnet_div_toToken').style.display='none';
        document.getElementById('testnet__fromToken').style.display='block';
        document.getElementById('testnet__toToken').style.display='block';
        // document.getElementById('estimateSwap').disabled=true;
        // document.getElementById('amount').disabled=true;
    }
  },
  _addList:function (tokenList) { //working

    _ptag1=document.getElementById("selectFromToken");
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
    _ptag2=document.getElementById("selectToToken");
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
    if(document.getElementById('connect').innerHTML=='connected')
    {
        var chainId=await window.ethereum.request({'method':'eth_chainId'}).then(_id=>{
            return _id
        })

        if(chainId=='0x1'){
            _fromToken=document.getElementById('selectFromToken').value
            _toToken=document.getElementById('selectToToken').value
            _decimalVal=18;
            for(i=0;i<_list.length;i++){
                if(_fromToken==_list[i].symbol){
                    _decimalVal=_list[i].decimals
                    break;
                }
            }
        }
        else if(chainId=='0x5'){
            _fromToken=document.getElementById('fromToken').value;// WETH
            _toToken=document.getElementById('toToken').value;//DAI
            _tokenSymbol=document.getElementById('fromToken').options[document.getElementById('fromToken').selectedIndex].text
            _decimalVal=18;
            for(i=0;i<_list.length;i++){
                if(_tokenSymbol==_list[i].symbol){
                    _decimalVal=_list[i].decimals
                    break;
                }
            }
        }
        else{
            _fromToken=document.getElementById('_fromToken').value;//0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6 - WETH
            _toToken=document.getElementById('_toToken').value;//0x07865c6E87B9F70255377e024ace6630C1Eaa37F - USDC
        }
        
        _amount=document.getElementById('amount').value;
        _amountInWei=_amount*(10**(_decimalVal))


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
                if(_fromToken.length>0 && _toToken.length>0 && _fromToken!="select" && _toToken!="select")
                {
                    if(_fromToken!=_toToken)
                    {
                        var url="https://"+testnet+"api.0x.org/swap/v1/price?sellToken="+_fromToken+"&buyToken="+_toToken+"&sellAmount="+_amountInWei+"&slippagePercentage="+_slippagePercentage+"&takerAddress="+_taker
                
                        Promise.resolve($.get(url)).then(_response=>{
                            console.log(_response)
                            alert("Estimate Exchange Values fetched!! Go for Swap..")
                            document.getElementById('swapToken').disabled=false
                            document.getElementById('expected_amount').value=_response.buyAmount
                            document.getElementById('swapInfo').style.display="block"
                            document.getElementById('_estimateGas').style.display="block"
                            document.getElementById('estimate_gas').innerHTML=_response.estimatedGas;
                            document.getElementById('_currentPrice').style.display="block"
                            document.getElementById('currentPrice').innerHTML=_response.price;
                            document.getElementById('hr_1').style.display="block";
                            document.getElementById('hr_1').style.marginBottom="0px";
                            document.getElementById('hr_2').style.marginTop="10px";
                        }).catch(err=>{
                            console.log(err)  
                            alert("status: "+err.status+" , Message: "+err.statusText+" & Error: "+err.responseJSON.reason)
                        })
                    }
                    else{
                        alert("Sell token & Buy token must be different")
                    }
                    
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
    }
    else{
        console.log("connect to wallet first.")
        alert("connect to wallet first.")
    }
    
  },
 
  _swapToken:async function(){//api for trADING
    if(document.getElementById('connect').innerHTML=='connected')
    {
        var chainId=await window.ethereum.request({'method':'eth_chainId'}).then(_id=>{
            return _id
        })

        if(chainId=='0x1'){
            _fromToken=document.getElementById('selectFromToken').value
            _toToken=document.getElementById('selectToToken').value
            for(i=0;i<_list.length;i++){
                if(_fromToken==_list[i].symbol){
                    _decimalVal=_list[i].decimals
                    break;
                }
            }
        }
        else if(chainId=='0x5'){
            _fromToken=document.getElementById('fromToken').value;// WETH
            _toToken=document.getElementById('toToken').value;// USDC
            _tokenSymbol=document.getElementById('fromToken').options[document.getElementById('fromToken').selectedIndex].text
            _decimalVal=18;
            for(i=0;i<_list.length;i++){
                if(_tokenSymbol==_list[i].symbol){
                    _decimalVal=_list[i].decimals
                    break;
                }
            }
        }
        else{
            _fromToken=document.getElementById('_fromToken').value;//0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6 - WETH
            _toToken=document.getElementById('_toToken').value;//0x07865c6E87B9F70255377e024ace6630C1Eaa37F - USDC
        }

        _amount=document.getElementById('amount').value;
        _amountInWei=_amount*(10**(_decimalVal))

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
                if(_fromToken.length>0 && _toToken.length>0 && _fromToken!="select" && _toToken!="select")
                {
                    if(_fromToken!=_toToken){
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
                            alert("status: "+err.status+" , Message: "+err.statusText+" & Error: "+err.responseJSON.reason)
                        })
                    }
                    else{
                        alert("Sell token & Buy token must be different")
                    }
                    
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
    }
    else{
        console.log("connect to wallet first.")
        alert("connect to wallet first.")
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
        await tokenContract.approve(_allowanceTarget,_maxApproval,async (err,txId)=>{//{from:_taker,gas:'15000000000'}
            console.log(txId)
            if(txId!=undefined && !err)
            {
                // await web3.eth.getTransactionReceipt(txId,async (err,txReceiptId)=>{
                //     console.log(txReceiptId)})
                //     if(txReceiptId){
                        await web3.eth.sendTransaction(response,{from:_taker,gas:'1000000000000000'},async(err,swapTxId)=>{ //gas:"0x40b28", gasPrice:"0x5f5e100"
                            console.log(swapTxId)
                            if(swapTxId!=undefined && !err){
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

    document.getElementById('_fromToken').value=""
    document.getElementById('_toToken').value=""
    document.getElementById('fromToken').value="select"
    document.getElementById('toToken').value="select"
    document.getElementById('amount').value=""
    document.getElementById('expected_amount').value=""
    document.getElementById('slippage_percent').value="1"
//   document.getElementById('toAddress').value=""
    document.getElementById('estimate_gas').innerHTML=0;
    document.getElementById('currentPrice').innerHTML=0
    document.getElementById('swapToken').disabled=true
    document.getElementById('selectFromToken').value="select"
    document.getElementById('selectToToken').value="select"
}

};
