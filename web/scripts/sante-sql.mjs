// Pose le jeton du robot de surveillance (GitHub Actions → workflow « Surveillance »), lu dans web/.env :
//   SANTE_JETON=…   une longue chaîne aléatoire, la même que le secret GitHub SANTE_JETON
// Sans préfixe VITE_ : jamais dans le site. Le script n'affiche que le SQL avec l'empreinte bcrypt du jeton.
// Usage : cd web && npm run sante:sql      puis coller le résultat dans le SQL Editor de Supabase.
import bcrypt from 'bcryptjs'

const jeton = (process.env.SANTE_JETON ?? '').trim()
if (Object.keys(process.env).some(k => k.startsWith('VITE_') && /SANTE|JETON/i.test(k))) {
  console.error('✗ Une variable VITE_ contient le jeton : elle partirait dans le site. Retirez le préfixe VITE_.'); process.exit(1)
}
if (jeton.length < 24) {
  console.error('✗ SANTE_JETON absent ou trop court dans web/.env (24 caractères au moins, ex. : openssl rand -hex 24).'); process.exit(1)
}
console.log(`-- H MODE : jeton du robot de surveillance (empreinte seulement). À coller dans le SQL Editor, après les migrations.
insert into public.robot_jeton (id, hash) values (1, '${bcrypt.hashSync(jeton, bcrypt.genSaltSync(10))}')
on conflict (id) do update set hash = excluded.hash, maj_le = now();`)
