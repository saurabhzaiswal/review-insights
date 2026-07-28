import { portfolioPropertyNames } from '../config/portfolio-brand.js'

const PROPERTY_NAME_MAP = new Map([
  ['central sydney', 'Harbour Central Hotel'],
  ['darling harbour', 'Marina View Suites'],
  ['potts point', 'City Point Lodge'],
  ['surry hills', 'Hillside Boutique Hotel'],
  ['olympic hotel paddington', 'Parkside Urban Stay'],
])

function stableIndex(value, length) {
  const text = String(value ?? 'property')
  let hash = 0
  for (const character of text) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return hash % length
}

export function publicPropertyName(property, fallbackIndex = 0) {
  if (!property) return 'Portfolio Property'
  const originalName = String(property.name ?? '').trim()
  const mapped = PROPERTY_NAME_MAP.get(originalName.toLowerCase())
  if (mapped) return mapped

  const identifier = property.id ?? property.slug ?? originalName ?? fallbackIndex
  return portfolioPropertyNames[stableIndex(identifier, portfolioPropertyNames.length)]
}

export function presentProperty(property, fallbackIndex = 0) {
  if (!property || typeof property !== 'object') return property
  return {
    ...property,
    name: publicPropertyName(property, fallbackIndex),
    publicLocation: 'Portfolio property',
  }
}

export function presentReview(review, fallbackIndex = 0) {
  if (!review || typeof review !== 'object') return review
  return {
    ...review,
    property: presentProperty(review.property, fallbackIndex),
  }
}

export function presentScraperRun(run, fallbackIndex = 0) {
  if (!run || typeof run !== 'object') return run
  return {
    ...run,
    property: presentProperty(run.property, fallbackIndex),
  }
}

export function presentScraperStatus(status) {
  if (!status || typeof status !== 'object') return status
  return {
    ...status,
    properties: (status.properties ?? []).map((item, index) => ({
      ...item,
      property: presentProperty(item.property, index),
    })),
  }
}
