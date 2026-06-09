import { tokenMatchesClient } from './auth.js';

describe('auth token client matching', () => {
  it('accepts audience array', () => {
    expect(tokenMatchesClient({ aud: ['account', 'studyflow-client'] }, 'studyflow-client')).toBe(true);
  });

  it('accepts Keycloak authorized party claim', () => {
    expect(tokenMatchesClient({ aud: 'account', azp: 'studyflow-client' }, 'studyflow-client')).toBe(true);
  });

  it('rejects another client', () => {
    expect(tokenMatchesClient({ aud: 'account', azp: 'other-client' }, 'studyflow-client')).toBe(false);
  });
});

