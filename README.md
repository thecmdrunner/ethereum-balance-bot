# ⚡️ Ethereum Balance Bot

A bot that tweets out the ETH balance of a wallet (only Ether, not ERC-20 tokens).

The API is hosted on [this endpoint](https://api.buildable.dev/flow/v1/call/live/vb-balance-70eb80985c) using [Buildable](https://buildable.dev/)

Only the Ethereum mainnet is supported as of now.

Polygon network may be supported in the future.

## How to run?

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new Project, or use an existing one.

2. Install `firebase` to deploy on Firebase Cloud Functions.

```bash
# Linux and Mac OS
sudo npm install -g firebase

# Windows
npm install -g firebase
```

3. Clone the repository

```bash
git clone https://github.com/thegamerhat/ethereum-balance-bot
cd ethereum-balance-bot
```

4. Install dependencies and log into firebase.

```bash
npm install
firebase login
```

5. Select the project that you have created earlier, or use an existing one.

6. Run the functions locally for testing.

```bash
firebase serve
```

7. Finally, deploy the functions to Firebase.

```bash
firebase deploy
```
