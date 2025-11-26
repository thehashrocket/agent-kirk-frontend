# 🧠 Agent Kirk – System Overview & Data Flow

## 1. High-Level Concept

Agent Kirk is built around a few key ideas:

* **Single entry point** from the frontend (Master Workflow).
* **Standardized data packets** (`queryPacket`, `chatInput`, and the User Data Packet).
* **Two main response paths**:

  * **Quick Responder** → fast, lightweight LLM reply.
  * **Reporting Agent** → slower, heavy analytics + full report.
* **Shared utilities** to wrap/unpack packets and to assemble user context so all agents see the same shape of data.

The system is deliberately modular: each workflow has one clear responsibility, and communication happens via well-defined packet shapes.

---

## 2. Main Workflows & Their Roles

Here’s what we’ve built and what each piece does:

* **Kirk | Set Up Run Variables**
  Takes raw webhook input from the frontend and normalizes it into clean, top-level fields (`queryId`, `query`, `userId`, etc.).

* **Kirk | Create Query Packet from User Query**
  Wraps those normalized fields into a single object under `queryPacket`. This is our “envelope.”

* **Kirk | Unpack Query Packet from User Query**
  Does the opposite: takes `queryPacket` and promotes its contents back to the top level when a workflow wants flat JSON again.

* **Kirk | Check Query Status**
  Looks up the `Query.status` in Postgres and decides whether to continue to heavy processing (`IN_PROGRESS`) or bail (`COMPLETED`).

* **Kirk | Create User Data Packet**
  Fetches GA accounts, Sprout accounts, email accounts, user memories, recent conversations, and the conversation thread, then merges them into a **User Data Packet**.

* **Kirk | Get User Data Packet**
  Calls `Create User Data Packet`, merges it with the incoming query data, and returns a canonical `chatInput` structure used by all LLM agents.

* **[01] Agent Kirk | Master Workflow**
  Main orchestrator: receives frontend requests, calls “Set Up Run Variables,” triggers Quick Responder for fast output, and then kicks off the Reporting Agent for the full report.

* **[01] Agent Kirk | Quick Responder Agent**
  Uses `Get User Data Packet` and a fast LLM prompt to generate the initial reply. Builds the base query packet for downstream use.

* **Kirk | Quick Responder Agent Response**
  Writes the quick reply into the `Query.response` field and calls the frontend webhook (`responseUrl`) so the UI updates immediately, marking status as `pending`.

* **[01] Agent Kirk | Reporting Agent**
  Big one. After Quick Responder, this gathers GA4 / Sprout / Email data, uses LLM tools for analysis, keeps sending incremental updates, and finally produces a formatted markdown report and marks the query `COMPLETED`.

* **[00] Kirk Automated Drive Backup**
  Not directly in the query flow, but backs up workflows and generates a technical reference doc in Google Docs. This is our ops safety net.

---

## 3. End-to-End Request Lifecycle

### 3.1. Frontend → Master Workflow

1. The **frontend** sends a POST request with a JSON body that includes:

   * `queryId`, `content` (user message), `userId`, `conversationId`
   * `gaAccountId`, `gaPropertyIds`, `sproutSocialAccountIds`, `emailClientIds`
   * `responseUrl` (for UI updates)
   * `logging` flag, etc.

2. The **Master Workflow** receives this and calls:
   **`Kirk – Set Up Run Variables`**.

---

### 3.2. Set Up Run Variables

**Kirk | Set Up Run Variables**:

* Reads values from `$json.body.*` and maps them to clean, top-level fields:

  * `queryId`, `query`, `userId`, `sessionId`, `gaAccountId`, `gaPropertyId`, `sproutSocialAccountIds`, `emailClientIds`, `responseUrl`, `logging`, `dateToday`.
* Then calls:
  **`Kirk – Create Query Packet from User Query`**.

Resulting shape after that subworkflow:

```json
{
  "queryPacket": {
    "queryId": "...",
    "query": "...",
    "userId": "...",
    "sessionId": "...",
    "gaAccountId": "...",
    "gaPropertyId": [...],
    "sproutSocialAccountIds": [...],
    "emailClientIds": "...",
    "responseUrl": "...",
    "logging": "...",
    "dateToday": "..."
  }
}
```

The **Master Workflow** now has a consistent, wrapped `queryPacket` to send around.

---

### 3.3. Quick Responder Path (Fast Response)

From here, the Master Workflow triggers the **Quick Responder Agent**.

#### 3.3.1. Get User Context

**Quick Responder** calls **`Kirk – Get User Data Packet`**:

* `Get User Data Packet` → calls `Create User Data Packet` to build the **User Data Packet**: GA accounts, Sprout accounts, email accounts, memories, recent convos, and conversation thread.
* It then merges:

  * The unpacked `queryPacket` (via `Unpack Query Packet`)
  * The User Data Packet
* And wraps everything in a final structure:

```json
{
  "chatInput": {
    // all fields from queryPacket
    // full user data packet
  }
}
```

This `chatInput` structure is *the* canonical input shape for all Kirk LLM agents.

#### 3.3.2. Quick LLM Response

Quick Responder:

* Uses `chatInput` and an LLM tool to generate a **fast answer** (“Quick Responder output”).
* Builds a small packet that includes:

  * `queryId`
  * `quickResponder` content
  * any metadata needed for the response relay.

#### 3.3.3. Write & Notify

Quick Responder then calls: **`Kirk – Quick Responder Agent Response`**.

That workflow:

1. **Writes the quick reply into the DB**

   * Sets `Query.response = quickResponder.response`.
2. **Notifies the frontend**

   * Calls `responseUrl` with a payload like:

     ```json
     {
       "message": "Quick response text...",
       "status": "pending"
     }
     ```
3. **Writes `stepResponse`**

   * Stores the same status object into `Query.stepResponse` for persistence.

At this point:

* The **user sees an immediate answer** in the UI.
* The query is **still in progress** for the heavier Reporting Agent.

---

### 3.4. Check Query Status Before Heavy Work

The Master Workflow now wants to run the Reporting Agent. Before doing that, it calls:

**`Kirk – Check Query Status`**.

This workflow:

1. Calls **`Unpack Query Packet`** to get a flat `queryId`.
2. Runs a Postgres query:

   ```sql
   SELECT "status" FROM "Query" WHERE "id" = $1;
   ```

   using `$json.chatInput.queryId`.
3. Uses a **Switch**:

   * If `status == IN_PROGRESS` → continue.
   * If `status == COMPLETED` → do nothing (no more heavy processing).
4. For `IN_PROGRESS`, it calls **Create Query Packet** again to re-wrap into a clean `queryPacket` for downstream.

This prevents:

* Double-running Reporting Agent.
* Wasted compute if something already marked the query completed.

---

### 3.5. Reporting Agent Path (Full Analytics)

If the status check passes, the Master Workflow triggers:

**`[01] Agent Kirk | Reporting Agent`**.

This is the heavy analytics and reporting engine.

At a high level it:

1. **Unpacks the query packet** and merges:

   * GA accounts from Postgres
   * Sprout accounts from Postgres
   * Conversation history from DB

2. **Calls Summarizer Agent**:

   * Understands what the user is really asking.
   * Decides which tools (GA4, Sprout, Email, Strategist, Calculator, etc.) are needed.
   * Sends an initial “Here’s what I’m going to do” update to the user.

3. **Iteratively runs tools**:

   * GA4 workflows
   * Sprout Social data pulls
   * Email metrics flows
   * Strategist tool
   * Calculator for comparisons
     After each tool call:
   * Uses **Respond to User** to add a status/progress update.
   * Uses **Update Frontend** so the UI shows incremental progress.

4. **Deeper Insights Agent**:

   * Once all data is fetched, it performs the deep analysis, builds the raw report content.

5. **Final Responder Agent**:

   * Formats the final report into markdown:

     * One-sentence answer
     * Summary
     * Key highlights
     * Recommendations
   * Writes it into `Query.response`.
   * Calls Update Frontend to mark the query as `COMPLETED`.

The user ends up with:

* Quick answer (fast path).
* Detailed report (slow path) that replaces / augments the initial answer.

---

## 4. Data Shapes & Packets

### 4.1. `queryPacket`

Used to standardize input between workflows.

* Created by: **Create Query Packet from User Query**.
* Unpacked by: **Unpack Query Packet from User Query**.

**Shape:**

```json
{
  "queryPacket": {
    "queryId": "...",
    "query": "...",
    "userId": "...",
    "sessionId": "...",
    "gaAccountId": "...",
    "gaPropertyId": [...],
    "sproutSocialAccountIds": [...],
    "emailClientIds": "...",
    "responseUrl": "...",
    "logging": "...",
    "dateToday": "..."
  }
}
```

---

### 4.2. User Data Packet

Built by **Create User Data Packet**.

Contains:

* GA accounts / properties
* Sprout accounts
* Email account IDs
* User memories
* Recent conversations
* Conversation thread

This is merged with the unpacked `queryPacket` and then wrapped into `chatInput`.

---

### 4.3. `chatInput`

Built by **Get User Data Packet**.

Final structure for LLM agents:

```json
{
  "chatInput": {
    // query fields (from queryPacket)
    // user context (User Data Packet)
  }
}
```

All LLM agents (Quick Responder, Summarizer, Reporting Agent, Strategist, etc.) are designed to consume this shape.

---

## 5. Status, Response, and UI Sync

A few key contracts are enforced:

* **Query.status** in Postgres:

  * `IN_PROGRESS` → Reporting Agent allowed to run.
  * `COMPLETED` → heavy processing should not re-run.

* **Query.response**:

  * First written by **Quick Responder Agent Response** with the fast reply.
  * Later overwritten / expanded by the **Final Responder** inside Reporting Agent.

* **Query.stepResponse**:

  * Used to store progress/status payloads sent to the frontend.

* **Frontend callbacks (`responseUrl`)**:

  * Used for both quick response and progress updates.
  * Final response marks the query as `COMPLETED` in the UI.

---

## 6. How to Extend Kirk Safely

When we add a new agent or tool, the rules are:

1. **Always work from `chatInput`**

   * If we need user context + query details → call `Get User Data Packet` first.
2. **If we’re building a new request flow**:

   * Use **Set Up Run Variables** → **Create Query Packet** at the entry point.
3. **Need to inspect or modify query fields in a subworkflow?**

   * Call **Unpack Query Packet from User Query** to flatten fields.
4. **Any heavy “follow-on” workflow** should:

   * Respect `Check Query Status` before running.
5. **Always update the frontend + DB consistently**:

   * Use the same pattern as Quick Responder Response and Reporting Agent:

     * Write to `Query.response` / `Query.stepResponse`
     * Call `responseUrl`
     * Adjust `status` as appropriate.

---

## 7. TL;DR

If we had to explain Kirk to a new engineer in 30 seconds:

> “The frontend hits a master webhook. We normalize that into a `queryPacket`, build a full `chatInput` with user context, send a fast LLM response via the Quick Responder, check the query status, and then run a heavy Reporting Agent that pulls GA4/Sprout/Email data, does deep analysis, and writes a final markdown report back to the DB and UI. Everything talks via standard packets: `queryPacket`, User Data Packet, and `chatInput`.”

---