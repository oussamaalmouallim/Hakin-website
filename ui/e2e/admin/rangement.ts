import { readFileSync } from 'node:fs'
import { FICHIER_COMPTE, psql } from './preparation'

/** Fin de suite : le compte jetable est supprimé, les pièces d'essai restantes sont retirées et la clé d'avant est remise. */
export default async function rangement() {
  const { email, suffixe, ancienneCle } = JSON.parse(readFileSync(FICHIER_COMPTE, 'utf8')) as { email: string; suffixe: string; ancienneCle: string }
  psql(`delete from auth.users where email = '${email}'`) // compte jetable : ses droits admin partent avec lui
  psql(`delete from public.produits where slug like 'veste-essai-e2e-${suffixe}%'`)
  psql(ancienneCle ? `update public.admin_cle set hash = '${ancienneCle}' where id = 1` : 'delete from public.admin_cle')
}
