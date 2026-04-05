import { Ministere } from '@models/ministere';

describe('Ministere', () => {
  it("accepte un objet conforme a l'API", () => {
    const m: Ministere = {
      id: 1,
      libelleMinistere: 'MENAPLN',
    };
    expect(m.id).toBe(1);
    expect(m.libelleMinistere).toBe('MENAPLN');
  });
});
