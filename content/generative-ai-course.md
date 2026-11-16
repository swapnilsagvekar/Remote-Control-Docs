# Generative AI Course — Step by Step  
**Version:** 1.0  
**Date:** October 2026  
**Author:** Swapnil Sagvekar  
**Audience:** Developer learning generative AI with Python  
**Scope:** From Python basics to live Gemini agents, tokens, embeddings, and prompt engineering  
**Practice folder:** `~/Desktop/Swapnil/generative ai`

---

## How to use this course

Every step is a **small, runnable Python file**. Read the comments at the top, run it, look at the output, then try the exercise at the bottom.

1. Run one file at a time, in order.
2. Predict the output **before** you run it.
3. Change one thing, run again, and see what changed.

---

## One-time setup

| What | Command / action |
|------|------------------|
| Go to the project | `cd "/home/swapnil/Desktop/Swapnil/generative ai"` |
| Python environment | Already created in `.venv/` — always run files with `.venv/bin/python` |
| API key | Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and put it in `.env` |
| Model setting | `GEMINI_CHAT_MODEL=gemini-3.8-flash` in `.env` |

Your `.env` file should look like this (never commit it — it is in `.gitignore`):

```
GEMINI_API_KEY=your-key-here
GEMINI_CHAT_MODEL=gemini-3.8-flash
```

Example run:

```bash
.venv/bin/python part3_live_gemini/01_first_gemini_call.py
```

---

## Project structure

```
generative ai/
  gemini_setup.py              shared: reads .env, creates the Gemini client, retries
  part1_python_basics/         01–10  Python foundations (no AI)
  part2_agent_prerequisites/   01–05  agent building blocks (no AI calls)
  part3_live_gemini/           01–06  real Gemini calls, agents, memory, LangChain
  lessons/                     lesson_01–03  how generative AI works
  generative_ai.py             original Colab notebook export (reference only)
```

**`gemini_setup.py`** is imported by every file that calls Gemini. It gives you:

| Name | What it does |
|------|--------------|
| `client` | The Gemini client, created once with your key |
| `CHAT_MODEL` | Model name from `.env` (default `gemini-3.8-flash`) |
| `generate(prompt, config)` | Calls Gemini and returns the response (`.text` = answer) |
| `with_retry(fn)` | Re-runs an API call when Gemini is busy (503) or you hit the per-minute limit (429) |

---

## Gemini free tier — what you need to know

| Fact | Detail |
|------|--------|
| Gemini app subscription ≠ API | A Google AI Pro / Jio Gemini Pro plan covers gemini.google.com only. The API has **separate** billing. |
| Pro models in code | `gemini-2.5-pro` is closed to new users; `gemini-3.1-pro-preview` has a free-tier limit of **0**. Needs API billing. |
| Free chat model | `gemini-3.8-flash` — strong and free, about **5 requests per minute** |
| Free embeddings | `gemini-embedding-001` — 3,072 numbers per text |
| 503 "high demand" | Temporary. `with_retry` waits 2s, 4s, 8s… and tries again. |
| 429 "retry in 19s" | Per-minute limit. `with_retry` waits the requested time automatically. |
| 429 "retry in 17h" | Daily limit used up. Try again tomorrow or switch model in `.env`. |

To use Pro later: enable billing in AI Studio, then set `GEMINI_CHAT_MODEL=gemini-3.1-pro-preview`. No code changes needed.

---

## Part 1 — Python basics

No AI yet. These are the building blocks every AI program uses.

| Step | File | You learn |
|------|------|-----------|
| 1 | `01_variables_and_printing.py` | Variables, `print()`, simple math |
| 2 | `02_lists_and_loops.py` | Lists and `for` loops |
| 3 | `03_functions.py` | `def`, parameters, `return` |
| 4 | `04_if_else.py` | Decisions with `if / elif / else` |
| 5 | `05_dictionaries.py` | Key–value data, `.get()` with defaults (LLM JSON becomes a dictionary) |
| 6 | `06_libraries.py` | `import` and using a library (`random`) |
| 7 | `07_pandas_data_analysis.py` | Load a CSV from the internet, `head()`, `describe()` |
| 8 | `08_matplotlib_visualization.py` | Scatter plot of California house prices |
| 9 | `09_input_loop_game.py` | `while` loop + `input()` — the same shape as an agent loop |
| 10 | `10_interactive_dashboard.py` | Inject Python data into an HTML page (Chart.js) and open it in the browser |

---

## Part 2 — Agent prerequisites (offline)

An **agent** is an LLM that *decides which Python function to run*. Before using a real LLM, learn the pieces with fake LLM output.

### Step 1 — Mock tool calling (`01_mock_tool_calling.py`)
The LLM's "decision" is a JSON string like `{"tool": "get_weather", "arguments": {...}}`. Python parses it and runs the matching function.

### Step 2 — Classes (`02_classes_oop.py`)
An agent is an object: **state** (name, role, memory list) + **methods** (`remember()`, `status()`).

### Step 3 — Web APIs and errors (`03_web_apis_and_errors.py`)
Tools are usually web APIs. Always use a `timeout`, call `raise_for_status()`, and catch specific errors so one bad call doesn't crash the agent.

### Step 4 — Parsing LLM JSON (`04_parsing_llm_json.py`)
LLMs often wrap JSON in ```` ```json ```` fences plus chatty text. Find the fenced block, strip it, then `json.loads()`.

### Step 5 — Mini agent loop (`05_mini_agent_loop.py`)
All four pieces together: **parse decision → run tool → store observation in memory**.

---

## Part 3 — Live Gemini

### Step 1 — First call (`01_first_gemini_call.py`)
`generate("...")` sends a prompt and returns the answer. `response.usage_metadata` shows the tokens you used.

### Step 2 — System instructions + JSON (`02_system_instructions_json.py`)

| Setting | Why |
|---------|-----|
| `system_instruction` | Rules that apply to every reply ("You are a routing agent…") |
| `response_mime_type="application/json"` | Output is guaranteed valid JSON — no markdown stripping |
| `temperature=0.1` | Predictable output for machine-readable answers |

### Step 3 — Live agent (`03_live_agent.py`)
The full loop:

1. LLM decides the tool (JSON)
2. Python runs the real API (PokeAPI)
3. The tool result goes **back** to the LLM, which writes a friendly answer

### Step 4 — Multi-tool routing (`04_multi_tool_routing.py`)
With two tools, describe **when to use each one** in the system instruction. The model picks the tool and extracts its arguments (e.g. `stat_type: "attack"`).

### Step 5 — Chat memory (`05_chat_memory.py`)
LLMs remember **nothing** between calls. "Memory" means re-sending the whole conversation each turn. `client.chats.create()` keeps that history list for you — the script prints it so you can see what is sent.

### Step 6 — LangChain (`06_langchain_intro.py`)
A framework for LLM apps: `prompt_template | llm | StrOutputParser()` builds a reusable chain. The Gemini class is `ChatGoogleGenerativeAI` (the original notebook used a wrong name, `ChatGoogleGenAI`, which crashes).

---

## Lesson 1 — An LLM is a next-word predictor

**File:** `lessons/lesson_01_next_token.py`

Every LLM repeats one loop:

1. Look at the text so far
2. Compute a probability for every possible next token
3. Pick one, append it, repeat

The lesson builds a tiny model from 6 sentences. After the word "the" it predicts:

| Next word | Probability |
|-----------|-------------|
| cat | 36.4% |
| dog | 18.2% |
| mat, fish, rug, mouse, bone | 9.1% each |

### Temperature

| Temperature | Behaviour | Example output |
|-------------|-----------|----------------|
| 0.1 | Almost always the top choice — repetitive | `the cat sat on the cat ate the cat…` |
| 1.0 | Follows learned probabilities | `the dog chased the cat sat on the mat .` |
| 3.0 | Flattened — rare words picked more | `the dog ate the mat .` |

**Key ideas**

- "Generative" = it produces sentences that were never in the training data by recombining patterns.
- **Hallucination** comes from the same mechanism: plausible ≠ true.
- Use low temperature for JSON/routing, higher for creative writing.

---

## Lesson 2 — Tokens and embeddings

**File:** `lessons/lesson_02_tokens_embeddings.py`

### Part A — Tokens

| Text | Tokens | Lesson |
|------|--------|--------|
| `I am learning generative AI` | 6 | "generative" → `gener` + `ative` |
| `Supercalifragilisticexpialidocious` | 10 | Rare words split into many pieces |
| `123456789 + 987654321` | 8 | Numbers split into 3-digit chunks → weak arithmetic |
| `मैं जनरेटिव एआई सीख रहा हूँ` | 9 | Same meaning in Hindi costs ~50% more tokens |

- Pricing and context windows are measured in **tokens**.
- English rule of thumb: 1 token ≈ 4 characters ≈ 0.75 words.

### Part B — Embeddings

An embedding turns text into a vector (3,072 numbers for Gemini) that represents **meaning**. Compare vectors with **cosine similarity**.

|  | cat | kitten | stocks | shares | pizza |
|--|-----|--------|--------|--------|-------|
| **cat** | 1.00 | **0.82** | 0.56 | 0.55 | 0.59 |
| **stocks** | 0.56 | 0.57 | 1.00 | **0.74** | 0.54 |

- "Cat sleeping on the sofa" ≈ "Kitten naps on the couch" (0.82) with almost no shared words.
- Unrelated pairs sit around 0.5–0.6, not 0 — compare scores **relative** to each other.
- Semantic search for *"Which sentence talks about the economy?"* ranked both finance sentences first. This is the core of **RAG**.

### How Transformers fix Lesson 1's problem
Lesson 1's model only saw one previous word. Transformers embed every token, then **attention** lets each token look at all others — so "bank" means different things in "river bank" and "bank loan".

---

## Lesson 3 — Prompt engineering

**File:** `lessons/lesson_03_prompt_engineering.py` (11 API calls, ~2 minutes on the free tier)

### A — Zero-shot vs few-shot

| Style | What you send | Result |
|-------|---------------|--------|
| Zero-shot | "Classify the sentiment of these reviews" | Free-form essay, hard to parse |
| Few-shot | 3 examples in the exact format `POSITIVE \| reason` | Copies the format exactly |

Few-shot output from a real run:

```
Output: POSITIVE | satisfied with delivery and functionality
Output: NEGATIVE | sarcasm regarding product fragility
Output: NEUTRAL | mediocre performance, meets basic needs
```

Note it caught the **sarcasm** in "Oh great, the screen cracked on day one."

### B — Thinking / chain-of-thought

Puzzle: *A notebook and pen cost ₹110. The notebook costs ₹100 more than the pen. Pen price?* Intuitive answer ₹10 is wrong; correct is **₹5**.

| Setting | Answer | Hidden thinking tokens |
|---------|--------|------------------------|
| `thinking_level="low"` | ₹5 | 130 |
| `thinking_level="high"` | ₹5 | 397 |

- Modern models reason in **hidden thinking tokens** (you pay for them).
- Older/smaller models need "think step by step" **in the prompt** — classic chain-of-thought.
- `minimal` thinking is not supported on `gemini-3.8-flash`.

### C — Roles (system instructions)

Same question "What is an API?":

- **10-year-old:** "An API is like a waiter at a restaurant who takes your order to the kitchen…"
- **Senior engineer:** "A defined set of programmatic interfaces that expose backend functionality… via standardized request-response cycles."

### D — Temperature in practice

| Temperature | Two runs of "Name a chai cafe in Pune" |
|-------------|----------------------------------------|
| 0.0 | `Chai Pune-a`, `Chai Pune-a` (identical) |
| 2.0 | `Puneri Chaiwalla`, `Chai Pune-dham` (different) |

### Prompt checklist

| Part | Question it answers |
|------|---------------------|
| **Role** | Who should the model be? |
| **Task** | What exactly should it do? |
| **Context** | What background does it need? |
| **Format** | What shape should the output have? (examples help most) |
| **Limits** | Length, language, what *not* to do |

---

## Part 4 — RAG: chat with your own documents

**Folder:** `part4_rag/` — sample documents in `my_docs/` (a made-up company handbook, cafe menu, and app FAQ).

**RAG = an open-book exam.** The AI first *finds* the right pages of your documents, *adds* them to the prompt, then *answers*.

| Letter | Word | Meaning |
|--------|------|---------|
| R | Retrieval | Find the right chunks |
| A | Augmented | Add them to the prompt |
| G | Generation | AI writes the answer from them |

### Two phases

| Phase | When | Steps |
|-------|------|-------|
| Prepare | Once, and again when documents change | Documents → chunks → embeddings → `rag_index.json` |
| Answer | Every question | Question → embedding → top 3 chunks → prompt → Gemini → answer + source |

### Step files

| File | What it shows |
|------|---------------|
| `01_why_rag.py` | Without documents Gemini guessed "12–20 days"; the handbook says **24** |
| `02_load_and_chunk.py` | 3 documents → 12 chunks of ~400 characters (headings kept with their text) |
| `03_build_index.py` | Each chunk → 3,072-number embedding (`RETRIEVAL_DOCUMENT`), saved to JSON |
| `04_search.py` | "money back" finds the **refund** chunk — search by meaning, not words |
| `05_answer_with_sources.py` | Prints the exact prompt: rules + chunks + question → "24 paid leaves, Source: company_handbook.md" |
| `06_rag_chat.py` | Chat loop; out-of-scope questions get "I don't know based on your documents." |
| `rag_pipeline.py` | All building blocks: Part A load/chunk, B embed/index, C search, D prompt/answer |

### The 3 prompt rules

1. Answer using **only** the context.
2. If it's not there, say **"I don't know based on your documents."**
3. Name the **source file**.

### Use your own PDF

1. Copy a text-based PDF into `part4_rag/my_docs/`
2. Rebuild: `.venv/bin/python part4_rag/03_build_index.py`
3. Chat: `.venv/bin/python part4_rag/06_rag_chat.py`

Scanned PDFs (photos of pages) have no text. Don't send secret documents to an online AI.

| Tuning knob | Too small | Good start | Too big |
|-------------|-----------|------------|---------|
| `chunk_size` | 100 — loses meaning | 300–800 | 3000 — mixed topics |
| `top_k` | 1 — may miss the answer | 3–5 | 20 — slow, costly, confusing |

---

## Roadmap — what comes next

| # | Lesson | You will build |
|---|--------|----------------|
| 4 | Native function calling | Replace hand-written JSON routing with Gemini's built-in tool calling |
| 5 | RAG ✅ | Done — see Part 4 above |
| 6 | Agents with LangGraph | Multi-step agents that plan, loop, and recover from errors |
| 7 | Evaluation & safety | Test LLM answers, catch hallucinations, add guardrails |
| 8 | Multimodal | Images in, images out; how diffusion models work |
| 9 | Fine-tuning (optional) | When to fine-tune instead of prompting |

---

## Troubleshooting

| Error | Meaning | Fix |
|-------|---------|-----|
| `GEMINI_API_KEY not found` | `.env` missing or key empty | Copy `.env.example` to `.env`, paste key |
| `404 … no longer available to new users` | Old model name | Use a model from the free-tier table above |
| `429 … limit: 0` | Model not on free tier (e.g. Pro) | Enable billing or use `gemini-3.8-flash` |
| `429 … retry in 17h…` | Daily free quota used | Wait, or set `GEMINI_CHAT_MODEL=gemini-3.1-flash-lite` |
| `503 UNAVAILABLE` | Gemini busy | Automatic retry; if it persists, wait a few minutes |
| `ModuleNotFoundError` | Ran with system Python | Use `.venv/bin/python` |

---

## Glossary

| Term | Meaning |
|------|---------|
| **LLM** | Large Language Model — predicts the next token |
| **Token** | A word or word-piece; the unit of pricing and context |
| **Temperature** | How random the next-token choice is |
| **Embedding** | A vector of numbers representing meaning |
| **Cosine similarity** | How closely two embeddings point in the same direction |
| **System instruction** | Rules applied to every reply |
| **Few-shot** | Teaching by examples inside the prompt |
| **Chain-of-thought** | Reasoning before answering (visible or hidden) |
| **Tool / function calling** | LLM chooses a function; your code runs it |
| **Agent** | LLM + tools + a loop + memory |
| **RAG** | Retrieval-Augmented Generation — search your docs, then answer |
| **Hallucination** | Confident but false output |
