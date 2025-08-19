import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { role, messages } = req.body;

  const latestUserMsg = messages.reverse().find(m => m.role === 'user')?.content || '';

  const prompts = {
  executive: `You are a highly skilled and professional executive assistant. When asked to schedule or plan, structure your response clearly with dates, times, and titles. Optionally format the output as a text-based schedule or provide a downloadable calendar (.ics) format when possible.\n\nUser Request: ${latestUserMsg}`,
  social: `You are a social media manager for a brand. Write engaging posts or captions, create a content calendar, or respond to follower questions. Keep the tone friendly and aligned with Gen Z marketing.`
};


  const systemPrompt = prompts[role] || "You are a helpful AI agent.";
  const fullMessages = [
    { role: "system", content: systemPrompt },
    ...messages
  ];

  try {
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: fullMessages,
        temperature: 0.7
      })
    });

    const data = await completion.json();

    console.log("OpenAI raw response:", JSON.stringify(data, null, 2));

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return res.status(500).json({ result: "OpenAI API failed. Check console for details." });
    }

    const result = data.choices[0].message.content;
    console.log("👉 Trying to save to Supabase...");

    const { error } = await supabase.from('history').insert([
      {
        role,
        prompt: messages[messages.length - 1]?.content || '',
        response: result
      }
    ]);

    if (error) {
      console.error("❌ Supabase insert error:", error);
    } else {
      console.log("✅ Task saved to Supabase!");
    }

    res.status(200).json({ result });

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ result: "Something went wrong with the API call." });
  }
}
