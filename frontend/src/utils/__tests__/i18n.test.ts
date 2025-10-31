import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectBrowserLanguage, getTranslations, t, SupportedLanguage } from '../i18n';

describe('i18n', () => {
  let originalLanguage: string;

  beforeEach(() => {
    originalLanguage = globalThis.navigator.language;
  });

  afterEach(() => {
    Object.defineProperty(globalThis.navigator, 'language', {
      value: originalLanguage,
      configurable: true
    });
  });

  describe('detectBrowserLanguage', () => {
    it('should detect Italian language', () => {
      Object.defineProperty(globalThis.navigator, 'language', {
        value: 'it-IT',
        configurable: true
      });
      expect(detectBrowserLanguage()).toBe('it');
    });

    it('should detect English language', () => {
      Object.defineProperty(globalThis.navigator, 'language', {
        value: 'en-US',
        configurable: true
      });
      expect(detectBrowserLanguage()).toBe('en');
    });

    it('should detect Spanish language', () => {
      Object.defineProperty(globalThis.navigator, 'language', {
        value: 'es-ES',
        configurable: true
      });
      expect(detectBrowserLanguage()).toBe('es');
    });

    it('should detect French language', () => {
      Object.defineProperty(globalThis.navigator, 'language', {
        value: 'fr-FR',
        configurable: true
      });
      expect(detectBrowserLanguage()).toBe('fr');
    });

    it('should detect German language', () => {
      Object.defineProperty(globalThis.navigator, 'language', {
        value: 'de-DE',
        configurable: true
      });
      expect(detectBrowserLanguage()).toBe('de');
    });

    it('should default to English for unsupported languages', () => {
      Object.defineProperty(globalThis.navigator, 'language', {
        value: 'ja-JP',
        configurable: true
      });
      expect(detectBrowserLanguage()).toBe('en');
    });
  });

  describe('getTranslations', () => {
    it('should return English translations', () => {
      const translations = getTranslations('en');
      expect(translations.errors.llm_unavailable).toContain('temporarily unavailable');
    });

    it('should return Italian translations', () => {
      const translations = getTranslations('it');
      expect(translations.errors.llm_unavailable).toContain('temporaneamente non disponibile');
    });

    it('should return Spanish translations', () => {
      const translations = getTranslations('es');
      expect(translations.errors.llm_unavailable).toContain('temporalmente');
    });

    it('should return French translations', () => {
      const translations = getTranslations('fr');
      expect(translations.errors.llm_unavailable).toContain('temporairement');
    });

    it('should return German translations', () => {
      const translations = getTranslations('de');
      expect(translations.errors.llm_unavailable).toContain('vorübergehend');
    });
  });

  describe('t function', () => {
    it('should translate error messages in English', () => {
      const message = t('errors.llm_unavailable', 'en');
      expect(message).toContain('temporarily unavailable');
    });

    it('should translate error messages in Italian', () => {
      const message = t('errors.llm_unavailable', 'it');
      expect(message).toContain('temporaneamente');
    });

    it('should translate nested keys', () => {
      const message = t('chat.thinking', 'en');
      expect(message).toContain('thinking');
    });

    it('should return key if translation not found', () => {
      const message = t('nonexistent.key', 'en');
      expect(message).toBe('nonexistent.key');
    });

    it('should handle multiple levels of nesting', () => {
      const message = t('errors.network_error', 'en');
      expect(message).toContain('Network error');
    });
  });

  describe('LLM Error Messages', () => {
    const languages: SupportedLanguage[] = ['en', 'it', 'es', 'fr', 'de'];

    languages.forEach(lang => {
      it(`should have LLM unavailable message in ${lang}`, () => {
        const message = t('errors.llm_unavailable', lang);
        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(0);
      });

      it(`should have LLM unavailable on create message in ${lang}`, () => {
        const message = t('errors.llm_unavailable_on_create', lang);
        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(0);
      });

      it(`should have failed to send message in ${lang}`, () => {
        const message = t('errors.failed_to_send', lang);
        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(0);
      });

      it(`should have network error message in ${lang}`, () => {
        const message = t('errors.network_error', lang);
        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Chat UI Messages', () => {
    const languages: SupportedLanguage[] = ['en', 'it', 'es', 'fr', 'de'];

    languages.forEach(lang => {
      it(`should have thinking message in ${lang}`, () => {
        const message = t('chat.thinking', lang);
        expect(message).toBeTruthy();
      });

      it(`should have type message placeholder in ${lang}`, () => {
        const message = t('chat.type_message', lang);
        expect(message).toBeTruthy();
      });

      it(`should have new chat label in ${lang}`, () => {
        const message = t('chat.new_chat', lang);
        expect(message).toBeTruthy();
      });
    });
  });
});

