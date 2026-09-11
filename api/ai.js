export default {
  async fetch(request) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (request.method !== "POST") {
      return Response.json(
        { error: "Only POST requests are allowed." },
        { status: 405, headers: corsHeaders }
      );
    }

    try {
      const { action, text } = await request.json();

      if (!text || !text.trim()) {
        return Response.json(
          { error: "No text was provided." },
          { status: 400, headers: corsHeaders }
        );
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return Response.json(
          { error: "Gemini API key is not configured on Vercel." },
          { status: 500, headers: corsHeaders }
        );
      }

      const prompts = {
        summarize:
          "Summarize the following research text in 3-5 clear sentences. Keep the important information and remove repetition.",

        keypoints:
          "Extract the most important key points from the following research text. Use short bullet points.",

        explain:
          "Explain the following research text in very simple language, as if explaining it to a university student who is new to the topic.",

        facts:
          "Extract the most useful factual information from the following research text. Use concise bullet points."
      };

      const instruction =
        prompts[action] || prompts.summarize;

      const prompt = `${instruction}

Research text:

${text.slice(0, 25000)}`;

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },

          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return Response.json(
          {
            error:
              data?.error?.message ||
              "Gemini API request failed."
          },
          {
            status: response.status,
            headers: corsHeaders
          }
        );
      }

      const result =
        data?.candidates?.[0]?.content?.parts
          ?.map(part => part.text || "")
          .join("")
          .trim() || "";

      return Response.json(
        {
          success: true,
          result: result || "No result generated."
        },
        {
          status: 200,
          headers: corsHeaders
        }
      );

    } catch (error) {

      console.error(error);

      return Response.json(
        {
          error: "Server error. Please try again."
        },
        {
          status: 500,
          headers: corsHeaders
        }
      );
    }
  }
};