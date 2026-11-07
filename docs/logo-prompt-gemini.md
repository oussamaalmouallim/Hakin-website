# Logo H MODE — prompt pour Gemini (décision D5, 03/11/2026)

> **Remplacé le 07/11/2026** : le logo de la marque est le monogramme du héros (H traversé d'une courbe, dégradé beige).
> Photo de profil Instagram et Facebook prête : `ui/medias/marque/logo-profil-1080.png` (`cd ui && npm run logo`).
> Ce prompt reste ici pour mémoire.

Usage : photo de profil Instagram et Facebook (affichée en rond), puis reprise sur le site.
Charte du site : `palette.md` (encre `#0a0a0a`, fond crème `#f5f4f0`, jaune `#f5d000`), monogramme actuel = pastille noire
ronde inclinée de -12° avec un « H » serif (Cormorant Garamond), nom en Archivo Black, sous-ligne mono « CASABLANCA ».

## Prompt principal (à coller tel quel dans Gemini)

```text
Design a minimalist luxury fashion logo for "H MODE", a menswear boutique in Casablanca, Morocco.
Style: premium streetwear meets Parisian couture, editorial, clean, confident. Flat vector look, no gradients, no 3D, no shadows, no mockup.

Composition: a perfect circle badge, solid jet black (#0A0A0A), tilted -12 degrees. Inside, centered, a single elegant high-contrast serif capital letter "H" (Didone / Cormorant Garamond style, thin hairlines and thick stems) in warm off-white cream (#F5F4F0). One small solid bright yellow dot (#F5D000) placed just after the H, like a full stop, as the only accent color.

Background: plain warm cream (#F5F4F0), square 1:1, 1080x1080 px. The badge fills about 70% of the canvas and stays fully inside a centered circle, so nothing is cut when Instagram and Facebook crop it to a round profile picture.

Strict rules: exactly the letter H, no other text, no slogan, no extra letters, no clothing, no hanger, no crown, no ornaments, no frame, no watermark. Crisp edges, perfectly centered, high resolution.
```

## Variante avec le nom (bannières, pas pour la photo de profil)

```text
Same logo system for "H MODE": on the left the black tilted circle badge with the cream serif "H" and the small yellow dot; on the right, the wordmark "H MODE" in a heavy geometric black sans-serif (Archivo Black style, uppercase, tight letter-spacing), and under it "CASABLANCA" in small uppercase monospace letters with wide letter-spacing, in mid grey (#6B6B6B). Plain cream background (#F5F4F0), wide 3:1 format, flat vector, no other text, no effects.
```

## Variante sombre (story, fond noir)

```text
Same badge, inverted: cream circle (#F5F4F0) with a black serif "H" and the small yellow dot (#F5D000), on a solid black background (#0A0A0A), square 1:1, 1080x1080, flat vector, no other text.
```

## Conseils

- Si Gemini écrit d'autres lettres, relancer en ajoutant : `The only character in the image is the letter H.`
- Demander plusieurs propositions et garder la plus simple : elle doit rester lisible à 110 px (taille du rond Instagram).
- Me renvoyer l'image retenue (PNG 1080×1080, ou mieux en SVG) : je la vectorise si besoin et je l'intègre au site (`Logotype`, favicon).
