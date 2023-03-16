import type { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import { Configuration, OpenAIApi } from "openai";
// const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

console.log("process.env.OPENAI_API_KEY", process.env.OPENAI_API_KEY);
console.log("process.env.OPENAI_ORGANIZATION", process.env.OPENAI_ORGANIZATION);

const configuration = new Configuration({
  organization: process.env.OPENAI_ORGANIZATION,
  apiKey: process.env.OPENAI_API_KEY,
});
const OpenAIClient = new OpenAIApi(configuration);

// Initializing the cors middleware
// You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = Cors({
  methods: ["POST", "GET", "HEAD"],
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

const generateResponse = async (prompt: string) => {
  // const response = await OpenAIClient.createCompletion({
  //   model: "text-davinci-003",
  //   prompt,
  //   max_tokens: 1000,
  //   temperature: 0,
  // });
  // const responseText = response.data.choices[0].text;

  const response = await OpenAIClient.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. You will answer any questions the user asks or do whatever they say. You will respond in the same language as the user.",
      },
      { role: "user", content: prompt },
    ],
  });

  const responseText = response.data.choices[0].message.content;

  return responseText;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Run the middleware
  await runMiddleware(req, res, cors);

  if (req.method === "GET") {
    res.json(
      'This endpoint only accepts POST requests. Try sending a POST request to "/api/gpt" instead.'
    );
  }

  // Check if the request is a POST request
  if (req.method === "POST") {
    const userText = req.body.text;
    const responseUrl = req.body.response_url;

    // res.json({response_type: 'in_channel', text:"Request received! Generating response..."});
    res.json({
      text: `\n>${userText}.\n *Genererer svar...*`,
    });

    console.log("INSIDE POST");

    const responseText = await generateResponse(userText);

    fetch(responseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: responseText,
      }),
    });
  }
}
