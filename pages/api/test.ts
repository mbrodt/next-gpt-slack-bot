import { NextResponse } from "next/server";
import { NextFetchEvent, NextRequest } from "next/server";
// import { Configuration, OpenAIApi } from "openai";
import cors from "edge-cors";

export const config = {
  runtime: "edge",
};

console.log("process.env.OPENAI_API_KEY", process.env.OPENAI_API_KEY);
console.log("process.env.OPENAI_ORGANIZATION", process.env.OPENAI_ORGANIZATION);

const generateResponse = async (prompt: string) => {
  console.log("prompt", prompt);

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
                "You are a helpful assistant. You will answer any questions the user asks or do whatever they say. You will ALWAYS respond in the same language as the user. This will likely be EITHER Danish or English",
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
        'This endpoint only accepts POST requests. Try sending a POST request to "/api/gpt" instead.'
      )
    );
  }

  if (request.method === "POST") {
    // const body = await request.json();

    console.log("geo", request.geo);

    const body = await request.formData();
    console.log("body:", body);

    const userText = body.get("text") as string;
    console.log("userText:", userText);
    const responseUrl = body.get("response_url") as string;
    console.log("responseUrl:", responseUrl);

    event.waitUntil(
      generateResponse(userText).then((responseText) => {
        console.log("RESPONSE TEXT", responseText);

        console.log("posting to responseUrl", responseUrl);
        fetch(responseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: responseText,
          }),
        }).then((res) => {
          console.log("DONE POSTING TO SLACK", res);
        });
      })
    );

    return cors(
      request,
      NextResponse.json({
        text: `*${userText}*\n_Genererer svar..._`,
      })
    );
  }
}
