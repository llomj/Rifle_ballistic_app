# Average speed (muzzle velocity) catalog

Reference values for **autofill** of *Average speed* in the app (stored base MV, m/s). Barrel and powder-temp corrections then apply in the UI.

## Source of truth

| File | Role |
|------|------|
| `src/data/bulletMuzzleVelocityById.json` | **Bullet id → m/s** — loaded by the app (one entry per catalog bullet). |
| `scripts/generate-bullet-mv.mjs` | Regenerates the JSON from `bullets.json` + caliber midpoints + weight scaling. **Hand-tuned** entries live in `HAND_MV_MPS_BY_ID` in that script. |

## Regenerate after editing bullets or hand values

```bash
npm run generate-bullet-mv
```

Then rebuild the app. Adjust **hand-tuned** IDs in `scripts/generate-bullet-mv.mjs` (`HAND_MV_MPS_BY_ID`) for factory / published loads you trust (e.g. .30-30 Win 150 gr lever-action ~725 m/s ≈ 2380 fps class).

## Hand-tuned examples (edit in the script, then regenerate)

| Bullet id | Notes (approx.) |
|-----------|-----------------|
| `300winmag-180gr-g1` | 922 m/s — aligns with default Tikka profile |
| `3030-150gr-g1` | 725 m/s — typical factory 150 gr .30-30 from ~20" lever (field range ~720–730 m/s) |
| `3030-170gr-g1` | 678 m/s — heavier bullet, slower |

## Full table (bullet id → catalog MV m/s)

| Bullet id | Name | m/s |
|-----------|------|-----|
| `300winmag-180gr-g1` | .300 Win Mag 180 gr SP G1 | 922 |
| `300winmag-165gr-g1` | .300 Win Mag 165 gr BTSP G1 | 982.2 |
| `300winmag-200gr-g1` | .300 Win Mag 200 gr ELD-X G1 | 892 |
| `300winmag-150gr-g1` | .300 Win Mag 150 gr SST G1 | 995.8 |
| `308-168gr-g1` | .308 Win 168 gr BTHP Match G1 | 820 |
| `308-175gr-g1` | .308 Win 175 gr SMK G1 | 803.6 |
| `308-150gr-g1` | .308 Win 150 gr SP G1 | 868 |
| `308-180gr-g1` | .308 Win 180 gr SP G1 | 792.5 |
| `65creedmoor-143gr-g1` | 6.5 Creedmoor 143 gr ELD-X G1 | 790.1 |
| `65creedmoor-140gr-g1` | 6.5 Creedmoor 140 gr BTHP G1 | 798.8 |
| `65creedmoor-129gr-g1` | 6.5 Creedmoor 129 gr SST G1 | 832 |
| `65creedmoor-147gr-g1` | 6.5 Creedmoor 147 gr ELD-M G1 | 779.3 |
| `223-55gr-g1` | .223 Rem 55 gr FMJ G1 | 1020.6 |
| `223-62gr-g1` | .223 Rem 62 gr M855 G1 | 964.6 |
| `223-69gr-g1` | .223 Rem 69 gr SMK G1 | 914.7 |
| `223-77gr-g1` | .223 Rem 77 gr OTM G1 | 869.4 |
| `223-75gr-g1` | .223 Rem 75 gr BTHP G1 | 877.3 |
| `300weatherby-180gr-g1` | .300 Weatherby 180 gr Accubond G1 | 1050 |
| `3030-150gr-g1` | .30-30 Win 150 gr SP G1 | 725 |
| `3030-170gr-g1` | .30-30 Win 170 gr FP G1 | 678 |
| `300rum-180gr-g1` | .300 Rem Ultra Mag 180 gr SP G1 | 915 |
| `300saum-180gr-g1` | .300 SAUM 180 gr SP G1 | 900 |
| `223-55-fmj` | .223 Rem 55 gr FMJ | 1020.6 |
| `223-62-fmj` | .223 Rem 62 gr FMJ | 964.6 |
| `223-69-match` | .223 Rem 69 gr Match | 914.7 |
| `223-77-match` | .223 Rem 77 gr Match | 869.4 |
| `243-87-vmax` | .243 Win 87 gr V-Max | 967.6 |
| `243-90-softpoint` | .243 Win 90 gr SP | 951.7 |
| `243-95-ballistic-tip` | .243 Win 95 gr Ballistic Tip | 925.8 |
| `243-100-sp` | .243 Win 100 gr SP | 902.7 |
| `270-130-sp` | .270 Win 130 gr SP | 966.6 |
| `270-140-accubond` | .270 Win 140 gr Accubond | 931.3 |
| `270-150-sp` | .270 Win 150 gr SP | 899.6 |
| `308-155-palmas` | .308 Win 155 gr Palmas | 854 |
| `308-185-match` | .308 Win 185 gr Match | 781.5 |
| `308-190-match` | .308 Win 190 gr Match | 771.3 |
| `308-178-eldx` | .308 Win 178 gr ELD-X | 796.9 |
| `30-06-150-fmj` | .30-06 Springfield 150 gr FMJ | 885 |
| `30-06-165-sp` | .30-06 Springfield 165 gr SP | 843.8 |
| `30-06-180-sp` | .30-06 Springfield 180 gr SP | 808 |
| `65cm-120-match` | 6.5 Creedmoor 120 gr Match | 862.5 |
| `65cm-130-match` | 6.5 Creedmoor 130 gr Match | 829.1 |
| `7mm-150-sp` | 7mm Rem Mag 150 gr SP | 955.4 |
| `7mm-162-eldx` | 7mm Rem Mag 162 gr ELD-X | 919.2 |
| `7mm-175-match` | 7mm Rem Mag 175 gr Match | 884.5 |
| `300wm-190-match` | .300 Win Mag 190 gr Match | 915.3 |
| `300wm-200-match` | .300 Win Mag 200 gr Match | 892 |
| `300wm-215-hybrid` | .300 Win Mag 215 gr Hybrid | 860.4 |
| `338-250-match` | .338 Win Mag 250 gr Match | 875.1 |
| `338-285-match` | .338 Win Mag 285 gr Match | 819.6 |
| `338-300-match` | .338 Win Mag 300 gr Match | 798.9 |
| `708-139gr-g1` | 7mm-08 Rem 139 gr SST G1 | 866 |
| `708-140gr-g1` | 7mm-08 Rem 140 gr BTSP G1 | 863.1 |
| `708-150gr-g1` | 7mm-08 Rem 150 gr SP G1 | 833.8 |
| `708-162gr-g1` | 7mm-08 Rem 162 gr ELD-X G1 | 802.2 |
| `708-175gr-g1` | 7mm-08 Rem 175 gr SMK G1 | 771.9 |
| `300wsm-150gr-g1` | .300 WSM 150 gr SST G1 | 968.6 |
| `300wsm-165gr-g1` | .300 WSM 165 gr BTSP G1 | 923.6 |
| `300wsm-180gr-g1` | .300 WSM 180 gr Accubond G1 | 884.3 |
| `300wsm-200gr-g1` | .300 WSM 200 gr ELD-X G1 | 838.8 |
| `65prc-120gr-g1` | 6.5 PRC 120 gr CX G1 | 950.4 |
| `65prc-143gr-g1` | 6.5 PRC 143 gr ELD-X G1 | 875.4 |
| `65prc-147gr-g1` | 6.5 PRC 147 gr ELD-M G1 | 863.3 |
| `65prc-156gr-g1` | 6.5 PRC 156 gr Hybrid G1 | 838.2 |
| `270wsm-130gr-g1` | .270 WSM 130 gr AccuTip G1 | 934.1 |
| `270wsm-140gr-g1` | .270 WSM 140 gr Accubond G1 | 900 |
| `270wsm-150gr-g1` | .270 WSM 150 gr Partition G1 | 869.4 |
| `308-125gr-g1` | .308 Win 125 gr TTSX G1 | 885.6 |
| `308-165gr-g1` | .308 Win 165 gr SST G1 | 827.7 |
| `308-168gr-a-max-g1` | .308 Win 168 gr A-Max G1 | 820 |
| `270-145gr-g1` | .270 Win 145 gr ELD-X G1 | 914.8 |
| `270-160gr-g1` | .270 Win 160 gr Partition G1 | 871 |
| `243-105gr-g1` | .243 Win 105 gr BTHP G1 | 881.2 |
| `243-107gr-g1` | .243 Win 107 gr SMK G1 | 872.9 |
| `30-06-168gr-g1` | .30-06 Springfield 168 gr SMK G1 | 836.1 |
| `30-06-200gr-g1` | .30-06 Springfield 200 gr Partition G1 | 766.4 |
| `65creedmoor-108gr-g1` | 6.5 Creedmoor 108 gr ELD-M G1 | 885.6 |
| `65creedmoor-156gr-g1` | 6.5 Creedmoor 156 gr Berger G1 | 756.6 |
| `300winmag-165gr-g1` | .300 Win Mag 165 gr SST G1 | 982.2 |
| `7mmremmag-160gr-g1` | 7mm Rem Mag 160 gr Accubond G1 | 925 |
| `223-50gr-g1` | .223 Rem 50 gr V-Max G1 | 1020.6 |
| `223-60gr-g1` | .223 Rem 60 gr Partition G1 | 980.6 |
| `6mmcm-95gr-g1` | 6mm Creedmoor 95 gr V-Max G1 | 968.2 |
| `6mmcm-103gr-g1` | 6mm Creedmoor 103 gr ELD-X G1 | 929.8 |
| `6mmcm-108gr-g1` | 6mm Creedmoor 108 gr ELD-M G1 | 908.3 |
| `6mmcm-115gr-g1` | 6mm Creedmoor 115 gr DTAC G1 | 880.4 |
| `280rem-140gr-g1` | .280 Rem 140 gr Accubond G1 | 923.4 |
| `280rem-150gr-g1` | .280 Rem 150 gr SP G1 | 892 |
| `280rem-162gr-g1` | .280 Rem 162 gr ELD-X G1 | 858.2 |
| `280ai-150gr-g1` | .280 AI 150 gr Partition G1 | 937 |
| `280ai-168gr-g1` | .280 AI 168 gr Berger Hybrid G1 | 885.2 |
| `7mmprc-160gr-g1` | 7mm PRC 160 gr Accubond G1 | 911.4 |
| `7mmprc-175gr-g1` | 7mm PRC 175 gr ELD-X G1 | 871.6 |
| `7mmprc-180gr-g1` | 7mm PRC 180 gr ELD-M G1 | 859.5 |
| `300prc-212gr-g1` | .300 PRC 212 gr ELD-X G1 | 896.2 |
| `300prc-225gr-g1` | .300 PRC 225 gr ELD-M G1 | 869.7 |
| `300prc-230gr-g1` | .300 PRC 230 gr Hybrid G1 | 860.3 |
| `7x57-140gr-g1` | 7×57 Mauser 140 gr SP G1 | 827.4 |
| `7x57-175gr-g1` | 7×57 Mauser 175 gr RN G1 | 739.9 |
| `65x55-140gr-g1` | 6.5×55 140 gr SP G1 | 822.6 |
| `65x55-156gr-g1` | 6.5×55 156 gr Oryx G1 | 779.2 |
| `93x62-250gr-g1` | 9.3×62 250 gr SP G1 | 745.3 |
| `93x62-286gr-g1` | 9.3×62 286 gr Woodleigh G1 | 697.1 |
| `338-225gr-g1` | .338 Win Mag 225 gr Accubond G1 | 918 |
| `65creedmoor-95gr-g1` | 6.5 Creedmoor 95 gr V-Max G1 | 885.6 |
| `65creedmoor-160gr-g1` | 6.5 Creedmoor 160 gr Partition G1 | 754.4 |
| `308-178gr-g1` | .308 Win 178 gr Hornady BTHP G1 | 796.9 |
| `300winmag-220gr-g1` | .300 Win Mag 220 gr Partition G1 | 850.4 |
