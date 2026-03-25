# streetfightercocos2d

Remake simple de Street Fighter avec Cocos2d-JS.

Le projet se lance dans un navigateur via la page `index.html`, mais il est preferable d'utiliser un petit serveur HTTP local plutot que d'ouvrir le fichier directement.

## Prerequis

- Python 3 installe
- Un navigateur moderne

## Demarrage rapide

Depuis la racine du projet, lance un serveur HTTP Python:

### Windows PowerShell

```powershell
py -m http.server 8000
```

Si `py` n'est pas disponible:

```powershell
python -m http.server 8000
```

### macOS / Linux

```bash
python3 -m http.server 8000
```

Ensuite ouvre cette URL dans le navigateur:

```text
http://localhost:8000/
```

## Installation

Clone le depot:

```bash
git clone https://github.com/ian75013/streetfightercocos2d.git
cd streetfightercocos2d
```

Le moteur Cocos2d-JS est deja present dans `frameworks/cocos2d-html5`, donc il n'y a pas d'etape supplementaire necessaire pour un lancement local simple.

## Comment le projet demarre

- `index.html` charge `frameworks/cocos2d-html5/CCBoot.js`
- `main.js` initialise le jeu
- `project.json` declare les scripts sources a charger
- la scene principale est lancee apres le preload des ressources

## Arborescence utile

- `index.html` : point d'entree web
- `main.js` : bootstrap Cocos2d-JS
- `project.json` : configuration du projet
- `src/` : logique du jeu
- `res/` : sprites, textures et ressources
- `frameworks/cocos2d-html5/` : moteur Cocos2d-JS

## Pourquoi utiliser un serveur HTTP local

Ouvrir directement `index.html` avec le navigateur peut provoquer des problemes de chargement de scripts, de fichiers JSON, de spritesheets ou de ressources selon les restrictions locales du navigateur.

Le serveur HTTP Python evite ces problemes et reproduit un fonctionnement plus proche d'un vrai environnement web.

## Depannage

### Le port 8000 est deja utilise

Lance un autre port:

```powershell
py -m http.server 8080
```

Puis ouvre:

```text
http://localhost:8080/
```

### La commande Python n'est pas reconnue

Teste l'une de ces commandes:

```powershell
py --version
python --version
```

Si aucune ne fonctionne, il faut installer Python et l'ajouter au PATH.

## Etat du projet

Le projet est une base Cocos2d-JS orientee prototype. Le README a ete mis a jour pour permettre un lancement local rapide et reproductible.