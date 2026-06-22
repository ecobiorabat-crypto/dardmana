/**
 * Importe des clients depuis scripts/customers.csv.
 *
 * Colonnes (l'ordre n'importe pas, en-têtes insensibles à la casse/accents) :
 *   nom, telephone, email, ville, pays
 *   → obligatoires : nom et telephone. Optionnels : email, ville, pays (MA par défaut).
 *
 * - Clé d'unicité = TÉLÉPHONE (normalisé au format international +212…).
 *   Un téléphone déjà présent en base est ignoré (pas de doublon).
 * - Email absent/vide → laissé à null.
 * - Téléphone absent → ligne ignorée (log clair).
 * - Customer n'ayant pas de champ "ville", la ville (si fournie) est enregistrée
 *   dans une Address par défaut rattachée au client.
 *
 * Usage : npm run import-customers
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { config } from 'dotenv'

config({ path: '.env.local' })

const pool = new Pool({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const CSV_PATH = resolve(process.cwd(), 'scripts/customers.csv')

// ─── Mini parseur CSV (gère BOM, guillemets, délimiteur , ou ;) ────────────────

function normalizeHeader(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .replace(/[^a-z]/g, '')
}

const HEADER_ALIASES: Record<string, string> = {
  nom: 'nom', name: 'nom', nomcomplet: 'nom', fullname: 'nom', prenomnom: 'nom',
  email: 'email', mail: 'email', courriel: 'email', adresseemail: 'email', emails: 'email',
  telephone: 'telephone', tel: 'telephone', phone: 'telephone', mobile: 'telephone', gsm: 'telephone', numero: 'telephone',
  ville: 'ville', city: 'ville', localite: 'ville',
  pays: 'pays', country: 'pays',
}

function parseLine(line: string, delim: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ } else inQuotes = false
      } else cur += c
    } else if (c === '"') {
      inQuotes = true
    } else if (c === delim) {
      out.push(cur); cur = ''
    } else cur += c
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

function parseCsv(raw: string): Record<string, string>[] {
  const text = raw.replace(/^﻿/, '') // retire le BOM
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) return []

  // Détecte le délimiteur sur l'en-tête : ; (Excel FR) ou ,
  const headerLine = lines[0]
  const delim = headerLine.split(';').length > headerLine.split(',').length ? ';' : ','

  const cols = parseLine(headerLine, delim).map((h) => HEADER_ALIASES[normalizeHeader(h)] ?? normalizeHeader(h))

  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i], delim)
    const row: Record<string, string> = {}
    cols.forEach((c, idx) => { row[c] = values[idx] ?? '' })
    rows.push(row)
  }
  return rows
}

// ─── Import ────────────────────────────────────────────────────────────────────

/** Normalise un numéro marocain au format international (+212…). */
function normalizePhone(raw: string): string {
  const p = raw.replace(/[\s.\-()/]/g, '') // retire espaces, points, tirets, parenthèses, slashs
  if (!p) return ''
  if (p.startsWith('+')) return p // déjà international
  if (p.startsWith('00')) return '+' + p.slice(2) // 00212… → +212…
  if (p.startsWith('212')) return '+' + p // 212… → +212…
  if (p.startsWith('0')) return '+212' + p.slice(1) // 0612345678 → +212612345678
  return '+212' + p // numéro local sans 0 (ex : 612345678) → suppose MA
}

async function main() {
  let raw: string
  try {
    raw = readFileSync(CSV_PATH, 'utf8')
  } catch {
    console.error(`❌ Fichier introuvable : ${CSV_PATH}`)
    console.error('   Place ton fichier exporté à : scripts/customers.csv')
    process.exit(1)
  }

  const rows = parseCsv(raw)
  if (rows.length === 0) {
    console.error('❌ CSV vide ou sans lignes de données (vérifie l\'en-tête).')
    process.exit(1)
  }

  let created = 0
  let skipped = 0 // doublon : téléphone déjà en base
  let ignored = 0 // nom ou téléphone manquant
  let addresses = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const ligne = i + 2 // +2 : 1 pour l'en-tête, 1 pour l'index 0-based
    const nom = (r.nom ?? '').trim()
    const email = (r.email ?? '').toLowerCase().trim()
    const ville = (r.ville ?? '').trim()
    const pays = ((r.pays ?? '').trim().toUpperCase()) || 'MA'
    const phone = normalizePhone((r.telephone ?? '').trim())

    if (!nom) {
      console.log(`⏭️  Ignoré (nom manquant) : ligne ${ligne}`)
      ignored++
      continue
    }
    if (!phone) {
      console.log(`⏭️  Ignoré (téléphone manquant) : ${nom}`)
      ignored++
      continue
    }

    try {
      // Clé d'unicité = téléphone : un numéro déjà en base est ignoré (doublon).
      const existing = await prisma.customer.findUnique({ where: { phone }, select: { id: true } })
      if (existing) { skipped++; continue }

      const customer = await prisma.customer.create({
        data: {
          name: nom,
          phone,
          email: email || null, // email optionnel → null si absent
          country: pays,
        },
        select: { id: true },
      })
      created++

      // La ville n'existe pas sur Customer → on la stocke dans une adresse par défaut.
      if (ville) {
        await prisma.address.create({
          data: {
            customerId: customer.id,
            label: 'Importé',
            fullName: nom,
            phone,
            addressLine1: '(à compléter)',
            city: ville,
            country: pays,
            isDefault: true,
          },
        })
        addresses++
      }
    } catch (e) {
      errors.push(`Ligne ${ligne} (${nom}): ${(e as Error).message.slice(0, 90)}`)
    }
  }

  console.log('\n──────── Import terminé ────────')
  console.log(`✅ ${created} client(s) créé(s)`)
  console.log(`⏭️  ${skipped} ignoré(s) (téléphone déjà en base — doublon)`)
  if (ignored > 0) console.log(`⚠️  ${ignored} ligne(s) ignorée(s) (nom ou téléphone manquant)`)
  if (addresses > 0) console.log(`📍 ${addresses} adresse(s) créée(s) à partir de la ville`)
  if (errors.length > 0) {
    console.log(`❌ ${errors.length} ligne(s) en erreur :`)
    errors.slice(0, 20).forEach((d) => console.log('   - ' + d))
    if (errors.length > 20) console.log(`   … et ${errors.length - 20} de plus`)
  }
  console.log(`📊 ${rows.length} ligne(s) traitée(s) au total`)
}

main()
  .catch((e) => { console.error('❌ Erreur:', e.message); process.exit(1) })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
