# Competitive Learning Hackathon Build Prompt

Build a working competitive learning web app for 100 concurrent students, approximately 50 simultaneous one versus one matches. Two developers own frontend and backend. Prioritize a complete, reliable demo over additional features.

The product hypothesis is that competition motivates students to apply concepts and revisit mistakes. The core loop is **compete → understand mistakes → practice → compete again**. Describe results as observed performance, not proven mastery or learning gains.

## Product and match rules

- Enter a username to create a guest profile. Issue a random authenticated session; a username alone must never grant access to an existing profile. Preserve the session across refreshes. No passwords, email, or account recovery in this demo.
- Two main tabs: **Play** and **My Learning**. Results and practice open within these flows.
- Play: select exactly one subject, Algebra or Derivatives, then join its FIFO matchmaking queue. Show queue status and Cancel. Allow only one queue or active match per guest. After 15 seconds, offer continued waiting or clearly labeled solo practice; never present a bot as another person.
- Match two students choosing the same subject. Each match has eight four-option multiple-choice questions: two per subtopic, with identical questions and option order for both players. Use a balanced, hardcoded difficulty mix.
- Each question allows 35 seconds. One final answer or explicit “I’m stuck” submission per player. Award 100 points for correct answers and zero otherwise. No speed bonus or penalty; equal scores produce a draw.
- Lock submitted answers. Reveal the answer and hardcoded explanation only after both players submit or the deadline expires. Then show five seconds of review before advancing. Display both scores, question progress, and the timer.
- Show wrong answers, stuck responses, and timeouts in the postgame review. Record correct answers too: diagnosis needs a denominator.
- Results show win/loss/draw, score, accuracy, a question review, AI feedback, and **Practice my weakest skill**. This starts three untimed hardcoded questions from that subtopic, preferring unseen questions. Label reused questions and keep practice statistics separate from competitive results.
- My Learning shows each subject’s subtopic breakdown, evidence counts, reviewable mistakes, latest AI summary, and a copyable personalized practice prompt.
- Use readable math rendering, keyboard-accessible choices, visible focus states, and text labels alongside result colors. Support laptop and phone screens.

## Question bank

Create and manually verify 48 questions: six per subtopic, including two easy, two medium, and two hard. Keep them short enough for the time limit. In each match, give every subtopic one easy and one medium question; reserve hard questions for practice in this demo. Vary the bank questions between matches without repeating an ID inside a match.

| Subject | Subtopics |
|---|---|
| Algebra | Linear equations; inequalities; quadratic factoring; exponent rules |
| Derivatives | Power rule and polynomial sums; chain rule; product rule; quotient rule |

Each question requires `id`, `subject`, `subtopic`, `difficulty`, `promptLatex`, four choices with stable IDs, `correctOptionId`, `explanation`, and optional `misconceptionByOptionId`. Assign one primary subtopic; other skills may appear as prerequisites. Distractors should represent plausible errors, with exactly one mathematically correct option. Include domain restrictions where needed.

Example: differentiate `(3x + 2)^2`. Choices: `6(3x + 2)` (correct), `2(3x + 2)`, `6`, and `(3x + 2)^2`. Explanation: “Apply the power rule to the outer square, then multiply by the derivative of the inner expression, which is 3.” Tag the second option as a possible omitted inner derivative.

Questions, answer keys, explanations, and misconception tags are hardcoded and stored on the backend. Send only the active question and options before reveal. Do not use AI for live question generation, scoring, or mathematical grading.

## Evidence and AI

For every presented question, save the player, match or practice run, question ID, selected option or null, outcome (`correct`, `incorrect`, `stuck`, `timeout`, `disconnected`), and server-measured elapsed time. Optionally capture “confident / unsure” with answer submission if time permits. Do not infer confidence from speed.

Compute statistics in backend code, not the LLM. Show correct / eligible attempts, accuracy, distinct questions seen, and stuck/timeout counts. Exclude disconnected attempts from accuracy. For profile indicators, use each question’s first eligible competitive attempt so memorized repeats do not inflate evidence; preserve all attempts in history.

Use explicit demo heuristics: fewer than four distinct eligible questions = “Not enough evidence”; otherwise 75% or higher = “Recent strength,” below 50% = “Review first,” and the remainder = “Keep practicing.” These are interface rules, not validated mastery estimates. After one match, feedback can identify questions to revisit while acknowledging limited evidence. Prioritize retry topics by lowest eligible accuracy, breaking ties by more mistakes/stuck responses; if no weakness is observed, label the action “Practice this subject.”

After a match, make one asynchronous LLM call per player with that player’s attempts, verified solutions, misconception tags, computed statistics, and compact historical subtopic counts. Return validated JSON:

`{ summary, strengths: [{ subtopic, evidenceQuestionIds, reason }], priorities: [{ subtopic, evidenceQuestionIds, possibleIssue, nextAction }], practicePrompt }`

Use this analysis instruction:

> You are a concise learning coach. Use only supplied attempts, statistics, and verified solutions. Give a short summary, at most two strengths, and at most two priorities. Cite question IDs for observations. Describe distractor-based misconceptions as possibilities; a selected answer does not reveal the student's reasoning. Separate wrong answers, stuck responses, timeouts, and disconnections. Do not diagnose a knowledge gap from time alone, invent evidence, or claim mastery from sparse data. Recommend one concrete next action per priority. Generate a personalized practice prompt using the supplied skills and evidence. Return only the required JSON schema.

The generated practice prompt should follow this structure:

> Help me practice [subject], especially [priority subtopics]. My recent results were [accurate counts], and I may have struggled with [supported possible issues]. Give me six new questions, progressing from foundational to application problems. Present one question at a time and wait for my answer and reasoning. Offer one hint before revealing a full solution. After each answer, explain the relevant rule briefly and adapt the next question. End with a short review and two transfer questions using different expressions. Do not treat these limited results as proof of mastery.

Generate analysis and prompt together; cache by player and match. My Learning reuses the latest completed analysis, labeled with its match date, while numeric statistics remain current. Reject unknown evidence IDs or malformed output. Limit to five concurrent LLM requests, cap output length, apply a 15-second request timeout, and retry at most once. Persist job status. Always display deterministic results immediately; if AI fails, show a templated summary and practice prompt derived from the same statistics. Keep API keys server-side.

## Implementation and shared contract

Use React, TypeScript, Vite, and a math renderer on the frontend; Node.js, TypeScript, Express, Socket.IO, and PostgreSQL on the backend. Use one long-running backend instance to serve the built frontend and API under the same origin, with HTTPS and WebSocket support. Pin dependencies and provide an environment example, database migration, seed script, and run/deploy README.

Keep queues and active room timers in memory; persist guests/sessions, versioned questions, matches, participants, attempts, practice runs, and analysis jobs/results in PostgreSQL. Derive profile statistics from attempts. Match states: `waiting → active → completed/abandoned`. Question phases: `answering → review`. Keep the backend authoritative for phase, deadlines, membership, submissions, and scores.

| Interface | Contract |
|---|---|
| `POST /api/guest` | Accept username; create profile and secure HttpOnly session cookie |
| `GET /api/me` | Guest identity and active match, if any |
| `GET /api/subjects` | Subject and subtopic metadata |
| `GET /api/matches/:id/results` | Participant-only results and analysis status/output |
| `GET /api/learning?subject=...` | Own statistics, mistakes, latest summary and prompt |
| `POST /api/practice` | Start three-question run for requested subject/subtopic |
| `POST /api/practice/:id/answer` | Submit one answer; return verified feedback and next question |
| Client socket events | `queue:join {subject}`, `queue:leave {}`, `match:resume {matchId}`, `answer:submit {matchId, questionId, optionId|null, stuck, requestId}` |
| Server socket events | `queue:status`, `match:start`, `question:start`, `answer:ack`, `question:result`, `match:end`, `match:snapshot`, `error` |

Define shared TypeScript payload types and example fixtures before splitting work. Start/snapshot payloads include match ID, players, scores, phase, question index, sanitized current question, the requesting player's submission state, `serverNow`, and `deadlineAt`; review snapshots include revealed answers. Results include outcomes, explanations, and updated scores. Errors have stable codes and readable messages.

Authenticate HTTP requests and socket connections using the guest session. Validate room membership and input; never accept a client-supplied score or identity as authority. Make answer processing idempotent using a unique `(matchId, playerId, questionId)` constraint; acknowledge only persisted answers and return the original acknowledgement on retries. Reject late, invalid, or out-of-phase submissions.

Clients calculate the countdown from server timestamps; no per-second broadcasts. On reconnect or refresh, fetch an authoritative snapshot. Allow a 15-second reconnect grace period while question timers continue; mark affected unanswered questions as disconnected, not conceptual failures. Beyond grace, end the match with a forfeit label, preserving existing attempts. If both leave, abandon it. On backend restart, mark unfinished matches abandoned and restore completed results; live-match restart recovery is outside demo scope.

Socket.IO defaults to at-most-once delivery, so acknowledgements, duplicate protection, and explicit resynchronization are required application behavior. [Official delivery documentation](https://socket.io/docs/v4/delivery-guarantees/).

## Two-person build plan

| Stage | Frontend owner | Backend owner |
|---|---|---|
| First hour together | Agree screens, shared types, fixtures, rules, and question format | Agree schema, events, deployment target, and session behavior |
| First complete flow | Build guest entry, Play, queue, match, and results against fixtures | Build guest sessions, database, seed loading, matching, timers, grading, and result persistence |
| Learning loop | Build My Learning, mistake review, AI loading/fallback states, prompt copy, and practice UI | Build statistics, analysis queue/cache/fallback, and practice endpoints |
| Content in parallel | Author 24 algebra questions | Author 24 derivative questions |
| Final integration together | Connect real APIs early; verify keyboard/mobile use, math, and reconnect states | Deploy early; run capacity tests and check duplicate/late answers, disconnects, AI failures |

Both developers cross-check the other’s answer keys. Get two real browsers through one complete match before polishing visuals or adding extras. Keep shared contracts in one package and communicate changes before editing them.

## Demo acceptance and scope

- Two browsers create separate guests, match, receive identical questions, score correctly, review mistakes, and retain results after refresh.
- Duplicate submissions count once; late submissions fail; one user cannot read another user’s private results or modify their score.
- Seeded wrong-answer and stuck scenarios produce accurate subtopic counts, evidence-grounded feedback, a relevant copied prompt, and working practice retries.
- Simulate 100 Socket.IO clients in 50 matches across both subjects for at least two full rounds on the intended deployment. Require no double-matching, lost acknowledged answers, cross-room leakage, or stalled matches; target p95 answer acknowledgements under 500 ms. Measure and report actual results rather than assuming capacity.
- Exercise refresh, queue cancellation, disconnect, and unavailable AI. Simulate 100 completed-player analysis jobs with a stub to verify queuing/fallback; separately verify several real LLM responses without confusing stub throughput with provider capacity.
- Demo story: two volunteers compete, one misses chain-rule questions, the review identifies the possible missing inner derivative, and that student tries a different chain-rule question. Show the attempt comparison without claiming one retry proves learning.

Exclude teacher accounts, school integrations, global rankings, Elo, payments, open chat, and adaptive competitive question generation. If the core passes, add confidence tracking first. A teacher class-summary view is a later extension for repeat classroom use, not a prerequisite for this weekend’s demo.
