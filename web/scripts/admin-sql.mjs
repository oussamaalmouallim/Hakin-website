// Crée (ou met à jour) le compte admin et sa clé de sécurité, à partir de trois lignes de web/.env :
//   ADMIN_EMAIL=…              e-mail de connexion à /admin
//   ADMIN_MOT_DE_PASSE=…       mot de passe
//   ADMIN_CLE=…                clé de sécurité, au format de votre choix
//   ADMIN_ROLE=…               facultatif : « technique » (par défaut, tout l'admin + supervision) ou « commerce »
//                              (catalogue, commandes, demandes ; pas de supervision). La clé est commune à tous les admins.
// Variables SANS préfixe VITE_ : Vite ne les met jamais dans le site.
// Le script affiche le SQL à coller dans le SQL Editor de Supabase. Mot de passe et clé n'en sortent qu'en empreinte bcrypt :
// ni le SQL, ni la base, ni le site ne les contiennent en clair.
// Usage : cd web && npm run admin:sql      (relancer après tout changement des trois lignes)
import bcrypt from 'bcryptjs'

const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase()
const motDePasse = process.env.ADMIN_MOT_DE_PASSE ?? ''
const cle = (process.env.ADMIN_CLE ?? '').trim()
const role = (process.env.ADMIN_ROLE ?? 'technique').trim().toLowerCase()
const fuite = Object.keys(process.env).filter(k => k.startsWith('VITE_') && /ADMIN|CLE|MOT_DE_PASSE/i.test(k))

const erreurs = []
if (fuite.length) erreurs.push(`${fuite.join(', ')} : une variable VITE_ part dans le site, publique. Retirez le préfixe VITE_.`)
if (!/^[^\s@']+@[^\s@']+\.[^\s@']+$/.test(email)) erreurs.push('ADMIN_EMAIL absent ou invalide dans web/.env.')
if (!motDePasse) erreurs.push('ADMIN_MOT_DE_PASSE absent dans web/.env.')
if (!cle) erreurs.push('ADMIN_CLE absente dans web/.env.')
if (!['technique', 'commerce'].includes(role)) erreurs.push('ADMIN_ROLE doit valoir « technique » ou « commerce ».')
if (erreurs.length) {
  console.error(erreurs.map(e => `✗ ${e}`).join('\n'))
  process.exit(1)
}

function sqlAdmin(email, empreinteMdp, empreinteCle) {
  return `-- H MODE : compte admin ${email} (rôle ${role}) et clé de sécurité (empreintes seulement). À coller dans le SQL Editor, après les migrations.
do $admin$
declare uid uuid;
begin
  select id into uid from auth.users where email = '${email}';
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', '${email}', '${empreinteMdp}', now(),
      '{"provider":"email","providers":["email"]}', '{"nom":"Administration H MODE"}', now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', '${email}', 'email_verified', true), 'email', now(), now(), now());
  else
    update auth.users set encrypted_password = '${empreinteMdp}', email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now() where id = uid;
  end if;
  insert into public.admins (utilisateur, role) values (uid, '${role}') on conflict (utilisateur) do update set role = excluded.role;
  insert into public.admin_cle (id, hash) values (1, '${empreinteCle}') on conflict (id) do update set hash = excluded.hash, maj_le = now();
end $admin$;
-- Vérification : doit renvoyer une ligne.
select u.email, a.role from auth.users u join public.admins a on a.utilisateur = u.id where u.email = '${email}';`
}

console.log(sqlAdmin(email, bcrypt.hashSync(motDePasse, bcrypt.genSaltSync(10)), bcrypt.hashSync(cle, bcrypt.genSaltSync(12))))
