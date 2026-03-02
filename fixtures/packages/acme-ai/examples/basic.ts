import OpenAI, { stream } from "acme-ai";

async function run() {
  const client = new OpenAI();
  const completion = await client.complete("gpt-test", {
    prompt: "hello",
    max_tokens: 64
  });

  const structured = await client.extract("name: Jane, age: 31");
  console.log(completion.text, structured);

  for await (const chunk of stream("gpt-test", { prompt: "stream" })) {
    console.log(chunk);
  }
}

run();
