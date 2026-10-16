import { createContext, useContext } from 'react';
import { IoLanguageOutline } from 'react-icons/io5';
import { cardText } from 'util/cardText';
import styles from './CardLang.module.scss';

const CardLangContext = createContext('vi');

/** The card's language for everything inside it ('vi' or 'en'). */
export const CardLangProvider = CardLangContext.Provider;

/** The card's words in its language; Vietnamese outside a card. */
export function useCardText() {
  return cardText(useContext(CardLangContext));
}

/** "English" / "Tiếng Việt": switches the card, above the envelope too. */
export function LangSwitch({ lang, onChange }) {
  const t = cardText(lang);
  const next = lang === 'en' ? 'vi' : 'en';
  return (
    <button
      type="button"
      className={styles.switch}
      onClick={() => onChange(next)}
      aria-label={t.switchLabel}
      lang={next}
    >
      <IoLanguageOutline aria-hidden />
      <span>{t.switchTo}</span>
    </button>
  );
}
