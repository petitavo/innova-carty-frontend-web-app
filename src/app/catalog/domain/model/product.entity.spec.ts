import { allowedRange } from './product.entity';

describe('allowedRange (US13)', () => {
  it('returns the weight range accepted for a product', () => {
    // Same example as the mock-up: chicken breast 1,010 g with 6% tolerance.
    expect(allowedRange(1010, 6)).toEqual({ min: 949, max: 1071 });
  });

  it('collapses to the nominal weight when tolerance is 0', () => {
    expect(allowedRange(500, 0)).toEqual({ min: 500, max: 500 });
  });
});
