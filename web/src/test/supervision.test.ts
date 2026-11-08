import { describe, expect, it } from 'vitest'
import { familleNavigateur, nettoyer } from '@/lib/supervision'

describe('supervision : rien de personnel ne part', () => {
  it('retire e-mails, numéros, jetons et paramètres d\'adresse', () => {
    expect(nettoyer('Échec pour sara@exemple.ma au +212 6 12 34 56 78 sur /produit/x?token=abc', 500))
      .toBe('Échec pour [e-mail] au [numéro] sur /produit/x')
    expect(nettoyer(`jwt ${'a'.repeat(40)} fin`, 500)).toBe('jwt [jeton] fin')
    expect(nettoyer('ab '.repeat(300), 500)).toHaveLength(500)
  })
  it('ne garde que la famille du navigateur et du système', () => {
    expect(familleNavigateur('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1')).toBe('Safari · iOS')
    expect(familleNavigateur('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36 Instagram 300.0')).toBe('Instagram · Android')
  })
})
