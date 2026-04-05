import { Url } from '@models/url';

describe('Url', () => {
  it('should create an instance', () => {
    expect(Url.lienServer).toContain('http');
  });
});
