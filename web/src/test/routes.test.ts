import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** Les routes de l'application doivent être connues de l'hébergement (Netlify : public/_redirects ; Docker : nginx.conf),
 *  sinon la page répond 404 alors qu'elle existe. Ce test casse dès qu'une route est ajoutée d'un seul côté. */
const app = readFileSync('src/App.tsx', 'utf8')
const premiers = [...new Set([...app.matchAll(/<Route path="\/([^/"*:]+)/g)].map(m => m[1]))].sort()
const redirects = readFileSync('public/_redirects', 'utf8')
const nginx = readFileSync('../infra/docker/nginx.conf', 'utf8')
const routesNginx = (nginx.match(/location ~ \^\/\(([^)]+)\)/)?.[1] ?? '').split('|')

describe('routes : application ↔ hébergement', () => {
  it('chaque route de l\'application est servie en 200 par Netlify', () => {
    expect(premiers.length).toBeGreaterThan(15)
    for (const r of premiers) expect(redirects, `/${r} absente de public/_redirects`).toMatch(new RegExp(`^/${r}(/\\*)?\\s+/index\\.html\\s+200$`, 'm'))
  })
  it('chaque route de l\'application est servie en 200 par nginx (Docker)', () => {
    for (const r of premiers.filter(r => r !== 'admin')) expect(routesNginx, `/${r} absente de nginx.conf`).toContain(r)
    expect(nginx).toMatch(/location \^~ \/admin/)
  })
  it('adresse inconnue : vrai statut 404, en dernier', () => {
    expect(redirects.trim().split('\n').at(-1)).toMatch(/^\/\*\s+\/index\.html\s+404$/)
    expect(nginx).toMatch(/error_page 404 \/index\.html;/)
  })
})
