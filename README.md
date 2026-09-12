# ClearRead

A deliberately small hackathon demo showing that multiple-choice correctness and demonstrated reading comprehension are not the same thing.

Students answer seven questions about *Tikki Tikki Tembo* and explain their thinking on the five questions where reasoning adds value. Each result reports the selected answer as correct or incorrect and evaluates written explanations separately as strong, partial, or weak.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The Vite development server proxies `/api` requests to the Express server on port 3001.

The quiz works without an API key using a built-in story-specific evaluator. To use live model evaluation, add `OPENAI_API_KEY` to `.env`. The server uses the OpenAI Responses API with a strict JSON schema and falls back to the built-in evaluator if the model call fails.

## Production

```bash
npm run build
npm start
```

The Express server serves the built frontend and API together on `PORT` (default `3001`).

## Product scope

- Seven multiple-choice questions
- Required explanations for five reasoning-focused questions
- Separate correctness and comprehension results
- No accounts, database, dashboard, question generation, or gamification

The evaluator prompt is in `server/evaluate.ts`. It explicitly judges understanding independently from answer correctness and evaluates textual evidence rather than writing quality.
