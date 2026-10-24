import { describe, it, expect } from 'vitest';
import { I18nEngine } from '../packages/i18n/core.ts';

describe('I18nEngine Core', () => {
  it('correctly translates keys with parameters', () => {
    const engine = new I18nEngine({
      defaultLanguage: 'it',
      supportedLanguages: ['it', 'en'],
    });

    engine.register('it', {
      greeting: 'Ciao, {name}!',
      metrics: {
        latency: 'Tempo di risposta: {ms}ms',
      },
    });

    expect(engine.t('greeting', { name: 'Mario' })).toBe('Ciao, Mario!');
    expect(engine.t('metrics.latency', { ms: 42 })).toBe('Tempo di risposta: 42ms');
  });

  it('falls back to default language when a key is missing in target language', () => {
    const engine = new I18nEngine({
      defaultLanguage: 'it',
      fallbackLanguage: 'it',
      supportedLanguages: ['it', 'en'],
    });

    engine.register('it', {
      onlyInItalian: 'Disponibile in italiano',
    });

    engine.register('en', {
      common: 'Hello',
    });

    engine.setLanguage('en');
    expect(engine.t('common')).toBe('Hello');
    expect(engine.t('onlyInItalian')).toBe('Disponibile in italiano');
  });

  it('audits and detects missing translations across registered languages', () => {
    const engine = new I18nEngine({
      defaultLanguage: 'it',
      supportedLanguages: ['it', 'en'],
    });

    engine.register('it', {
      app: {
        title: 'Titolo',
        desc: 'Descrizione',
      },
    });

    engine.register('en', {
      app: {
        title: 'Title',
        // missing 'desc'
      },
    });

    const report = engine.findMissing('it');
    expect(report.en).toContain('app.desc');

    const audit = engine.audit('it');
    expect(audit.isFullyTranslated).toBe(false);
    expect(audit.totalKeys).toBe(2);
  });
});
