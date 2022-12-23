const httpn = require('http');
const path = require('path');
const express = require('express');
const socketio = require('socket.io');
const needle = require('needle');
const config = require('dotenv').config();
const TOKEN = process.env.TWITTER_BEARER_TOKEN;
const PORT = process.env.PORT || 3000;

// const app = express();

// const server = httpn.createServer(app);
// const io = socketio(server);

//console.log('Starting...', TOKEN);

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules';
const streamURL = 'https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id';


// Edit rules as desired here below
const rules = [{ value: '#makeabettermapof -is:retweet -is:reply -is:quote' }];

// Gets stream rules
async function getRules() {
    const response = await needle('get', rulesURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`
        }
    });
    console.log(response.body);
    return response.body;
}

// Sets stream rules
async function setRules() {
    const data = {
        add: rules
    };
    const response = await needle('post', rulesURL, data, {
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${TOKEN}`
        }
    });
    return response.body;
}   

// Delete stream rules
async function deleteRules(rules) {
    if (!Array.isArray(rules.data)) {
        return null;
    }

    const ids = rules.data.map((rule) => rule.id);

    const data = {
        delete: {
            ids: ids
        }
    };
    const response = await needle('post', rulesURL, data, {
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
      })
    
      return response.body
    }

// Stream Tweets
function streamTweets(){
    const stream = needle.get(streamURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`
        }
    });
    stream.on('data', data => {
        try {
            const json = JSON.parse(data);
            console.log(json);
            
            console.log('hi');
            // http to api gw
            needle.post('https://avp6vgqy92.execute-api.eu-central-1.amazonaws.com/dev/recive_tweets', json, {json: true})
        } catch (e) {
            // Keep alive signal received. Do nothing.
        }
    }).on('err', error => {
        if (error.code !== 'ECONNRESET') {
            console.log(error);
            process.exit(1);
        }
    });
}

// io.on('connection', (socket) => {
//     console.log('New client connected');
// });

;(async () => {
     let currentRules;
    try {
         await setRules();
//         // Gets the complete list of rules currently applied to the stream
         currentRules = await getRules();
         // Delete all rules. Comment the line below if you want to keep your existing rules.
        await deleteRules(currentRules);
         // // Add rules to the stream. Comment the line below if you want to keep your existing rules.
         await setRules();
     } catch (e) {
         console.error(e);
          process.exit(1);
     }
     // Listen to the stream.
     streamTweets();
})();

//server.listen(PORT, () => console.log(`Server running on port ${PORT}`));


   