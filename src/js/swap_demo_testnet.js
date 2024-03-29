const Web3=require('web3')
let web3;

_init=function(){
    if(typeof window.ethereum!="undefined"){
        web3=new Web3(window.ethereum)
        try{
            window.ethereum.request({'method':'eth_requestAccounts'}).then(_account=>{
                web3.eth.defaultAccount=_account
            })
        }
        catch(err){
            console.log(err);
            alert('No selected account found..User rejected the request')
        }
    }
    else if(window.web3){
        web3=new Web3(window.web3)
    }
    else{
        console.log("install metamask")
    }

    window.ethereum.on('chainChanged',(_chainId)=>{
        this._clear();
        this._getAccount();
    })
    window.ethereum.on('accountsChanged',(_account)=>{
        this._clear();
        this._getAccount();
    })
    this._getAccount();
},
_getAccount=async function(){
    await window.ethereum.request({'method':'eth_accounts'}).then(async _acc=>{
        console.log(_acc)
        web3.eth.defaultAccount=_acc[0]
        await window.ethereum.request({'method':'eth_chainId'}).then(_id=>{
            alert("Connected Chain Id: "+_id+" & Connected Account: "+web3.eth.defaultAccount)
        })
    })
    this._getAccountInfo();
},
_getAccountInfo=async ()=>{

    document.getElementById("accountText").style.display="block";
    document.getElementById('connectedAccountAddress').innerHTML=web3.eth.defaultAccount;
    document.getElementById('connect').innerHTML="connected";
    document.getElementById('toAddress').value=web3.eth.defaultAccount;
    await web3.eth.getBalance(web3.eth.defaultAccount,(err,currentBalance)=>{
        console.log(currentBalance)
        document.getElementById("walletBalance").innerHTML=web3.fromWei(JSON.parse(currentBalance),'ether')+'Eth'
      })
    _list=await $.get("https://tokens.coingecko.com/uniswap/all.json").then(_res=>{
        return _res.tokens;
    })
}
_getEstimate=async function(){

    _fromToken=document.getElementById('fromToken').value;
    _toToken=document.getElementById('toToken').value;
     _tokenSymbol=document.getElementById('fromToken').options[document.getElementById('fromToken').selectedIndex].text
    _amount=document.getElementById('amount').value;
    _decimalVal=18;
    for(i=0;i<_list.length;i++){
        if(_tokenSymbol==_list[i].symbol){
            _decimalVal=_list[i].decimals
            break;
        }
    }
    _amountInWei=_amount*(10**(_decimalVal))
    
    _slippagePercentage=(document.getElementById('slippage_percent').value)/100//default=0.01%
    _taker=document.getElementById('toAddress').value;

    var chainId=await Promise.resolve(window.ethereum.request({'method':'eth_chainId'})).then(chainId=>{return chainId})

    if(chainId=='0x5'){
    var url="https://goerli.api.0x.org/swap/v1/price?sellToken="+_fromToken+"&buyToken="+_toToken+"&sellAmount="+_amountInWei+"&slippagePercentage="+_slippagePercentage+"&takerAddress="+_taker

    Promise.resolve($.get(url)).then(_response=>{
        console.log(_response)
        alert("Estimate Exchange Values fetched!! Go for Swap..")
        document.getElementById('swapToken').disabled=false
        document.getElementById('expected_amount').value=_response.buyAmount*_response.price//(_response.buyAmount)/(10**_decimalValTo)
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
    console.log("change to testnet goerli.")
    alert('change to testnet goerli!!')
    
   }
   
    
}

_swapToken=async function(){

    _fromToken=document.getElementById('fromToken').value;//DAI
    _toToken=document.getElementById('toToken').value;//WETH
    _tokenSymbol=document.getElementById('fromToken').options[document.getElementById('fromToken').selectedIndex].text
    
    _amount=document.getElementById('amount').value;//in ether    
    _decimalVal=18;
    for(i=0;i<_list.length;i++){
        if(_tokenSymbol==_list[i].symbol){
            _decimalVal=_list[i].decimals
            break;
        }
    }
    _amountInWei=_amount*(10**(_decimalVal))

    _slippagePercentage=(document.getElementById('slippage_percent').value)/100//default=0.01%
    _taker=document.getElementById('toAddress').value;
    
    var chainId=await Promise.resolve(window.ethereum.request({'method':'eth_chainId'})).then(chainId=>{return chainId})
    console.log(chainId)
    if(chainId=='0x5'){
        var swapUrl="https://goerli.api.0x.org/swap/v1/quote?sellToken="+_fromToken+"&buyToken="+_toToken+"&sellAmount="+_amountInWei+"&slippagePercentage="+_slippagePercentage+"&takerAddress="+_taker+"&skipValidation=true"

        const header={
            '0x-api-key':'bf3504fe-ea6b-4970-bbe0-1d0bfeb61b0d'
        }
        Promise.resolve($.get(swapUrl,header)).then(async response=>{//,header
            console.log(response)
            alert("Get Exchange Quotes Details!!! Ready for Approval..")
            await _swapApproval(response);
        }).catch(err=>{
            console.log(err)
            alert("status: "+err.status+" , Message: "+err.statusText+" & Error: "+err.responseJSON.values.message)
        })
    }
    else{
        console.log("change to testnet goerli.")
        alert('change to testnet goerli!!')
    }
},

_swapApproval=async function(response){

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
        await tokenContract.approve(_allowanceTarget,_maxApproval,{from:_taker,gas:"15000000"},async (err,txId)=>{
            console.log(txId)
            if(txId!=undefined)
            {
            //    const txReceipt= await web3.eth.getTransactionReceipt(txId,async (err,txReceipt)=>{
            //         console.log(txReceipt)
            //         if(txReceipt){
                        await web3.eth.sendTransaction(response,async(err,swapTxId)=>{//,{from:response.from,value:response.sellAmount,gas:'1500000'}
                            console.log(swapTxId)//add event for receipt
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

_clear=function(){

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
