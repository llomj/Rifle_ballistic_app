import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface FlowViewProps {
  onBack: () => void;
}

const Section: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="mb-10">
    <h3 className="text-lg font-bold text-emerald-400 mb-3 pb-2 border-b border-emerald-500/30">{title}</h3>
    <div className="text-slate-300 text-sm leading-relaxed space-y-2">{children}</div>
  </div>
);

const Step: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <p><span className="text-amber-400 font-semibold">Step {n}:</span> <span className="text-slate-300">{children}</span></p>
);

const CodeBlock: React.FC<{ code: string }> = ({ code }) => (
  <SyntaxHighlighter
    language="python"
    style={oneDark}
    customStyle={{
      padding: '1rem',
      margin: '0.75rem 0',
      borderRadius: '0.75rem',
      background: 'rgba(15, 23, 42, 0.8)',
      fontSize: '0.8rem',
      lineHeight: '1.6',
      fontFamily: "'Fira Code', monospace"
    }}
    codeTagProps={{ style: { fontFamily: "'Fira Code', monospace" } }}
    PreTag="div"
  >
    {code.trim()}
  </SyntaxHighlighter>
);

const Key: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-cyan-400 font-medium">{children}</span>
);

export const FlowView: React.FC<FlowViewProps> = ({ onBack }) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  return (
    <div className="relative min-h-[600px] animate-in slide-in-from-left duration-500 pb-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <i className="fas fa-diagram-project text-emerald-400"></i>
          {isFr ? 'Flux et indentation' : 'Flow & Indentation'}
        </h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors"
        >
          {isFr ? 'Retour' : 'Back'}
        </button>
      </div>

      <div className="glass rounded-2xl p-6 border border-white/5 overflow-x-auto max-h-[70vh] overflow-y-auto">
        <p className="text-slate-400 text-sm mb-6">
          {isFr
            ? "Python utilise l'indentation pour définir les blocs de code. Pas d'accolades — les espaces et tabulations montrent ce qui appartient à quoi. Ce guide vous explique étape par étape comment le flux d'exécution et l'indentation fonctionnent."
            : "Python uses indentation to define blocks of code. No curly braces — spaces and tabs show what belongs where. This guide walks you step-by-step through how execution flow and indentation work."}
        </p>

        <Section title={isFr ? '1. RÈGLES D\'INDENTATION' : '1. INDENTATION RULES'}>
          <Step n={1}>{isFr ? "Utilisez 4 espaces par niveau (style Python standard). Chaque niveau d'imbrication ajoute 4 espaces." : "Use 4 spaces per level (standard Python style). Each nesting level adds 4 spaces."}</Step>
          <Step n={2}>{isFr ? "Tout ce qui est dans un bloc est indenté d'un niveau de plus que l'en-tête du bloc (if, for, else, etc.)." : "Everything inside a block is indented one level more than the block header (if, for, else, etc.)."}</Step>
          <Step n={3}>{isFr ? "La première ligne moins indentée termine le bloc. Python détecte la fin du bloc par le retour à une colonne précédente." : "The first line that is less indented ends the block. Python detects the end of a block by the return to a previous column."}</Step>
          <p className="text-slate-500 uppercase text-xs font-semibold mt-3">{isFr ? 'Exemple' : 'Example'}</p>
          <CodeBlock code={`if x > 0:
    print("positive")   # inside if block
    print("still")      # still inside
print("done")           # outside if — back to left`} />
        </Section>

        <Section title={isFr ? '2. BOUCLES FOR — FLUX DÉTAILLÉ' : '2. FOR LOOPS — DETAILED FLOW'}>
          <Step n={1}>{isFr ? "Python évalue l'en-tête de la boucle : for item in sequence. Il prépare l'itérateur." : "Python evaluates the loop header: for item in sequence. It prepares the iterator."}</Step>
          <Step n={2}>{isFr ? "Il prend le premier élément, l'assigne à l variable de boucle, puis exécute tout le corps de la boucle." : "It takes the first item, assigns it to the loop variable, then runs the entire loop body."}</Step>
          <Step n={3}>{isFr ? "Quand le corps finit, il prend l'élément suivant et répète." : "When the body finishes, it takes the next item and repeats."}</Step>
          <Step n={4}>{isFr ? "Répète jusqu'à ce qu'il n'y ait plus d'éléments. La boucle se termine alors." : "Repeats until no items are left. The loop then ends."}</Step>
          <p className="text-cyan-400 font-medium mt-2">{isFr ? "Ordre : toujours l'intérieur d'abord, puis l'extérieur." : "Order: always inner first, then outer."}</p>
          <CodeBlock code={`for i in range(2):
    for j in range(2):
        print(i, j)   # inner runs fully for each outer step

# Output: 0 0, 0 1, 1 0, 1 1
# First: outer i=0, inner j=0,1
# Then:  outer i=1, inner j=0,1`} />
        </Section>

        <Section title={isFr ? '3. BOUCLES WHILE — FLUX DÉTAILLÉ' : '3. WHILE LOOPS — DETAILED FLOW'}>
          <Step n={1}>{isFr ? "Vérifier la condition. Si elle est True, continuer." : "Check the condition. If it is True, continue."}</Step>
          <Step n={2}>{isFr ? "Exécuter tout le corps de la boucle." : "Run the entire loop body."}</Step>
          <Step n={3}>{isFr ? "Revenir à l'étape 1 et revérifier la condition." : "Go back to step 1 and re-check the condition."}</Step>
          <Step n={4}>{isFr ? "Si la condition est False, arrêter immédiatement. Sortir de la boucle." : "If the condition is False, stop immediately. Exit the loop."}</Step>
          <p className="text-cyan-400 font-medium mt-2">{isFr ? "Ordre : condition → corps → condition → corps → ..." : "Order: condition → body → condition → body → ..."}</p>
          <CodeBlock code={`n = 0
while n < 3:
    print(n)
    n += 1

# Flow: n=0 → True → print 0 → n=1
#       n=1 → True → print 1 → n=2
#       n=2 → True → print 2 → n=3
#       n=3 → False → stop`} />
        </Section>

        <Section title={isFr ? '4. RETURN vs PRINT — DIFFÉRENCE CRUCIALE' : '4. RETURN vs PRINT — CRITICAL DIFFERENCE'}>
          <p><Key>return</Key> {isFr ? "renvoie une valeur à l'appelant et termine la fonction immédiatement. Rien après return n'est exécuté." : "sends a value back to the caller and ends the function immediately. Nothing after return runs."}</p>
          <p><Key>print</Key> {isFr ? "affiche du texte à l'écran. Ne renvoie PAS de valeur. La fonction continue après print." : "displays text to the screen. Does NOT send a value back. The function continues after print."}</p>
          <Step n={1}>{isFr ? "return quitte la fonction et transmet une valeur." : "return exits the function and passes a value."}</Step>
          <Step n={2}>{isFr ? "print affiche seulement ; rien n'est renvoyé. Si vous assignez print(...) à une variable, vous obtenez None." : "print only displays; nothing is returned. If you assign print(...) to a variable, you get None."}</Step>
          <CodeBlock code={`def add(a, b):
    return a + b

def show(a, b):
    print(a + b)

x = add(2, 3)   # x gets 5
y = show(2, 3)  # prints 5, but y is None`} />
        </Section>

        <Section title={isFr ? '5. VARIABLES GLOBALES vs LOCALES' : '5. GLOBAL vs LOCAL VARIABLES'}>
          <Step n={1}>{isFr ? "Les variables définies dans une fonction sont LOCALES — visibles seulement dans cette fonction. Elles n'affectent pas l'extérieur." : "Variables defined inside a function are LOCAL — only visible inside that function. They do not affect the outside."}</Step>
          <Step n={2}>{isFr ? "Les variables définies au niveau du script (top-level) sont GLOBALES — visibles partout." : "Variables defined at the top level of the script are GLOBAL — visible everywhere."}</Step>
          <Step n={3}>{isFr ? "Pour modifier une globale dans une fonction, utilisez la déclaration global x avant de l'assigner." : "To change a global inside a function, use the global x declaration before assigning to it."}</Step>
          <p className="text-cyan-400 font-medium mt-2">{isFr ? "Ordre de recherche : Python cherche d'abord dans le scope local, puis dans les scopes englobants, puis global." : "Lookup order: Python looks first in the local scope, then in enclosing scopes, then global."}</p>
          <CodeBlock code={`x = 10

def f():
    x = 5    # local x, does not change global
    return x

def g():
    global x
    x = 5    # changes global x

print(f())   # 5
print(x)     # 10 (unchanged)
g()
print(x)     # 5 (changed)`} />
        </Section>

        <Section title={isFr ? '6. CLOSURES — FONCTIONS IMBRIQUÉES' : '6. CLOSURES — INNER FUNCTIONS'}>
          <Step n={1}>{isFr ? "Une fonction peut définir une autre fonction à l'intérieur. La fonction interne est créée au moment de l'exécution." : "A function can define another function inside it. The inner function is created when the outer runs."}</Step>
          <Step n={2}>{isFr ? "La fonction interne peut « se souvenir » des variables de l'externe. Elle les capture dans son environnement." : "The inner function can \"remember\" variables from the outer. It captures them in its environment."}</Step>
          <Step n={3}>{isFr ? "Quand vous appelez la fonction interne plus tard, elle utilise encore ces variables. C'est une closure." : "When you call the inner function later, it still uses those variables. That is a closure."}</Step>
          <p className="text-cyan-400 font-medium mt-2">{isFr ? "Ordre : l'externe s'exécute d'abord → l'interne est créée mais pas exécutée → quand vous appelez l'interne, elle utilise les variables de l'externe." : "Order: outer runs first → inner is created but not run → when you call inner, it uses the outer's variables."}</p>
          <CodeBlock code={`def make_counter():
    count = 0

    def step():
        nonlocal count
        count += 1
        return count

    return step

c = make_counter()
print(c())   # 1
print(c())   # 2
# step "closes over" count — remembers it between calls`} />
        </Section>

        <Section title={isFr ? '7. FLUX OOP — ORDRE D\'EXÉCUTION' : '7. OOP WORKFLOW — ORDER OF EXECUTION'}>
          <Step n={1}>{isFr ? "La définition de la classe s'exécute — les méthodes sont définies et attachées à la classe." : "The class definition runs — methods are defined and attached to the class."}</Step>
          <Step n={2}>{isFr ? "objet = MaClasse() — __new__ s'exécute d'abord, puis __init__. __init__ initialise l'instance." : "object = MyClass() — __new__ runs first, then __init__. __init__ initializes the instance."}</Step>
          <Step n={3}>{isFr ? "objet.methode() — Python cherche la méthode dans la hiérarchie des classes (MRO)." : "object.method() — Python looks up the method in the class hierarchy (MRO)."}</Step>
          <Step n={4}>{isFr ? "self désigne l'instance courante. Les méthodes utilisent self pour accéder aux attributs." : "self refers to the current instance. Methods use self to access attributes."}</Step>
          <p className="text-cyan-400 font-medium mt-2">{isFr ? "Ordre : attributs d'instance d'abord (self.x), puis attributs de classe." : "Order: instance attributes first (self.x), then class attributes."}</p>
          <CodeBlock code={`class Dog:
    species = "Canis"   # class attribute

    def __init__(self, name):
        self.name = name   # instance attribute

    def bark(self):
        print(self.name, "says woof")

d = Dog("Rex")
d.bark()   # Rex says woof

# Flow: 1) Dog class defined
#       2) Dog("Rex") → __init__ runs
#       3) self.name = "Rex"
#       4) d.bark() → looks up bark in Dog
#       5) bark uses self.name`} />
        </Section>

        <Section title={isFr ? '8. BLOCS IMBRIQUÉS — INTÉRIEUR PUIS EXTÉRIEUR' : '8. NESTED BLOCKS — INNER THEN OUTER'}>
          <p className="text-amber-400 font-semibold">{isFr ? "Règle : Toujours exécuter le bloc le plus interne d'abord. Quand il finit, passer au niveau suivant." : "Rule: Always execute the innermost block first. When it finishes, move to the next outer level."}</p>
          <CodeBlock code={`for i in range(2):
    if i == 0:
        for j in range(2):
            print(i, j)   # innermost: runs first
    print("outer")       # outer: runs after inner block

# Step 1: i=0
# Step 2: if True → inner for runs (j=0, j=1)
# Step 3: print "outer"
# Step 4: i=1
# Step 5: if False → skip inner
# Step 6: print "outer"`} />
        </Section>

        <Section title={isFr ? 'RÉSUMÉ' : 'SUMMARY'}>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>{isFr ? "L'indentation définit les blocs — pas d'accolades." : "Indentation defines blocks — no braces."}</li>
            <li>{isFr ? "Boucles : intérieur d'abord, puis extérieur." : "Loops: inner first, then outer."}</li>
            <li>{isFr ? "return vs print : return donne une valeur ; print affiche seulement." : "return vs print: return gives a value; print only displays."}</li>
            <li>{isFr ? "Global vs local : le scope compte ; utilisez global pour modifier les globales." : "Global vs local: scope matters; use global to modify globals."}</li>
            <li>{isFr ? "Closures : les fonctions internes se souviennent des variables externes." : "Closures: inner functions remember outer variables."}</li>
            <li>{isFr ? "OOP : __init__ → attributs d'instance → méthodes utilisent self." : "OOP: __init__ → instance attributes → methods use self."}</li>
          </ul>
        </Section>
      </div>
    </div>
  );
};
