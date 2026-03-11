/**
 * French translations for rifle glossary. Master content in glossary.md.
 */
import type { GlossaryItem } from '../constants';

export const RIFLE_GLOSSARY_FR: GlossaryItem[] = [
  {
    term: "Fusil",
    definition: "Arme à canon long conçue pour être tirée depuis l'épaule, avec des rayures en spirale qui font tourner le projectile pour stabilité et précision.",
    levelRange: "1",
    detailedDescription: "Un fusil a un canon rayé : des rainures en spirale qui font tourner la balle, améliorant précision et portée. Les fusils de chasse typiques sont à verrou ou à levier. Longueur du canon, calibre et pas de rayure sont essentiels pour l'ammunition et la trajectoire.\n\nConcepts clés : calibre, longueur du canon, pas de rayure, type d'action. L'app utilise des profils fusil (calibre, canon, pas, hauteur de lunette, zéro) pour calculer chute et holdover.",
    example: "Tikka T3 .308, canon 24\", pas 1:10, zéro 100 m"
  },
  {
    term: "Calibre",
    definition: "Le diamètre nominal du canon (ou du projectile), en pouces (ex. .308) ou millimètres (ex. 7,62 mm). Sert souvent à nommer la cartouche.",
    levelRange: "1",
    detailedDescription: "Le calibre identifie l'alésage et la taille du projectile. Calibres courants : .223 Rem, .308 Win, 6.5 Creedmoor, .300 Win Mag. Doit correspondre à l'ammunition. Dans l'app, le calibre fait partie du profil fusil et affecte les entrées du solveur balistique.",
    example: ".308 Winchester, 7,62 mm"
  },
  {
    term: "MIL (milliradian)",
    definition: "Un millième de radian. 1 MIL ≈ 1 m à 1000 m. Utilisé pour l'estimation de distance et le holdover.",
    levelRange: "1",
    detailedDescription: "Le MIL (ou mrad) est une unité angulaire. Formule : distance = (hauteur cible × 1000) / mils quand hauteur et distance sont dans les mêmes unités (ex. mètres). Réticules et tambours sont souvent en 0,1 MIL. 1 MIL ≈ 3,438 MOA.",
    example: "Cible 1 m sous 2 mils → distance = 1000/2 = 500 m"
  },
  {
    term: "MOA (Minute d'angle)",
    definition: "1/60 de degré. ≈ 1,047 po à 100 yards, ≈ 2,9 cm à 100 m. Utilisé pour réglages et taille de groupe.",
    levelRange: "1",
    detailedDescription: "Le MOA est utilisé sur beaucoup de lunettes pour dérive et hausse. Formule distance : distance ≈ (taille cible × 95,5) / MOA (taille et distance en mêmes unités). Clics courants : 1/4 MOA, 1/8 MOA. 1 MIL ≈ 3,438 MOA.",
    example: "Lunette 1/4 MOA, 4 clics haut ≈ 1 MOA"
  },
  {
    term: "Coefficient balistique (BC)",
    definition: "Mesure de la résistance du projectile à la traînée. BC plus élevé = moins de chute et de dérive. Dépend du modèle (G1, G7).",
    levelRange: "1",
    detailedDescription: "Le BC est lié à un modèle de traînée (G1, G7). G7 représente souvent mieux les balles longues portées. Une même balle peut avoir des G1 et G7 différents. L'app utilise le BC avec la V0 et autres entrées pour trajectoire et holdover.",
    example: "G1 0,45, G7 0,23"
  },
  {
    term: "Vitesse initiale",
    definition: "Vitesse du projectile à la bouche (m/s ou ft/s). Entrée clé pour les calculateurs balistiques.",
    levelRange: "1",
    detailedDescription: "La vitesse initiale (V0) dépend de la cartouche, de la longueur du canon et de la charge. Elle détermine la trajectoire : V0 plus élevée = trajectoire plus plate et moins de chute à une distance donnée. L'app utilise V0 avec BC, zéro et hauteur de lunette.",
    example: "2800 ft/s, 853 m/s"
  },
  {
    term: "Zéro / distance de zéro",
    definition: "La distance à laquelle la ligne de mire et la trajectoire sont réglées pour se croiser (ex. 100 m, 200 m).",
    levelRange: "1",
    detailedDescription: "Le zéro est fait à une distance choisie. Plus proche que le zéro on peut viser bas ; au-delà on tient compte du holdover (ou on tourne la hausse). L'app utilise la distance de zéro dans le solveur et pour les clics de tambour.",
    example: "Zéro à 100 m"
  },
  {
    term: "Holdover",
    definition: "Visée au-dessus de la cible pour compenser la chute à plus longue portée. En MIL, MOA ou repères de réticule.",
    levelRange: "1",
    detailedDescription: "Au-delà du zéro, la balle tombe. Le holdover est la quantité angulaire ou réticule dont on vise haut. L'app affiche le holdover en MIL ou MOA et en clics de tambour, et peut générer une table balistique (distance vs chute, holdover, clics).",
    example: "À 300 m : tenir 0,8 mrad ou tourner 8 clics (0,1 mrad)"
  },
  {
    term: "Lunette",
    definition: "Viseur télescopique monté sur le fusil pour agrandir la cible et fournir une référence de visée (réticule).",
    levelRange: "2",
    detailedDescription: "Les lunettes ont un grossissement, des lentilles objectif et oculaire, un diamètre de tube et un plan focal (FFP ou SFP). Les tambours règlent hausse et dérive en MIL ou MOA. L'app utilise : FFP/SFP, unité (MIL/MOA), valeur du clic, clics par tour.",
    example: "3–9×40, 0,1 MIL, FFP"
  },
  {
    term: "FFP (Premier plan focal)",
    definition: "Le réticule est devant les lentilles de grossissement. L'écart MIL/MOA est correct à toute magnification.",
    levelRange: "2",
    detailedDescription: "En FFP, le réticule change de taille avec le grossissement, donc les subtensions (ex. 1 mil) sont correctes à tous les zooms. Estimation de distance et holdover fonctionnent à toute magnification. L'app peut supposer FFP pour distance et holdover en mil/MOA.",
    example: "1 mil entre les points à 4× et à 10×"
  },
  {
    term: "SFP (Second plan focal)",
    definition: "Le réticule est derrière les lentilles de grossissement. Les subtensions ne sont exactes qu'à une magnification donnée (souvent max).",
    levelRange: "2",
    detailedDescription: "En SFP, les valeurs mil/MOA ne sont correctes qu'à une magnification (ex. max). À d'autres grossissements il faut appliquer un facteur. L'app peut utiliser la calibration de magnification pour SFP pour subtension et distance.",
    example: "Mil-dot correct à 10× seulement"
  },
  {
    term: "Valeur du clic",
    definition: "Déplacement du point d'impact par clic du tambour (ex. 1/4 MOA, 0,1 MIL).",
    levelRange: "2",
    detailedDescription: "Chaque clic décale l'impact d'un angle fixe. 0,1 MIL et 1/4 MOA sont courants. Avec les clics par tour, l'app convertit la chute (MIL ou MOA) en nombre de clics à tourner.",
    example: "0,1 MIL par clic, 10 clics = 1 MIL"
  },
  {
    term: "Hauteur de cible",
    definition: "Dimension apparente ou connue de la cible utilisée dans la formule de distance (ex. largeur d'épaule de gibier, hauteur en mils).",
    levelRange: "2",
    detailedDescription: "Pour l'estimation de distance il faut la taille de la cible (en m ou yards) et la taille angulaire (mils ou MOA). Distance = (hauteur cible × 1000) / mils (MIL), ou (hauteur × 95,5) / MOA. L'app a une bibliothèque de hauteurs (cerf, homme, steel, personnalisé).",
    example: "Cerf 0,5 m, 2 mils → 250 m"
  },
  {
    term: "Chute de balle",
    definition: "Distance verticale dont la balle tombe sous la ligne de mire (ou l'axe du canon) à une portée donnée.",
    levelRange: "2",
    detailedDescription: "La gravité et la traînée provoquent la chute. Elle augmente avec la distance et dépend de la V0, du BC, du zéro et de l'atmosphère. L'app calcule la chute et la convertit en hausse (MIL/MOA) et en clics pour votre lunette.",
    example: "À 300 m : 25 cm de chute → 0,83 mrad"
  },
  {
    term: "Hauteur de lunette au-dessus du canon",
    definition: "Distance verticale du centre du canon au centre de la lunette. Affecte la trajectoire et la précision du solveur.",
    levelRange: "2",
    detailedDescription: "La hauteur de lunette crée un angle entre le canon et la ligne de mire. Elle affecte la courbe de trajectoire, surtout près du zéro. L'app l'utilise dans le solveur pour chute et hausse.",
    example: "50 mm hauteur de lunette"
  }
];
