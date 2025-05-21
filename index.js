const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = "EAAT5VhnwplIBOxE8KqFvx0fo3JbNdk36XmZBzHxJ0NjVSC4HtTPLYXc49nG6xJv6yzXgLwntq9HnshyzGZAmFd9AZBxAZBtZBdlrvIyiLIOi7PwNoZC907NoNZA4xOsTs5SwnTHNgwZBH88xN0HM0Xh7KisLEOitZBZAj6KisiYKuzJZBPV7MLS0bZCS2PTZAdwZDZD";

let qaPairs = [
  { question: "how much is a reading", answer: "අත්රිදුමක් රු.499යි. ජාතකය රු.599යි සර්." },
  { question: "can i send my palm photo", answer: "ඔව් සර්. කරුණාකර පැහැදිලි අත් පින්තූරයක් එවන්න." },
  { question: "when will i get the reading", answer: "ඔබේ නියම විශ්ලේෂණය පැය 24ක් ඇතුළත ලැබෙනවා සර්." }
];

function findBestMatch(msg) {
  msg = msg.toLowerCase();
  for (let pair of qaPairs) {
    if (msg.includes(pair.question.toLowerCase())) {
      return pair.answer;
    }
  }
  return null;
}

function learnFromUser(msg) {
  const parts = msg.split("=>");
  if (parts.length === 2) {
    const question = parts[0].trim().toLowerCase();
    const answer = parts[1].trim();
    qaPairs.push({ question, answer });
    return "ඔයා කියපු එක මට මතක තියෙන්නෙ දැන් සර්.";
  }
  return null;
}

app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "nova_verify";
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    for (let entry of body.entry) {
      for (let event of entry.messaging) {
        const senderId = event.sender.id;
        if (event.message && event.message.text) {
          const msg = event.message.text;
          let response = learnFromUser(msg) || findBestMatch(msg) || "සමාවෙන්න සර්, ඒක ගැන මට තව ඉගෙන ගන්න ඕනේ.";

          await axios.post(
            `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
            {
              recipient: { id: senderId },
              message: { text: response }
            }
          );
        }
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("✅ Nova Facebook Chatbot Running on Port", PORT));
