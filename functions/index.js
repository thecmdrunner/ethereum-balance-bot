const functions = require("firebase-functions");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
admin.initializeApp();

// Database reference
const dbRef = admin.firestore().doc("tokens/demo");

// Twitter API init
const TwitterApi = require("twitter-api-v2").default;

const twitterClient = new TwitterApi({
  clientId: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
});

const port = 5000;

const projectId = "vitalik-balance-bot"; // example: "balance-bot"

const projectRegion = "us-central1"; // example: "us-central1"

const functionsURL = `http://127.0.0.1:${port}/${projectId}/${projectRegion}`;

const ethereumAPI =
  "https://api.buildable.dev/flow/v1/call/live/vb-balance-70eb80985c";

const callbackURL = `${functionsURL}/callback`;

// STEP 1 - Auth URL
exports.auth = functions.https.onRequest(async (request, response) => {
  const twitterObject = twitterClient.generateOAuth2AuthLink(callbackURL, {
    scope: ["tweet.read", "tweet.write", "users.read", "offline.access"],
  });

  const { url, codeVerifier, state } = twitterObject;

  // store verifier
  await dbRef.set({ codeVerifier, state });

  // This URL is provided by Twitter, which is set in OAuth 2.0 settings.
  response.redirect(url);
});

// STEP 2 - Verify callback code, store access_token
exports.callback = functions.https.onRequest(async (request, response) => {
  const { state, code } = request.query;

  const dbSnapshot = await dbRef.get();
  const { codeVerifier, state: storedState } = dbSnapshot.data();

  if (state !== storedState) {
    return response.status(400).send("Stored tokens do not match!");
  }

  const {
    client: loggedClient,
    accessToken,
    refreshToken,
  } = await twitterClient.loginWithOAuth2({
    code,
    codeVerifier,
    redirectUri: callbackURL,
  });

  await dbRef.set({ accessToken, refreshToken });

  const { data } = await loggedClient.v2.me(); // start using the client if you want

  // response.send(data);
  // Instead of sending that data, just redirect to the 'tweet' url.
  response.redirect(`${functionsURL}/tweet`);
});

// STEP 3 - Refresh tokens and post tweets
exports.tweet = functions.https.onRequest(async (request, response) => {
  const { refreshToken } = (await dbRef.get()).data();

  const {
    client: refreshedClient,
    accessToken,
    refreshToken: newRefreshToken,
  } = await twitterClient.refreshOAuth2Token(refreshToken);

  await dbRef.set({ accessToken, refreshToken: newRefreshToken });

  const tweetContents = await fetch(ethereumAPI).then(async (res) => {
    return res.json();
  });

  console.log(tweetContents);

  const { balance } = tweetContents;

  let roundOffBalance = balance;
  roundOffBalance = roundOffBalance.slice(0, -9);
  console.log(roundOffBalance);

  const nextTweet = `Vitalik has ${"$"}${roundOffBalance} worth of Ethereum! ⚡️`;

  if (nextTweet.length > 0) {
    console.log(`New Tweet: ${nextTweet}`);
    const { data } = await refreshedClient.v2.tweet(nextTweet);

    response.send(data);
  }
});
