import { useEffect, useId, useRef, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Logotype, useNotifier } from '@/design-system'
import { boutique, estPackshot, produits, srcImage } from '@/lib/catalogue'
import { formatDH } from '@/lib/format'
import { supabaseActif } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useSession } from '@/state/session'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MDP_MIN = 8
/** Retour après connexion : chemin interne seulement (jamais `//autre-site`). */
export const retourSur = (v: string | null) => (v && v.startsWith('/') && !v.startsWith('//') ? v : '/compte')

/** cloneme: C-26 — champ de la page d'authentification de la référence : libellé mono 10 px .2em gris, champ `px-4 py-3`
 *  rayon 10 px, filet fort puis encre au focus ; erreur = filet rouge + message mono 10 px .15em rouge en capitales. */
function ChampAuth({ label, erreur, motDePasse, ...p }: { label: string; erreur?: string; motDePasse?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const champ = (
    <input id={id} {...p} type={motDePasse ? (visible ? 'text' : 'password') : p.type}
      aria-invalid={erreur ? true : undefined} aria-describedby={erreur ? `${id}-e` : undefined}
      className={cn('w-full rounded-[10px] border bg-transparent px-4 py-3 text-[15px] text-encre outline-none transition-colors',
        motDePasse && 'pr-12', erreur ? 'border-danger' : 'border-ligne-forte focus:border-encre')} />
  )
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-gris">{label}</label>
      {motDePasse ? (
        <div className="relative">
          {champ}
          <button type="button" onClick={() => setVisible(v => !v)} aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={visible}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gris transition-colors hover:text-encre">
            {visible ? <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />}
          </button>
        </div>
      ) : champ}
      {erreur && <p id={`${id}-e`} className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-danger">{erreur}</p>}
    </div>
  )
}

/** Bouton principal de la référence : pleine largeur, encre, Archivo Black 13 px, grossit de 2 % au survol, 60 % pendant l'envoi. */
function BoutonEnvoi({ envoi, children }: { envoi: boolean; children: ReactNode }) {
  return (
    <button type="submit" disabled={envoi} aria-busy={envoi}
      className="flex w-full items-center justify-center gap-3 rounded-full bg-encre py-4 font-display text-[13px] uppercase tracking-[0.16em] text-fond transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100">
      {envoi && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}{children}
    </button>
  )
}

const caseLibelle = 'font-mono text-[11px] uppercase tracking-[0.16em] text-gris'
const lienDiscret = 'font-mono text-[11px] uppercase tracking-[0.16em] text-gris transition-colors hover:text-encre'

/** Message serveur (identifiants refusés, réseau…) : approximé, la référence n'en montre aucun sans compte. */
function Alerte({ ton = 'erreur', children }: { ton?: 'erreur' | 'info'; children: ReactNode }) {
  return (
    <div role={ton === 'erreur' ? 'alert' : 'status'} className={cn('rounded-[10px] border px-4 py-3 text-[14px] leading-[1.5]',
      ton === 'erreur' ? 'border-danger/40 bg-danger/[0.06] text-danger' : 'border-ligne-forte bg-fond-2 text-encre')}>{children}</div>
  )
}

type Vue = 'connexion' | 'inscription' | 'oubli' | 'verifier' | 'nouveau'

/** cloneme: P-04 — page d'authentification de la référence (`/auth`) : deux colonnes plein écran, formulaire à gauche (400 px),
 *  panneau noir à droite (masqué en mobile). Onglets Connexion / Inscription en pilule. Pas d'en-tête ni de pied de site. */
export function PageConnexion({ recuperation: routeRecuperation }: { recuperation?: boolean }) {
  const [sp] = useSearchParams()
  const naviguer = useNavigate()
  const { pathname } = useLocation()
  const notifier = useNotifier()
  const { utilisateur, pret, recuperation } = useSession()
  const session = useSession()
  const retour = retourSur(sp.get('retour'))
  const [vue, setVue] = useState<Vue>(routeRecuperation ? 'nouveau' : sp.get('mode') === 'inscription' ? 'inscription' : 'connexion')
  const [envoi, setEnvoi] = useState(false)
  const [alerte, setAlerte] = useState<{ texte: string; code?: string } | null>(null)
  const [info, setInfo] = useState<string | null>(sp.get('confirme') ? 'Adresse e-mail confirmée. Connectez-vous pour continuer.' : null)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [f, setF] = useState({ prenom: '', nom: '', email: '', motDePasse: '', confirmation: '', cgu: false, souvenir: true })
  const titre = useRef<HTMLHeadingElement>(null)

  useEffect(() => { setVue(routeRecuperation ? 'nouveau' : sp.get('mode') === 'inscription' ? 'inscription' : 'connexion') }, [routeRecuperation, sp])
  useEffect(() => { setAlerte(null); setErreurs({}) }, [vue])

  // Déjà connecté : on part vers la page demandée (sauf pendant le choix d'un nouveau mot de passe).
  if (utilisateur && !routeRecuperation && vue !== 'verifier') return <Navigate to={retour} replace />

  const maj = (k: keyof typeof f) => (e: { target: { value: string } }) => { setF(x => ({ ...x, [k]: e.target.value })); setErreurs(x => ({ ...x, [k]: '' })) }
  const changerVue = (v: Vue) => {
    setVue(v)
    if (v === 'connexion' || v === 'inscription') naviguer({ pathname: '/connexion', search: v === 'inscription' ? `?mode=inscription${sp.get('retour') ? `&retour=${encodeURIComponent(retour)}` : ''}` : (sp.get('retour') ? `?retour=${encodeURIComponent(retour)}` : '') }, { replace: true })
    window.setTimeout(() => titre.current?.focus(), 0)
  }
  const valider = (e: Record<string, string>) => {
    const reste = Object.fromEntries(Object.entries(e).filter(([, v]) => v))
    setErreurs(reste)
    if (Object.keys(reste).length) { window.setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0); return false }
    return true
  }
  const envoyer = (action: () => Promise<void>) => async (ev: FormEvent) => {
    ev.preventDefault()
    setAlerte(null)
    setEnvoi(true)
    try { await action() } finally { setEnvoi(false) }
  }

  const surConnexion = envoyer(async () => {
    if (!valider({ email: EMAIL.test(f.email.trim()) ? '' : 'Entrez un email valide', motDePasse: f.motDePasse ? '' : 'Requis' })) return
    const r = await session.connexion(f.email, f.motDePasse, f.souvenir)
    if (r.erreur) { setAlerte({ texte: r.erreur, code: r.code }); return }
    notifier({ ton: 'succes', message: 'Vous êtes connecté.' })
    naviguer(retour, { replace: true })
  })
  const surInscription = envoyer(async () => {
    if (!valider({
      prenom: f.prenom.trim() ? '' : 'Requis', nom: f.nom.trim() ? '' : 'Requis',
      email: EMAIL.test(f.email.trim()) ? '' : 'Entrez un email valide',
      motDePasse: f.motDePasse.length >= MDP_MIN ? '' : `Min ${MDP_MIN} caractères`,
      confirmation: f.confirmation === f.motDePasse ? '' : 'Les mots de passe ne correspondent pas',
      cgu: f.cgu ? '' : 'Acceptez les conditions pour continuer',
    })) return
    const r = await session.inscription(f)
    if (r.erreur) { setAlerte({ texte: r.erreur, code: r.code }); return }
    if (r.confirmationRequise) { setVue('verifier'); return }
    notifier({ ton: 'succes', message: 'Compte créé. Bienvenue chez H MODE.' })
    naviguer(retour, { replace: true })
  })
  const surOubli = envoyer(async () => {
    if (!valider({ email: EMAIL.test(f.email.trim()) ? '' : 'Entrez un email valide' })) return
    const r = await session.motDePasseOublie(f.email)
    if (r.erreur) { setAlerte({ texte: r.erreur, code: r.code }); return }
    setInfo(`Si un compte existe pour ${f.email.trim()}, un lien pour choisir un nouveau mot de passe vient de lui être envoyé.`)
    setVue('connexion')
  })
  const surNouveau = envoyer(async () => {
    if (!valider({
      motDePasse: f.motDePasse.length >= MDP_MIN ? '' : `Min ${MDP_MIN} caractères`,
      confirmation: f.confirmation === f.motDePasse ? '' : 'Les mots de passe ne correspondent pas',
    })) return
    const r = await session.nouveauMotDePasse(f.motDePasse)
    if (r.erreur) { setAlerte({ texte: r.erreur, code: r.code }); return }
    notifier({ ton: 'succes', message: 'Mot de passe modifié.' })
    naviguer('/compte', { replace: true })
  })
  const renvoyer = async () => {
    const r = await session.renvoyerConfirmation(f.email)
    if (r.erreur) setAlerte({ texte: r.erreur, code: r.code })
    else { setAlerte(null); setInfo(`E-mail de confirmation renvoyé à ${f.email.trim()}.`) }
  }

  const textes: Record<Vue, [string, string]> = {
    connexion: ['Bon retour', 'Connectez-vous pour retrouver vos commandes, vos adresses et votre panier.'],
    inscription: ['Créer un compte', 'Rejoignez H MODE : vos commandes, vos adresses et votre panier sur tous vos appareils.'],
    oubli: ['Mot de passe oublié', 'Indiquez votre adresse e-mail : nous vous envoyons un lien pour en choisir un nouveau.'],
    verifier: ['Vérifiez vos e-mails', `Un lien de confirmation a été envoyé à ${f.email.trim() || 'votre adresse'}. Ouvrez-le pour activer votre compte.`],
    nouveau: ['Nouveau mot de passe', 'Choisissez un nouveau mot de passe pour votre compte.'],
  }
  const lienValide = recuperation || Boolean(utilisateur)

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="flex flex-col items-center justify-center bg-fond px-6 py-12 md:px-16 md:py-16">
        <div className="w-full max-w-[400px]">
          <Link to="/" aria-label="H MODE — accueil" className="mb-10 flex w-fit"><Logotype /></Link>

          {(vue === 'connexion' || vue === 'inscription') && (
            <div role="tablist" aria-label="Compte" className="mb-8 inline-flex rounded-full bg-fond-2 p-1">
              {(['connexion', 'inscription'] as const).map(o => (
                <button key={o} type="button" role="tab" aria-selected={vue === o} onClick={() => changerVue(o)}
                  className={cn('rounded-full px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-all', vue === o ? 'bg-encre text-fond' : 'bg-transparent text-gris hover:text-encre')}>
                  {o === 'connexion' ? 'Connexion' : 'Inscription'}
                </button>
              ))}
            </div>
          )}

          <h1 ref={titre} tabIndex={-1} className="mb-2 font-display text-[32px] uppercase tracking-[-0.02em] outline-none">{textes[vue][0]}</h1>
          <p className="mb-8 text-[14px] text-gris">{textes[vue][1]}</p>

          <div className="flex flex-col gap-4">
            {!supabaseActif && <Alerte ton="info">Les comptes ne sont pas disponibles sur cette version du site. Vous pouvez commander sans compte.</Alerte>}
            {info && <Alerte ton="info">{info}</Alerte>}
            {alerte && (
              <Alerte>
                {alerte.texte}
                {alerte.code === 'email_not_confirmed' && <> <button type="button" onClick={renvoyer} className="underline underline-offset-4">Renvoyer l'e-mail</button></>}
                {alerte.code === 'user_already_exists' && <> <button type="button" onClick={() => changerVue('connexion')} className="underline underline-offset-4">Se connecter</button></>}
              </Alerte>
            )}

            {vue === 'connexion' && (
              <form noValidate onSubmit={surConnexion} aria-label="Connexion" className="flex flex-col gap-4">
                <ChampAuth label="Adresse email" type="email" autoComplete="email" value={f.email} onChange={maj('email')} erreur={erreurs.email} />
                <ChampAuth label="Mot de passe" motDePasse autoComplete="current-password" value={f.motDePasse} onChange={maj('motDePasse')} erreur={erreurs.motDePasse} />
                <div className="flex items-center justify-between gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={f.souvenir} onChange={() => setF(x => ({ ...x, souvenir: !x.souvenir }))} className="accent-encre" />
                    <span className={caseLibelle}>Se souvenir de moi</span>
                  </label>
                  <button type="button" onClick={() => changerVue('oubli')} className={lienDiscret}>Mot de passe oublié ?</button>
                </div>
                <BoutonEnvoi envoi={envoi}>{envoi ? 'Connexion…' : 'Connexion'}</BoutonEnvoi>
              </form>
            )}

            {vue === 'inscription' && (
              <form noValidate onSubmit={surInscription} aria-label="Inscription" className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <ChampAuth label="Prénom" autoComplete="given-name" value={f.prenom} onChange={maj('prenom')} erreur={erreurs.prenom} />
                  <ChampAuth label="Nom" autoComplete="family-name" value={f.nom} onChange={maj('nom')} erreur={erreurs.nom} />
                </div>
                <ChampAuth label="Adresse email" type="email" autoComplete="email" value={f.email} onChange={maj('email')} erreur={erreurs.email} />
                <ChampAuth label="Mot de passe" motDePasse autoComplete="new-password" value={f.motDePasse} onChange={maj('motDePasse')} erreur={erreurs.motDePasse} />
                <ChampAuth label="Confirmer le mot de passe" type="password" autoComplete="new-password" value={f.confirmation} onChange={maj('confirmation')} erreur={erreurs.confirmation} />
                <div>
                  <label className="flex cursor-pointer items-start gap-2">
                    <input type="checkbox" checked={f.cgu} onChange={() => { setF(x => ({ ...x, cgu: !x.cgu })); setErreurs(x => ({ ...x, cgu: '' })) }}
                      aria-invalid={erreurs.cgu ? true : undefined} className="mt-[2px] accent-encre" />
                    <span className={cn(caseLibelle, 'leading-[1.5] tracking-[0.14em]')}>
                      J'accepte les <Link to="/cgv" target="_blank" className="text-encre">conditions de vente</Link> et la <Link to="/confidentialite" target="_blank" className="text-encre">politique de confidentialité</Link>
                    </span>
                  </label>
                  {erreurs.cgu && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-danger">{erreurs.cgu}</p>}
                </div>
                <BoutonEnvoi envoi={envoi}>{envoi ? 'Création…' : 'Créer un compte'}</BoutonEnvoi>
              </form>
            )}

            {vue === 'oubli' && (
              <form noValidate onSubmit={surOubli} aria-label="Mot de passe oublié" className="flex flex-col gap-4">
                <ChampAuth label="Adresse email" type="email" autoComplete="email" value={f.email} onChange={maj('email')} erreur={erreurs.email} />
                <BoutonEnvoi envoi={envoi}>{envoi ? 'Envoi…' : 'Envoyer le lien'}</BoutonEnvoi>
                <button type="button" onClick={() => changerVue('connexion')} className={cn(lienDiscret, 'self-center')}>← Retour à la connexion</button>
              </form>
            )}

            {vue === 'verifier' && (
              <div className="flex flex-col gap-4">
                <button type="button" onClick={renvoyer} className="w-full rounded-full border border-ligne-forte py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-encre transition-colors hover:border-encre">Renvoyer l'e-mail</button>
                <button type="button" onClick={() => changerVue('connexion')} className={cn(lienDiscret, 'self-center')}>← Retour à la connexion</button>
              </div>
            )}

            {vue === 'nouveau' && (!pret ? <p className="text-gris">Vérification du lien…</p> : lienValide ? (
              <form noValidate onSubmit={surNouveau} aria-label="Nouveau mot de passe" className="flex flex-col gap-4">
                <ChampAuth label="Nouveau mot de passe" motDePasse autoComplete="new-password" value={f.motDePasse} onChange={maj('motDePasse')} erreur={erreurs.motDePasse} />
                <ChampAuth label="Confirmer le mot de passe" type="password" autoComplete="new-password" value={f.confirmation} onChange={maj('confirmation')} erreur={erreurs.confirmation} />
                <BoutonEnvoi envoi={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</BoutonEnvoi>
              </form>
            ) : (
              <>
                <Alerte>Ce lien a expiré ou a déjà servi. Demandez-en un nouveau.</Alerte>
                <button type="button" onClick={() => { naviguer('/connexion', { replace: true }); setVue('oubli') }} className="w-full rounded-full border border-ligne-forte py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-encre hover:border-encre">Recevoir un nouveau lien</button>
              </>
            ))}

            {pathname === '/connexion' && (vue === 'connexion' || vue === 'inscription') && (
              <Link to={retour === '/compte' ? '/' : retour} className={cn(lienDiscret, 'mt-2 self-center')}>Continuer sans compte →</Link>
            )}
          </div>
        </div>
      </div>
      <PanneauMembre />
    </div>
  )
}

/** cloneme: C-27 — panneau noir de la référence : filigrane défilant à 6 %, pastille jaune, titre clamp(40–64 px),
 *  carte translucide 20 px avec vignette 80 px, liste d'avantages à coches jaunes en deux colonnes.
 *  H MODE : uniquement des faits vrais (fonctions du compte, pièce réelle à la une, paiement de boutique.json). */
function PanneauMembre() {
  const piece = produits.find(p => p.misEnAvant && p.prixDH !== null) ?? produits.find(p => p.misEnAvant)
  const avantages = ['Commandes suivies', 'Panier synchronisé', 'Adresses enregistrées', 'Coordonnées pré-remplies']
  return (
    <div aria-hidden className="relative hidden flex-col justify-between overflow-hidden bg-encre p-16 text-fond md:flex">
      {/* cloneme: A-06 — filigrane qui défile */}
      <div className="pointer-events-none absolute inset-0 flex items-center overflow-hidden opacity-[0.06]">
        <div className="anim-filigrane whitespace-nowrap font-display text-[200px] leading-none tracking-[-0.04em]">H MODE · H MODE · H MODE · H MODE · H MODE · H MODE ·</div>
      </div>
      <div className="relative z-[1]">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-[6px] font-mono text-[10px] uppercase tracking-[0.2em] text-encre">
          <span className="h-2 w-2 rounded-full bg-encre" />Compte H MODE
        </span>
        <h2 className="mb-4 font-display text-[clamp(40px,5vw,64px)] uppercase leading-[0.9] tracking-[-0.02em]">Votre style,<br />vos commandes</h2>
        <p className="max-w-[360px] text-[15px] leading-[1.6] text-fond/60">Retrouvez vos commandes, vos adresses et votre panier sur tous vos appareils.</p>
      </div>
      {piece && (
        <div className="relative z-[1] flex items-center gap-5 rounded-[20px] bg-fond/[0.06] p-5">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-fond/[0.08]">
            <img src={srcImage(piece.images[0].src, 480)} alt="" className={cn('h-full w-full', estPackshot(piece) ? 'object-contain p-2' : 'object-cover')} />
          </div>
          <div className="min-w-0">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-fond/50">À la une · {piece.marque}</p>
            <p className="truncate font-display text-[18px] uppercase">{piece.nom}</p>
            <p className="mt-1 font-mono text-[11px] tracking-[0.12em] text-accent">{piece.prixDH !== null ? formatDH(piece.prixDH) : 'Prix sur demande'}</p>
          </div>
        </div>
      )}
      <div className="relative z-[1]">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-fond/50">Avec votre compte</p>
        <div className="grid grid-cols-2 gap-3">
          {avantages.map(a => <div key={a} className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-fond/70"><span className="text-accent">✓</span>{a}</div>)}
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-fond/40">{boutique.paiement} · {boutique.ville}</p>
      </div>
    </div>
  )
}
