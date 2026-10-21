# INTORE mobile — backend contract

This is what the **phone apps** need from the backend so integration can replace the current on-device sample data.

The Expo app today stores everything in memory (`src/state/session.tsx`, `src/data/sample.ts`). Those files are **not** a server. Sample credentials, invitation numbers, the enrolment code `4829`, and the 97% face score are prototype fixtures.

When this contract is implemented, each action below should work the same on every protocol phone and every member phone.

**Apps covered**

| App | Who | Screens |
| --- | --- | --- |
| Protocol | Gate officer | Sign in, My post, Faces, Enrol, Check in, Confirm, Profile |
| Member | Cell member | Sign in, Home, Pay, Profile, Ballot |

Language: JSON over HTTPS. Dates: ISO-8601 (`2026-10-30T07:30:00+02:00`). Money: integer **euro cents** (`1000` = €10). Invitation numbers: **8 digits**, no spaces.

---

## 1. Conventions

### 1.1 Base URL and versioning

```
https://{host}/v1
```

All authenticated routes send:

```
Authorization: Bearer {accessToken}
Accept-Language: en | fr | rw
```

`rw` is stored on the profile. Until Kinyarwanda strings exist, the phone still renders English.

### 1.2 Auth tokens

| Token | Lifetime | Use |
| --- | --- | --- |
| `accessToken` | ~15 minutes | Every API call |
| `refreshToken` | ~30 days | `POST /auth/refresh` |

On `401`, the phone refreshes once, then returns to Sign in.

### 1.3 Errors

Every error body:

```json
{
  "error": {
    "code": "invalid_credentials",
    "message": "Username or password is wrong."
  }
}
```

The phone maps `code` to the copy already on screen. Do not invent new user-facing sentences unless the table below says so.

| HTTP | `code` | Phone shows |
| --- | --- | --- |
| 400 | `validation_error` | Field-level message |
| 401 | `invalid_credentials` | Username or password is wrong. |
| 401 | `unauthenticated` | Return to Sign in |
| 403 | `account_locked` | Account locked until a system admin unlocks it. |
| 403 | `forbidden_role` | This account cannot open that app |
| 404 | `not_found` | No invitation with that number |
| 409 | `already_admitted` | Already checked in today |
| 409 | `already_voted` | Vote already recorded |
| 409 | `already_enrolled` | Face already enrolled |
| 422 | `unpaid` | Send them to the contribution desk… |
| 422 | `id_missing` | The identity document is missing… |
| 422 | `no_face` | {name} — no face on file |
| 422 | `stopped` | Entry stopped |
| 422 | `wrong_enrolment_code` | Wrong code |
| 422 | `wrong_pin` | Stay on PIN, clear dots |
| 422 | `ballot_closed` | Ballot closed |

### 1.4 Idempotency

Write actions send `Idempotency-Key: {uuid}`. Repeating the same key returns the first result (no second admission, no second vote, no second enrolment).

---

## 2. Shared resources

### Person (invitee at an event)

Returned by Faces, Check in lookup, and Confirm.

```json
{
  "id": "uuid",
  "name": "Uwase Ange",
  "initials": "UA",
  "cell": { "id": "uuid", "name": "Belgium" },
  "role": "Delegate",
  "seat": "A-14",
  "document": {
    "label": "National ID",
    "number": "1198 0800 1234 5601"
  },
  "emailMasked": "a•••••@diaspora.rw",
  "invitationNumber": "53476150",
  "faceStatus": "no_photo",
  "enrolledPhotoUrl": null,
  "enrolledAt": null,
  "contribution": {
    "status": "paid",
    "label": "€60 paid",
    "amountCents": 6000
  },
  "dayPass": {
    "label": "Day 1 of 2 · first entry today",
    "validToday": true
  },
  "admission": {
    "status": "none",
    "at": null,
    "gate": null,
    "how": null
  }
}
```

`faceStatus`: `enrolled` | `no_photo` | `id_missing`  
`contribution.status`: `paid` | `unpaid`  
`admission.status`: `none` | `admitted` | `stopped`

Do not let in when `faceStatus != enrolled`, `contribution.status == unpaid`, `document.number` is empty, `admission.status` is `admitted` or `stopped`, or `dayPass.validToday` is false.

### Me (signed-in account)

```json
{
  "id": "uuid",
  "fullName": "Karangwa Fidèle",
  "initials": "KF",
  "email": "f.karangwa@diaspora.rw",
  "phone": "+33 6 12 44 80 19",
  "documentMasked": "Passport •••• 6789",
  "cell": { "id": "uuid", "name": "France" },
  "memberSince": "2019-03-01",
  "language": "en",
  "roles": [
    {
      "type": "protocol",
      "label": "Protocol officer",
      "assignment": {
        "eventId": "uuid",
        "eventName": "RPF Europe Retreat — Poland",
        "venue": "EXPO XXI, Warsaw",
        "gateId": "uuid",
        "gateName": "Gate 2",
        "purpose": "Delegates and committees",
        "shift": { "date": "2026-10-30", "startsAt": "07:30", "endsAt": "13:00" }
      }
    },
    {
      "type": "member",
      "label": "Member",
      "assignment": { "cellId": "uuid", "cellName": "France" }
    }
  ]
}
```

The phone shows **role switch** when `roles` has both `protocol` and `member`. One account, two shells.

---

## 3. Authentication

### Sign in

**Phone:** Sign in → username + password. Lock after **5** wrong attempts until an admin unlocks.

`POST /auth/sign-in`

```json
{ "username": "f.karangwa", "password": "••••" }
```

**200**

```json
{
  "accessToken": "…",
  "refreshToken": "…",
  "user": { "...Me..." }
}
```

Then the phone shows **Continue as** Protocol officer / Member from `user.roles`.

| Result | Status | `code` |
| --- | --- | --- |
| Wrong username or password | 401 | `invalid_credentials` |
| Fifth failure | 403 | `account_locked` |

### Forgot password

**Phone:** Forgot your password? → username → Email me a reset link.

`POST /auth/password-reset`

```json
{ "username": "f.karangwa" }
```

**200** always (do not reveal whether the username exists). Send the reset email when it does.

### Forgot username

**Phone:** Forgot your username? → email → Email me my username.

`POST /auth/username-reminder`

```json
{ "email": "f.karangwa@diaspora.rw" }
```

**200** always. Send the username to that email when it matches a profile.

### Refresh / sign out

`POST /auth/refresh` `{ "refreshToken": "…" }` → new tokens  
`POST /auth/sign-out` `{ "refreshToken": "…" }` → **204**, revoke refresh

**Phone:** Profile → Sign out.

New members are created by a cell leader (web). The phone only tells them to use the welcome-email link. That flow is not in this app.

---

## 4. Session and profile

### Load me

`GET /me` → **Me**

Call after sign-in and when opening Profile.

### Update personal details

**Phone:** Profile → Personal details → Save. Fields: full name, email, phone. ID / passport on this screen is **read-only**.

`PATCH /me`

```json
{ "fullName": "Karangwa Fidèle", "email": "f.karangwa@diaspora.rw", "phone": "+33 6 12 44 80 19" }
```

**200** updated **Me**. Email change may require confirmation; until confirmed, keep serving the previous email and say so in `error.message`.

### Language

**Phone:** Profile → Language (English, Français, Kinyarwanda).

`PATCH /me` `{ "language": "en" | "fr" | "rw" }`

### Preferences that stay on the phone

These toggles do **not** need a backend:

- Notifications (until push is added)
- Unlock with Face ID
- Keep the app on during my shift

When push is added later: `PUT /me/device` with `{ "expoPushToken": "ExponentPushToken[…]" }`.

---

## 5. Protocol — My post

**Phone:** opens My post after choosing Protocol.

`GET /protocol/post`

```json
{
  "event": {
    "id": "uuid",
    "name": "RPF Europe Retreat — Poland",
    "venue": "EXPO XXI, Warsaw",
    "dayIndex": 1,
    "dayCount": 2
  },
  "gate": {
    "id": "uuid",
    "name": "Gate 2",
    "purpose": "Delegates and committees"
  },
  "dutyDays": [
    { "id": "day-1", "label": "Day 1 · Fri 30 Oct", "current": true },
    { "id": "day-2", "label": "Day 2 · Sat 31 Oct", "current": false }
  ],
  "team": [
    { "id": "uuid", "initials": "KF", "name": "Karangwa Fidèle", "detail": "You · France cell" },
    { "id": "uuid", "initials": "IK", "name": "Ishimwe Kevin", "detail": "Belgium cell · +32 470 553 018" }
  ],
  "otherGates": [
    { "id": "uuid", "name": "Gate 1", "purpose": "Main entrance — participants", "officerCount": 3 }
  ],
  "assignedAt": "2026-09-02",
  "protocolLead": { "name": "Uwamahoro Joy", "phone": "+48512330114" }
}
```

Header line on every protocol tab: `{event.name} · {gate.name} · Day {dayIndex} of {dayCount}`.

**Start gate check** only navigates on the phone. No API call.

---

## 6. Protocol — Faces

### List

**Phone:** search name / ID / passport; filter event, cell, To enrol / Enrolled / All.

`GET /events/{eventId}/faces?cellId=&status=todo|enrolled|all&q=`

```json
{
  "totals": { "enrolled": 318, "invited": 412 },
  "people": [ { "...Person..." } ]
}
```

`status=todo` = `no_photo` or `id_missing`.  
Search matches `name` and `document.number` (ignore spaces).

### Event and cell pickers

`GET /me/events` → `[{ "id", "name" }]`  
`GET /events/{eventId}/cells` → `[{ "id", "name" }]` (include a virtual “All cells” on the phone)

---

## 7. Protocol — Enrol a face (3 steps)

**Phone:** Faces row or Confirm → Enrol the face now.

Cannot enrol if `faceStatus == id_missing`. Phone copy: *The identity document is missing, so a face cannot be enrolled.*

### Step 1 — document check + emailed code

Officer ticks: name matches, number matches, person matches document photo. That is **on the phone**. The server must still refuse enrol if the document is missing.

**Send code** (also Resend email):

`POST /people/{personId}/enrolment-code`

```json
{ "eventId": "uuid" }
```

**200** `{ "sentTo": "a•••••@diaspora.rw", "expiresInSeconds": 600 }`

Email a **4-digit** code to the address on the profile. It proves that email is theirs. Codes expire (10 minutes recommended). Resend invalidates the previous code.

**Verify code** (as they type 4 digits):

`POST /people/{personId}/enrolment-code/verify`

```json
{ "code": "4829" }
```

**200** `{ "ok": true }`  
**422** `wrong_enrolment_code` → phone: *Wrong code*

Do not open the camera until `ok: true`.

### Step 2 — live capture

Liveness prompts (blink, turn head) run **on the phone**. The backend receives the photo from step 3. If you later add a liveness vendor, the phone will send that vendor’s payload here as well; do not block the first integration on it.

### Step 3 — save to profile

**Phone:** Save to her profile.

`POST /people/{personId}/face`

`multipart/form-data`

| Field | Type | |
| --- | --- | --- |
| `eventId` | string | |
| `gateId` | string | officer’s gate |
| `photo` | file | JPEG from the camera |
| `enrolmentCode` | string | the verified 4-digit code |

**200**

```json
{
  "person": { "...Person with faceStatus enrolled..." },
  "enrolledAt": "2026-10-09T14:12:00+02:00",
  "enrolledBy": { "id": "uuid", "name": "Karangwa Fidèle" },
  "gate": { "id": "uuid", "name": "Gate 2" }
}
```

The enrolled photo must appear at **every gate** the next time this person’s QR or number is checked.

**409** `already_enrolled` — phone can still show *Face already enrolled*.  
**422** `id_missing` — refuse.

---

## 8. Protocol — Check in

**Phone:** Face / QR code / Number. Counters *In today* and *This gate*.

`GET /gates/{gateId}/stats`

```json
{
  "admittedTodayEvent": 184,
  "admittedTodayGate": 62
}
```

Increment both on a successful admit.

### A. Face (1:N search)

**Phone:** Scan their face. Today this is a 1.8s simulation. Production must compare the live frame with **every enrolled face for this event**.

`POST /events/{eventId}/check-in/face-search`

`multipart/form-data`: `photo` (JPEG), `gateId`

**200 match**

```json
{
  "status": "match",
  "score": 97,
  "person": { "...Person..." }
}
```

Phone opens Confirm with `how: "face"`.

**200 no match**

```json
{ "status": "none" }
```

Phone: *No match found* → Scan QR code / Try again.

Threshold: return `none` below the agreed score (prototype displayed 97). Put the threshold on the server, not the phone.

### B. QR code

**Phone:** camera reads a QR. Payload is the **8-digit invitation number** (spaces ignored). Optionally a signed token that still resolves to that number.

`GET /events/{eventId}/invitations/{invitationNumber}`

Example: `GET /events/{id}/invitations/53476150`

**200** `{ "person": { "...Person..." } }` → Confirm `how: "qr"`  
**404** `not_found` — ignore scan, keep looking

### C. Number

**Phone:** type 8 digits → Find the person.

Same endpoint as QR.  
**404** `not_found` → *No invitation with that number*

---

## 9. Protocol — Confirm card

**Phone:** Found by face / QR / number. Shows enrolled photo, ID, cell, role · seat, day pass, contribution.

Load with the Person from the lookup. Refresh with `GET /people/{personId}?eventId=` if the object might be stale.

### Compare with enrolled photo (1:1)

**Phone:** Scan their face to compare.

`POST /people/{personId}/check-in/compare`

`multipart/form-data`: `photo`, `eventId`

**200** `{ "samePerson": true, "score": 97 }` → *Same person · 97% match*  
**200** `{ "samePerson": false, "score": 41 }` → officer uses **No, stop**

### Yes, let in

Disabled until `faceStatus == enrolled` and none of the blocks below.

`POST /events/{eventId}/admissions`

```json
{
  "personId": "uuid",
  "gateId": "uuid",
  "how": "face" | "qr" | "number"
}
```

**201**

```json
{
  "id": "uuid",
  "personId": "uuid",
  "at": "2026-10-30T09:41:00+02:00",
  "gate": { "id": "uuid", "name": "Gate 2" },
  "how": "qr",
  "seat": "A-14",
  "dayPassLabel": "Day 1 of 2"
}
```

Phone: *Welcome in* → Scan the next person.

Server **must** reject:

| Condition | HTTP | `code` | Phone |
| --- | --- | --- | --- |
| Already admitted today | 409 | `already_admitted` | Already checked in today · no second record |
| Officer previously stopped them | 422 | `stopped` | Entry stopped |
| Unpaid contribution | 422 | `unpaid` | Send them to the contribution desk… |
| Missing ID / passport | 422 | `id_missing` | The identity document is missing… |
| No enrolled face | 422 | `no_face` | Enrol the face before letting them in |
| Day pass not valid today | 422 | `pass_invalid` | Not valid today |

### No, stop

**Phone:** No, stop. Alerts the protocol lead. Pauses this person’s QR until someone checks it.

`POST /events/{eventId}/stops`

```json
{ "personId": "uuid", "gateId": "uuid" }
```

**201** `{ "personId": "uuid", "status": "stopped" }`

- Further QR / number / face lookups for this person return `admission.status: "stopped"`.
- Notify the protocol lead (SMS or push). Phone number is on `GET /protocol/post`.

Phone: *Entry stopped* → Back to the gate.

---

## 10. Member — Home

`GET /member/home`

```json
{
  "greetingName": "Fidèle",
  "cellName": "France",
  "nextEvent": {
    "id": "uuid",
    "name": "RPF Europe Retreat — Poland",
    "whenLabel": "Fri 30 – Sat 31 Oct · EXPO XXI, Warsaw",
    "daysUntil": 19,
    "youGaveCents": 8000,
    "cellProgressPercent": 14,
    "closesOn": "2026-10-16"
  },
  "qrCodes": {
    "status": "pending_cell_payment",
    "message": "They arrive once your cell’s payments are checked."
  },
  "todos": [
    {
      "id": "vote-2027",
      "type": "ballot",
      "title": "Vote for the 2027 host",
      "subtitle": "Closes 25 Oct",
      "ballotId": "uuid"
    },
    {
      "id": "pay-october",
      "type": "pay",
      "title": "Pay your October contribution",
      "subtitle": "€10 to the France cell"
    }
  ],
  "messages": [
    {
      "id": "uuid",
      "fromName": "Mukamana Solange",
      "fromInitials": "MS",
      "at": "2026-10-19T10:00:00+02:00",
      "body": "Our cell is at 14% of its pledge — please give before 16 October."
    }
  ]
}
```

`qrCodes.status`: `pending_cell_payment` | `ready`. When `ready`, include image URLs or payloads for the member’s invitation QR. The phone currently only shows the pending copy.

**Message tap** opens that `body`. Optional later: `POST /member/messages/{id}/read`.

---

## 11. Member — Pay

Contributions are **recorded for the cell leader to check**. The first integration does **not** charge a bank or wallet (same as the prototype). If a payment provider is added later, keep this record as the source of truth the officer sees at the gate.

`GET /member/contributions`

```json
{
  "year": 2026,
  "givenCents": 21500,
  "monthlyAmountCents": 1000,
  "months": [
    { "month": 1, "label": "Jan", "status": "paid" },
    { "month": 10, "label": "Oct", "status": "due" }
  ],
  "history": [
    {
      "id": "uuid",
      "name": "September payment",
      "detail": "4 Sep · bank transfer",
      "amountCents": 1000,
      "at": "2026-09-04"
    }
  ]
}
```

**Phone:** Pay October · €10.

`POST /member/contributions`

```json
{ "year": 2026, "month": 10, "amountCents": 1000, "method": "recorded" }
```

**201**

```json
{
  "id": "uuid",
  "status": "pending_cell_leader",
  "givenCents": 22500,
  "months": [ { "month": 10, "label": "Oct", "status": "paid" } ]
}
```

Phone: *October paid · your cell leader will check it*.  
`contribution.status` on Person stays `unpaid` for **event** fees until the leader confirms those; monthly cell dues and event tickets are separate lines. Event gate checks `Person.contribution` for **that event**, not the October monthly.

If October is already recorded: **409** `already_paid` — phone shows the paid state.

---

## 12. Ballot (2027 host)

**Phone:** Member Home → Vote for the 2027 host. PIN or face, then one secret vote.

`GET /ballots/{ballotId}`

```json
{
  "id": "uuid",
  "question": "Who should host the RPF Europe Retreat 2027?",
  "closesAt": "2026-10-20T23:59:59+02:00",
  "closesLabel": "Ballot · closes 20 Oct 2026",
  "voterFirstName": "Ange",
  "hasVoted": false,
  "options": [
    { "id": "uuid", "name": "Belgium", "league": "Belgium cell", "city": "Antwerp Expo" }
  ]
}
```

Countdown on the phone is `closesAt − now`.

### Confirm identity — PIN

`POST /ballots/{ballotId}/verify-pin`

```json
{ "pin": "1234" }
```

**200** `{ "ok": true }` → show options  
**422** `wrong_pin` → clear the four dots  
**409** `already_voted` → recorded screen

PIN is **per member**, set when the account is created (not a global sample PIN).

### Confirm identity — face

**Phone:** Use face recognition.

`POST /ballots/{ballotId}/verify-face`  
`multipart/form-data`: `photo`

**200** `{ "ok": true }`  
**422** `no_face` / `not_same_person`

### Cast vote (once)

`POST /ballots/{ballotId}/votes`

```json
{ "optionId": "uuid" }
```

**201** `{ "recorded": true, "choiceName": "Belgium" }`  
Phone: *You voted for Belgium. Results are published when the vote closes on {date}.*

**409** `already_voted` — never change the first choice.  
**422** `ballot_closed`.

Do not return who voted for what on this API. Results are published after close (web), not on the phone.

---

## 13. Action checklist (phone → API)

| # | Phone action | Method | Path |
| --- | --- | --- | --- |
| 1 | Sign in | POST | `/auth/sign-in` |
| 2 | Forgot password | POST | `/auth/password-reset` |
| 3 | Forgot username | POST | `/auth/username-reminder` |
| 4 | Refresh session | POST | `/auth/refresh` |
| 5 | Sign out | POST | `/auth/sign-out` |
| 6 | Choose / switch Protocol or Member | — | use `GET /me` roles |
| 7 | Open Profile | GET | `/me` |
| 8 | Save personal details | PATCH | `/me` |
| 9 | Save language | PATCH | `/me` |
| 10 | Open My post | GET | `/protocol/post` |
| 11 | Faces list / search / filters | GET | `/events/{id}/faces` |
| 12 | Event picker | GET | `/me/events` |
| 13 | Cell picker | GET | `/events/{id}/cells` |
| 14 | Send / resend enrolment code | POST | `/people/{id}/enrolment-code` |
| 15 | Verify enrolment code | POST | `/people/{id}/enrolment-code/verify` |
| 16 | Save enrolled face | POST | `/people/{id}/face` |
| 17 | Gate counters | GET | `/gates/{id}/stats` |
| 18 | Scan face at gate (1:N) | POST | `/events/{id}/check-in/face-search` |
| 19 | Scan QR / type number | GET | `/events/{id}/invitations/{number}` |
| 20 | Compare live face to enrolled (1:1) | POST | `/people/{id}/check-in/compare` |
| 21 | Yes, let in | POST | `/events/{id}/admissions` |
| 22 | No, stop | POST | `/events/{id}/stops` |
| 23 | Member home | GET | `/member/home` |
| 24 | Pay screen | GET | `/member/contributions` |
| 25 | Pay October | POST | `/member/contributions` |
| 26 | Open ballot | GET | `/ballots/{id}` |
| 27 | Ballot PIN | POST | `/ballots/{id}/verify-pin` |
| 28 | Ballot face | POST | `/ballots/{id}/verify-face` |
| 29 | Cast vote | POST | `/ballots/{id}/votes` |
| 30 | Call protocol lead | — | `tel:` from `/protocol/post` |

---

## 14. Rules the server owns

The phone currently copies these in `src/domain/rules.ts`. After integration, **only the server** decides:

1. Five failed sign-ins lock the account until an admin unlocks it.
2. A face cannot be enrolled without a document number.
3. Enrolment code is emailed to the profile address and checked before save.
4. Saved face is visible at every gate for that event.
5. Face search is against enrolled faces for **this event**, no code needed.
6. Admit is one record per person per event-day. No second Welcome in.
7. Unpaid event contribution → contribution desk, no admit.
8. Stop pauses QR / number / face until a lead clears it.
9. Vote is secret and once.
10. October pay is a record for the cell leader, not a card charge, until a provider is added.

---

## 15. Face matching

The phone must **not** ship a hard-coded 97% or a “always Ange” match.

| Call | Server does |
| --- | --- |
| `face-search` | 1:N among enrolled faces for the event |
| `compare` | 1:1 live vs enrolled photo of that person |
| `verify-face` (ballot) | 1:1 live vs the voter’s enrolled photo |

Store embeddings next to the enrolled JPEG. Return `score` (0–100) for the officer label. Agree the pass threshold with protocol (prototype UI used 97).

---

## 16. Gate offline (needed for a real event)

Check-in will fail if the hall has no network.

For the first live event, provide:

`GET /gates/{gateId}/cache`

```json
{
  "generatedAt": "2026-10-30T06:00:00+02:00",
  "people": [ { "...Person including enrolledPhotoUrl..." } ]
}
```

The phone may keep this pack for the shift and replay `admissions` / `stops` with idempotency keys when the network returns. Face 1:N offline is a later phase; QR and number must work from this cache on day one.

---

## 17. What we will send you to integrate

1. OpenAPI from this contract (can be generated once paths are frozen).
2. A staging base URL and one protocol + one member test account (not the prototype strings hard-coded in the app).
3. Enrolment-code delivery to a mailbox we can read.
4. Sample invitation QR payloads (8-digit number).
5. Two test people: one `no_photo` + paid, one `enrolled` + unpaid, so Confirm and Pay paths can be checked.

Until those exist, the app stays on sample data and must not pretend the server is live.
