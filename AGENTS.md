# Rifle Ballistic App — AI Agent Operational Rules

---

## 0. Rifle Ballistic App — Product Definition

**This is a mobile app for hunting and using a rifle.** It is a personal rifle ballistic calculator: mobile-friendly (PWA or mobile web), works offline, minimal field-friendly UI.

### Goal
Build a personal rifle ballistic app that allows the user to input rifle specifications, scope data, and bullet information, then calculate **shooting distance**, **bullet drop**, and **scope adjustments**.

### Scope & Unit Support
- **MIL / Milliradian** scopes
- **MOA / Minute of Angle** scopes  
The app automatically chooses the correct formula from the scope unit selected in settings.

### Core Distance Formulas
- **MIL:** `distance = (target_height * 1000) / mils`
- **MOA:** `distance = (target_height * 95.5) / moa`

### Languages
- **English** and **French**. User can switch language instantly from Settings.

### Platform
- Mobile-friendly (PWA or simple mobile web app)
- Works on phone, fast interface, **works completely offline**, minimal field-friendly UI

### Features (current / planned)
- **Rifle profiles:** name, caliber, barrel length, twist rate, scope height, zero distance
- **Scope settings:** FFP/SFP, unit (MIL/MOA), click value, turret clicks/rev, magnification calibration (SFP)
- **Ammunition:** bullet weight (g/gr), type, BC (G1/G7), muzzle velocity, diameter
- **Distance calculator:** target height + mils or MOA → distance
- **Bullet drop calculator:** drop, elevation adjustment, turret clicks, holdover
- **Target height library:** Human, Deer, Pig, Bird, Steel plate, Custom (editable)
- **Environment (optional):** wind speed/direction, temperature, altitude, humidity → influence ballistics
- **Quick Range mode:** target height + mils/MOA → instant distance, holdover, clicks
- **Ballistic table generator:** Distance | Drop | Holdover | Clicks (100–500 m etc.)
- **Holdover display:** in MIL or MOA per scope system
- **Data storage:** rifle profiles stored locally; quick switch between rifles

### UI Layout
- **Main:** Quick Range Calculator + Rifle Selector
- **Tabs:** Rifles | Ballistics | Targets | Environment | Settings
- **Settings:** Language (EN/FR), Measurement (Metric/Imperial), Scope unit (MIL/MOA)

### Future (architecture ready)
Wind drift, angle compensation, GPS elevation, shot logging, camera mil measurement, reticle simulation, import/export profiles, range card generator.

### **URGENT — Full offline requirement**
- **The app must work fully offline.** With no internet, opening the app must load and run correctly (e.g. after the user has opened it at least once with network so the service worker can cache assets).
- **No runtime dependency on CDNs or external URLs.** All scripts, styles, fonts, and icons must be bundled or served from the app origin (no `cdn.`, `esm.sh`, `googleapis`, etc. in production).
- **Service worker:** Must cache the app shell and assets so offline visits are served from cache. See `public/sw.js` and `ps.md` for behaviour and troubleshooting.
- If the app fails to open or breaks when offline, treat it as a critical bug and fix it; consult `ps.md` for solutions.

---

## 1. Consent & Modification Rules
- **Explicit Consent**: No changes shall be made to the source code without explicit user approval.
- **Layout Preservation**: Do not deviate from the existing visual identity.
- **Never Change Layout Unless Asked**: Do not change layout, remove UI elements, or reorganize panels unless the user explicitly requests it.
- **Incremental Updates**: Keep updates as minimal as possible while satisfying requirements.
- **Strict Scope Control**: When the user asks for a specific change, implement only that request. Do not add extra UI elements, display changes, or additional features unless explicitly requested.

## 2. Glossary & Educational Integrity
- **Glossary Source of Truth**: The `glossary.md` file is the master reference.
- **Consistency Rule**: All definitions must be consistent with `glossary.md`.
- **Pre-Change Check**: Agents must always consult `ps.md` and `planning.md` before making changes.
- **Debugging Reference**: Agents must always consult `ps.md` for debugging information and urgent issues.

## 3. Testing and Deployment Rules
- **Testing Requirement**: Agents must always run tests before telling the user that the app should deploy successfully.
- **Layout Preservation**: Agents must never change the layout of the app when making changes unless explicitly asked by the user.
- **Debugging Reference**: Agents must always consult ps.md for debugging information.
- **Browser Testing**: Agents must always test the app in the browser first to ensure it works and opens correctly before pushing to Git.
- **User Consent for Commits**: Agents must always ask the user for approval before committing to Git.

## 4. Internationalization & French Mode
- **Goal**: Transform this app into a fully bilingual experience (English and French). This is critical.
- **Full French Mode**: When the user selects French, **all** visible UI text and explanations must appear in French (navigation, buttons, panels, short explanations, detailed explanations).
- **Structural Parity**: French detailed explanations must be structurally identical to the English versions: same sections, same level of detail.
- **Fallback Rule**: Only fall back to English when a French translation truly does not exist yet; once added, the French version must fully mirror the English content in depth and structure.

## 5. Monetisation Goal
- **Goal**: Monetise this app later. Quality must be top-notch.

## 6. Verify Code Instruction
- When the user types "verify code", the agent's role is to verify and debug any problems, issues, conflicts, or potential bugs in the codebase.

## 7. Scope and Restraint
- **Do not do things the user never asked for.** Implement only what is explicitly requested. Do not add extra features, change unrelated code, or "improve" things without being asked.

---

## 8. Rifle Ballistic App — Basic layout (reference)

The rifle ballistic screens (Distance / Height) use the following **reference layout** as the canonical baseline. Keep this structure and syntax-highlight it in columns.

**Turret table (column layout: distance | drop | mrad | clicks)**

```
150m    2.8cm   -0.20    ^2 clicks
171m    9.5cm   -0.50    ^5 clicks
201m    20cm   -0.80    ^8 clicks
251m    35cm   -1.2    ^12 clicks
301m    55cm   -1.6    ^16 clicks
351m    80cm   -2    ^20 clicks
401m    110cm   -2.5    ^25 clicks
451m    150cm   -3    ^30 clicks
501m    195cm   -3.5    ^35 clicks
551m    250cm   -4    ^40 clicks
601m    300cm   -5    ^50 clicks
651m    370cm   -5.8    ^58 clicks
701m    460cm   -6.5    ^66 clicks
751m    540cm   -7.5    ^75 clicks
```

**(tal du Cerf 1m epaule/pied, 1.75 homme)** — cyan note

**Mildot reference (cerf / homme = distance)**

```
mildot:10(cerf)=100	16(homme)=100m
mildot:6(cerf)=150	12.5(homme)=150m
mildot:4.8(cerf)=200	8.3(homme)=200m
mildot:4(cerf)=250	7(homme)=250m
mildot:3.3(cerf)=300	6(homme)=300m
mildot:2.9(cerf)=350	5(homme)=350m
mildot:2.5(cerf)=400	4.3(homme)=400m
mildot:2.2(cerf)=450	3.9(homme)=450m
mildot:2(cerf)=500	3.5(homme)=500m
mildot:1.8(cerf)=550	3.2(homme)=550m
mildot:1.68(cerf)=600	2.9(homme)=600m
mildot:1.6(cerf)=650	2.7(homme)=650m
mildot:1.4(cerf)=700	2.5(homme)=700m
mildot:1.3(cerf)=750	2.3(homme)=750m
mildot:1.25(cerf)=800	2.2(homme)=800m
mildot:1.15(cerf)=850	2.1(homme)=850m
mildot:1.1(cerf)=900	2(homme)=900m
```

**10/1000=1mil(10mm at 100m)   Compensation**

```
mils: 0.01	100 meters =  0cm
mils: 0.00667	150 meters =  2.8cm
mils: 0.005	200 meters =  9.5cm
mils: 0.004	250 meters =  20cm
mils: 0.00333	300 meters =  35cm
mils: 0.00286	350 meters =  55cm
mils: 0.0025	400 meters =  80cm
mils: 0.00222	450 meters =  110cm
mils: 0.002	500 meters =  150cm
mils: 0.00182	550 meters =  195cm
mils: 0.00167	600 meters =  250cm
mils: 0.00154	650 meters =  300cm
mils: 0.00143	700 meters =  370cm
mils: 0.00133	750 meters =  460cm
mils: 0.00125	800 meters =  540cm
```

**10x optics (100y/3.6 Inch, 100m/10cm)**

```
200y  7.2 Inch   	200m	20cm
300y  10.8 Inch   	300m	30cm
400y  14.4 Inch   	400m	40cm
500y  18.0 Inch   	500m	50cm
600y  21.6 Inch   	600m	60cm
700y  25.2 Inch   	700m	70cm
800y  28.8 Inch   	800m	80cm
900y  32.4 Inch   	900m	90cm
1000y  36.0 Inch   	1000m	100cm/1m
```

**Comment calculer le mirage du vent**

```
22 degrees angle environ 4  kph
45 degrees angle environ 8  kph
90 degrees angle environ 16 kph
```

- **Display:** Use column layout and syntax highlighting (yellow titles/formula, cyan notes, white body, green/red for results). Keep this layout as the basic starting point for the ballistic app.

- **Metrics color scheme:** The color scheme for ballistic metrics must remain consistent throughout the app.
  - **Blue (sky):** meters, yards (e.g. 150m, 200y)
  - **Yellow (amber):** cm, inch
  - **White:** clicks, mrad (e.g. -0.20), mils

### Circle Size Consistency
- **Single source of truth:** All ballistic circles (clicks compass, Distance calculator, Height calculator) use `CIRCLE_SIZE_PX` from `src/constants/ballisticUI.ts`.
- **If the user asks to change the size of one circle, all circles must change and remain identical.** Update only `CIRCLE_SIZE_PX`; never size circles separately.

### Degrees and MOA / MRAD Display (DO NOT MOVE)
- **First page (clicks compass):** Degrees (°) and MOA must always appear in the **centre** of the circle, **under** the distance input (m/yd). Never place degrees or MOA labels around the ring. Format: `{deg}° · {moa} MOA`. Use `text-sm` or larger for readability.
- **Calculate pages (Distance / Height):** MRAD must always appear in the **centre** of the circle, under the calculator icon. Never place mrad labels around the ring. Format: `{mrad} mrad`. Use `text-sm` or larger.
- **Rule:** Never move the degrees/MOA or mrad display function from the centre position under the main input.

### Circle Position Consistency Across Pages
- **Fixed circle position:** The compass circle must remain at the **exact same position** on all pages (main page, Distance calculator, Height calculator).
- **Implementation:** All pages must use `CIRCLE_SLOT_HEIGHT` (from `src/constants/ballisticUI.ts`) with the same structure: `style={{ height: CIRCLE_SLOT_HEIGHT }}`.
- **The circle never moves** — only the panel below expands/collapses. The circle position is identical whether swiping between pages or expanding/collapsing the input panel.

---

## 9. Database Structure — Hunting Rifle Ballistic Calculator

This section defines the comprehensive database structure for the ballistic app. It supports rifle profiles, scope systems, bullet libraries, atmospheric calculations, and reticle holdovers. Reference data lives in `src/data/databaseConstants.ts`. Existing app logic uses compatible subsets; new fields are optional.

### SCOPE ADJUSTMENT SYSTEMS

Supported angular measurement systems used in rifle scopes:
- **MOA** (Minute Of Angle)
- **TMOA** (True MOA)
- **SMOA** (Shooter MOA)
- **MIL** (Milliradian)
- **MRAD** (Milliradian)
- **IPHY** (Inch per 100 yards)

Typical click values: 1/4 MOA, 1/8 MOA, 0.1 MIL, 0.05 MIL.
Key conversion: **1 MIL = 3.438 MOA**.

### RETICLE TYPES

**Classic hunting:** Duplex, German #1, German #4, Fine Crosshair, Post.
**Rangefinding:** Mil-Dot, Half Mil Dot, TMR, MSR, H59, Tremor3.
**Grid / Christmas tree:** Horus, EBR-2C, SCR, MSR2.
**BDC:** BDC 600, BDC 800, Rapid-Z, Dead-Hold.

### SCOPE TYPES (per entry)

- scope, brand, model
- magnification_min, magnification_max
- tube_diameter
- reticle_type
- focal_plane (FFP / SFP)
- adjustment_system
- click_value
- zero_stop

### FOCAL PLANES

- **FFP** (First Focal Plane)
- **SFP** (Second Focal Plane)

### SCOPE TUBE DIAMETERS

1 inch, 30mm, 34mm, 35mm, 36mm, 40mm

### SCOPE BRANDS

**Premium:** Swarovski, Zeiss, Schmidt & Bender, Kahles, Tangent Theta, Hensoldt.
**High-end:** Nightforce, Leica, Steiner.
**Popular hunting:** Vortex, Leupold, Burris, Meopta, Athlon, Trijicon.
**Budget:** Bushnell, Hawke, Primary Arms, Sig Sauer.

### COMMON HUNTING RIFLES (GLOBAL)

**Bolt-action:** Remington 700, Tikka T3/T3X, Howa 1500, Ruger American, Savage 110, Weatherby Vanguard, Sako 85, Browning X-Bolt, Winchester Model 70, CZ 527.
**Lever-action:** Winchester 1894, Marlin 336, Henry Long Ranger.
**Straight-pull:** Blaser R8, Merkel Helix.

### RIFLES — PACIFIC / AUSTRALIA / NEW CALEDONIA

Typical calibers: .223 Rem, .243 Win, .270 Win, .308 Win, 30-06, 7mm-08, 6.5 Creedmoor.
Typical platforms: Tikka T3, Ruger American, Howa 1500, Savage Axis, Browning X-Bolt.

### BULLET TYPES (CONSTRUCTION)

Soft point (SP, JSP, PSP), Hollow point (HP, HPBT), Polymer tip (Ballistic Tip, SST, AccuTip, ELD-X), Bonded (Accubond, Swift A-Frame, InterBond), Monolithic copper (Barnes TSX, Barnes TTSX, Hornady CX), Match (Sierra MatchKing, ELD-Match, Berger Hybrid).

### BULLET SHAPE TYPES

Flat base, Boat tail, Boat tail hollow point, Spitzer, Round nose, Wadcutter.

### DRAG MODELS

G1, G2, G5, G6, G7, G8, GL. Most rifle bullets use G1 or G7 BC.

### BULLET DATABASE STRUCTURE

- bullet, manufacturer, model
- caliber, weight_grains
- ballistic_coefficient (G1/G7)
- drag_model
- bullet_type, bullet_shape
- muzzle_velocity (optional; user can override)

### BALLISTIC SOLVER INPUT PARAMETERS

caliber, bullet weight, BC, drag model, muzzle velocity, barrel length, twist rate, scope height above bore, zero distance, temperature, pressure, altitude, wind speed, wind direction.

### BALLISTIC OUTPUT VALUES

bullet drop, wind drift, velocity, energy, time of flight, MOA adjustments, MIL adjustments, reticle holdover.

### RIFLE PROFILE STRUCTURE

caliber, barrel_length, twist_rate, muzzle_velocity, scope_height, zero_distance.

### SCOPE PROFILE STRUCTURE

brand, model, magnification_range, tube_diameter, reticle_type, focal_plane, adjustment_system, click_value, zero_stop.

### ADVANCED FEATURES (architecture ready)

- Reticle holdover visualization
- Scope turret click simulator
- Range estimation using MIL relation formula
- Multiple rifle profiles
- Custom bullet entry
- Atmospheric compensation
- MOA and MIL switching
- Offline ballistic calculations

The system supports both preloaded ballistic libraries and user-defined entries for rifles, scopes, and bullets. The ballistic solver is optimized for mobile and works offline.
