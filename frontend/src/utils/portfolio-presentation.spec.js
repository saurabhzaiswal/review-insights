import { describe, expect, it } from 'vitest'
import { portfolioBrand } from '../config/portfolio-brand.js'
import { presentProperty, presentReview, publicPropertyName } from './portfolio-presentation.js'

describe('portfolio presentation', () => {
  it('contains the independent creator identity in one central config', () => {
    expect(portfolioBrand.productName).toBe('Hospitality Review Intelligence')
    expect(portfolioBrand.creatorName).toBe('Saurabh Choudhary')
    expect(portfolioBrand.disclaimer).toContain('backend database')
    expect(portfolioBrand.disclaimer).toContain('not affiliated')
  })

  it.each([
    ['Central Sydney', 'Harbour Central Hotel'],
    ['Darling Harbour', 'Marina View Suites'],
    ['Potts Point', 'City Point Lodge'],
    ['Surry Hills', 'Hillside Boutique Hotel'],
    ['Olympic Hotel Paddington', 'Parkside Urban Stay'],
  ])('maps %s to portfolio property %s', (source, expected) => {
    expect(publicPropertyName({ name: source })).toBe(expected)
  })

  it('never exposes an unknown API property name', () => {
    const presented = presentProperty({ id: 'unknown-1', name: 'Original Property Name' })
    expect(presented.name).not.toBe('Original Property Name')
    expect(presented.publicLocation).toBe('Portfolio property')
  })

  it('preserves backend review data while applying the property alias', () => {
    const source = {
      id: 'review-1',
      sentiment: 'negative',
      rating: 5.5,
      reviewDate: '2026-07-20',
      reviewerName: 'Seeded Guest',
      reviewerCountry: 'Australia',
      reviewText: 'The stored backend review text',
      property: { name: 'Surry Hills' },
      topics: [{ key: 'noise', displayName: 'Noise' }],
    }
    const presented = presentReview(source)

    expect(presented.rating).toBe(source.rating)
    expect(presented.reviewDate).toBe(source.reviewDate)
    expect(presented.reviewerName).toBe(source.reviewerName)
    expect(presented.reviewerCountry).toBe(source.reviewerCountry)
    expect(presented.reviewText).toBe(source.reviewText)
    expect(presented.topics).toEqual(source.topics)
    expect(presented.property.name).toBe('Hillside Boutique Hotel')
  })
})
