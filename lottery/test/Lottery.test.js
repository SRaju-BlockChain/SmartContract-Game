const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { interface, bytecode} = require('../compile');

let lottery;
let accounts;

beforeEach(async () =>{
  accounts = await web3.eth.getAccounts();
  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({data: bytecode})
    .send( { from: accounts[0], gas: '1000000' });
});

describe('Lottery Contract', () => {
  it('deploys a Lottery Contract', () => {
    assert.ok(lottery.options.address);
  });
  it('Allows one Account to enter Lottery', async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether')
    });
    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });
    assert.equal(accounts[0], players[0]);
    assert.equal(1, players.length);

  });

  it('Allows more than one Account to enter Lottery', async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether')
    });

    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei('0.02', 'ether')
    });
    await lottery.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei('0.02', 'ether')
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });
    assert.equal(accounts[0], players[0]);
    assert.equal(accounts[1], players[1]);
    assert.equal(accounts[2], players[2]);
    assert.equal(3, players.length);
  });
  it('Requires a minimum amount of ether to enter lottery', async () => {
    try {
      await lottery.methods.enter.send ({
        from: accounts[0],
        value: 0 /* Sending 0 Wei*/
      });
      asset(false);
    } catch (err)  {
        assert(err);
    }
  });

  it('Requires permissions to call pickWinner method', async () => {
    try {
      await lottery.methods.pickWinner().send ({
        from: accounts[1]
      });
      assert(false);
    } catch (err)  {
        assert(err);
    }
  });

  it('send money to Winner and reset the Player Array', async () => {
      await lottery.methods.enter().send ({
          from: accounts[1],
          value: web3.utils.toWei('2', 'ether')
      });
      const initialBalanace = await web3.eth.getBalance(accounts[1]);
      await lottery.methods.pickWinner().send ({
        from: accounts[0]
      });
      const finalBalanace = await web3.eth.getBalance(accounts[0]);
      const differenceInEther =  finalBalanace-initialBalanace;
      console.log('Initial Balance --> from Account '+ accounts[1] + ' is ' + initialBalanace);
      console.log('Difference in Ether ' + differenceInEther);
      assert(differenceInEther > web3.utils.toWei('1.8', 'ether'));

      
  });

});
