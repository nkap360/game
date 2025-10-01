import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: body.model ?? 'deepseek-chat',
      messages: body.messages ?? [],
      temperature: body.temperature ?? 0.8,
      max_tokens: body.max_tokens ?? 600,
    }),
  });

  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: `Upstream error: ${response.status}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
