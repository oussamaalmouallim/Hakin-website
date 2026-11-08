/** Longueurs maximales acceptées par la base (supabase/migrations, contraintes `check`). Le formulaire les applique
 *  avant l'envoi : sinon la base refuse tout le lot et le client ne sait pas quel champ corriger. */
export const LONGUEURS = {
  nom: 120,
  telephone: 30,
  email: 254,
  libelle: 60,
  ville: 80,
  adresse: 300,
  instructions: 500,
} as const

export const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const tropLong = (valeur: string, champ: keyof typeof LONGUEURS) =>
  valeur.trim().length > LONGUEURS[champ] ? `${LONGUEURS[champ]} caractères au plus.` : undefined
