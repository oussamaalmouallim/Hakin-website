import { ClipboardList, DatabaseBackup, FileText, Gauge, HeartPulse, History, LayoutDashboard, MessageCircle, ScrollText, Settings, ShieldCheck, Shirt, type LucideIcon } from 'lucide-react'
import type { RoleAdmin } from './api'

/** Plan de l'administration : une entrée = une page indépendante, dans la barre latérale, le fil d'Ariane et la recherche.
 *  La supervision n'est montrée qu'au rôle « technique » ; la base refuse de toute façon ses données aux autres. */
export interface PageAdminNav { vers: string; libelle: string; Icone: LucideIcon; fin?: boolean; compteur?: 'commandes' | 'demandes'; motsCles?: string }
export interface GroupeAdminNav { titre: string; role?: RoleAdmin; pages: PageAdminNav[] }

export const GROUPES_ADMIN: GroupeAdminNav[] = [
  { titre: 'Pilotage', pages: [
    { vers: '/admin', libelle: 'Tableau de bord', Icone: LayoutDashboard, fin: true, motsCles: 'accueil résumé' },
    { vers: '/admin/journal', libelle: 'Journal', Icone: History, motsCles: 'historique modifications actions' },
  ] },
  { titre: 'Catalogue', pages: [
    { vers: '/admin/produits', libelle: 'Produits et prix', Icone: Shirt, motsCles: 'pièces tailles coloris photos stock' },
    { vers: '/admin/textes', libelle: 'Textes', Icone: FileText, motsCles: 'contenu pages' },
    { vers: '/admin/reglages', libelle: 'Réglages', Icone: Settings, motsCles: 'livraison whatsapp contact' },
  ] },
  { titre: 'Ventes', pages: [
    { vers: '/admin/commandes', libelle: 'Commandes', Icone: ClipboardList, compteur: 'commandes', motsCles: 'ventes clients' },
    { vers: '/admin/demandes', libelle: 'Demandes WhatsApp', Icone: MessageCircle, compteur: 'demandes', motsCles: 'messages' },
  ] },
  { titre: 'Supervision', role: 'technique', pages: [
    { vers: '/admin/supervision', libelle: 'Vue d\'ensemble', Icone: Gauge, fin: true, motsCles: 'supervision dashboard technique disponibilité' },
    { vers: '/admin/supervision/sante', libelle: 'Santé et disponibilité', Icone: HeartPulse, motsCles: 'health checks contrôles temps de réponse incidents' },
    { vers: '/admin/supervision/journaux', libelle: 'Journaux et incidents', Icone: ScrollText, motsCles: 'logs erreurs événements' },
    { vers: '/admin/supervision/securite', libelle: 'Sécurité et API', Icone: ShieldCheck, motsCles: 'limites 429 rate limiting blocages' },
    { vers: '/admin/supervision/maintenance', libelle: 'Maintenance et sauvegardes', Icone: DatabaseBackup, motsCles: 'backups restauration déploiements version' },
  ] },
]

export const groupesVisibles = (role: RoleAdmin) => GROUPES_ADMIN.filter(g => !g.role || g.role === role)

/** Page courante (la plus longue adresse qui correspond) et son groupe, pour le fil d'Ariane. */
export function pageCourante(chemin: string, role: RoleAdmin) {
  let meilleur: { groupe: GroupeAdminNav; page: PageAdminNav } | null = null
  for (const groupe of groupesVisibles(role)) for (const page of groupe.pages) {
    const ok = page.fin ? chemin === page.vers || chemin === `${page.vers}/` : chemin === page.vers || chemin.startsWith(`${page.vers}/`)
    if (ok && (!meilleur || page.vers.length > meilleur.page.vers.length)) meilleur = { groupe, page }
  }
  return meilleur
}
