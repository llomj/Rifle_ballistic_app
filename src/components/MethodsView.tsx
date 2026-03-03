import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface MethodsViewProps {
  onBack: () => void;
}

const CHEAT_SHEET_EN = `# ----------------- Strings -----------------
str.capitalize()       # Capitalize first character
str.casefold()         # Lowercase for caseless comparison
str.center(w)          # Center in width
str.count(sub)         # Count occurrences
str.encode()           # Encode to bytes
str.endswith(s)        # Ends with?
str.expandtabs(n)      # Expand tabs
str.find(s)            # Find substring
str.format(...)        # Format string
str.format_map(d)      # Format using dict
str.index(s)           # Index of substring
str.isalnum()          # Alphanumeric?
str.isalpha()          # Alphabetic?
str.isascii()          # ASCII?
str.isdecimal()        # Decimal?
str.isdigit()          # Digit?
str.isidentifier()     # Valid identifier?
str.islower()          # Lowercase?
str.isnumeric()        # Numeric?
str.isprintable()      # Printable?
str.isspace()          # Whitespace?
str.istitle()          # Titlecase?
str.isupper()          # Uppercase?
str.join(iter)        # Join iterable
str.ljust(w)           # Left justify
str.lower()            # Lowercase
str.lstrip()           # Strip left
str.partition(s)       # Split into 3 parts
str.replace(a,b)       # Replace substring
str.rfind(s)           # Last occurrence
str.rindex(s)          # Last index
str.rjust(w)           # Right justify
str.rpartition(s)      # Split from right
str.rsplit(s)          # Split from right
str.rstrip()           # Strip right
str.split(s)           # Split string
str.splitlines()       # Split lines
str.startswith(p)      # Starts with prefix?
str.strip()            # Strip both ends
str.swapcase()         # Swap case
str.title()            # Titlecase
str.translate(t)       # Translate chars
str.upper()            # Uppercase
str.zfill(w)           # Zero pad left

# ----------------- Lists -----------------
list.append(x)         # Add element
list.extend(it)        # Add multiple
list.insert(i,x)       # Insert at index
list.remove(x)         # Remove element
list.pop(i=-1)         # Remove and return
list.clear()           # Clear list
list.index(x)          # Index of element
list.count(x)          # Count occurrences
list.sort(key=None, reverse=False) # Sort list
list.reverse()        # Reverse list
list.copy()            # Shallow copy

# ----------------- Dictionaries -----------------
dict.clear()             # Remove all items
dict.copy()              # Shallow copy
dict.fromkeys(seq,val)   # Create dict from keys
dict.get(k,default=None) # Get value, default if missing
dict.items()             # Return (key,value)
dict.keys()              # Keys view
dict.values()            # Values view
dict.pop(k,default=None) # Remove key
dict.popitem()           # Remove last (key,value)
dict.setdefault(k,v=None)# Get or set default
dict.update(other)       # Update dict

# ----------------- Tuples -----------------
tuple.count(x)           # Count occurrences
tuple.index(x)          # Index of element

# ----------------- Sets -----------------
set.add(e)                     # Add element
set.clear()                    # Clear set
set.copy()                     # Shallow copy
set.difference(*o)             # Return difference
set.difference_update(*o)      # Remove differences
set.discard(e)                 # Remove if present
set.intersection(*o)           # Intersection
set.intersection_update(*o)    # Keep intersection
set.isdisjoint(o)              # No elements in common?
set.issubset(o)                # Is subset?
set.issuperset(o)              # Is superset?
set.pop()                      # Remove arbitrary
set.remove(e)                  # Remove element
set.symmetric_difference(o)    # Elements in either, not both
set.symmetric_difference_update(o)# Update to symmetric difference
set.union(*o)                  # Union of sets
set.update(*o)                 # Add elements

# ----------------- Frozenset -----------------
# Same as set, but immutable (no add/remove/update)

# ----------------- Bytes & Bytearray -----------------
# capitalize, casefold, decode, endswith, find, hex, isalnum, isalpha
# isdigit, join, replace, split, startswith, strip, upper, lower
# bytearray: append(), extend(), insert(), pop(), remove(), clear()

# ----------------- Range -----------------
# range(start, stop, step) - Iterable
# len(range), range[i], range.index(val), range.count(val)

# ----------------- Numbers -----------------
# int, float, complex: abs(), as_integer_ratio(), bit_length()
# conjugate(), from_bytes(), to_bytes()
# float: is_integer(), hex(), fromhex()
# complex: real, imag, conjugate()

# ----------------- File objects -----------------
# read(), readline(), readlines(), write(), writelines()
# close(), flush(), seek(), tell()

# ----------------- Classes -----------------
# __init__(), __new__(), __str__(), __repr__()
# __class__, __dict__, __mro__, __bases__`;

const CHEAT_SHEET_FR = `# ----------------- Chaînes -----------------
str.capitalize()       # Première lettre en majuscule
str.casefold()         # Minuscules pour comparaison sans casse
str.center(w)          # Centrer dans une largeur
str.count(sub)         # Compter les occurrences
str.encode()           # Encoder en bytes
str.endswith(s)        # Se termine par ?
str.expandtabs(n)      # Développer les tabulations
str.find(s)            # Trouver la sous-chaîne
str.format(...)        # Formater la chaîne
str.format_map(d)      # Formater avec un dict
str.index(s)           # Index de la sous-chaîne
str.isalnum()          # Alphanumérique ?
str.isalpha()          # Alphabétique ?
str.isascii()          # ASCII ?
str.isdecimal()        # Décimal ?
str.isdigit()          # Chiffre ?
str.isidentifier()     # Identifiant valide ?
str.islower()          # Minuscules ?
str.isnumeric()        # Numérique ?
str.isprintable()      # Imprimable ?
str.isspace()          # Espace blanc ?
str.istitle()          # Titre ?
str.isupper()          # Majuscules ?
str.join(iter)         # Joindre l'itérable
str.ljust(w)           # Justifier à gauche
str.lower()            # Minuscules
str.lstrip()           # Supprimer à gauche
str.partition(s)       # Diviser en 3 parties
str.replace(a,b)       # Remplacer la sous-chaîne
str.rfind(s)           # Dernière occurrence
str.rindex(s)          # Dernier index
str.rjust(w)           # Justifier à droite
str.rpartition(s)      # Diviser depuis la droite
str.rsplit(s)          # Diviser depuis la droite
str.rstrip()           # Supprimer à droite
str.split(s)           # Diviser la chaîne
str.splitlines()       # Diviser les lignes
str.startswith(p)      # Commence par le préfixe ?
str.strip()            # Supprimer les deux extrémités
str.swapcase()         # Inverser la casse
str.title()            # Titre
str.translate(t)       # Traduire les caractères
str.upper()            # Majuscules
str.zfill(w)           # Remplissage à zéro à gauche

# ----------------- Listes -----------------
list.append(x)         # Ajouter un élément
list.extend(it)        # Ajouter plusieurs
list.insert(i,x)       # Insérer à l'index
list.remove(x)         # Supprimer l'élément
list.pop(i=-1)         # Supprimer et retourner
list.clear()           # Vider la liste
list.index(x)          # Index de l'élément
list.count(x)          # Compter les occurrences
list.sort(key=None, reverse=False) # Trier la liste
list.reverse()        # Inverser la liste
list.copy()            # Copie superficielle

# ----------------- Dictionnaires -----------------
dict.clear()             # Supprimer tous les éléments
dict.copy()              # Copie superficielle
dict.fromkeys(seq,val)   # Créer dict à partir des clés
dict.get(k,default=None) # Obtenir valeur, défaut si manquant
dict.items()             # Retourner (clé,valeur)
dict.keys()              # Vue des clés
dict.values()            # Vue des valeurs
dict.pop(k,default=None) # Supprimer la clé
dict.popitem()           # Supprimer le dernier (clé,valeur)
dict.setdefault(k,v=None)# Obtenir ou définir défaut
dict.update(other)       # Mettre à jour le dict

# ----------------- Tuples -----------------
tuple.count(x)           # Compter les occurrences
tuple.index(x)           # Index de l'élément

# ----------------- Ensembles -----------------
set.add(e)                     # Ajouter un élément
set.clear()                    # Vider l'ensemble
set.copy()                     # Copie superficielle
set.difference(*o)             # Retourner la différence
set.difference_update(*o)      # Supprimer les différences
set.discard(e)                 # Supprimer si présent
set.intersection(*o)           # Intersection
set.intersection_update(*o)    # Garder l'intersection
set.isdisjoint(o)              # Aucun élément en commun ?
set.issubset(o)                # Est un sous-ensemble ?
set.issuperset(o)              # Est un sur-ensemble ?
set.pop()                      # Supprimer arbitrairement
set.remove(e)                  # Supprimer l'élément
set.symmetric_difference(o)   # Éléments dans l'un ou l'autre, pas les deux
set.symmetric_difference_update(o)# Mettre à jour la différence symétrique
set.union(*o)                  # Union des ensembles
set.update(*o)                 # Ajouter des éléments

# ----------------- Frozenset -----------------
# Comme set, mais immuable (pas add/remove/update)

# ----------------- Bytes & Bytearray -----------------
# capitalize, casefold, decode, endswith, find, hex, isalnum, isalpha
# isdigit, join, replace, split, startswith, strip, upper, lower
# bytearray: append(), extend(), insert(), pop(), remove(), clear()

# ----------------- Range -----------------
# range(start, stop, step) - Itérable
# len(range), range[i], range.index(val), range.count(val)

# ----------------- Nombres -----------------
# int, float, complex: abs(), as_integer_ratio(), bit_length()
# conjugate(), from_bytes(), to_bytes()
# float: is_integer(), hex(), fromhex()
# complex: real, imag, conjugate()

# ----------------- Objets fichier -----------------
# read(), readline(), readlines(), write(), writelines()
# close(), flush(), seek(), tell()

# ----------------- Classes -----------------
# __init__(), __new__(), __str__(), __repr__()
# __class__, __dict__, __mro__, __bases__`;

export const MethodsView: React.FC<MethodsViewProps> = ({ onBack }) => {
  const { language } = useLanguage();
  const content = language === 'fr' ? CHEAT_SHEET_FR : CHEAT_SHEET_EN;

  return (
    <div className="relative min-h-[600px] animate-in slide-in-from-left duration-500 pb-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <i className="fas fa-code text-indigo-400"></i>
          {language === 'fr' ? 'Méthodes intégrées' : 'Built-in Methods'}
        </h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors"
        >
          {language === 'fr' ? 'Retour' : 'Back'}
        </button>
      </div>

      <div className="glass rounded-2xl p-6 border border-white/5 overflow-x-auto">
        <pre className="code-font text-xs sm:text-sm text-indigo-300 leading-relaxed whitespace-pre">
          <code>{content}</code>
        </pre>
      </div>
    </div>
  );
};
