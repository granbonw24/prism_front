import { appHomeHref } from './app-home-url';

describe('appHomeHref', () => {
  let base: HTMLBaseElement;

  beforeEach(() => {
    base = document.querySelector('base') ?? document.head.appendChild(document.createElement('base'));
  });

  it('pointe vers /dcspa/ quand le base href staging est posé', () => {
    base.setAttribute('href', '/dcspa/');
    expect(appHomeHref()).toBe(new URL('/dcspa/', window.location.origin).href);
  });

  it('pointe vers la racine hôte en local (base /)', () => {
    base.setAttribute('href', '/');
    expect(appHomeHref()).toBe(new URL('/', window.location.origin).href);
  });
});
