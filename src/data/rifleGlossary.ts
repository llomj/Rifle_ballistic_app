/**
 * Rifle ballistic glossary (EN). Master content in glossary.md.
 * Used by GlossaryView. GlossaryItem shape in constants.ts.
 */
import type { GlossaryItem } from '../constants';

export const RIFLE_GLOSSARY: GlossaryItem[] = [
  {
    term: "Rifle",
    definition: "A long-barrelled firearm designed to be fired from the shoulder, with spiral grooves (rifling) inside the barrel to spin the projectile for stability and accuracy.",
    levelRange: "1",
    detailedDescription: "A rifle has a rifled barrel: spiral grooves cut into the bore that spin the bullet, improving accuracy and range. Typical hunting rifles are bolt-action or lever-action. Barrel length, caliber, and twist rate are key for matching ammunition and trajectory.\n\nKey concepts: caliber, barrel length, twist rate, action type. The app uses rifle profiles (caliber, barrel, twist, scope height, zero) to compute drop and holdover.",
    example: "Tikka T3 .308, 24\" barrel, 1:10 twist, zero 100 m"
  },
  {
    term: "Caliber",
    definition: "The nominal internal diameter of the barrel (or bullet diameter), usually in inches (e.g. .308) or millimetres (e.g. 7.62 mm). Often used to name the cartridge.",
    levelRange: "1",
    detailedDescription: "Caliber identifies the bore and bullet size. Common rifle calibers: .223 Rem, .308 Win, 6.5 Creedmoor, .300 Win Mag. Must match the ammunition. In the app, caliber is part of the rifle profile and affects ballistic solver inputs.",
    example: ".308 Winchester, 7.62 mm"
  },
  {
    term: "MIL (milliradian)",
    definition: "One thousandth of a radian. 1 MIL ≈ 1 m at 1000 m. Used for range estimation and holdover.",
    levelRange: "1",
    detailedDescription: "MIL (or mrad) is an angular unit. Formula: distance = (target height × 1000) / mils when height and distance are in the same units (e.g. metres). Scope reticles and turrets are often in 0.1 MIL clicks. 1 MIL ≈ 3.438 MOA.",
    example: "1 m target subtends 2 mils → distance = 1000/2 = 500 m"
  },
  {
    term: "MOA (Minute of Angle)",
    definition: "1/60 of a degree. ≈ 1.047 in at 100 yards, ≈ 2.9 cm at 100 m. Used for adjustments and group size.",
    levelRange: "1",
    detailedDescription: "MOA is used on many scopes for windage and elevation. Formula for range: distance ≈ (target size × 95.5) / MOA (size and distance in same units). Common click values: 1/4 MOA, 1/8 MOA. 1 MIL ≈ 3.438 MOA.",
    example: "1/4 MOA scope, 4 clicks up ≈ 1 MOA"
  },
  {
    term: "Ballistic Coefficient (BC)",
    definition: "Measure of how well the bullet resists air drag. Higher BC = less drop and wind drift. Depends on drag model (G1, G7).",
    levelRange: "1",
    detailedDescription: "BC is tied to a drag model (e.g. G1, G7). G7 often fits modern long-range bullets better. Same bullet can have different G1 and G7 values. The app uses BC with muzzle velocity and other inputs to compute trajectory and holdover.",
    example: "G1 0.45, G7 0.23"
  },
  {
    term: "Muzzle velocity",
    definition: "Speed of the bullet at the muzzle (m/s or ft/s). Key input for ballistic calculators.",
    levelRange: "1",
    detailedDescription: "Muzzle velocity (MV) is set by cartridge, barrel length, and load. It drives the whole trajectory: higher MV means flatter path and less drop at a given range. The app uses MV with BC, zero, and scope height to compute drop and clicks.",
    example: "2800 ft/s, 853 m/s"
  },
  {
    term: "Zero / zero distance",
    definition: "The range at which the line of sight and the trajectory are set to cross (e.g. 100 m, 200 m).",
    levelRange: "1",
    detailedDescription: "Zeroing is done at a chosen distance. Closer than zero you may hold under; beyond zero you hold over (or dial elevation). The app uses zero distance in the ballistic solver and for turret click calculations.",
    example: "Zero at 100 m"
  },
  {
    term: "Holdover",
    definition: "Aiming above the target to compensate for drop at longer range. Can be in MIL, MOA, or reticle marks.",
    levelRange: "1",
    detailedDescription: "Beyond zero, the bullet falls. Holdover is the angular or reticle amount you aim high. The app shows holdover in MIL or MOA and as turret clicks, and can generate a ballistic table (distance vs drop, holdover, clicks).",
    example: "At 300 m: hold 0.8 mrad or dial 8 clicks (0.1 mrad)"
  },
  {
    term: "Riflescope",
    definition: "A telescopic sight mounted on the rifle to magnify the target and provide an aiming reference (reticle).",
    levelRange: "2",
    detailedDescription: "Scopes have magnification, objective and ocular lenses, tube diameter, and focal plane (FFP or SFP). Turrets adjust elevation and windage in MIL or MOA. The app uses scope settings: FFP/SFP, unit (MIL/MOA), click value, clicks per revolution.",
    example: "3–9×40, 0.1 MIL, FFP"
  },
  {
    term: "FFP (First Focal Plane)",
    definition: "Reticle is in front of the magnification lenses. Mil/MOA spacing is correct at every magnification.",
    levelRange: "2",
    detailedDescription: "On FFP scopes, the reticle scales with magnification, so subtensions (e.g. 1 mil) are correct at all zoom levels. Range estimation and holdover work at any magnification. The app can assume FFP when using mil/MOA for distance and holdover.",
    example: "1 mil between dots at 4× and at 10×"
  },
  {
    term: "SFP (Second Focal Plane)",
    definition: "Reticle is behind the magnification lenses. Subtensions are accurate only at a stated magnification (often max).",
    levelRange: "2",
    detailedDescription: "On SFP scopes, mil/MOA values are correct only at one magnification (e.g. max). At other magnifications you must scale. The app may use magnification calibration for SFP when computing subtension and distance.",
    example: "Mil-dot correct at 10× only"
  },
  {
    term: "Click value",
    definition: "The change in point of impact per click of the turret (e.g. 1/4 MOA, 0.1 MIL).",
    levelRange: "2",
    detailedDescription: "Each turret click moves the impact by a fixed angle. 0.1 MIL and 1/4 MOA are common. With clicks per revolution, the app converts drop (MIL or MOA) into the number of clicks to dial.",
    example: "0.1 MIL per click, 10 clicks = 1 MIL"
  },
  {
    term: "Target height",
    definition: "The apparent or known dimension of the target used in the range formula (e.g. shoulder width of game, height in mils).",
    levelRange: "2",
    detailedDescription: "For range estimation you need the target size (in metres or yards) and the angular size (mils or MOA). Distance = (target height × 1000) / mils (MIL), or (target height × 95.5) / MOA. The app has a target height library (deer, human, steel, custom).",
    example: "Deer 0.5 m, 2 mils → 250 m"
  },
  {
    term: "Bullet drop",
    definition: "Vertical distance the bullet falls below the line of sight (or bore line) at a given range.",
    levelRange: "2",
    detailedDescription: "Gravity and drag cause drop. Drop increases with distance and depends on MV, BC, zero, and atmosphere. The app computes drop and converts it to elevation (MIL/MOA) and turret clicks for your scope.",
    example: "At 300 m: 25 cm drop → 0.83 mrad"
  },
  {
    term: "Scope height above bore",
    definition: "Vertical distance from the centre of the bore to the centre of the scope. Affects trajectory and solver accuracy.",
    levelRange: "2",
    detailedDescription: "Scope height creates an angle between bore and line of sight. It affects the trajectory curve, especially near the zero range. The app uses it in the ballistic solver for drop and elevation.",
    example: "50 mm scope height"
  }
];
