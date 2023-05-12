var swapApprove = artifacts.require("./swapApprove");
var walletBalance=artifacts.require('./walletBalance');
var ERC20Token= artifacts.require('./ERC20.sol');

module.exports = function(deployer) {
  deployer.deploy(walletBalance);
  deployer.deploy(swapApprove);
  deployer.deploy(ERC20Token);
};
