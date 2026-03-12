# Ammunition / Bullets — In-app catalog

All ammunition (bullet) entries currently available in the app. Expand this list to add more options.

## Structure (per entry)

| Field           | Description                              |
|-----------------|------------------------------------------|
| `id`            | Unique identifier (slug)                 |
| `name`          | Display name                             |
| `caliber`       | Caliber designation (e.g. .308 Win)     |
| `caliberKey`    | Key for matching rifle (e.g. 308)        |
| `diameterMm`    | Bullet diameter in mm                    |
| `weightGrams`   | Bullet weight in grams                   |
| `bcG1`          | Ballistic coefficient (G1)              |
| `bcG7`          | Ballistic coefficient (G7), optional    |
| `manufacturer`  | (optional) Manufacturer                  |
| `bulletType`    | (optional) Construction type             |
| `bulletShape`   | (optional) Shape                         |
| `dragModel`     | (optional) G1, G2, G5, G6, G7, G8, GL    |

## Ammunition in the app

| id | name | caliber | caliberKey | diameterMm | weightGrams | bcG1 | bcG7 | manufacturer | bulletType | bulletShape | dragModel |
|----|------|---------|------------|------------|-------------|------|------|--------------|------------|-------------|-----------|
| 300winmag-180gr-g1 | 7.62mm (.300) 180 gr SP G1 | .300 Win Mag | 300winmag | 7.82 | 11.66 | 0.439 | 0.225 | — | — | — | — |
| 300winmag-165gr-g1 | .300 Win Mag 165 gr BTSP G1 | .300 Win Mag | 300winmag | 7.82 | 10.69 | 0.435 | 0.223 | — | — | — | — |
| 300winmag-200gr-g1 | .300 Win Mag 200 gr ELD-X G1 | .300 Win Mag | 300winmag | 7.82 | 12.96 | 0.636 | 0.325 | — | — | — | — |
| 300winmag-150gr-g1 | .300 Win Mag 150 gr SST G1 | .300 Win Mag | 300winmag | 7.82 | 9.72 | 0.415 | 0.212 | — | — | — | — |
| 308-168gr-g1 | .308 Win 168 gr BTHP Match G1 | .308 Win | 308 | 7.82 | 10.89 | 0.462 | 0.237 | — | — | — | — |
| 308-175gr-g1 | .308 Win 175 gr SMK G1 | .308 Win | 308 | 7.82 | 11.34 | 0.505 | 0.258 | Sierra | Sierra MatchKing | Boat tail hollow point | G1 |
| 308-150gr-g1 | .308 Win 150 gr SP G1 | .308 Win | 308 | 7.82 | 9.72 | 0.415 | 0.212 | — | — | — | — |
| 308-180gr-g1 | .308 Win 180 gr SP G1 | .308 Win | 308 | 7.82 | 11.66 | 0.439 | 0.225 | — | — | — | — |
| 65creedmoor-143gr-g1 | 6.5 Creedmoor 143 gr ELD-X G1 | 6.5 Creedmoor | 65creedmoor | 6.71 | 9.27 | 0.625 | 0.315 | Hornady | ELD-X | Boat tail | G1 |
| 65creedmoor-140gr-g1 | 6.5 Creedmoor 140 gr BTHP G1 | 6.5 Creedmoor | 65creedmoor | 6.71 | 9.07 | 0.585 | 0.295 | — | — | — | — |
| 65creedmoor-129gr-g1 | 6.5 Creedmoor 129 gr SST G1 | 6.5 Creedmoor | 65creedmoor | 6.71 | 8.36 | 0.505 | 0.255 | — | — | — | — |
| 65creedmoor-147gr-g1 | 6.5 Creedmoor 147 gr ELD-M G1 | 6.5 Creedmoor | 65creedmoor | 6.71 | 9.53 | 0.697 | 0.352 | — | — | — | — |
| 223-55gr-g1 | .223 Rem 55 gr FMJ G1 | .223 Rem | 223 | 5.69 | 3.56 | 0.243 | 0.121 | — | — | — | — |
| 223-62gr-g1 | .223 Rem 62 gr M855 G1 | .223 Rem | 223 | 5.69 | 4.02 | 0.304 | 0.151 | — | — | — | — |
| 223-69gr-g1 | .223 Rem 69 gr SMK G1 | .223 Rem | 223 | 5.69 | 4.47 | 0.301 | 0.152 | — | — | — | — |
| 223-77gr-g1 | .223 Rem 77 gr OTM G1 | .223 Rem | 223 | 5.69 | 4.99 | 0.362 | 0.182 | — | — | — | — |
| 223-75gr-g1 | .223 Rem 75 gr BTHP G1 | .223 Rem | 223 | 5.69 | 4.86 | 0.395 | 0.198 | — | — | — | — |
| 300weatherby-180gr-g1 | .300 Weatherby 180 gr Accubond G1 | .300 Weatherby Mag | 300weatherby | 7.82 | 11.66 | 0.507 | 0.260 | — | — | — | — |
| 3030-150gr-g1 | .30-30 Win 150 gr SP G1 | .30-30 Winchester | 30-30 | 7.82 | 9.72 | 0.278 | 0.142 | Remington | SP | Flat base | G1 |
| 3030-170gr-g1 | .30-30 Win 170 gr FP G1 | .30-30 Winchester | 30-30 | 7.82 | 11.02 | 0.304 | 0.155 | Winchester | SP | Flat base | G1 |

## BALLISTIC_DATABASE (additional bullets)

Raw format (short): `id, caliber, weight_gr, bcG1, bcG7`  
Full format: `id, caliber, weight_gr, bcG1, bcG7, muzzle_velocity_fps, [ref], dragModel, manufacturer`

| id | caliber | weight_gr | bcG1 | bcG7 | dragModel | manufacturer |
|----|---------|-----------|------|------|-----------|--------------|
| 223_55_fmj | .223 Rem | 55 | 0.255 | 0.130 | G1 | Federal |
| 223_62_fmj | .223 Rem | 62 | 0.307 | 0.151 | G1 | Winchester |
| 223_69_match | .223 Rem | 69 | 0.355 | 0.185 | G7 | Sierra |
| 223_77_match | .223 Rem | 77 | 0.372 | 0.190 | G7 | Nosler |
| 243_87_vmax | .243 Win | 87 | 0.400 | 0.210 | G7 | Hornady |
| 243_90_softpoint | .243 Win | 90 | 0.365 | 0.180 | G1 | Remington |
| 243_95_ballistic_tip | .243 Win | 95 | 0.379 | 0.200 | G7 | Nosler |
| 243_100_sp | .243 Win | 100 | 0.405 | 0.200 | G1 | Winchester |
| 270_130_sp | .270 Win | 130 | 0.435 | 0.220 | G1 | Federal |
| 270_140_accubond | .270 Win | 140 | 0.496 | 0.250 | G7 | Nosler |
| 270_150_sp | .270 Win | 150 | 0.525 | 0.265 | G1 | Remington |
| 308_150_fmj | .308 Win | 150 | 0.398 | 0.200 | G1 | Winchester |
| 308_155_palmas | .308 Win | 155 | 0.450 | 0.225 | G7 | Sierra |
| 308_165_sp | .308 Win | 165 | 0.447 | 0.225 | G1 | Federal |
| 308_168_match | .308 Win | 168 | 0.462 | 0.218 | G7 | Sierra |
| 308_175_match | .308 Win | 175 | 0.496 | 0.243 | G7 | Nosler |
| 308_178_eldx | .308 Win | 178 | 0.552 | 0.278 | G7 | Hornady |
| 308_185_match | .308 Win | 185 | 0.555 | 0.280 | G7 | Berger |
| 308_190_match | .308 Win | 190 | 0.533 | 0.270 | G7 | Sierra |
| 30_06_150_fmj | .30-06 Springfield | 150 | 0.398 | 0.200 | G1 | Winchester |
| 30_06_165_sp | .30-06 Springfield | 165 | 0.447 | 0.225 | G1 | Remington |
| 30_06_180_sp | .30-06 Springfield | 180 | 0.480 | 0.240 | G1 | Federal |
| 65cm_120_match | 6.5 Creedmoor | 120 | 0.458 | 0.230 | G7 | Hornady |
| 65cm_130_match | 6.5 Creedmoor | 130 | 0.552 | 0.270 | G7 | Berger |
| 65cm_140_match | 6.5 Creedmoor | 140 | 0.610 | 0.315 | G7 | Hornady |
| 65cm_147_match | 6.5 Creedmoor | 147 | 0.697 | 0.351 | G7 | Nosler |
| 7mm_150_sp | 7mm Rem Mag | 150 | 0.456 | 0.230 | G1 | Remington |
| 7mm_162_eldx | 7mm Rem Mag | 162 | 0.631 | 0.317 | G7 | Hornady |
| 7mm_175_match | 7mm Rem Mag | 175 | 0.689 | 0.347 | G7 | Berger |
| 300wm_180_sp | .300 Win Mag | 180 | 0.480 | 0.240 | G1 | Federal |
| 300wm_190_match | .300 Win Mag | 190 | 0.533 | 0.270 | G7 | Sierra |
| 300wm_200_match | .300 Win Mag | 200 | 0.597 | 0.301 | G7 | Berger |
| 300wm_215_hybrid | .300 Win Mag | 215 | 0.691 | 0.350 | G7 | Berger |
| 338_250_match | .338 Win Mag | 250 | 0.575 | 0.290 | G7 | Lapua |
| 338_285_match | .338 Win Mag | 285 | 0.730 | 0.365 | G7 | Berger |
| 338_300_match | .338 Win Mag | 300 | 0.768 | 0.383 | G7 | Lapua |

## Calibers represented

- .223 Rem
- .243 Win
- .270 Win
- .308 Win
- .30-06 Springfield
- 6.5 Creedmoor
- 7mm Rem Mag
- .300 Win Mag
- .338 Win Mag
- .300 Weatherby Mag
- .30-30 Winchester

## Reference: bullet types and shapes (databaseConstants)

- **Construction types:** SP, JSP, PSP; HP, HPBT; Ballistic Tip, SST, AccuTip, ELD-X; Accubond, Swift A-Frame, InterBond; Barnes TSX, Barnes TTSX, Hornady CX; Sierra MatchKing, ELD-Match, Berger Hybrid
- **Shapes:** Flat base, Boat tail, Boat tail hollow point, Spitzer, Round nose, Wadcutter
- **Drag models:** G1, G2, G5, G6, G7, G8, GL (most rifle entries use G1 or G7)

## Source

- App data: `src/data/bullets.json`
- Calibers list: `src/data/calibers.json`
- Catalog API: `src/data/catalogs.ts` (`BULLETS`, `getBulletById`, `searchBullets`, `getBulletsForCaliberKey`)
- Constants: `src/data/databaseConstants.ts`

## Future expansion

- Add more weights and types per caliber; add muzzle velocity where known.
- Add calibers: .243 Win, .270 Win, .30-06, 7mm-08, 6.5 PRC, .22-250, etc.
- Optional: manufacturer, bullet type, shape, and drag model on every entry for filtering.
