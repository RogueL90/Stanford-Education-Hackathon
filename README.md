# ClearRead

A deliberately small hackathon demo showing that multiple-choice correctness and demonstrated reading comprehension are not the same thing.

Students read one passage, choose an answer, and explain their thinking. The result reports the selected answer as correct or incorrect and evaluates the explanation separately as strong, partial, or weak.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The Vite development server proxies `/api` requests to the Express server on port 3001.

The three responses under **Demo responses** work without an API key. To use live model evaluation, add `OPENAI_API_KEY` to `.env`. The server uses the OpenAI Responses API with a strict JSON schema and falls back to the built-in evaluator if the model call fails.

## Production

```bash
npm run build
npm start
```

The Express server serves the built frontend and API together on `PORT` (default `3001`).

## Product scope

- One passage
- One multiple-choice question
- One required explanation
- Separate correctness and comprehension results
- Three reliable demo presets
- No accounts, database, dashboard, question generation, or gamification

The evaluator prompt is in `server/evaluate.ts`. It explicitly judges understanding independently from answer correctness and evaluates textual evidence rather than writing quality.
