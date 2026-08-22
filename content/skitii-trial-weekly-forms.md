# Skitii Trial — Weekly Clinical Review Forms  
**Version:** 1.0  
**Date:** July 2026  
**Author:** Swapnil Sagvekar  
**Customer:** Yenepoya Hospital  
**Scope:** Field-level reference for each Weekly Clinical Review form step (dynamic / configurable per trial)

---

## 1. Overview

Weekly Clinical Review is a **multi-step assessment** shown from the Dashboard Weekly action. Which steps appear for a given even study week (Week 0, 2, 4, 6, 8…) is driven by trial config (`weeklyFormDefinitions`) — the same dynamic model as patient intake schema.

> **`trialDurationWeeks` ≠ form weeks.** Duration (Yenepoya = **4**) → `completionDate` = enrollment + **27** days (sessions through that day). Which even-week forms exist — and how many — comes **only** from `weeklyFormDefinitions`. Each Week 2+ form is a **7-day** window: start = enrollment + (week × 7). Forms may still be submitted after `completionDate` while their window is open. Reminder = **day before** `windowEnd` only (skip if Done; no Week 0 reminder).

**Important:** The step set below is the **current Yenepoya / design catalogue**. Steps and fields **will change in future trials**. Do not hardcode this list in the mobile app; render from backend config.

### 1.1 Current form catalogue (step keys)

| # | Step key (suggested) | Display name |
|---|----------------------|--------------|
| 1 | `vitals` | Vital Signs (Weekly Clinical Review: vitals + past history + meds + investigations) |
| 2 | `gad7_phq9` | GAD-7 & PHQ-9 |
| 3 | `nccn_distress` | NCCN Distress Thermometer |
| 4 | `hads` | HADS-A & HADS-D |
| 5 | `qlq_c30` | QLQ-C30 |
| 6 | `qlq_hn35` | QLQ-H&N35 |
| 7 | `treatment_adherence` | Treatment Adherence |
| 8 | `satisfaction_survey` | Satisfaction Survey (Intervention Group) |
| 9 | `hrv` | HRV (5-Minute Resting) |

> A given week may use a **subset** of these steps. Progress is always **Step X of N** where **N = number of steps configured for that week** (not the catalogue size of 9). Example: if that week has **7** forms → **Step 1 of 7** … **Step 7 of 7** (percent = X/N × 100).

---

## 2. Form: Vital Signs (`vitals`)

**Screen title:** Weekly Clinical Review  
**Step key:** `vitals` (single Mixed payload on `weeklyForms.vitals`)

UI sections on this step: **Vital Signs** → **Past History** → **Current Medication** → **Investigations**.  
Client gate before Next: vital signs complete + past-history section addressed + **≥1** current medication. Investigations are optional.

### 2.1 Vital Signs

| Field | UI label | Required | Type / control | Notes / example |
|-------|----------|----------|----------------|-----------------|
| `bpSystolic` | Blood Pressure (Systolic)* | Yes | Number (text input) | Placeholder: `120` (mmHg). **No min/max range validation.** |
| `bpDiastolic` | Blood Pressure (Diastolic)* | Yes | Number (text input) | Placeholder: `80` (mmHg). **No min/max range validation.** |
| `spo2` | SpO₂* / SpO2 %* | Yes | Number / percent input | Placeholder: `98%` — store as number `98` (unit: %). **No min/max range validation.** |
| `ecogScore` | ECOG Performance Status* | Yes | Dropdown (“ECOG Status*”) | Store `0`–`4` (see below) |

#### ECOG Performance Status options

| Value | UI label |
|-------|----------|
| `0` | 0 — Fully active |
| `1` | 1 — Restricted strenuous activity |
| `2` | 2 — Ambulatory, unable to work |
| `3` | 3 — Limited self-care |
| `4` | 4 — Completely disabled |

### 2.2 Past History

**Instruction:** Tick any known condition and record how many years the patient has had it.

| Field | UI label | Required | Type / control | Notes |
|-------|----------|----------|----------------|-------|
| `pastHistory.conditions[]` | Condition cards | Section required; each tick optional | Array of selected conditions | Omit unchecked codes |
| `pastHistory.conditions[].code` | — | Yes if selected | Enum string | `dm` \| `htn` \| `asthma` \| `allergy` |
| `pastHistory.conditions[].yearsSince` | How many years since* | Yes if condition ticked | Number | Duration in years (not calendar year of diagnosis) |
| `pastHistory.notes` | Anything else (descriptive) | No | Text | Placeholder: prior radiotherapy, surgery, family history… |

| `code` | UI label |
|--------|----------|
| `dm` | Diabetes mellitus (DM) |
| `htn` | Hypertension (HTN) |
| `asthma` | Asthma |
| `allergy` | Allergy |

### 2.3 Current Medication

**Instruction:** At least one drug with its dose, frequency and route is required.  
UI: **+ Add drug** rows; trash to remove.

| Field | UI label | Required | Type / control | Notes |
|-------|----------|----------|----------------|-------|
| `currentMedications` | — | Yes (≥1 row) | Array | |
| `currentMedications[].drugName` | Drug name | Yes | Text | e.g. `Cisplatin` |
| `currentMedications[].dose` | Dose | Yes | Text | e.g. `50 mg` |
| `currentMedications[].frequency` | Frequency | Yes | Dropdown | Enum — see below |
| `currentMedications[].mode` | Mode (route) | Yes | Dropdown | Enum — see below |

#### Frequency options

| Value | UI label |
|-------|----------|
| `od` | Once daily (OD) |
| `bd` | Twice daily (BD) |
| `tds` | Three times daily (TDS) |
| `qid` | Four times daily (QID) |
| `weekly` | Weekly |
| `prn` | As needed (PRN) |

#### Mode (route) options

| Value | UI label |
|-------|----------|
| `oral` | Oral |
| `intravenous` | Intravenous |
| `intramuscular` | Intramuscular |
| `subcutaneous` | Subcutaneous |
| `topical` | Topical |
| `inhalation` | Inhalation |

### 2.4 Investigations

**Instruction:** Enter recorded values for routine tests, or add any other test.  
Optional section. UI: **+ Add other test** for custom rows; **Add Photo** uploads one jpeg/png/webp via Product Backend GraphQL `uploadDocument` and stores the returned URL as `investigations.photoUrl`.

| Field | UI label | Unit (display) | Required | Type |
|-------|----------|----------------|----------|------|
| `investigations.wbc` | WBC | cells/µL | No | Number |
| `investigations.platelet` | Platelet | ×10³/µL | No | Number |
| `investigations.hb` | Hb | g/dL | No | Number |
| `investigations.fbs` | FBS | mg/dL | No | Number |
| `investigations.ppbs` | PPBS | mg/dL | No | Number |
| `investigations.hba1c` | HbA1c | % | No | Number |
| `investigations.photoUrl` | Add Photo | — | No | String (HTTPS URL from Product GraphQL `uploadDocument`) |
| `investigations.other[]` | Other tests | — | No | Array |
| `investigations.other[].name` | Test name | — | Yes if row present | String |
| `investigations.other[].value` | Value | — | Yes if row present | Number |
| `investigations.other[].unit` | Unit | — | Yes if row present | String |

### 2.5 Suggested payload fragment

```json
{
  "bpSystolic": 120,
  "bpDiastolic": 80,
  "spo2": 98,
  "ecogScore": 1,
  "pastHistory": {
    "conditions": [
      { "code": "htn", "yearsSince": 5 },
      { "code": "allergy", "yearsSince": 5 }
    ],
    "notes": "Prior radiotherapy in 2021, thyroid surgery, family history..."
  },
  "currentMedications": [
    {
      "drugName": "Cisplatin",
      "dose": "50 mg",
      "frequency": "od",
      "mode": "intravenous"
    }
  ],
  "investigations": {
    "wbc": 7200,
    "platelet": 250,
    "hb": 12.4,
    "fbs": 96,
    "ppbs": 132,
    "hba1c": 5.8,
    "photoUrl": "https://docs.example.com/docs/trial/investigations/00000000-0000-0000-0000-000000000001.jpg",
    "other": [
      { "name": "Serum creatinine", "value": 0.9, "unit": "mg/dL" }
    ]
  }
}
```

Submitted under `submitWeeklyAssessment` as:

```json
{
  "patientId": "...",
  "studyWeek": 0,
  "vitals": { "...": "see fragment above" }
}
```

Backend stores the object as-is on `weeklyForms.vitals` (`SchemaTypes.Mixed`); no server-side field validation of the nested shape.

---

## 3. Form: GAD-7 & PHQ-9 (`gad7_phq9`)

**Recall window:** “Over the last **2 weeks**…” (aligns with 14-day study form cadence)

### 3.1 Shared response scale

Same 4 options for every GAD-7 and PHQ-9 item (single choice, required):

| Label | Score |
|-------|-------|
| Not at all | 0 |
| Several days | 1 |
| More than half the days | 2 |
| Nearly every day | 3 |

### 3.2 GAD-7 — Generalized Anxiety Disorder-7

**Instruction:** Over the last 2 weeks, how often have you been bothered by the following problems?

| # | Key | Item text (required *) |
|---|-----|------------------------|
| 1 | `gad7_1` | Feeling nervous, anxious, or on edge |
| 2 | `gad7_2` | Not being able to stop or control worrying |
| 3 | `gad7_3` | Worrying too much about different things |
| 4 | `gad7_4` | Trouble relaxing |
| 5 | `gad7_5` | Being so restless that it is hard to sit still |
| 6 | `gad7_6` | Becoming easily annoyed or irritable |
| 7 | `gad7_7` | Feeling afraid, as if something awful might happen |

**Subscale total:** sum of 7 items → `gad7Total` (0–21)

### 3.3 PHQ-9 — Patient Health Questionnaire-9

**Instruction:** Over the last 2 weeks, how often have you been bothered by any of the following problems?

| # | Key | Item text (required *) |
|---|-----|------------------------|
| 1 | `phq9_1` | Little interest or pleasure in doing things |
| 2 | `phq9_2` | Feeling down, depressed, or hopeless |
| 3 | `phq9_3` | Trouble falling or staying asleep, or sleeping too much |
| 4 | `phq9_4` | Feeling tired or having little energy |
| 5 | `phq9_5` | Poor appetite or overeating |
| 6 | `phq9_6` | Feeling bad about yourself — or that you are a failure or have let yourself or your family down |
| 7 | `phq9_7` | Trouble concentrating on things, such as reading the newspaper or watching television |
| 8 | `phq9_8` | Moving or speaking so slowly that other people could have noticed; or the opposite — being so fidgety or restless that you have been moving around a lot more than usual |
| 9 | `phq9_9` | Thoughts that you would be better off dead, or of hurting yourself in some way |

**Subscale total:** sum of 9 items → `phq9Total` (0–27)

### 3.4 Suggested payload fragment

```json
{
  "step": "gad7_phq9",
  "gad7": {
    "items": [0, 1, 2, 1, 0, 1, 0],
    "total": 5
  },
  "phq9": {
    "items": [1, 1, 2, 1, 0, 1, 1, 0, 0],
    "total": 7
  }
}
```

### 3.5 Decisions (confirmed)

| Topic | Decision |
|-------|----------|
| Licensing | **Yes** — approved for this trial |
| Totals (`gad7Total`, `phq9Total`) | Computed on **both** tablet and backend |
| Self-harm item (`phq9_9`) | **Store data only** — no special alert / escalation in the app |

---

## 4. Form: NCCN Distress Thermometer (`nccn_distress`)

### 4.1 Distress Thermometer

| Field | UI label / question | Required | Type | Notes |
|-------|---------------------|----------|------|-------|
| `distressLevel` | How much distress have you been experiencing in the past week?* | Yes | Slider 0–10 | Left: “No distress” · Right: “Extreme distress”. Must interact / set value (default 0 shown in design). |

### 4.2 Problem Checklist*

Zero checked is allowed. Store selected keys as a string array.

**Practical Problems**

| Key | Label |
|-----|-------|
| `housing` | Housing |
| `transportation` | Transportation |
| `insurance` | Insurance |
| `work_school` | Work/School |

**Family Problems**

| Key | Label |
|-----|-------|
| `dealing_with_children` | Dealing with children |
| `dealing_with_partner` | Dealing with partner |

**Emotional Problems**

| Key | Label |
|-----|-------|
| `worry` | Worry |
| `sadness` | Sadness |
| `nervousness` | Nervousness |
| `fears` | Fears |
| `depression` | Depression |
| `loss_of_interest` | Loss of interest |

**Spiritual Problems**

| Key | Label |
|-----|-------|
| `loss_of_faith` | Loss of faith |
| `loss_of_meaning` | Loss of meaning |

**Physical Problems**

| Key | Label |
|-----|-------|
| `pain` | Pain |
| `fatigue` | Fatigue |
| `eating` | Eating |
| `breathing` | Breathing |
| `nausea` | Nausea |
| `sleep_problems` | Sleep problems |
| `bathing` | Bathing |
| `mouth_sores` | Mouth sores |

### 4.3 Suggested payload fragment

```json
{
  "step": "nccn_distress",
  "distressLevel": 0,
  "problems": ["worry", "fatigue", "sleep_problems"]
}
```

---

## 5. Form: HADS-A & HADS-D (`hads`)

All items required (*). Each item has **4 options**; option **wording and left-to-right order must match the validated HADS instrument** (do not reorder). Scores are 0–3 per item using standard HADS scoring (some items are reverse-scored relative to display order).

### 5.1 Anxiety — HADS-A (A1–A7)


| # | Key | Question | Options (left → right, as in UI) |
|---|-----|----------|----------------------------------|
| A1 | `hads_a1` | I feel tense or wound up* | Most of the time · A lot of the time · From time to time · Not at all |
| A2 | `hads_a2` | I get a sort of frightened feeling as if something awful is about to happen* | Very definitely and quite badly · Yes, but not too badly · A little, but it doesn't worry me · Not at all |
| A3 | `hads_a3` | Worrying thoughts go through my mind* | A great deal of the time · A lot of the time · From time to time, but not too often · Only occasionally |
| A4 | `hads_a4` | I can sit at ease and feel relaxed* | Not at all · Not often · Usually · Definitely |
| A5 | `hads_a5` | I get a sort of frightened feeling like "butterflies" in the stomach* | Very often · Quite often · Occasionally · Not at all |
| A6 | `hads_a6` | I feel restless as if I have to be on the move* | Very much indeed · Quite a lot · Not very much · Not at all |
| A7 | `hads_a7` | I get sudden feelings of panic* | Very much indeed · Quite a lot · Not very much · Not at all |

**Anxiety subscale total:** `hadsAnxietyTotal` (0–21)

### 5.2 Depression — HADS-D (D1–D7)


| # | Key | Question | Options (left → right, as in UI) |
|---|-----|----------|----------------------------------|
| D1 | `hads_d1` | I still enjoy the things I used to enjoy* | Hardly at all · Only a little · Not quite so much · Definitely as much |
| D2 | `hads_d2` | I can laugh and see the funny side of things* | Not at all · Definitely not so much now · Not quite so much now · As much as I always could |
| D3 | `hads_d3` | I feel cheerful* | Not at all · Not often · Sometimes · Most of the time |
| D4 | `hads_d4` | I feel as if I am slowed down* | Nearly all the time · Very often · Sometimes · Not at all |
| D5 | `hads_d5` | I have lost interest in my appearance* | Definitely · I don't take as much care as I should · I may not take quite as much care · I take just as much care as ever |
| D6 | `hads_d6` | I look forward with enjoyment to things* | Hardly at all · Definitely less than I used to · Rather less than I used to · As much as I ever did |
| D7 | `hads_d7` | I can enjoy a good book or radio or TV program* | Very seldom · Not often · Sometimes · Often |

**Depression subscale total:** `hadsDepressionTotal` (0–21)

### 5.3 Suggested payload fragment

```json
{
  "step": "hads",
  "anxiety": {
    "items": [1, 0, 2, 1, 0, 1, 0],
    "total": 5
  },
  "depression": {
    "items": [2, 1, 1, 0, 1, 2, 1],
    "total": 8
  }
}
```

> Store per-item **selected option index** (0–3 left→right) and/or score after applying official HADS scoring rules.

---

## 6. Form: EORTC QLQ-C30 (`qlq_c30`)

### 6.1 Instructions (UI)

**About your health**

> We are interested in some things about you and your health. Please answer all questions yourself by selecting the answer that best applies to you. There are no right or wrong answers. Your information will remain strictly confidential.

**Time frame for items 1–28:** During the past week.

### 6.2 Response scale — items 1–28

| Label | Suggested score |
|-------|-----------------|
| Not at all | 1 |
| A little | 2 |
| Quite a bit | 3 |
| Very much | 4 |

> Official EORTC scoring transforms raw scores to 0–100 scales — compute per EORTC QLQ-C30 scoring manual (on tablet and/or backend). Store raw item responses 1–4.

### 6.3 Items 1–28 (4-point scale)

| # | Key | Question |
|---|-----|----------|
| 1 | `qlq_c30_1` | Do you have any trouble doing strenuous activities, like carrying a heavy shopping bag or a suitcase? |
| 2 | `qlq_c30_2` | Do you have any trouble taking a long walk? |
| 3 | `qlq_c30_3` | Do you have any trouble taking a short walk outside of the house? |
| 4 | `qlq_c30_4` | Do you need to stay in bed or a chair during the day? |
| 5 | `qlq_c30_5` | Do you need help with eating, dressing, washing yourself or using the toilet? |
| 6 | `qlq_c30_6` | Were you limited in doing either your work or other daily activities? |
| 7 | `qlq_c30_7` | Were you limited in pursuing your hobbies or other leisure time activities? |
| 8 | `qlq_c30_8` | Were you short of breath? |
| 9 | `qlq_c30_9` | Have you had pain? |
| 10 | `qlq_c30_10` | Did you need to rest? |
| 11 | `qlq_c30_11` | Have you had trouble sleeping? |
| 12 | `qlq_c30_12` | Have you felt weak? |
| 13 | `qlq_c30_13` | Have you lacked appetite? |
| 14 | `qlq_c30_14` | Have you felt nauseated? |
| 15 | `qlq_c30_15` | Have you vomited? |
| 16 | `qlq_c30_16` | Have you been constipated? |
| 17 | `qlq_c30_17` | Have you had diarrhea? |
| 18 | `qlq_c30_18` | Were you tired? |
| 19 | `qlq_c30_19` | Did pain interfere with your daily activities? |
| 20 | `qlq_c30_20` | Have you had difficulty in concentrating on things, like reading a newspaper or watching television? |
| 21 | `qlq_c30_21` | Did you feel tense? |
| 22 | `qlq_c30_22` | Did you worry? |
| 23 | `qlq_c30_23` | Did you feel irritable? |
| 24 | `qlq_c30_24` | Did you feel depressed? |
| 25 | `qlq_c30_25` | Have you had difficulty remembering things? |
| 26 | `qlq_c30_26` | Has your physical condition or medical treatment interfered with your family life? |
| 27 | `qlq_c30_27` | Has your physical condition or medical treatment interfered with your social activities? |
| 28 | `qlq_c30_28` | Has your physical condition or medical treatment caused you financial difficulties? |

### 6.4 Overall health and quality of life — items 29–30

**Section title:** Overall health and quality of life  
**Scale:** 1 (Very poor) … 7 (Excellent)

| # | Key | Question |
|---|-----|----------|
| 29 | `qlq_c30_29` | How would you rate your overall health during the past week? |
| 30 | `qlq_c30_30` | How would you rate your overall quality of life during the past week? |

### 6.5 Suggested payload fragment

```json
{
  "step": "qlq_c30",
  "version": 3,
  "items": {
    "1": 2, "2": 1, "3": 1, "4": 2, "5": 1,
    "6": 3, "7": 2, "8": 1, "9": 2, "10": 3,
    "11": 2, "12": 2, "13": 1, "14": 1, "15": 1,
    "16": 1, "17": 1, "18": 3, "19": 2, "20": 2,
    "21": 2, "22": 2, "23": 1, "24": 2, "25": 1,
    "26": 2, "27": 2, "28": 1,
    "29": 5, "30": 5
  }
}
```

---

## 7. Form: EORTC QLQ-H&N35 (`qlq_hn35`)

### 7.1 Instructions (UI)

**During the past week**

> Patients sometimes report that they have the following symptoms or problems. Please indicate the extent to which you have experienced these symptoms or problems during the past week. Select the answer that best applies to you.

### 7.2 Response scale — items 1–30

| Label | Suggested raw score |
|-------|---------------------|
| Not at all | 1 |
| A little | 2 |
| Quite a bit | 3 |
| Very much | 4 |

### 7.3 Symptoms and daily functioning — items 1–30

| # | Key | Question |
|---|-----|----------|
| 1 | `qlq_hn35_1` | Have you had pain in your mouth? |
| 2 | `qlq_hn35_2` | Have you had pain in your jaw? |
| 3 | `qlq_hn35_3` | Have you had soreness in your mouth? |
| 4 | `qlq_hn35_4` | Have you had a painful throat? |
| 5 | `qlq_hn35_5` | Have you had problems swallowing liquids? |
| 6 | `qlq_hn35_6` | Have you had problems swallowing pureed food? |
| 7 | `qlq_hn35_7` | Have you had problems swallowing solid food? |
| 8 | `qlq_hn35_8` | Have you choked when swallowing? |
| 9 | `qlq_hn35_9` | Have you had problems with your teeth? |
| 10 | `qlq_hn35_10` | Have you had problems opening your mouth wide? |
| 11 | `qlq_hn35_11` | Have you had a dry mouth? |
| 12 | `qlq_hn35_12` | Have you had sticky saliva? |
| 13 | `qlq_hn35_13` | Have you had problems with your sense of smell? |
| 14 | `qlq_hn35_14` | Have you had problems with your sense of taste? |
| 15 | `qlq_hn35_15` | Have you coughed? |
| 16 | `qlq_hn35_16` | Have you been hoarse? |
| 17 | `qlq_hn35_17` | Have you felt ill? |
| 18 | `qlq_hn35_18` | Has your appearance bothered you? |
| 19 | `qlq_hn35_19` | Have you had trouble eating? |
| 20 | `qlq_hn35_20` | Have you had trouble eating in front of your family? |
| 21 | `qlq_hn35_21` | Have you had trouble eating in front of other people? |
| 22 | `qlq_hn35_22` | Have you had trouble enjoying your meals? |
| 23 | `qlq_hn35_23` | Have you had trouble talking to other people? |
| 24 | `qlq_hn35_24` | Have you had trouble talking on the telephone? |
| 25 | `qlq_hn35_25` | Have you had trouble having social contact with your family? |
| 26 | `qlq_hn35_26` | Have you had trouble having social contact with friends? |
| 27 | `qlq_hn35_27` | Have you had trouble going out in public? |
| 28 | `qlq_hn35_28` | Have you had trouble having physical contact with family or friends? |
| 29 | `qlq_hn35_29` | Have you felt less interest in sex? |
| 30 | `qlq_hn35_30` | Have you felt less sexual enjoyment? |

### 7.4 Treatments, nutrition and weight — items 31–35

**Section title:** Treatments, nutrition and weight  
**Time frame:** During the past week  
**Scale:** **No** / **Yes** — store as **`1` = No**, **`2` = Yes** (EORTC-style numeric; same family as items 1–30)

| # | Key | Question |
|---|-----|----------|
| 31 | `qlq_hn35_31` | Have you used pain-killers? |
| 32 | `qlq_hn35_32` | Have you taken any nutritional supplements (excluding vitamins)? |
| 33 | `qlq_hn35_33` | Have you used a feeding tube? |
| 34 | `qlq_hn35_34` | Have you lost weight? |
| 35 | `qlq_hn35_35` | Have you gained weight? |

### 7.5 Suggested payload fragment

```json
{
  "step": "qlq_hn35",
  "items": {
    "1": 2, "2": 1, "3": 2, "4": 1, "5": 2,
    "6": 1, "7": 3, "8": 1, "9": 1, "10": 2,
    "11": 3, "12": 2, "13": 1, "14": 2, "15": 2,
    "16": 1, "17": 1, "18": 2, "19": 2, "20": 1,
    "21": 1, "22": 2, "23": 1, "24": 1, "25": 1,
    "26": 1, "27": 2, "28": 1, "29": 1, "30": 1,
    "31": 2, "32": 1, "33": 1, "34": 2, "35": 1
  }
}
```

---

## 8. Form: Treatment Adherence (`treatment_adherence`)

### 8.1 Meta (from UI)

| Meta | Value |
|------|-------|
| Subtitle | Dropout-risk Assessment |
| Timepoints | Week 4 (Yenepoya) |
| Duration | 5–10 minutes |
| Mode | Face-to-face interview |
| Administrator | Principal Investigator |
| Intro | “I’d like to ask a few yes/no questions about your cancer treatment over the past two weeks. There are no right or wrong answers.” |

> Configure this step only on weeks where it applies (Yenepoya: Week **4**) via `weeklyFormDefinitions`.

### 8.2 Response scale

| Label | Store as |
|-------|----------|
| Yes | `true` / `yes` |
| No | `false` / `no` |

All 10 statements required (Yes/No radio).

### 8.3 Statements (1–10)

| # | Key | Statement |
|---|-----|-----------|
| 1 | `ta_1` | Have you attended all of your scheduled radiotherapy / chemotherapy sessions in the past two weeks? |
| 2 | `ta_2` | Have you missed or postponed any treatment session for a reason other than a medical instruction? |
| 3 | `ta_3` | Do you feel confident that you will complete your full planned course of treatment? |
| 4 | `ta_4` | Have treatment side effects made you consider stopping treatment? |
| 5 | `ta_5` | Do you have reliable transport to reach the hospital for each session? |
| 6 | `ta_6` | Are the costs of treatment or travel making it hard for you to continue? |
| 7 | `ta_7` | Do you have someone at home who supports you in attending treatment? |
| 8 | `ta_8` | Do you clearly understand your treatment plan and how many sessions remain? |
| 9 | `ta_9` | Have you thought about withdrawing from treatment in the past two weeks? |
| 10 | `ta_10` | Would you like additional support (counselling, financial, or social) to help you continue? |

### 8.4 Suggested payload fragment

```json
{
  "step": "treatment_adherence",
  "items": {
    "1": true,
    "2": false,
    "3": true,
    "4": false,
    "5": true,
    "6": false,
    "7": true,
    "8": true,
    "9": false,
    "10": false
  }
}
```

---

## 9. Form: Satisfaction Survey — Intervention Group (`satisfaction_survey`)

**Section title:** About your Skitii sessions  

### 9.1 Meta (from UI)

| Meta | Value |
|------|-------|
| Audience | **Intervention group only** |
| Anonymity | Anonymous — answers do not affect care; **no name or Study ID** captured on this screen |
| Instruction | “Please tell us about your experience using the Skitii music sessions.” |
| Privacy copy | “This survey is anonymous and intervention-group only. Your answers will not affect your care and no name or Study ID is captured.” |

> Show this step only for intervention-group patients on weeks where it applies (e.g. Week 4) via `weeklyFormDefinitions` + group type.

### 9.2 Response scale (5-point Likert)

| Label | Store as |
|-------|----------|
| Strongly disagree | `1` |
| Disagree | `2` |
| Neutral | `3` |
| Agree | `4` |
| Strongly agree | `5` |

All 9 statements required (single choice per row).

### 9.3 Statements (1–9)

| # | Key | Statement |
|---|-----|-----------|
| 1 | `sat_1` | Overall, I am satisfied with the Skitii music sessions. |
| 2 | `sat_2` | The Skitii app was easy to use. |
| 3 | `sat_3` | The chest strap (heart-rate sensor) was comfortable to wear. |
| 4 | `sat_4` | The music helped me feel more relaxed during treatment. |
| 5 | `sat_5` | The music helped reduce my anxiety about treatment. |
| 6 | `sat_6` | The sessions fit well into my hospital visits. |
| 7 | `sat_7` | I received enough support from staff to use the device. |
| 8 | `sat_8` | I would recommend the Skitii sessions to other patients. |
| 9 | `sat_9` | I would like to continue using the Skitii sessions. |

### 9.4 Suggested payload fragment

```json
{
  "step": "satisfaction_survey",
  "items": {
    "1": 5,
    "2": 4,
    "3": 4,
    "4": 5,
    "5": 4,
    "6": 4,
    "7": 5,
    "8": 5,
    "9": 4
  }
}
```

> Backend still associates the response with the patient/session for trial ops; the **device UI** must not display name or Study ID on this step (per privacy copy).

---

## 10. Form: HRV (`hrv`)

### 10.1 Meta / behaviour

| Meta | Value |
|------|-------|
| Duration | **5 minutes** resting (`durationSec` = `300`) |
| Device | BLE heart-rate monitor connected |
| Instruction (UI) | “Please remain still and relaxed” |
| Submit | **Automatic** when timer completes — no manual Submit button |
| API | `POST /weekly-assessments/:id/hrv` (PIN token) with full payload including `readings` |
| After success | **Weekly Form Submitted Successfully!** screen → **Return to Dashboard** |
| Completion | Week is `fully_completed` only after HRV auto-post succeeds when this step is configured |

> Runs after non-HRV steps are completed (if any), or alone if it is the only remaining configured step.

### 10.2 Live UI (during measurement)

| UI block | Content |
|----------|---------|
| Timer | Circular timer (`MM:SS Mins`) + progress arc — runs to **05:00** |
| Instruction | Please remain still and relaxed |
| **Instant Rate Monitor** | Live **Heart Rate** (bpm) — e.g. `80 bpm` |
| | **SD of HR** — e.g. `±11.4 bpm` |
| | Heart-rate waveform (live trace) |

Fields are **auto-filled from BLE** — not entered manually.

### 10.3 Auto-submit + success screen

```
5-minute recording ends
    ↓
Frontend computes meanHr, sdHr, rmssd, sdnn, pnn50 from readings
    ↓
POST /weekly-assessments/:id/hrv  (automatic — no user tap)
    ↓ (success)
“Weekly Form Submitted Successfully!” + patient name / Patient ID
    ↓
Return to Dashboard  →  Weekly chip Done
```

If the auto-post fails (network / expired PIN token), show error and allow retry without re-measuring when possible (re-verify PIN if `WEEKLY_PIN_TOKEN_EXPIRED`).

### 10.4 Metrics to compute / store (after 5 minutes)

Same pattern as session **baseline** (`meanHr`, `sdHr`, `durationSec`, `readings`), plus clinical HRV metrics. **No** standalone `heartRate` — current HR comes from `readings`; average is `meanHr`.

| Field | Meaning | Store |
|-------|---------|-------|
| Start / end | Recording window | `hrv.startedAt`, `hrv.endedAt` |
| Duration | Expected 300 s | `hrv.durationSec` |
| Mean HR | Average bpm | `hrv.meanHr` |
| SD of HR | Standard deviation of HR | `hrv.sdHr` |
| Readings | Sample stream `[{ hr, timestamp }]` | `hrv.readings` |
| RMSSD | ms | `hrv.rmssd` |
| SDNN | ms | `hrv.sdnn` |
| pNN50 | % | `hrv.pnn50` |
| Submitted at | Timestamp | `hrv.submittedAt` |

### 10.5 Suggested payload fragment

```json
{
  "step": "hrv",
  "startedAt": "2026-07-17T11:20:00.000Z",
  "endedAt": "2026-07-17T11:25:00.000Z",
  "durationSec": 300,
  "meanHr": 80,
  "sdHr": 11.4,
  "rmssd": 42.5,
  "sdnn": 55.0,
  "pnn50": 18.2,
  "readings": [
    { "hr": 78, "timestamp": "2026-07-17T11:20:01.000Z" },
    { "hr": 80, "timestamp": "2026-07-17T11:20:02.000Z" }
  ]
}
```

---

## 11. Config example (trial `weeklyFormDefinitions`)

```json
{
  "weeklyFormDefinitions": [
    {
      "week": 0,
      "label": "Week 0",
      "steps": ["vitals", "gad7_phq9", "hrv"]
    },
    {
      "week": 2,
      "label": "Week 2",
      "steps": [
        "vitals",
        "gad7_phq9",
        "nccn_distress",
        "hads",
        "qlq_c30",
        "qlq_hn35",
        "hrv"
      ]
    },
    {
      "week": 4,
      "label": "Week 4",
      "steps": [
        "vitals",
        "gad7_phq9",
        "nccn_distress",
        "hads",
        "qlq_c30",
        "qlq_hn35",
        "treatment_adherence",
        "satisfaction_survey",
        "hrv"
      ]
    }
  ]
}
```

> Yenepoya: `trialDurationWeeks` = **4** → sessions through enrollment + **27** days. Seed `weeklyFormDefinitions` above = Week **0, 2, 4** — more form weeks may be added (each Week 2+ = **7-day** window). `satisfaction_survey` = **intervention** only. Progress = **Step X of N** for that week’s `steps` array length.
