# Vercel AI SDK Integration with Gemini

To fully utilize the Vercel AI SDK in Zysculpt, follow these setup steps:

## 1. Install Dependencies
```bash
npm install ai @ai-sdk/google
```

## 2. Configuration
Create a `.env.local` file (or set in Vercel) with your Gemini API key:
```
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
```

## 3. Usage Example (Frontend)
In your React components, you can use the `useChat` hook for a more robust streaming experience:

```tsx
import { useChat } from 'ai/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat', // Requires a backend route or Edge Function
  });

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>{m.role}: {m.content}</div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
      </form>
    </div>
  );
}
```

## 4. Backend Route (Vercel Edge Function)
If using Next.js or a Vercel project, define a route like `app/api/chat/route.ts`:

```ts
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = await streamText({
    model: google('gemini-1.5-pro-latest'),
    messages,
  });
  return result.toDataStreamResponse();
}
```

*Note: In the current Zysculpt implementation, we use the direct @google/genai SDK to comply with specific project coding guidelines.*