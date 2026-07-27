import { useCallback, useEffect, useState } from 'react';
import { Board } from './components/Board';
import { Footer, Masthead, Panel, Tabs } from './components/Frame';
import { Foundations } from './components/Foundations';
import { MacosSettings } from './components/MacosSettings';
import { ShareButton } from './components/ShareButton';
import { Simulator } from './components/Simulator';
import { Walkthrough } from './components/Walkthrough';
import { CopyProvider, COPY } from './content';
import { DEFAULT_LANGUAGE, TAGS, preferred, type Language } from './lib/i18n';
import type { Inputs } from './lib/model';
import {
  decodeLanguage,
  decodeState,
  decodeTab,
  encodeState,
  shareLink,
  type Tab,
} from './lib/url';

/**
 * The URL is the whole of this application's persistence.
 *
 * Nothing is written to the browser — no localStorage, no cookie, no analytics —
 * so the address bar is where a setting lives. It is updated with
 * `replaceState` rather than `pushState`: dragging a slider should not fill the
 * back button with a hundred intermediate states.
 */
export default function App() {
  const search = typeof window === 'undefined' ? '' : window.location.search;
  const [inputs, setInputs] = useState<Inputs>(() => decodeState(search));
  const [tab, setTab] = useState<Tab>(() => decodeTab(search));
  /**
   * Null until the visitor picks one, which is what keeps `lang` out of a link
   * they never asked for. The language actually rendered falls back to what the
   * browser asks for.
   */
  const [chosen, setChosen] = useState<Language | null>(() => decodeLanguage(search));
  const [detected] = useState<Language>(() => preferred());
  const language = chosen ?? detected ?? DEFAULT_LANGUAGE;

  // The document's own language has to follow, or a screen reader keeps reading
  // French with an English voice.
  useEffect(() => {
    document.documentElement.lang = TAGS[language];
    document.title = COPY[language].chrome.documentTitle;
  }, [language]);

  useEffect(() => {
    const next = `${window.location.pathname}${encodeState(inputs, tab, chosen)}`;
    if (next !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, '', next);
    }
  }, [inputs, tab, chosen]);

  // A visitor can still arrive at a different state through the back button,
  // for instance after following a shared link from this same page.
  useEffect(() => {
    const onPop = () => {
      setInputs(decodeState(window.location.search));
      setTab(decodeTab(window.location.search));
      setChosen(decodeLanguage(window.location.search));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const patch = useCallback((next: Partial<Inputs>) => {
    setInputs((previous) => ({ ...previous, ...next }));
  }, []);

  return (
    <CopyProvider value={COPY[language]}>
      <div className="mx-auto max-w-[820px] px-6 pt-12 pb-20 max-sm:px-4.5 max-sm:pt-8">
      <Board />
      <Masthead language={language} onLanguage={setChosen} />
      <Tabs current={tab} onChange={setTab} />

      <Panel tab="walkthrough" current={tab}>
        <Walkthrough
          inputs={inputs}
          onChange={patch}
          onOpenInstrument={() => {
            setTab('simulator');
            window.scrollTo(0, 0);
          }}
        />
      </Panel>

      <Panel tab="simulator" current={tab}>
        <Simulator inputs={inputs} onChange={patch} />
        <div className="mt-8">
          <ShareButton link={shareLink(inputs, tab, chosen)} />
        </div>
      </Panel>

      <Panel tab="macos" current={tab}>
        <MacosSettings inputs={inputs} />
      </Panel>

      <Panel tab="foundations" current={tab}>
        <Foundations />
      </Panel>

      <Footer shareLink={shareLink(inputs, tab, chosen)} />
      </div>
    </CopyProvider>
  );
}
