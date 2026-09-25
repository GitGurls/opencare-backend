# OpennCare Backend 

Backend for **OpennCare** — connected healthcare ecosystem (patients, doctors, hospitals).
Built for: Patient app (records/appointments/medical passport), Hospital/Clinic B2B management,
and Emergency services (ambulance/blood bank/pharmacy/hospital availability).

## Stack
Node.js + Express + MongoDB (Mongoose) + JWT auth (role-based: `patient`, `doctor`, `hospital_admin`)

## Setup

```bash
npm install
cp .env.example .env
# edit .env -> set MONGO_URI (MongoDB Atlas free cluster works great) and JWT_SECRET
npm run seed   # loads demo data: CityCare Hospital, Dr. Arjun Mehta, Ananya Sharma
npm run dev    # starts on http://localhost:5000
```

Demo logins after seeding (password for all: `password123`):
| Role | Email |
|---|---|
| hospital_admin | admin@citycare.com |
| doctor | arjun.mehta@citycare.com |
| patient | ananya.sharma@gmail.com |

## Folder structure
```
src/
  config/db.js          Mongo connection
  models/                Mongoose schemas
  middleware/            auth (JWT), role guard, error handler
  controllers/            business logic
  routes/                 Express routers
  utils/                  token generator, seed script
server.js                entry point
```

## Auth — httpOnly cookie (not localStorage)

Token is **not** meant to be stored in localStorage (XSS risk). Instead:

- `POST /api/auth/register` / `POST /api/auth/login` set an **httpOnly cookie** (`token`)
  automatically in the response. The browser stores it — frontend JS never touches it, can't
  read it, can't be stolen via XSS.
- Every future request just needs `credentials: "include"` (fetch) or `withCredentials: true`
  (axios) so the browser sends the cookie automatically. **No manual header needed.**
- `POST /api/auth/logout` clears the cookie.
- The response body also returns `token` in plain JSON — that's only for Postman/mobile testing.
  Web frontend should ignore it and just rely on the cookie.

**Frontend fetch example:**
```javascript
// Login - cookie gets set automatically by the browser
await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // <-- REQUIRED, this is what makes cookies work
  body: JSON.stringify({ email, password }),
});

// Any later protected request - just add credentials:"include", nothing else
await fetch("http://localhost:5000/api/patients/me", {
  credentials: "include",
});
```

**Important setup note:** cookies need `CLIENT_URL` in `.env` to exactly match the frontend's
URL (e.g. `http://localhost:5173`) — `credentials:true` CORS does not work with a wildcard `*`.

- `POST /api/auth/register` — body: `{ name, email, phone, password, role, profile }`
  - `role`: `"patient" | "doctor" | "hospital_admin"`
  - `profile` shape depends on role (see models) — e.g. for patient: `{ age, gender, bloodGroup, location }`
- `POST /api/auth/login` — body: `{ email, password }`
- `POST /api/auth/logout` — clears the cookie
- `GET /api/auth/me` — current logged-in user

## Patient APIs
- `GET /api/patients/me` — own profile
- `PUT /api/patients/me` — update profile
- `GET /api/patients/:id` — (doctor/hospital_admin) view a patient card

## Medical Passport + Patient Controlled Access
- `POST /api/records` — (patient) add own record/report
- `GET /api/records/mine` — (patient) full medical passport
- `POST /api/records/for/:patientId` — (doctor, needs active grant) add prescription/diagnosis
- `GET /api/records/patient/:patientId` — (doctor, needs active grant) view granted records only
- `POST /api/records/grants` — (patient) grant access: `{ doctorId | hospitalId, scope: "all"|"records", recordIds }`
- `PUT /api/records/grants/:id/revoke` — (patient) revoke access
- `GET /api/records/grants/mine` — (patient) list grants given out

> This is the "iOS Shared Album"-style permission system from the PPT — patient decides exactly
> what a doctor can see, and can revoke anytime.

## Doctor APIs
- `GET /api/doctors/me` / `PUT /api/doctors/me`
- `GET /api/doctors/my-patients` — patients who granted access
- `GET /api/doctors/my-appointments`

## Hospital (B2B) APIs
- `GET /api/hospitals/me` / `PUT /api/hospitals/me`
- `PUT /api/hospitals/me/beds` — update bed/ICU occupancy (Bed Management quick action)
- `GET /api/hospitals/me/analytics` — Total Beds, Occupancy Rate, Departments, Staff, etc.
- `GET /api/hospitals/me/doctors`
- `GET /api/hospitals/:id` — public hospital card (any logged-in role)

## Appointments
- `POST /api/appointments` — (patient) book, auto-assigns queue position
- `GET /api/appointments/mine` — (patient)
- `PUT /api/appointments/:id/cancel` — (patient)
- `PUT /api/appointments/:id/status` — (doctor/hospital_admin) Confirmed/InQueue/Completed/Cancelled

## Emergency (Fastcare)
All take `?lng=&lat=&maxDistanceKm=` (default 10km) query params — geospatial `$near` queries.
- `GET /api/emergency/hospitals` — nearby hospitals with live bed/ICU/emergency capacity
- `GET /api/emergency/ambulances` — nearby available ambulances
- `GET /api/emergency/blood-banks` — nearby blood banks (optional `&bloodGroup=B+`)
- `GET /api/emergency/pharmacies` — nearby pharmacies

## Smart Medication + Dispenser
- `POST /api/medicines/for/:patientId` — (patient, own id / doctor with active grant) add a
  medicine schedule: `{ name, dosage, times: ["08:00","20:00"], durationDays, notes }` —
  auto-generates individual dose entries for the full duration
- `GET /api/medicines/mine` — (patient) active medicine list
- `GET /api/medicines/mine/doses/today` — (patient) today's doses: Upcoming/Taken/Missed
- `PUT /api/medicines/doses/:doseId/mark` — (patient) self-report a dose: `{ status: "Taken"|"Missed" }`

### Smart Dispenser (physical device) — separate auth, not user JWT
- `POST /api/devices/register` — (patient) links hardware `deviceId` to their account, returns
  a `deviceSecret` **shown once** — flash it onto the ESP32 / store in its local config
- `GET /api/devices/mine` — (patient) device status (Online/Offline, last sync)
- `GET /api/devices/:deviceId/schedule` — (device, header `x-device-secret`) pulls upcoming
  doses to cache locally — this is what makes it **offline-ready**: device dispenses off its
  local cache even with no internet
- `POST /api/devices/:deviceId/sync` — (device, header `x-device-secret`) pushes back a batch
  of dispense events once back online: `{ events: [{ doseId, status, dispensedAt }] }`

### Connected Care (family/doctor updates)
- `POST /api/family-contacts` — (patient) add a family member: `{ name, relation, phone, email, notifyOn }`
- `GET /api/family-contacts/mine` — (patient) list contacts
- `PUT /api/family-contacts/:id/revoke` — (patient) revoke

> Actual SMS/push delivery needs a provider (Twilio, FCM) — out of hackathon scope. The
> permissioned recipient data is already queried inside `syncDeviceEvents` on a missed dose,
> ready to hand to a notification service.

## Clinic Operations (B2B)
- `POST/GET /api/clinic/staff`, `PUT /api/clinic/staff/:id` — (hospital_admin) staff management
- `POST/GET /api/clinic/expenses` — (hospital_admin) expense logging, `?month=&year=` filter, auto-totals
- `POST/GET /api/clinic/billing`, `PUT /api/clinic/billing/:id/pay` — (hospital_admin) patient billing
- `POST /api/clinic/followups`, `GET /api/clinic/followups/mine`, `PUT /api/clinic/followups/:id/status` — (doctor) follow-up scheduling

## Full PPT coverage
Every module from the PPT now has a backend home: Medical Passport, Patient Controlled Access,
Smart Medication, Smart Dispenser (offline-ready), Connected Care, Hospital Management, Smart
Appointments, Clinic Operations (staff/expenses/billing/follow-ups), and Fastcare (emergency).

## Quick test with curl
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ananya.sharma@gmail.com","password":"password123"}'
```
