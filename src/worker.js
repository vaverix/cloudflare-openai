import OpenAI from "openai";

export default {
  async fetch(request, env, ctx) {
    async function readRequestBody(request) {
      const contentType = request.headers.get("content-type");
      if (
        contentType.includes("application/json") ||
        contentType.includes("text/plain")
      ) {
        return await request.json();
      } else if (contentType.includes("application/text")) {
        const text = await request.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          return "";
        }
      }
      return "";
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
      "Access-Control-Max-Age": "86400",
    };
    async function handleOptions(request) {
      if (
        request.headers.get("Origin") !== null &&
        request.headers.get("Access-Control-Request-Method") !== null &&
        request.headers.get("Access-Control-Request-Headers") !== null
      ) {
        // Handle CORS preflight requests.
        return new Response(null, {
          headers: {
            ...corsHeaders,
            "Access-Control-Allow-Headers": request.headers.get(
              "Access-Control-Request-Headers"
            ),
          },
        });
      } else {
        // Handle standard OPTIONS request.
        return new Response(null, {
          headers: {
            Allow: "GET, HEAD, POST, OPTIONS",
          },
        });
      }
    }
    if (request.method === "OPTIONS") {
      // Handle CORS preflight requests
      return handleOptions(request);
    } else if (request.method === "POST") {
      const reqBody = await readRequestBody(request);

      try {
        if (!env.OPENAI_API_KEY) {
          throw new Error("Missing OPENAI_API_KEY");
        }
        const openai = new OpenAI({
          apiKey: env.OPENAI_API_KEY,
        });
        if (
          !reqBody ||
          !reqBody.messages ||
          reqBody.messages.length == 0 ||
          !reqBody.messages[0].content
        ) {
          throw new Error("No message in request body");
        }

        const messages = reqBody.messages;
        const chatCompletion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo-1106",
          messages: messages,
        });

        console.log(messages);
        return new Response(chatCompletion.choices[0].message.content, {
          status: 200,
          statusText: "OK",
          headers: {
            "Content-Type": "text/plain;charset=UTF-8",
            ...corsHeaders,
            url: "https://cloudflare-openai.vaverix.workers.dev/",
          },
        });
      } catch (e) {
        return new Response(e.message, { status: 500 });
      }
    } else if (request.method === "GET") {
      return new Response("Not implemented yet.", { status: 501 });
    }
  },
};
