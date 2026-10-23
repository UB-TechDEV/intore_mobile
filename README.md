# INTORE mobile

Expo / React Native phone apps for the FPR Diaspora events system.

This repository covers the **protocol** gate app (post, faces, check-in), the **member** app (home, pay, profile), and the **2027 host ballot**. Layout and copy follow the diaspora-ems prototype. The phones call the QA services — there is no mock login.

## Run

```bash
npm install
npx expo start
```

Open the project in **Expo Go** (SDK 57).

## Sign in

Use the **email or national ID** and password of a QA account. After sign-in, if the account has both Protocol and Member roles, choose which app to open.

API host (override with `EXPO_PUBLIC_API_HOST` if needed):

`https://apis-qa-events.intoresolutions.rw`

## What the phones call

| App | Services |
| --- | --- |
| Protocol | `auth`, `event` |
| Member / ballot | `auth`, `member`, `event` (host-votes), `contribution` |

Face search and ballot face verification are documented on the backend but return **503** — the screens fall back to QR/number and PIN.

Enrolment codes are **6 digits**. Invitation / QR codes are **8 digits**. Check-in is resolve → SMS OTP → entrance photo → admit.

## Backend

Live Swagger:

- https://apis-qa-events.intoresolutions.rw/auth/api/v1/swagger-ui/index.html
- https://apis-qa-events.intoresolutions.rw/event/api/v1/swagger-ui/index.html
- https://apis-qa-events.intoresolutions.rw/member/api/v1/swagger-ui/index.html
- https://apis-qa-events.intoresolutions.rw/contribution/api/v1/swagger-ui/index.html
