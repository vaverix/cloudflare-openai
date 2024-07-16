import OpenAI from "openai";

export default {
  async fetch(request, env, ctx) {
    /**
     * readRequestBody reads in the incoming request body
     * @param {Request} request the incoming request to read from
     */
    async function readRequestBody(request) {
      const contentType = request.headers.get("content-type");
      if (contentType.includes("application/json")) {
        return await request.json();
      }
      return "";
    }

    if (request.method === "POST") {
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
          throw new Error("Missing message in request body");
        }

        const messages = reqBody.messages;
        const chatCompletion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo-1106",
          messages: messages,
        });

        console.log(messages);
        return new Response(chatCompletion.choices[0].message.content);
      } catch (e) {
        return new Response(e.message, { status: 500 });
      }
    } else if (request.method === "GET") {
      return new Response("Not implemented yet.", { status: 501 });
    }
  },
};
