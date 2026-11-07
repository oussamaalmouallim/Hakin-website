import { readFileSync } from 'node:fs'
import { FICHIER_COMPTE, psql } from './preparation'

/** Fin de suite : le compte jetable perd ses droits et les pièces d'essai restantes sont retirées de la base locale. */
export default async function rangement() {
  const { email, suffixe } = JSON.parse(readFileSync(FICHIER_COMPTE, 'utf8')) as { email: string; suffixe: string }
  psql(`delete from public.admins where utilisateur in (select id from auth.users where email = '${email}')`)
  psql(`delete from public.produits where slug like 'veste-essai-e2e-${suffixe}%'`)
}
