/**
 * Load rifle, scope, and bullet catalogs from JSON. Used for search/autocomplete and profile resolution.
 */
import type { RifleCatalogItem, ScopeCatalogItem, BulletCatalogItem } from './ballistic';

import riflesJson from './rifles.json';
import scopesJson from './scopes.json';
import bulletsJson from './bullets.json';
import calibersJson from './calibers.json';

export const RIFLES: RifleCatalogItem[] = riflesJson as RifleCatalogItem[];
export const SCOPES: ScopeCatalogItem[] = scopesJson as ScopeCatalogItem[];
export const BULLETS: BulletCatalogItem[] = bulletsJson as BulletCatalogItem[];

export function getRifleById(id: string): RifleCatalogItem | undefined {
  return RIFLES.find((r) => r.id === id);
}

export function getScopeById(id: string): ScopeCatalogItem | undefined {
  return SCOPES.find((s) => s.id === id);
}

export function getBulletById(id: string): BulletCatalogItem | undefined {
  return BULLETS.find((b) => b.id === id);
}

export function getBulletsForCaliberKey(caliberKey: string): BulletCatalogItem[] {
  return BULLETS.filter((b) => b.caliberKey === caliberKey);
}

export function searchRifles(query: string, limit = 20): RifleCatalogItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return RIFLES.slice(0, limit);
  return RIFLES.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.caliber.toLowerCase().includes(q) ||
      r.caliberKey.toLowerCase().includes(q)
  ).slice(0, limit);
}

export function searchScopes(query: string, limit = 20): ScopeCatalogItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return SCOPES.slice(0, limit);
  return SCOPES.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      (s.magnificationRange && s.magnificationRange.toLowerCase().includes(q))
  ).slice(0, limit);
}

/** Search scopes filtered by unit (MIL or MOA). */
export function searchScopesForUnit(query: string, unit: 'MIL' | 'MOA', limit = 20): ScopeCatalogItem[] {
  const byUnit = SCOPES.filter((s) => s.unit === unit);
  const q = query.trim().toLowerCase();
  if (!q) return byUnit.slice(0, limit);
  return byUnit
    .filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.magnificationRange && s.magnificationRange.toLowerCase().includes(q))
    )
    .slice(0, limit);
}

export function searchBullets(query: string, caliberKey?: string, limit = 20): BulletCatalogItem[] {
  const base = caliberKey ? getBulletsForCaliberKey(caliberKey) : BULLETS;
  const q = query.trim().toLowerCase();
  if (!q) return base.slice(0, limit);
  return base
    .filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.caliber.toLowerCase().includes(q) ||
        b.caliberKey.toLowerCase().includes(q)
    )
    .slice(0, limit);
}

/** Caliber option for bullet type selector. */
export interface CaliberOption {
  caliberKey: string;
  caliber: string;
}

let uniqueCalibersCache: CaliberOption[] | null = null;

/** Comprehensive caliber list (from calibers.json). Merged with bullets catalog so any caliber in BULLETS not yet in the list is included. */
export function getUniqueCalibers(): CaliberOption[] {
  if (uniqueCalibersCache) return uniqueCalibersCache;
  const byKey = new Map<string, CaliberOption>();
  for (const c of calibersJson as CaliberOption[]) {
    byKey.set(c.caliberKey, c);
  }
  for (const b of BULLETS) {
    if (!byKey.has(b.caliberKey)) {
      byKey.set(b.caliberKey, { caliberKey: b.caliberKey, caliber: b.caliber });
    }
  }
  uniqueCalibersCache = Array.from(byKey.values()).sort((a, b) => a.caliber.localeCompare(b.caliber));
  return uniqueCalibersCache;
}

export function searchCalibers(query: string, limit = 20): CaliberOption[] {
  const all = getUniqueCalibers();
  const q = query.trim().toLowerCase();
  if (!q) return all.slice(0, limit);
  return all
    .filter(
      (c) =>
        c.caliber.toLowerCase().includes(q) ||
        c.caliberKey.toLowerCase().includes(q)
    )
    .slice(0, limit);
}
