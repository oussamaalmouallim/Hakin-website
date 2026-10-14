"""Arborescence des catégories et classification textuelle (titre, type, tags, fil d'Ariane).

Principe : on classe d'abord sur le TITRE du produit ; les champs secondaires (type, tags,
catégorie de la page) ne servent qu'en repli. En cas de doute hoodie / sweat, l'image va
dans 12_A_Verifier plutôt que d'être devinée.
"""
import re
import unicodedata

TREE = {
    "01_Jeans_Pantalons": ["Jeans_Slim_Straight_Regular", "Jeans_Baggy_Loose_Wide", "Jeans_Cargo_Vintage",
                           "Cargos_Chinos", "Joggers_Survetement", "Velours_Hiver"],
    "02_Hoodies": ["Kangourou_Classique", "Zippe_Demi_Zip", "Oversize_Baggy", "Uni_Minimaliste",
                   "Imprime_Graphique_Logo", "Fleece_Double_Hiver", "Non_Precise"],
    "03_Sweats_Sans_Capuche": ["Col_Rond", "Zippe_Demi_Zip_Quarter_Zip", "Col_Montant",
                               "Imprime_Graphique_Logo", "Fleece_Molleton_Epais"],
    "04_Pulls_Maille": [],
    "05_Vestes_Blousons": [],
    "06_Manteaux_Exterieur": [],
    "07_Chemises_Hauts": [],
    "08_Sneakers": ["Nike", "Adidas", "New_Balance", "Autres_References"],
    "09_Ensembles_Survetements": [],
    "10_Accessoires": [],
    "11_Looks_Complets": ["Streetwear", "Casual", "Superposition_Hiver"],
    "12_A_Verifier": [],
    "13_Rejets": [],
}


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9/+.]+", " ", s).strip()


def has(text: str, *patterns: str) -> bool:
    return any(re.search(r"(?<![a-z])" + p + r"(?![a-z])", text) for p in patterns)


# ---- détection de famille ---------------------------------------------------
OUT_OF_SCOPE = [r"short", r"bermuda", r"maillot de bain", r"pyjama", r"claquettes?", r"sandales?", r"tongs?",
                r"debardeur", r"t shirt", r"tee shirt", r"tshirt", r"boxers?", r"calecons?", r"slips?",
                r"filles?", r"garcons?", r"enfants?", r"kids?", r"bebes?", r"junior",
                r"chaussons?", r"mules?", r"robes?", r"jupes?", r"manches courtes", r"short sleeve",
                r"pack vest", r"gilet d hydratation"]
ACCESSORY = [r"bonnets?", r"casquettes?", r"echarpes?", r"gants?", r"sacs?", r"sacoches?", r"bananes?",
             r"sac a dos", r"ceintures?", r"chaussettes?", r"socks?", r"beanie", r"caps?", r"scarf", r"gloves?",
             r"backpack", r"cagoules?", r"tour de cou"]
SHOES = [r"sneakers?", r"baskets?", r"chaussures?", r"shoes?", r"trainers?", r"air force", r"air max", r"dunk",
         r"jordan [0-9]+", r"samba", r"gazelle", r"campus", r"superstar", r"stan smith", r"spezial", r"forum",
         r"[0-9]{3,4}r?", r"cortez", r"blazer", r"vomero", r"pegasus", r"p 6000", r"bondi", r"clifton",
         r"asics", r"gel", r"saucony", r"hoka", r"on cloud", r"bottines?", r"boots?"]
SET = [r"ensembles?", r"tracksuits?", r"deux pieces", r"2 pieces", r"co ord", r"survetement complet", r"set"]
COAT = [r"manteaux?", r"parkas?", r"trench", r"pardessus", r"caban", r"surchemises?", r"overshirt", r"coats?",
        r"duffle"]
JACKET = [r"vestes?", r"blousons?", r"bombers?", r"doudounes?", r"puffer", r"jackets?", r"coupe vent",
          r"windbreaker", r"windrunner", r"anorak", r"teddy", r"varsity", r"perfecto", r"parka"]
HOOD = [r"capuche", r"hoodies?", r"hooded", r"hoody", r"hdy", r"sweat a capuche", r"a capuche"]
# NB : « sweat-shirt » seul n'est PAS un indice fiable (DeFacto/Jumia l'emploie aussi pour des hoodies).
NO_HOOD = [r"sans capuche", r"1/4 de zip", r"quart de zip", r"1/2 zip", r"col rond", r"crew", r"crewneck", r"col montant",
           r"col camionneur", r"quarter zip", r"1/4 zip", r"1/2 zip", r"demi zip", r"half zip", r"mock neck",
           r"funnel"]
SWEAT = [r"sweats?", r"sweat shirt", r"sweatshirt", r"molleton", r"french terry", r"fleece", r"crew"]
KNIT = [r"pulls?", r"maille", r"tricot", r"cardigans?", r"gilets?", r"col roule", r"sweater", r"knit", r"jumper",
        r"torsade"]
SHIRT = [r"chemises?", r"flanelle", r"henley", r"polos?", r"manches longues", r"long sleeve", r"longsleeve",
         r"sous pull", r"shirt"]
BOTTOM = [r"jeans?", r"denim", r"cargos?", r"chinos?", r"joggers?", r"jogging", r"pantalons?", r"velours",
          r"corduroy", r"pants?", r"trousers", r"sweatpants?", r"bas de survetement"]


STRONG_BOTTOM = [r"pantalons?", r"jeans?", r"joggers?", r"cargos?", r"chinos?", r"sweatpants?", r"pants?",
                 r"trousers", r"bas de survetement", r"bas de jogging"]


def detect_brand(t: str) -> str:
    if has(t, r"nike", r"jordan", r"air force", r"air max", r"dunk"):
        return "Nike"
    if has(t, r"adidas", r"samba", r"gazelle", r"superstar", r"stan smith", r"spezial", r"campus"):
        return "Adidas"
    if has(t, r"new balance", r"nb"):
        return "New Balance"
    for b in ["puma", "asics", "hoka", "saucony", "reebok", "vans", "converse", "salomon", "kiabi", "defacto",
              "lacoste", "the north face", "levi s", "levis", "tommy hilfiger", "calvin klein", "on running",
              "alo", "timberland", "koton", "lc waikiki", "under armour", "fila", "umbro", "kappa", "jack jones",
              "hugo boss", "boss", "zara", "h m"]:
        if has(t, b):
            return b.title().replace("Levi S", "Levi's")
    return "inconnu"


def family(t: str) -> str | None:
    """Renvoie la catégorie principale détectée dans un texte normalisé, ou None."""
    if has(t, r"femmes?", r"women", r"wmns", r"woman") and not has(t, r"hommes?", r"men", r"unisexe?", r"mixte"):
        return "HORS_PERIMETRE"
    if has(t, *OUT_OF_SCOPE) and not has(t, *HOOD, *JACKET, *COAT, r"manches longues", r"long sleeve"):
        return "HORS_PERIMETRE"
    if has(t, *SET):
        return "09_Ensembles_Survetements"
    if has(t, *ACCESSORY):
        return "10_Accessoires"
    if has(t, r"sneakers?", r"baskets?", r"chaussures?", r"shoes?", r"trainers?"):
        return "08_Sneakers"
    if has(t, *COAT):
        return "06_Manteaux_Exterieur"
    if has(t, *JACKET) and not has(t, r"sweat", r"hoodie"):
        return "05_Vestes_Blousons"
    if has(t, r"chemises?"):
        return "07_Chemises_Hauts"
    if has(t, *STRONG_BOTTOM):
        return "01_Jeans_Pantalons"
    if has(t, *HOOD):
        return "02_Hoodies"
    if has(t, r"pull") and has(t, r"french terry", r"molleton", r"fleece"):
        return "03_Sweats_Sans_Capuche"   # "pull en molleton" = sweat, pas de la maille
    if has(t, *SWEAT):
        return "SWEAT_AMBIGU"
    if has(t, *KNIT):
        return "04_Pulls_Maille"
    if has(t, *SHIRT):
        return "07_Chemises_Hauts"
    if has(t, *BOTTOM):
        return "01_Jeans_Pantalons"
    if has(t, *SHOES):
        return "08_Sneakers"
    return None


# ---- attributs --------------------------------------------------------------
COLORS = {
    "noir": [r"noir", r"black", r"anthracite"], "blanc": [r"blanc", r"white", r"ivoire"],
    "ecru": [r"ecru", r"cream", r"creme", r"off white", r"sail"], "gris": [r"gris", r"grey", r"gray", r"chine", r"heather", r"smoke"],
    "beige": [r"beige", r"sable", r"sand", r"camel", r"taupe", r"khaki", r"kaki"], "marron": [r"marron", r"brown", r"chocolat", r"cognac"],
    "bleu_marine": [r"marine", r"navy"], "bleu": [r"bleu", r"blue", r"indigo", r"denim"], "vert": [r"vert", r"green", r"olive"],
    "bordeaux": [r"bordeaux", r"burgundy"], "rouge": [r"rouge", r"red"], "rose": [r"rose", r"pink"],
    "jaune": [r"jaune", r"yellow", r"moutarde"], "orange": [r"orange"], "violet": [r"violet", r"purple", r"mauve"],
    "multicolore": [r"multicolore", r"multi", r"multicolor"],
}
FITS = {"oversize": [r"oversize[d]?", r"ovz", r"boxy"], "baggy": [r"baggy"], "loose": [r"loose", r"large", r"ample"],
        "wide": [r"wide", r"wide leg"], "relaxed": [r"relaxed", r"decontracte"], "slim": [r"slim", r"ajuste"],
        "skinny": [r"skinny"], "straight": [r"straight", r"droit"], "regular": [r"regular", r"standard"],
        "cropped": [r"cropped", r"court"]}
MATERIALS = {"denim": [r"denim", r"jean"], "molleton": [r"molleton"], "french_terry": [r"french terry"],
             "fleece_polaire": [r"fleece", r"polaire", r"flc"], "sherpa": [r"sherpa", r"teddy"], "laine": [r"laine", r"wool"],
             "maille": [r"maille", r"tricot", r"knit"], "cuir": [r"cuir", r"leather"], "daim": [r"daim", r"suede", r"suedine"],
             "velours": [r"velours", r"corduroy"], "coton": [r"coton", r"cotton"], "nylon": [r"nylon", r"polyamide"],
             "mesh": [r"mesh", r"filet"], "flanelle": [r"flanelle", r"flannel"]}


def first_match(t: str, table: dict) -> str:
    for k, pats in table.items():
        if has(t, *pats):
            return k
    return "inconnu"


def neckline(t: str, cat: str) -> str:
    if cat == "02_Hoodies" or has(t, *HOOD):
        return "capuche"
    for k, pats in [("col_roule", [r"col roule", r"turtleneck"]), ("col_montant", [r"col montant", r"col camionneur", r"mock neck", r"funnel"]),
                    ("col_v", [r"col v", r"v neck"]), ("col_rond", [r"col rond", r"crew", r"crewneck"]),
                    ("col_chemise", [r"chemise", r"col classique"])]:
        if has(t, *pats):
            return k
    return "inconnu"


def closure(t: str, cat: str) -> str:
    if has(t, r"quarter zip", r"1/4 zip", r"1/4 de zip", r"quart de zip"):
        return "quarter_zip"
    if has(t, r"demi zip", r"half zip", r"1/2 zip"):
        return "demi_zip"
    if has(t, r"zip", r"zippe", r"zipped", r"full zip", r"fz", r"fermeture eclair"):
        return "zip_integral"
    if has(t, r"boutons?", r"button"):
        return "boutons"
    if cat == "08_Sneakers":
        return "lacets_ou_inconnu"
    return "inconnu"


def view_from(t: str) -> str:
    for k, pats in [("dos", [r"dos", r"back", r"arriere"]), ("profil", [r"profil", r"side", r"lateral"]),
                    ("semelle", [r"semelle", r"sole", r"outsole"]), ("dessus", [r"dessus", r"top view"]),
                    ("detail", [r"detail", r"zoom", r"close up"]), ("face", [r"face", r"front", r"avant"])]:
        if has(t, *pats):
            return k
    return "inconnu"


def subcategory(cat: str, t: str, brand: str) -> str:
    if cat == "01_Jeans_Pantalons":
        is_jean = has(t, r"jeans?", r"denim")
        if is_jean:
            if has(t, r"cargo"):
                return "Jeans_Cargo_Vintage"
            if has(t, r"baggy", r"loose", r"wide", r"large", r"oversize", r"ample", r"relaxed"):
                return "Jeans_Baggy_Loose_Wide"
            if has(t, r"vintage", r"dechire", r"destroy", r"ripped", r"delave", r"washed"):
                return "Jeans_Cargo_Vintage"
            return "Jeans_Slim_Straight_Regular"
        if has(t, r"velours", r"corduroy"):
            return "Velours_Hiver"
        if has(t, r"jogger", r"jogging", r"survetement", r"sweatpants?", r"molleton", r"fleece", r"track"):
            return "Joggers_Survetement"
        return "Cargos_Chinos"
    if cat == "02_Hoodies":
        if has(t, r"zip", r"zippe", r"fz", r"full zip", r"demi zip", r"half zip"):
            return "Zippe_Demi_Zip"
        if has(t, r"oversize[d]?", r"ovz", r"baggy", r"boxy"):
            return "Oversize_Baggy"
        if has(t, r"imprime", r"graphique", r"graphic", r"print", r"logo", r"inscription", r"brode", r"motif", r"gfx"):
            return "Imprime_Graphique_Logo"
        if has(t, r"fleece", r"flc", r"polaire", r"sherpa", r"double", r"epais", r"hiver", r"therma", r"gratte"):
            return "Fleece_Double_Hiver"
        if has(t, r"kangourou", r"kangaroo", r"pullover", r"po"):
            return "Kangourou_Classique"
        if has(t, r"uni", r"basique", r"basic", r"essential", r"minimal"):
            return "Uni_Minimaliste"
        return "Non_Precise"
    if cat == "03_Sweats_Sans_Capuche":
        if has(t, r"zip", r"zippe", r"quarter zip", r"demi zip", r"half zip", r"1/4 de zip"):
            return "Zippe_Demi_Zip_Quarter_Zip"
        if has(t, r"col montant", r"col camionneur", r"mock neck", r"funnel"):
            return "Col_Montant"
        if has(t, r"imprime", r"graphique", r"graphic", r"print", r"logo", r"inscription", r"brode", r"gfx"):
            return "Imprime_Graphique_Logo"
        if has(t, r"fleece", r"flc", r"polaire", r"epais", r"gratte", r"brushed", r"heavyweight"):
            return "Fleece_Molleton_Epais"
        return "Col_Rond"
    if cat == "08_Sneakers":
        return {"Nike": "Nike", "Adidas": "Adidas", "New Balance": "New_Balance"}.get(brand, "Autres_References")
    return ""


def classify(title: str, secondary: str = "", hint: tuple | None = None) -> dict:
    """title = titre (+ sous-titre) ; secondary = type, tags, catégorie de page.
    hint = (catégorie, sous-catégorie) imposée par la liste source si le texte ne dit rien."""
    t = norm(title)
    full = norm(title + " " + secondary)
    method = "page_source"
    note = ""
    cat = family(t)
    if cat is None:
        cat = family(norm(secondary))
        if cat:
            note = "catégorie déduite des champs secondaires (type/tags/rubrique)"
    if cat is None and hint and hint[0]:
        cat = hint[0]
        note = "catégorie déduite de la rubrique/requête source"
    status = "auto"
    if cat == "SWEAT_AMBIGU":
        if has(full, *NO_HOOD):
            cat = "03_Sweats_Sans_Capuche"
        elif hint and hint[0] in ("02_Hoodies", "03_Sweats_Sans_Capuche") and not has(t, r"sweat"):
            cat = hint[0]
        else:
            cat, status = "12_A_Verifier", "a_verifier"
            note = "sweat sans mention explicite de capuche ni de col : à vérifier visuellement"
    if cat in ("08_Sneakers",) and has(t, r"bottines?", r"boots?"):
        note = (note + " ; chaussure montante/boots").strip(" ;")
    brand = detect_brand(full)
    if cat is None:
        cat, status = "12_A_Verifier", "a_verifier"
        note = "aucune catégorie reconnue dans les textes source"
    if hint and hint[0] == cat and hint[1]:
        sub = hint[1]
    elif cat == "01_Jeans_Pantalons":
        sub = subcategory(cat, t, brand)  # le fil d'Ariane « Jeans » de Jumia contient aussi des joggers
    else:
        sub = subcategory(cat, full, brand)
    if note.startswith("catégorie déduite") and status == "auto":
        status = "a_verifier"
    return {
        "categorie": cat,
        "sous_categorie": sub or "",
        "marque": brand,
        "couleur": first_match(full, COLORS),
        "coupe": first_match(full, FITS),
        "matiere": first_match(full, MATERIALS),
        "col_capuche": neckline(full, cat),
        "fermeture": closure(full, cat),
        "methode_classification": method,
        "statut_verification": status,
        "notes_classification": note,
    }
