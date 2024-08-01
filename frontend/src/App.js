import React, { useState } from 'react';
import { AptosClient, FaucetClient, AptosAccount, TxnBuilderTypes, BCS } from 'aptos';
import './App.css';

const NODE_URL = 'https://fullnode.devnet.aptoslabs.com';
const FAUCET_URL = 'https://faucet.devnet.aptoslabs.com';

const client = new AptosClient(NODE_URL);
const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

const createGame = async (account, number, maxAttempts) => {
  const payload = {
    type: "entry_function_payload",
    function: "0x1::game::create_game",
    arguments: [BigInt(number), BigInt(maxAttempts)],
    type_arguments: [],
  }

  const transactionPayload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
    TxnBuilderTypes.EntryFunction.natural(
      '0x1::GuessTheNumber', // Replace with your module address and name
      'create_game',
      [],
      [
        BCS.bcsSerializeUint64(BigInt(number)),
        BCS.bcsSerializeUint64(BigInt(maxAttempts)),
      ]
    )
  );

  const [{ sequence_number }, chainId] = await Promise.all([
    client.getAccount(account.address()),
    client.getChainId(),
  ]);

  const rawTxn = new TxnBuilderTypes.RawTransaction(
    TxnBuilderTypes.AccountAddress.fromHex(account.address()),
    BigInt(sequence_number),
    transactionPayload,
    BigInt(1000), // max gas amount
    BigInt(0), // gas unit price
    BigInt(0), // gas currency code
    BigInt(Math.floor(Date.now() / 1000) + 10),
    new TxnBuilderTypes.ChainId(chainId),
  );

  const signedTxn = AptosClient.generateBCSTransaction(account, rawTxn);
  const transactionRes = await client.submitSignedBCSTransaction(signedTxn);

  await client.waitForTransaction(transactionRes.hash);
};

const guessNumber = async (account, number) => {
  const payload = {
    type: "entry_function_payload",
    function: "0x1::game::guess_number",
    arguments: [BigInt(number)],
    type_arguments: []
  }

  const transactionPayload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
    TxnBuilderTypes.EntryFunction.natural(
      '0x1::GuessTheNumber', // Replace with your module address and name
      'guess_number',
      [],
      [
        BCS.bcsSerializeUint64(BigInt(number)),
      ]
    )
  );

  const [{ sequence_number }, chainId] = await Promise.all([
    client.getAccount(account.address()),
    client.getChainId(),
  ]);

  const rawTxn = new TxnBuilderTypes.RawTransaction(
    TxnBuilderTypes.AccountAddress.fromHex(account.address()),
    BigInt(sequence_number),
    transactionPayload,
    BigInt(1000), // max gas amount
    BigInt(0), // gas unit price
    BigInt(0), // gas currency code
    BigInt(Math.floor(Date.now() / 1000) + 10),
    new TxnBuilderTypes.ChainId(chainId),
  );

  const signedTxn = AptosClient.generateBCSTransaction(account, rawTxn);
  const transactionRes = await client.submitSignedBCSTransaction(signedTxn);

  await client.waitForTransaction(transactionRes.hash);
};

const getGameStatus = async (address) => {
  try {
    const resource = await client.getAccountResource(
      address,
      "0x1::GuessTheNumber::Game"
    );
    return resource.data;
  } catch (error) {
    console.error('Failed to fetch game status', error);
    return null;
  }
};

function App() {
  const [account, setAccount] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [number, setNumber] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [message, setMessage] = useState('');

  const handleCreateGame = async () => {
    await createGame(account, parseInt(number), parseInt(maxAttempts));
    const status = await getGameStatus(account.address());
    setGameStatus(status);
  };

  const handleGuess = async () => {
    await guessNumber(account, parseInt(number));
    const status = await getGameStatus(account.address());
    if (status) {
      setGameStatus(status);
      setMessage(status.is_finished ? (status.winner ? 'You won!' : 'Game over!') : 'Keep guessing...');
    } else {
      setMessage('Failed to fetch game status.');
    }
  };

  const handleConnectWallet = async () => {
    const newAccount = new AptosAccount();
    await faucetClient.fundAccount(newAccount.address(), 1000000);
    setAccount(newAccount);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Guess the Number on Aptos</h1>
        {!account ? (
          <button onClick={handleConnectWallet}>Connect Wallet</button>
        ) : (
          <>
            <div>
              <label>Number to Guess (1-100):</label>
              <input type="number" value={number} onChange={(e) => setNumber(e.target.value)} />
              <label>Max Attempts:</label>
              <input type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} />
              <button onClick={handleCreateGame}>Create Game</button>
            </div>
            <div>
              <label>Guess a Number:</label>
              <input type="number" value={number} onChange={(e) => setNumber(e.target.value)} />
              <button onClick={handleGuess}>Guess</button>
            </div>
            {gameStatus && (
              <div>
                <p>Number of Attempts: {gameStatus.attempts}</p>
                <p>Guessed Numbers: {gameStatus.guesses.join(', ')}</p>
                <p>{message}</p>
              </div>
            )}
          </>
        )}
      </header>
    </div>
  );
}

export default App;
