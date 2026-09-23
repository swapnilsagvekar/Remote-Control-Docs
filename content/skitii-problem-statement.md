# Skitii — Problem Statement & Why We Exist  
**Version:** 1.2  
**Date:** August 2026  
**Author:** Swapnil Sagvekar  
**Audience:** Engineering team, product, onboarding  
**Scope:** Why Skitii exists, who it is for, and what we are building  

---

## The problem

Cancer treatment is already hard on the body. Chemo, radiation, surgery — patients go through a lot physically.

But there is another problem that often gets ignored: **fear and anxiety**.

- During treatment, many patients feel **severe anxiety**.
- This anxiety is **invisible**. A patient can look fine on the outside, but stress is building inside the body.
- High stress can **slow recovery**, affect the immune system, and make treatment harder to complete.
- Doctors and nurses can see physical symptoms, but they **do not have a real-time way to measure or reduce stress** while treatment is happening.

**Fear during cancer treatment hurts patients — and until now, there was no good way to see it or act on it in real time.**

---

## Who has the problem

**Primary — the patient**

The person sitting through chemo, radiation, or day-care treatment. They feel the fear directly. It affects their body, their mood, and whether they can keep coming back for the next session.

**Secondary — everyone around them**

- **Nurses and clinical staff** who run sessions and watch patients struggle without a tool to help in the moment
- **Oncologists and treating physicians** who prescribe treatment but cannot see minute-by-minute stress during it
- **Hospital administrators** who care about adherence, missed sessions, and quality of care outcomes

---

## What happens today without Skitii

In a typical hospital or chemotherapy day-care setting:

- Staff talk to the patient, try to comfort them, offer distraction (TV, phone, generic music)
- Sometimes anti-anxiety medication is used — but that is not real-time and not tailored to every session
- Clinicians rely on **how the patient looks or what they say** — there is no live measure of stress during treatment
- When anxiety spikes, the team often finds out **after** the patient is already distressed or has missed a session

Nothing today gives the care team a **continuous, objective signal** of stress **during** the session — and nothing responds to it automatically in that moment.

---

## Why the current approach is not enough

| Gap | What it means |
|-----|---------------|
| **Stress is invisible** | Clinicians cannot see anxiety building until the patient breaks down or speaks up |
| **Responses are generic** | TV, conversation, or a fixed playlist do not adapt to what the body is doing right now |
| **No closed loop** | There is no measure → understand → act → re-measure cycle during treatment |

| What we see | Why it matters |
|-------------|----------------|
| ~80% of patients are severely anxious during treatment | Anxiety affects healing, not just mood |
| No device existed to track real-time stress during chemo | Clinicians could not see it happening |
| Anxious patients have higher dropout and relapse risk | Fear can stop treatment from working well |

---

## Who uses, recommends, and pays

| Role | Who | In practice |
|------|-----|-------------|
| **Uses it** | Patient receives therapy; nurse or clinical staff runs the session on tablet/device | During chemo, radiation, or day-care shifts |
| **Recommends / approves** | Oncologist, treating physician, hospital clinical lead | Decides if Skitii fits the care pathway |
| **Pays** | Hospital, cancer center, or trial sponsor (institution) | Buys or sponsors deployment or clinical trial |

Patients and nurses use the **tablet app** during care. Hospital admins use the **admin panel** for operations. Backend and infrastructure support the treatment-room session.

---

## Primary user in the real workflow

**The patient** is at the center. Skitii runs **during** treatment — not before or after in a separate setting.

**Where and when:**

- In the hospital day-care or chemo/radiation unit, during an active treatment session
- A **nurse or clinical staff member** starts the session on the tablet, connects the heart sensor, and stays with the patient
- At Yenepoya (first trial), patients may have up to **3 sessions per day** across clinical shifts

The admin panel, backend APIs, and DevOps support the patient + nurse moment — they are not the primary user.

---

## What Skitii changes

> **Skitii makes treatment-related anxiety visible during the session and responds with personalized calming therapy in real time — so patients can get through treatment with less fear and hospitals can support better outcomes.**

Tagline: **“We make cancer anxiety visible.”**

Skitii was not built in a lab first. It came from what the founders saw in **real treatment rooms** — patients sitting through sessions while fear quietly made an already difficult experience worse.

---

## What success looks like

1. **For the patient** — Less anxiety during treatment; easier to complete sessions and return for the next one
2. **For the hospital** — Better adherence, fewer missed sessions, evidence that quality of care is improving
3. **For Skitii** — Clinical proof the device works (trials → regulatory approval → scale to more hospitals)

Goal: **reduce treatment-related anxiety** so patients can tolerate treatment better and recover better.

---

## How Skitii works

Skitii is an **AI-powered medical device** (not a wellness app).

### 1. Read

A small heart-rate sensor tracks **HRV (Heart Rate Variability)** every second during treatment. HRV is a proven clinical signal of stress — used in cardiology and intensive care worldwide.

### 2. Understand

Skitii calculates stress level in real time using metrics like **RMSSD**. Together, these indicate how stressed the patient is at that moment.

### 3. Respond

Skitii plays **AI-generated music** adapted to the patient’s current stress level. Not a fixed playlist — therapy that changes as the body calms down.

**Closed loop:** measure stress → understand it → respond → measure again.

**Read. Understand. Respond.**

---

## What is essential vs what can wait

**Essential — the live session loop**

Sensor → stress read → adaptive music **during treatment**. Without this, there is no Skitii.

**Can be postponed without breaking core value**

Extra analytics dashboards, nice-to-have admin reports, non-core integrations — as long as the session works reliably for patient + nurse in the treatment room.

---

## Who built it and why

**Dr. Chirag Jain** — Physician who sat with patients through hundreds of treatment sessions. He watched fear take over and make already difficult treatment feel unbearable. He knew the body’s stress signal was measurable, and decided someone had to build a device that acts on it.

**Darshana Jain** — Focused on patient experience. She saw how unmanaged anxiety during cancer treatment does not just cause suffering — it actively slows healing. She joined to make sure the science reached patients, not just research papers.

> *“We didn’t set out to build a product. We set out to fix something that was hurting people every single day.”*  
> — Dr. Chirag & Darshana Jain, Founders

Skitii was not built in a lab. **It was built in a treatment room.**

---

## Platform overview

Skitii is a **platform**, not a single app:

| Piece | What it is | Why it exists |
|-------|------------|---------------|
| **Skitii Product** | Main therapy device — BLE sensor + adaptive music sessions in clinics | Core product patients use during treatment |
| **Skitii Trial** | Clinical research version for hospitals (e.g. Yenepoya) | Same therapy flow + extra data collection for the study |
| **Trial Admin Panel** | Web console for hospital admins | Manage patients, sessions, weekly forms, and trial data |
| **Trial Mobile App** | React Native tablet app at the hospital | Nurses run sessions and collect weekly assessments |
| **Backend / DevOps** | APIs, auth, infrastructure | Powers everything; keeps data secure and deployments reliable |

Trials **prove the device works clinically** and collect evidence. Learnings feed back into the product.

---

## Adoption barriers

| Who | Likely objection | How Skitii addresses it |
|-----|------------------|-------------------------|
| **Oncologist** | “We already manage anxiety. I don’t need another device.” | Stress is managed blind today — visible only when the patient speaks up or breaks down. Skitii gives a live signal during the session without replacing the oncologist. |
| **Nurse** | “I don’t have time for another step in workflow.” | Runs during existing treatment time — patient is already in the chair. Staff start a session; the device handles the loop. |
| **Hospital admin** | “Is this proven? Is it regulated?” | Clinical trials (Yenepoya) generate evidence. CDSCO Class B approval is in progress. |
| **Patient** | “Another thing attached to me during chemo.” | Small sensor; experience is calming music, not more medical procedure. |

---

## 30-second explanation (for an oncologist)

> “Your patients are anxious during chemo and radiation — often severely — but you can’t see that stress minute by minute. Skitii is a medical device used during treatment: it reads the patient’s stress signal from a heart sensor and plays music that adapts in real time to calm them. It’s for your day-care team and patients, built from clinical experience, and we’re validating it in hospital trials so you can trust the outcomes, not just the idea.”

---

## If they say: “I don’t need this”

**Most likely reason:** Extra workflow, unproven device, or “my patients already have enough going on.”

**Response:**

> “Skitii is designed for the time your patient is already in the chair — not an extra appointment. Your nurse starts a session; the device monitors and calms in the background. The Yenepoya trial is how we prove whether it helps adherence and anxiety. If the data doesn’t show benefit, that’s the answer too.”

---

## Regulatory note

Skitii is an **investigational medical device** under clinical evaluation. CDSCO Class B regulatory approval is in progress.

It supports **anxiety management during cancer treatment** — it is **not** a cancer treatment itself, and it is not intended to diagnose, cure, or prevent any disease.

---

## Summary

- Invisible anxiety during cancer treatment hurts patients and slows recovery.
- **Roles:** patient suffers, nurse uses, oncologist recommends, hospital pays.
- **Core value:** sensor → stress read → adaptive music during treatment.
- **Evidence:** trials like Yenepoya prove the device works and build trust for scale.
