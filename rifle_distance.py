import os
from colorama import init, Fore, Style

# Initialize colorama
init(autoreset=True)

def sd():
    """
    Function to measure distance using SFP scope calculations.
    It prompts the user for target height and mils, then calculates and displays results.
    """
    print(Fore.LIGHTYELLOW_EX + "📐 Mesurer la distance avec la portée SFP")
    print(Fore.LIGHTYELLOW_EX + "Zero a 100m, zommer a 10x")
    print(Fore.LIGHTYELLOW_EX + "Formule: hauteur(float)x 1000/mils = distance")

    print(Fore.WHITE + "-" * 45)
    print(Fore.CYAN + "Bon pour tuer le poir entre 90 et 320 kg.")
    print(Fore.WHITE + "-" * 45)

    print(Fore.WHITE + "Rifle:   Carbine Tikka cal.300 Win mag Laminated")
    print(Fore.WHITE + "Lunette: HAWKE SideWinder 30-4-16x50 10x1/2 mil dot+")
    print(Fore.WHITE + "Scope Height:\t     4.6cm")
    print(Fore.WHITE + "Barrel Length: \t     60cm")
    print(Fore.WHITE + "Twist:   \t     1.11")
    print(Fore.WHITE + "Rim diameters:   ".ljust(20), "13.3mm")
    print(Fore.WHITE + "Case length:     ".ljust(20), "67mm")
    print(Fore.WHITE + "Overall length:  ".ljust(20), "85mm")
    print(Fore.WHITE + "Bullet:          ".ljust(20), "7.62mm (.300)")
    print(Fore.WHITE + "Average speed:   ".ljust(20), "922 m/s")
    print(Fore.WHITE + "Recoil:          ".ljust(20), "2.39")
    print(Fore.WHITE + "Coefficient:     ".ljust(20), ".439 G1")

    print(Fore.WHITE + "-" * 45)
    print(Fore.CYAN + "Milliradian = 0.572 degrees or 6283 parts of a circle")
    print(Fore.WHITE + "-" * 45)

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
650m    300cm   -5       ^50 clicks
700m    370cm   -5.8     ^58 clicks
750m    460cm   -6.5     ^66 clicks
800m    540cm   -7.5     ^75 clicks
    """)
    print(Fore.WHITE + "-" * 45)
    print(Fore.CYAN + "(tal du Cerf 1m epaule/pied, 1.75 homme)")
    print(Fore.WHITE + "-" * 45)
    

    deer_height_on_scope = [10, 6, 4.8, 4, 3.3, 2.9, 2.5, 2.2, 2, 1.8, 1.68, 1.6, 1.4, 1.3, 1.25, 1.15, 1.1]
    man_height_on_scope = [16, 12.5, 8.3, 7, 6, 5, 4.3, 3.9, 3.5, 3.2, 2.9, 2.7, 2.5, 2.3, 2.2, 2.1, 2]
    distance_on_scope = [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900]

    for i, j, k in zip(deer_height_on_scope, man_height_on_scope, distance_on_scope):
        print(f"mildot:{i}(cerf)={k}\t{j}(homme)={k}m")
    print("-" * 45)

    mildots = [round(1 / d, 5) for d in distance_on_scope]
    cm = [0, 2.8, 9.5, 20, 35, 55, 80, 110, 150, 195, 250, 300, 370, 460, 540]

    print("10/1000=1mil(10mm at 100m)   Compensation")
    for i, j, k in zip(mildots, distance_on_scope, cm):
        print(f"mils: {i}\t{j} meters =  {k}cm")
    print(Fore.WHITE + "-" * 45)
    print(Fore.WHITE + """10x optics (100y/3.6 Inch, 100m/10cm)
200y  7.2  Inch	  200m	20cm
300y  10.8 Inch	  300m	30cm
400y  14.4 Inch	  400m	40cm
500y  18.0 Inch	  500m	50cm
600y  21.6 Inch	  600m	60cm
700y  25.2 Inch	  700m	70cm
800y  28.8 Inch	  800m	80cm
900y  32.4 Inch	  900m	90cm
1000y 36.0 Inch	  1000m	100cm/1m
    """)
    print(Fore.WHITE + "-" * 45)

    print(Fore.WHITE + """Comment calculer le mirage du vent
22 degrees angle environ 4  kph
45 degrees angle environ 8  kph 
90 degrees angle environ 16 kph""")
    print(Fore.WHITE + "-" * 45)

    print(Fore.CYAN + "Tableau moyenne de hauteur(magnification 10x)\nAjoutez deux zéros à la cible puis divisez le nombre de points de mil dans la lunette de fusil = distance(1,8 m = 1800mm / nombre de mils) \nHuman   1.65m  1.78m     \nCerf    1.10m  1.50m = 1m epaule/pied \nNiaoli  3.5m   5m \nCoco    0.20m  0.30m")

    height = float(input(Fore.LIGHTYELLOW_EX + "HAUTEUR DE CIBLE(mettre): "))
    mils = float(input(Fore.LIGHTYELLOW_EX + "TAPEZ EN MILS(réticule): "))

    distance = round(height * 1000 / mils, 2)
    result = round(distance, 3)

    if 150 <= result <= 170:
        print(Fore.LIGHTGREEN_EX + "Turrette: 2.8cm  -0.20  ^2 clicks")
    elif 171 < result <= 200:
        print(Fore.LIGHTGREEN_EX + "Turret: 9.5cm. -0.50  ^5 clicks")
    elif 201 < result <= 250:
        print(Fore.LIGHTGREEN_EX + "Turret: 20cm  -0.80  ^8 clicks")
    elif 251 < result <= 300:
        print(Fore.LIGHTGREEN_EX + "Turret: 35cm  -1.2  ^12 clicks ")
    elif 301 < result <= 350:
        print(Fore.LIGHTGREEN_EX + "Turret: 55cm  -1.6  ^16 clicks")
    elif 351 < result <= 400:
        print(Fore.LIGHTGREEN_EX + "Turret: 80cm  -2  ^20 clicks ")
    elif 401 < result <= 450:
        print(Fore.RED + "Turret: 110cm  -2.5  ^25 clicks")
    elif 451 < result <= 500:
        print(Fore.RED + "Turret: 150cm  -3  ^30 clicks")
    elif 501 < result <= 550:
        print(Fore.RED + "Turret: 195cm  -3.5  ^35  clicks")
    elif 551 < result <= 600:
        print(Fore.RED + "Turret: 250cm  -4  ^40 clicks")
    elif 601 < result <= 650:
        print(Fore.RED + "Turret: 300cm  -5  ^50 clicks")
    elif 651 < result <= 700:
        print(Fore.RED + "Turret: 370cm  -5.8  ^58 clicks")
    elif 701 < result <= 750:
        print(Fore.RED + "Turret: 460cm  -6.5  ^66 clicks")
    elif 751 < result <= 800:
        print(Fore.RED + "Turret: 540cm  -7.5  ^75 clicks")
    else:
        print(Fore.RED + "Cible trop loin")

    print(Fore.CYAN + f"\nLa distance est de {result}m \n")
    print(Fore.LIGHTGREEN_EX + f"Distance = {result}m")
    print(Fore.LIGHTGREEN_EX + f"Reticle  = {(round(result / 10, 2))}cm")
    print(f"Hauteur cible: {round(result / 10, 2)}cm = 1 mil dot, x {mils} mils = {height}m")
    print("1 mil = 0.00015915494309189535 du 6283 part d'une circle")
    print("1 click = 1/10 MRAD = 10mm au 100m")
    print("1/6283 x 17.8 = 1 degree")
    print(" " * 45)

    while True:
        quit = input("continue y/n: ")

        if quit.lower() == "y":
            # Clear the console screen
            os.system('cls' if os.name == 'nt' else 'clear')
            # Call the function again to "reload" it
            sd()
            break
        else:
            print("Exiting...")
            break

# Call the sd function
if __name__ == "__main__":
    sd()