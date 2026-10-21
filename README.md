# INTORE mobile

Expo / React Native phone apps for the FPR Diaspora events system.

This repository covers the **protocol** gate app (post, faces, check-in), the **member** app (home, pay, profile), and the **2027 host ballot**. Layout and copy follow the diaspora-ems prototype. Sample data on the phone is not connected to a live backend.

## Run

```bash
npm install
npx expo start
```

Open the project in **Expo Go** (SDK 57).

## Sample sign-in

| | |
| --- | --- |
| Username | `f.karangwa` |
| Password | `diaspora-demo` |

After sign-in, choose **Protocol** or **Member**.

Other sample values from the prototype:

- Enrolment code: `4829`
- Ange invitation: `5347 6150`
- Unpaid invitation: `2200 1876`

Face match scores and liveness ticks are prototype simulations, not a production SDK.

## Backend

The phone is not wired to a server yet. What we need from the backend for every screen action is in [docs/backend-contract.md](docs/backend-contract.md).
