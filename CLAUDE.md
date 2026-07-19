# Brailliants — Claude Code Master Context

> Read this file at the start of every Claude Code session before writing any code.

---

## Project structure

```
brailliants/
  backend/          ← Django DRF — YOU ARE BUILDING THIS
  mobile/           ← Flutter app — already created, do NOT recreate
  web/              ← Next.js admin portal — already created, do NOT recreate
  CLAUDE.md         ← this file
  DESIGN.md         ← design tokens and component rules
```

**Rule: never touch the `mobile/` or `web/` folders unless a sprint prompt explicitly tells you to. All backend work lives in `backend/`.**

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Django 5 + Django REST Framework |
| Database | PostgreSQL 15 |
| Auth tokens | SimpleJWT |
| OAuth | django-allauth (Google + Facebook) |
| Real-time | Django Channels + Redis |
| Async tasks | Celery + Redis |
| File storage | AWS S3 / Cloudinary |
| AI | Google Gemini 1.5 Flash (free tier) |
| Payments | CamPay API (MTN MoMo + Orange Money) |
| Mobile | Flutter 3 + Riverpod (existing — `mobile/`) |
| Web admin | Next.js + React (existing — `web/`) |
| Push notifications | Firebase Cloud Messaging (FCM) |

---

## Colour tokens (locked — from actual design screens)

```
background:       #EEEEF5   very light purple-grey — all auth screen backgrounds
cardSurface:      #FFFFFF   white — input fields, feature cards
primary:          #3C3489   deep purple — titles, avatar, hero card, active elements
primaryLight:     #E8E8F8   light purple — chip backgrounds, tab container
primaryMid:       #7F77DD   medium purple — progress bar fill inside hero card
textPrimary:      #2D2770   dark purple — all heading text
textSecondary:    #8888AA   muted purple-grey — subtitles, labels, placeholders
textMuted:        #AAAAAA   light grey — placeholder hints
action:           #E8A020   amber — ALL primary buttons, active bottom nav, resume link
actionDisabled:   #F0C878   faded amber — disabled button state
actionText:       #2A1A00   dark brown — text on amber buttons
success:          #1D9E75   teal — Online chip, downloaded badges only
successLight:     #E1F5EE   teal tint
error:            #E24B4A   red — validation errors only
errorLight:       #FCEBEB   red tint
inputBorder:      #E0E0F0   very light purple — field borders
inputBorderFocus: #3C3489   purple on focus
navActive:        #E8A020   amber — active bottom nav tab
navInactive:      #3C3489   purple — inactive bottom nav tabs
heroBg:           #3C3489   hero card background
progressFill:     #7F77DD   inside the hero card progress bar
pageDotActive:    #3C3489   purple pill dot
pageDotInactive:  #CCCCDD   light grey pill dot
phonePrefix:      #3C3489   purple bold — +237 in phone field
```

---

## User roles

| Role | Description |
|---|---|
| student | Default. Accesses all learning features. Free or Pro. |
| teacher | Registers separately. Gets verified badge. Can upload notes. No paywall. |
| school_admin | Added by super admin. Web dashboard only. |
| super_admin | SECEL team. Full control via Django admin. |

---

## Freemium model

| Feature | Free | Pro 1000 XAF/month |
|---|---|---|
| Past papers | 3 per exam type/month | Unlimited |
| AI queries | 20 per month | Unlimited |
| Notes download | 3 per month | Unlimited |
| Community | Full access | Full access |
| Forum | Full access | Full access |

Payment via CamPay — MTN Mobile Money and Orange Money only.

---

## Key business rules

- AI always responds in the user selected interface language EN or FR
- Gemini system prompt always includes the student exam level and specialty
- Papers in JSON format — interactive quiz mode inside the app
- Papers in PDF format — download and view with PDF viewer
- School resources is_public=False means only enrolled approved students can see them
- Schools are added ONLY by super admin via Django admin no self-registration
- Teachers are verified ONLY by super admin via Django admin
- WebSocket connections use JWT token as query param ?token={access_token}
- Offline: Flutter app stores downloaded content, AI summaries, quiz results, timetable in Hive

---

## Backend folder structure

```
backend/
  config/
    settings/
      base.py
      development.py
      production.py
    urls.py
    wsgi.py
    asgi.py
  apps/
    accounts/
    enrolment/
    content/
    ai_learning/
    forum/
    community/
    planner/
    payments/
  manage.py
  requirements.txt
  .env.example
  Dockerfile
  docker-compose.yml
```

---

## Sprint map

| Sprint | Focus |
|---|---|
| Scaffold | Backend foundation — all models, settings, migrations |
| Sprint 1 | Auth, onboarding, OTP, JWT, profile |
| Sprint 2 | AI chat, note summariser, quiz generator |
| Sprint 3 | Question bank, notes, offline download, freemium |
| Sprint 4 | Forum, community groups, user search |
| Sprint 5 | Real-time chat, timetable, progress, FCM |
| Sprint 6 | School module, enrolment, Next.js web dashboard |
| Sprint 7 | CamPay payments, polish, demo prep |

---

## Coding conventions

- All Python PEP 8
- All UUIDs: id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
- All timestamps timezone-aware DateTimeField(auto_now_add=True)
- Never hardcode secrets — always read from environment variables
