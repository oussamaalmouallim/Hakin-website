// Prépare les deux lignes SQL qui nomment l'admin et posent sa clé de sécurité, à coller dans le SQL Editor de Supabase.
// Lit dans ui/.env (variables SANS préfixe VITE_ : Vite ne les met jamais dans le site) :
//   ADMIN_EMAIL=…            e-mail du compte admin (créé dans Supabase : Authentication → Users → Add user)
//   ADMIN_CLE=123456789012   clé de 12 chiffres, choisie par vous
// La clé n'est jamais affichée : seule son empreinte bcrypt (coût 12) sort du script.
// Usage : cd ui && npm run admin:sql
import bcrypt from 'bcryptjs'

const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase()
const cle = (process.env.ADMIN_CLE ?? '').trim()
const fuite = Object.keys(process.env).filter(k => k.startsWith('VITE_') && /ADMIN|CLE/i.test(k))

const erreurs = []
if (fuite.length) erreurs.push(`${fuite.join(', ')} : une variable VITE_ part dans le site, publique. Retirez le préfixe VITE_.`)
if (!/^[^\s@']+@[^\s@']+\.[^\s@']+$/.test(email)) erreurs.push('ADMIN_EMAIL absent ou invalide dans ui/.env.')
if (!/^\d{12}$/.test(cle)) erreurs.push('ADMIN_CLE doit faire exactement 12 chiffres dans ui/.env.')
else if (/^(\d)\1{11}$/.test(cle) || '01234567890123456789'.includes(cle) || '98765432109876543210'.includes(cle)) erreurs.push('ADMIN_CLE trop simple (chiffres répétés ou qui se suivent).')
if (erreurs.length) {
  console.error(erreurs.map(e => `✗ ${e}`).join('\n'))
  process.exit(1)
}

const empreinte = bcrypt.hashSync(cle, bcrypt.genSaltSync(12))
console.log(`-- H MODE : admin ${email} et clé de sécurité (empreinte seulement). À coller dans le SQL Editor, après lot-21-admin-cle.sql.
insert into public.admins (utilisateur) select id from auth.users where email = '${email}' on conflict do nothing;
insert into public.admin_cle (id, hash) values (1, '${empreinte}') on conflict (id) do update set hash = excluded.hash, maj_le = now();
-- Vérification : doit renvoyer une ligne.
select email from auth.users u join public.admins a on a.utilisateur = u.id where email = '${email}';`)
