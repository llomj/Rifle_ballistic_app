from colorama import init, Fore, Style
import os

def sh():
    # Initialize colorama
    init(autoreset=True)

    # Output with colored text
    print(Fore.LIGHTYELLOW_EX + "📐 Mesurer la distance avec la portée SFP")
    print(Fore.LIGHTYELLOW_EX + "Zero à 100m, zoomer à 10x")
    print(Fore.LIGHTYELLOW_EX + "Formule : hauteur(float) x 1000 / mils = distance")
    print(Fore.CYAN + "Bon pour tuer le poir entre 90 et 320 kg.")
    print(Fore.CYAN + "Tableau moyenne de hauteur (magnification 10x)\nHuman   1.65m  1.78m     \nCerf    1.40m  1.70m \nNiaoli  3.5m   5m \nCoco    0.20m  0.30m")
    print("-" * 45)

    # Static information about ammunition
    print(Fore.WHITE + """Rim diameters:    13.3mm
Case length:      67mm
Overall length:   85mm
Bullet:           7.62mm (.300 )
Average speed:    922 m/s
Recoil:           2.39 
Coefficient:      .439 G1 """)
    print("-" * 45)

    # Turret adjustments table
    print(Fore.WHITE + """
150m    2.8cm   -0.20    ^2 clicks
200m    9.5cm   -0.50    ^5 clicks
250m    20cm    -0.80    ^8 clicks 
300m    35cm    -1.2     ^12 clicks 
350m    55cm    -1.6     ^16 clicks
400m    80cm    -2       ^20 clicks
450m    110cm   -2.5     ^25 clicks
500m    150cm   -3       ^30 clicks
550m    195cm   -3.5     ^35 clicks
600m    250cm   -4       ^40 clicks
""")
    print("-" * 45)

    # Wind mirage calculation explanation
    print(Fore.WHITE + """Comment calculer le mirage du vent
22 degrees angle environ 4  kph
45 degrees angle environ 8  kph 
90 degrees angle environ 16 kph  
""")
    print("-" * 45)

    # Input for target distance and mils
    distance = float(input(Fore.LIGHTYELLOW_EX + "Distance de cible (mettre): "))
    mils = float(input(Fore.LIGHTYELLOW_EX + "Tapez en Mils (milliradians): "))
    height = distance * mils / 1000
    result = height

    # Display height and reticle
    print(f"Height = {result}m")
    print(f"Reticle = {result / mils * 100}cm")
    print(" " * 45)

    # Turret adjustment output based on calculated height
    if 150 <= result <= 170:
        print(Fore.BLUE + "Turret: 2.8cm  -0.20  ^2 clicks")
    elif 171 < result <= 200:
        print(Fore.BLUE + "Turret: 9.5cm. -0.50  ^5 clicks")
    elif 201 < result <= 250:
        print(Fore.BLUE + "Turret: 20cm  -0.80  ^8 clicks")
    elif 251 < result <= 300:
        print(Fore.GREEN + "Turret: 35cm  -1.2  ^12 clicks ")
    elif 301 < result <= 350:
        print(Fore.GREEN + "Turret: 55cm  -1.6  ^16 clicks")
    elif 351 < result <= 400:
        print(Fore.GREEN + "Turret: 80cm  -2  ^20 clicks ")
    elif 401 < result <= 450:
        print(Fore.RED + "Turret: 110cm  -2.5  ^25 clicks")
    elif 451 < result <= 500:
        print(Fore.RED + "Turret: 150cm  -3  ^30 clicks")
    elif 501 < result <= 550:
        print(Fore.RED + "Turret: 195cm  -3.5  ^35 clicks")
    elif 551 < result <= 600:
        print(Fore.RED + "Turret: 250cm  -4  ^40 clicks")
    else:
        print(Fore.LIGHTYELLOW_EX + "Va te faire foutre")

    # End of program prompt
    while True:
        quit = input("Continuer y/n: ")

        if quit.lower() == "y":
            print("Appuyez sur la touche Lecture")
            break
        else:
            print(quit)

# Call the function to run the program
if __name__ == "__main__":
    sh()
    