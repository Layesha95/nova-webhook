const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// 🔑 Your actual Page Access Token goes here
const PAGE_ACCESS_TOKEN = "EAAJXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; // replace with your real token

// 🧠 Nova's memory for Q&A
const qaPairs = [
  { question: "how much is a reading", answer: "Palm reading is Rs. 499. Horoscope is Rs. 599, Sir." },
  { question: "can i send my palm photo", answer: "Yes, Sir. Please send a clear palm photo here." },
  { question: "when will i get the reading", answer: "You will receive your full reading within 24 hours, Sir." }
];

// 🔍 Match message with memory
function findBestMatch(msg) {
  msg = msg.toLowerCase();
  for (let pair of qaPairs) {
    if (msg.includes(pair.question)) {
      return pair.answer;
    }
  }
  return null;
}

// 💬 Send message back to Facebook
function sendMessage(senderId, text) {
  axios.post(`https://graph.facebook.com/v17.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    recipient: { id: senderId },
    message: { text }
  }).catch(err => {
    console.error("Error sending message:", err.response?.data || err.message);
  });
}

// ✅ Facebook verification
app.get("/webhook", (req, res) => {
  let VERIFY_TOKEN = "nova_verify_token";
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];
  if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WEBHOOK_VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 📨 Handle incoming messages
app.post("/webhook", (req, res) => {
  let body = req.body;

  if (body.object === "page") {
    body.entry.forEach(function(entry) {
      let webhookEvent = entry.messaging[0];
      let senderId = webhookEvent.sender.id;
      let msgText = webhookEvent.message?.text;

      if (msgText) {
        console.log("Received:", msgText);
        const reply = findBestMatch(msgText);
        if (reply) {
          sendMessage(senderId, reply);
        } else {
          sendMessage(senderId, "Sorry, Sir. Please wait while I check that for you.");
        }
      }
    });
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

app.listen(5000, () => console.log("Nova Webhook running on port 5000"));
