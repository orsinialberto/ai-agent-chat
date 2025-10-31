/**
 * Simple i18n system for error messages and UI text
 * Detects browser language and provides translations
 */

export type SupportedLanguage = 'en' | 'it' | 'es' | 'fr' | 'de';

export interface Translations {
  errors: {
    llm_unavailable: string;
    llm_unavailable_on_create: string;
    failed_to_send: string;
    failed_to_load: string;
    network_error: string;
    unknown_error: string;
  };
  chat: {
    thinking: string;
    type_message: string;
    new_chat: string;
    download_message: string;
    copy_message: string;
    copied: string;
    send: string;
    model: string;
  };
}

const translations: Record<SupportedLanguage, Translations> = {
  en: {
    errors: {
      llm_unavailable: 'The AI service is temporarily unavailable. Please try again in a few moments.',
      llm_unavailable_on_create: 'The AI service is temporarily unavailable. Your chat was created, but the AI could not respond. Please try sending your message again.',
      failed_to_send: 'Failed to send message. Please try again.',
      failed_to_load: 'Failed to load chat. Please refresh the page.',
      network_error: 'Network error. Please check your connection.',
      unknown_error: 'An unexpected error occurred. Please try again.'
    },
    chat: {
      thinking: 'AI is thinking...',
      type_message: 'Type your message...',
      new_chat: 'New Chat',
      download_message: 'Download message',
      copy_message: 'Copy message',
      copied: 'Copied!',
      send: 'Send',
      model: 'Model'
    }
  },
  it: {
    errors: {
      llm_unavailable: 'Il servizio AI è temporaneamente non disponibile. Riprova tra qualche istante.',
      llm_unavailable_on_create: 'Il servizio AI è temporaneamente non disponibile. La tua chat è stata creata, ma l\'AI non ha potuto rispondere. Riprova a inviare il tuo messaggio.',
      failed_to_send: 'Impossibile inviare il messaggio. Riprova.',
      failed_to_load: 'Impossibile caricare la chat. Ricarica la pagina.',
      network_error: 'Errore di rete. Controlla la tua connessione.',
      unknown_error: 'Si è verificato un errore imprevisto. Riprova.'
    },
    chat: {
      thinking: 'L\'AI sta pensando...',
      type_message: 'Scrivi il tuo messaggio...',
      new_chat: 'Nuova Chat',
      download_message: 'Scarica messaggio',
      copy_message: 'Copia messaggio',
      copied: 'Copiato!',
      send: 'Invia',
      model: 'Modello'
    }
  },
  es: {
    errors: {
      llm_unavailable: 'El servicio de IA no está disponible temporalmente. Inténtalo de nuevo en unos momentos.',
      llm_unavailable_on_create: 'El servicio de IA no está disponible temporalmente. Tu chat fue creado, pero la IA no pudo responder. Intenta enviar tu mensaje nuevamente.',
      failed_to_send: 'Error al enviar el mensaje. Inténtalo de nuevo.',
      failed_to_load: 'Error al cargar el chat. Recarga la página.',
      network_error: 'Error de red. Verifica tu conexión.',
      unknown_error: 'Ocurrió un error inesperado. Inténtalo de nuevo.'
    },
    chat: {
      thinking: 'La IA está pensando...',
      type_message: 'Escribe tu mensaje...',
      new_chat: 'Nuevo Chat',
      download_message: 'Descargar mensaje',
      copy_message: 'Copiar mensaje',
      copied: '¡Copiado!',
      send: 'Enviar',
      model: 'Modelo'
    }
  },
  fr: {
    errors: {
      llm_unavailable: 'Le service IA est temporairement indisponible. Veuillez réessayer dans quelques instants.',
      llm_unavailable_on_create: 'Le service IA est temporairement indisponible. Votre chat a été créé, mais l\'IA n\'a pas pu répondre. Veuillez réessayer d\'envoyer votre message.',
      failed_to_send: 'Échec de l\'envoi du message. Veuillez réessayer.',
      failed_to_load: 'Échec du chargement du chat. Veuillez actualiser la page.',
      network_error: 'Erreur réseau. Vérifiez votre connexion.',
      unknown_error: 'Une erreur inattendue s\'est produite. Veuillez réessayer.'
    },
    chat: {
      thinking: 'L\'IA réfléchit...',
      type_message: 'Tapez votre message...',
      new_chat: 'Nouveau Chat',
      download_message: 'Télécharger le message',
      copy_message: 'Copier le message',
      copied: 'Copié!',
      send: 'Envoyer',
      model: 'Modèle'
    }
  },
  de: {
    errors: {
      llm_unavailable: 'Der KI-Dienst ist vorübergehend nicht verfügbar. Bitte versuchen Sie es in einigen Augenblicken erneut.',
      llm_unavailable_on_create: 'Der KI-Dienst ist vorübergehend nicht verfügbar. Ihr Chat wurde erstellt, aber die KI konnte nicht antworten. Bitte versuchen Sie, Ihre Nachricht erneut zu senden.',
      failed_to_send: 'Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.',
      failed_to_load: 'Chat konnte nicht geladen werden. Bitte laden Sie die Seite neu.',
      network_error: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.',
      unknown_error: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'
    },
    chat: {
      thinking: 'KI denkt nach...',
      type_message: 'Geben Sie Ihre Nachricht ein...',
      new_chat: 'Neuer Chat',
      download_message: 'Nachricht herunterladen',
      copy_message: 'Nachricht kopieren',
      copied: 'Kopiert!',
      send: 'Senden',
      model: 'Modell'
    }
  }
};

/**
 * Detect browser language and map to supported language
 */
export function detectBrowserLanguage(): SupportedLanguage {
  const browserLang = navigator.language.toLowerCase();
  
  // Check for exact matches first (e.g., 'it-IT' -> 'it')
  for (const lang of Object.keys(translations) as SupportedLanguage[]) {
    if (browserLang.startsWith(lang)) {
      return lang;
    }
  }
  
  // Default to English
  return 'en';
}

/**
 * Get translations for a specific language
 */
export function getTranslations(language?: SupportedLanguage): Translations {
  const lang = language || detectBrowserLanguage();
  return translations[lang] || translations.en;
}

/**
 * Get a specific translation
 */
export function t(key: string, language?: SupportedLanguage): string {
  const trans = getTranslations(language);
  const keys = key.split('.');
  
  let value: any = trans;
  for (const k of keys) {
    value = value?.[k];
  }
  
  return typeof value === 'string' ? value : key;
}

