# 🗺️ **Agent Kirk — 90-Day Refactor Roadmap**

### *Stabilize → Standardize → Improve → Expand*

---

# 🚨 **Phase 1 (Days 1–14): Immediate Stabilization**

### **Goal:** Stop fires, prevent silent failures, ensure users actually get responses.

This is the “don’t let the thing collapse” phase.

---

## **1. Add a System Watchdog for Stuck Queries**

**Why:** Queries can stay `IN_PROGRESS` forever if the Reporting Agent crashes.
**Priority:** 🔥 *Critical*

**Tasks:**

* Create a scheduled workflow that runs every 1–2 minutes.
* Find any Query where:

  * `status = 'IN_PROGRESS'`
  * `updatedAt > 10 minutes ago` (or lastUpdate timestamp)
* Auto-mark them as:

  * `status = 'FAILED'`
  * Write `stepResponse = { error: "Timed out" }`
* Notify admin Slack/email.

**Outcome:** No more queries silently stuck forever.

---

## **2. Add Retry Logic for All Frontend Callbacks**

**Why:** If responseUrl fails, the whole system lies about success.
**Priority:** 🔥 *Critical*

**Tasks:**

* Wrap all responseUrl HTTP calls in:

  * retry 3x
  * exponential backoff
  * fallback logging
  * final fail → store update in DB for manual re-send
* Add logging for failures.

**Outcome:** UI actually stays in sync.

---

## **3. Add LLM Output Normalization Layer**

**Why:** LLMs can return wrong shapes, hallucinated keys, unexpected arrays, etc.
**Priority:** 🔥 *Critical*

**Tasks:**

* Create a dedicated subworkflow:

  * Input: raw LLM output
  * Validate JSON shape
  * Ensure required fields exist
  * Remove undefined fields
  * Coerce strings/arrays to expected types
* Every LLM tool pipes through this before use.

**Outcome:** Downstream logic becomes 10x more stable.

---

# ⚙️ **Phase 2 (Days 15–45): Structural Improvements**

### **Goal:** Make the system maintainable by humans who weren’t the ex-employee.

---

## **4. Consolidate Data Packet Structure (Kill the Pack/Unpack Ping-Pong)**

**Why:** The re-wrap/unpack cycle is fragile and wastes time.
**Priority:** 🔥 High

**Tasks:**

* Establish **one canonical data structure**:
  `chatInput { user:..., query:..., context:... }`
* Update all workflows to:

  * Input: `chatInput`
  * Output: `chatInput`
* Remove:

  * `queryPacket`
  * `Unpack Query Packet`
  * half the merge nodes

**Outcome:** Big reduction in system fragility.

---

## **5. Break Up the Reporting Agent**

**Why:** It’s a monstrous god-workflow doing 12 jobs.
**Priority:** 🔥 High

**Split into:**

1. **reporting.orchestrator**
2. **reporting.prepare**
3. **reporting.runTool (GA4, Sprout, Email, etc.)**
4. **reporting.sendUpdate**
5. **reporting.deepInsights**
6. **reporting.finalResponder**

**Outcome:**
Modular workflows → far easier debugging, extension, and contractor onboarding.

---

## **6. Add Contract Tests for Every Workflow Boundary**

**Why:** Prevent accidental schema drift.
**Priority:** High

**Tasks:**

* Create a “validator” subworkflow that:

  * Ensures required fields exist
  * Checks types
  * Logs mismatches
* Add it after:

  * Get User Data Packet
  * Summarizer Agent
  * Deeper Insights Agent
  * Final Responder
  * Reporting Agent return

**Outcome:**
Early detection of bugs instead of weeks of mystery failures.

---

# 🛠️ **Phase 3 (Days 45–75): Performance, Logging, and Tooling**

### **Goal:** Make the system robust at scale and easier to troubleshoot.**

---

## **7. Add Centralized Logging & Error Reporting**

**Why:** Right now errors vanish unless we happen to catch them.
**Priority:** Medium

**Tasks:**

* Create a shared subworkflow:

  * input: `event`, `context`
  * output: log entry to Postgres or dedicated logs table
* Track:

  * workflow name
  * queryId
  * userId
  * error message
  * timestamp
  * stack or raw error

**Outcome:**
We can actually debug things.

---

## **8. Add Timeouts & Circuit Breakers for All External API Calls**

**Why:** GA4 & Sprout will occasionally hang → n8n stalls.
**Priority:** Medium

**Tasks:**

* Wrap GA4/Sprout calls in timeout logic.
* If a tool fails → return graceful fallback.
* Mark tool as “failed” but continue the report.

**Outcome:**
No more stuck Reporting Agents.

---

## **9. Cache User Data Packet for Short Intervals**

**Why:** We fetch GA/Sprout/Email/Memories every single run.
**Priority:** Medium

**Tasks:**

* Cache data for 15–60 seconds.
* Store in:

  * Redis
  * or local n8n DB table
* Invalidate on user account changes.

**Outcome:**
Huge performance win.

---

# 🚀 **Phase 4 (Days 75–90): Hardening & Next-Level Improvements**

### **Goal:** Turn Kirk into a maintainable, scalable, production-grade system.**

---

## **10. Redesign Query Status System**

**Why:** Two-state logic is not enough.
**Priority:** Medium

Introduce:

* `QUEUED`
* `IN_PROGRESS_FAST`
* `IN_PROGRESS_FULL`
* `AWAITING_DATA`
* `FAILED`
* `COMPLETED`

**Outcome:**
Proper lifecycle tracking like a real job system.

---

## **11. Add Automatic Recovery for Partial Failures**

**Why:** Right now a failed GA call kills the entire report.
**Priority:** Medium

**Tasks:**

* Mark failed tool runs as:

  * `toolName: failed`
  * Add fallback message
* Continue generating the report with partial data.

---

## **12. Add Developer-Friendly Docs & Internal Diagrams (for Contractors)**

**Why:** So we’re never in this situation again.
**Priority:** Medium

**Tasks:**

* Add short docs per workflow (we’ve already started this).
* Add packet shape diagrams.
* Add onboarding guide for n8n contractors.

**Outcome:**
Faster onboarding, safer maintenance.

---

# 🧲 **Roadmap Summary (Cheat Sheet)**

## **🔥 Weeks 1–2 (Stabilize)**

* Watchdog for stuck queries
* Retry logic for UI callbacks
* Normalize LLM outputs

## **⚙️ Weeks 3–6 (Structural Fixes)**

* Replace multi-packet system with single `chatInput`
* Modularize Reporting Agent
* Add validators at workflow boundaries

## **🛠️ Weeks 7–10 (Performance + Safety)**

* Logging & error reporting
* Timeout/circuit breaker system
* Cache User Data Packet

## **🚀 Weeks 11–12 (Hardening)**

* Expand query status lifecycle
* Graceful partial failure handling
* Full documentation + diagrams

---

# 🎯 **What This Gives Us**

By Day 90:

* The system stops breaking randomly
* We have guardrails against LLM drift
* Reporting Agent becomes maintainable
* Packet format becomes sane
* UI updates become reliable
* Contractors can safely work on it
* We’re no longer hostage to design choices of the fired employee
* Kirk becomes scalable and robust for real customers

---