import { NextResponse } from "next/server";
import { NextFetchEvent, NextRequest } from "next/server";
import cors from "edge-cors";

export const config = {
  runtime: "edge",
  regions: ["arn1", "fra1"],
};

const generateResponse = async (prompt: string) => {
  try {
    const gptResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant in a digital agency. You will answer any questions the user asks or do whatever they say. You will ALWAYS respond in the same language as the user.",
            },
            { role: "user", content: prompt },
          ],
        }),
      }
    );
    const gptData = await gptResponse.json();

    const responseText = gptData.choices[0].message.content;
    return responseText;
  } catch (error) {
    console.log("error message", error.message);
  }
};

export default async function MyEdgeFunction(
  request: NextRequest,
  event: NextFetchEvent
) {
  if (request.method === "GET") {
    return cors(
      request,
      NextResponse.json(
        'This endpoint only accepts POST requests. Try sending a POST request to "/api/generate" instead.'
      )
    );
  }

  if (request.method === "POST") {
    console.log("geo", request.geo);

    const body = await request.formData();

    const userText = body.get("text") as string;
    console.log("userText:", userText);
    const responseUrl = body.get("response_url") as string;

    const promise = new Promise(async (resolve, reject) => {
      const responseText = await generateResponse(userText);
      const slackResponse = await fetch(responseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: responseText,
        }),
      });
      console.log("done posting to Slack");
      resolve(slackResponse);
    });

    event.waitUntil(promise);

    return cors(
      request,
      NextResponse.json({
        text: `${userText}\n*Genererer svar...*`,
      })
    );
  }
}
