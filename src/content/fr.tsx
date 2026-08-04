import { Ask, Live } from '../components/Fields';
import { Display } from '../components/Latex';
import { Source, Tally } from '../components/Prose';
import { makeFormats } from '../lib/format';
import { cardById } from '../lib/foundations';
import { BOUNDS, DEFAULTS, loadVerdict, ratchetVerdict, type Inputs } from '../lib/model';
import type { ChannelKey, Copy, Step, WalkthroughValues } from './types';

const f = makeFormats('fr-FR');

/**
 * French.
 *
 * Vouvoiement throughout, and the instrument's own vocabulary translated rather
 * than kept in English — a decision worth recording, because it is the one that
 * shapes every other line: the console reads PORTÉE, not REACH.
 *
 * Where English leans on a short noun that French has no equivalent for, the
 * French takes the extra words rather than importing the English one. "Drain"
 * becomes "Fatigue"; "ratchet" becomes "effet cliquet", which is the received
 * translation in economics.
 */

const CHANNELS: Record<ChannelKey, { name: string; label: string; hint: string }> = {
  hours: {
    name: 'Heures nettes',
    label: 'Vos heures de concentration réelle, par jour',
    hint: 'Pas la durée de votre journée. Les heures où vous êtes vraiment dedans.',
  },
  share: {
    name: 'Portée',
    label: "La part de ce travail que l'IA peut toucher",
    hint: "Tout le reste — la réunion, la décision, savoir pourquoi le système est fait comme ça — avance à votre vitesse quelle que soit la qualité de l'outil. C'est ce curseur qui fixe votre limite.",
  },
  speed: {
    name: 'Vitesse',
    label: 'Le gain de vitesse sur cette part',
    hint: 'Trois fois plus vite, cela veut dire une heure de travail qui revient en vingt minutes.',
  },
  review: {
    name: 'Vérification',
    label: "La part du temps gagné qui repart aussitôt en relecture",
    hint: "Lire la sortie, la corriger, redemander. Un quart est une estimation prudente pour la plupart des gens.",
  },
  density: {
    name: 'Fatigue',
    label: "Ce que coûte une heure passée avec l'IA",
    hint: "1,0 est une heure de travail ordinaire. 1,3 est une heure d'arbitrages continus, sans aucun des temps morts qui découpaient la journée.",
  },
  visible: {
    name: 'Visible',
    label: 'La part du surplus que vous laissez voir',
    hint: "À 0 %, vous gardez votre rythme d'avant et empochez la différence. À 100 %, vous livrez tout ce que l'outil rend possible.",
  },
};

function channel(key: ChannelKey, v: WalkthroughValues, set: (patch: Partial<Inputs>) => void) {
  const renderers: Record<ChannelKey, (n: number) => string> = {
    hours: f.hours,
    share: f.percent,
    speed: f.timesShort,
    review: f.percent,
    density: f.index,
    visible: f.percent,
  };
  return {
    ...CHANNELS[key],
    value: v.inputs[key],
    ...BOUNDS[key],
    fallback: DEFAULTS[key],
    onChange: (n: number) => set({ [key]: n }),
    render: renderers[key],
  };
}

function steps(v: WalkthroughValues, set: (patch: Partial<Inputs>) => void): Step[] {
  const { inputs, result: r, rawGain, breakEven } = v;

  return [
    {
      no: 'Question une',
      title: 'Quelle part de votre journée est vraiment du travail ?',
      body: (
        <>
          <p>
            Commençons par le seul chiffre que vous connaissez déjà. Pas la durée de votre journée
            — les heures, dedans, où vous êtes réellement concentré. Chez la plupart des gens qui
            le mesurent honnêtement, la réponse tient entre trois et cinq, et la première fois cela
            fait un choc.
          </p>
          <Ask channel={channel('hours', v, set)} />
          <p>
            Tout ce qui suit est exprimé dans ces heures-là, parce que ce sont les seules sur
            lesquelles l'outil peut quoi que ce soit. Le reste de la journée n'a jamais été la
            contrainte.
          </p>
        </>
      ),
    },
    {
      no: 'Question deux',
      title: "Que peut réellement toucher l'outil ?",
      body: (
        <>
          <p>
            En 1967, un architecte informatique fait une observation sur l'accélération qui se
            révélera valable bien au-delà des processeurs. Elle est presque trop simple à énoncer :
            si vous accélérez une partie d'un travail, le reste du travail s'en moque.
          </p>
          <Source
            card={cardById('amdahl')}
            body="Accélérez une partie d'un travail et le reste continue exactement comme avant. Le gain sur l'ensemble est donc borné par ce que vous n'avez pas accéléré — et aucune puissance supplémentaire ne déplace cette borne."
          />
          <p>
            La première chose à établir n'est donc pas la qualité de l'assistant. C'est la part de
            votre travail qu'il peut atteindre, parce que tout ce qu'il n'atteint pas fixe votre
            limite.
          </p>
          <Ask channel={channel('share', v, set)}>
            Des spécifications floues, des systèmes non documentés et des décisions qui demandent
            trois personnes dans une pièce : voilà ce qui tire ce chiffre vers le bas. Pas le
            modèle.
          </Ask>
          <Tally>
            À <Live>{f.percent(inputs.share)}</Live>, Amdahl seul vous plafonnerait à{' '}
            <Live>{f.times(r.ceiling)}</Live> — là où vous arrivez avec un assistant{' '}
            <em>infiniment rapide</em>, pas dix fois plus rapide : infiniment. La vérification
            rabaissera ce chiffre dans deux questions. Aucune sortie de modèle ne vous fera passer
            au-dessus tant que celui-ci ne bouge pas.
          </Tally>
        </>
      ),
    },
    {
      no: 'Question trois',
      title: 'Et combien plus vite, sur cette part ?',
      body: (
        <>
          <p>
            Voici maintenant le chiffre dont tout le monde débat. Soyez généreux si vous voulez ;
            l'intérêt de la ligne suivante est justement qu'il compte moins qu'on ne le croit.
          </p>
          <Ask channel={channel('speed', v, set)} />
          <Tally>
            <Live>{f.timesShort(inputs.speed)}</Live> sur <Live>{f.percent(inputs.share)}</Live> du
            travail rend votre journée entière <Live>{f.times(rawGain)}</Live> plus rapide — contre
            un plafond de <Live>{f.times(r.ceiling)}</Live>. Tout ce que l'industrie a encore à
            vous donner, sur ces chiffres, tient dans un facteur{' '}
            <Live>{f.times(r.ceiling / rawGain)}</Live>.
          </Tally>
          <Display name="amdahl" />
          <p>
            Essayez dans l'autre sens. Montez le curseur de portée de vingt points et regardez le
            plafond se déplacer ; montez celui de vitesse et regardez-le ne pas bouger du tout. Les
            benchmarks mesurent la vitesse. C'est la portée qui a du levier — et contrairement à la
            vitesse, elle tient en partie à la façon dont votre travail est organisé, donc elle
            vous appartient en partie.
          </p>
        </>
      ),
    },
    {
      no: 'Question quatre',
      title: 'Qui relit ce qui sort ?',
      body: (
        <>
          <p>
            La règle de 1967 suppose discrètement que la partie accélérée revient terminée. Ce
            n'est pas le cas d'un travail généré. Il faut le lire, et lire n'est pas gratuit.
          </p>
          <p>
            Deux choses alourdissent cette facture plus qu'on ne l'imagine. Lire du code qu'on ne
            connaît pas est plus lent que d'écrire du code qu'on connaît — asymétrie ancienne, sans
            rapport avec l'IA. Et une réponse générée échoue rarement en étant manifestement
            cassée : elle échoue en étant plausible et fausse, ce qui est la catégorie d'erreur la
            plus coûteuse qui soit, parce qu'elle survit à un coup d'œil rapide et ressort bien
            plus tard.
          </p>
          <Ask channel={channel('review', v, set)} />
          <Display name="review" />
          <Tally>
            La vérification ramène le <Live>{f.times(rawGain)}</Live> à{' '}
            <Live>{f.times(r.gain)}</Live>. En heures : ce qui vous prend aujourd'hui{' '}
            <Live>{f.hours(inputs.hours)}</Live> en aurait pris{' '}
            <Live>{f.hours(r.hoursWithout)}</Live> sans l'outil.
          </Tally>
          <p>
            Première affirmation réglée. La journée est plus courte. Savoir si elle est{' '}
            <em>meilleure</em> est une autre question, et la réponse n'est pas dans ce chiffre.
          </p>
        </>
      ),
    },
    {
      no: 'Question cinq',
      title: 'Que vous coûte une heure de ce travail ?',
      body: (
        <>
          <p>
            Ce qui était de la fabrication est devenu de la vérification, et vérifier est un
            arbitrage continu : lire, évaluer, accepter, rejeter, redemander. Pendant ce temps, le
            mou qui découpait la journée — attendre une compilation, chercher quelque chose, la
            partie lente où l'on réfléchit — est précisément ce qui a été comprimé. Ce qui reste
            est plus dense.
          </p>
          <Source
            card={cardById('leroy')}
            body="Changer de tâche laisse une part de votre attention accrochée à la précédente, surtout si vous l'avez laissée inachevée, et la performance sur la suivante en souffre de façon mesurable."
          />
          <p>
            Superviser un agent est une machine à fabriquer des changements de tâche. Faites tourner
            trois sessions à la fois et vous avez trois fils à tenir en tête — un coût que vous
            payez, pas la machine.
          </p>
          <Ask channel={channel('density', v, set)} />
          <Tally>
            {r.loadGap > 0 ? (
              <>
                Votre journée est plus courte et coûte plus cher.{' '}
                <Live>{f.units(r.loadWith)}</Live> unités de charge contre{' '}
                <Live>{f.units(r.loadWithout)}</Live> — les heures ont baissé et le total est monté.
              </>
            ) : (
              <>
                Votre journée est plus courte et moins chère : <Live>{f.units(r.loadWith)}</Live>{' '}
                unités de charge contre <Live>{f.units(r.loadWithout)}</Live>. La bascule se situe
                à une fatigue de <Live>{f.index(breakEven)}</Live> — au-delà, la journée courte
                commence à coûter plus que la longue.
              </>
            )}
          </Tally>
          <p>
            Deuxième affirmation, et c'est celle que personne ne met dans une présentation. Une
            journée plus courte et une journée plus légère sont deux choses différentes. L'outil
            livre la première tout seul ; la seconde n'arrive que si vous en décidez ainsi.
          </p>
        </>
      ),
    },
    {
      no: 'Question six',
      title: 'Et qui repart avec le temps ?',
      body: (
        <>
          <p>
            Une dernière question, et elle n'est pas technique. La règle de 1967 a un jumeau qu'on
            cite beaucoup moins : dans la vraie vie, personne ne garde une tâche de la même taille
            pour rentrer plus tôt. On garde les heures et on agrandit la tâche.
          </p>
          <Source
            card={cardById('gustafson')}
            body="En pratique, la tâche n'est pas maintenue fixe pour finir plus tôt : elle est élargie à durée constante. Dès lors, le plafond cesse de mordre."
          />
          <p>
            Rien dans les mathématiques ne tranche entre finir à quinze heures et livrer une fois et
            demie plus à dix-huit. Ce choix est politique, et il n'est en général pas fait par la
            personne devant le clavier.
          </p>
          <Source
            card={cardById('roy')}
            body="Dans un atelier de Chicago, des ouvriers payés à la pièce plafonnaient volontairement leur production : une semaine exceptionnelle faisait réviser le tarif à la baisse et rendait toutes les suivantes pires."
          />
          <p>
            Les ouvriers de Roy n'étaient pas paresseux. Ils avaient identifié un cliquet. La même
            forme réapparaît partout où la performance est observée : le pic devient la norme
            attendue, et les attentes ne redescendent pas.
          </p>
          <Source
            card={cardById('acemoglu')}
            body="Mille ans de changement technique, et le constat qui les traverse : les gains ne se partagent pas d'eux-mêmes. Qui les capte dépend du rapport de force au moment où la technologie arrive."
          />
          <Ask channel={channel('visible', v, set)} />
          <Tally>
            La barre monte de <Live>{f.percentSigned(r.visibleGain - 1)}</Live> et y reste. Il vous
            reste <Live>{f.hours(r.marginKept)}</Live> par jour, en heures d'avant.
          </Tally>
          <p>
            Soyons honnête sur ce que ce curseur n'est pas. Se retenir seul est un geste faible —
            les ouvriers de Roy tenaient la ligne collectivement, et une personne qui travaille
            discrètement en dessous de ses capacités perd du terrain sans rien ralentir. Il vous
            montre ce que vous gardez. Ce n'est pas une stratégie pour gagner.
          </p>
        </>
      ),
    },
  ];
}

export const FR: Copy = {
  format: f,
  chrome: {
    documentTitle: "DUTY simulator — ce que l'IA vous achète vraiment",
    kicker: 'DUTY simulator · un interactif',
    headline: "Ce que l'IA vous achète vraiment",
    dek: "Tout le monde s'accorde à dire que ces outils font gagner du temps. Presque personne ne s'accorde sur ce que cette phrase veut dire — parce qu'elle en cache trois, et qu'elles ne vont pas dans le même sens.",
    standfirst:
      'Manœuvrez les curseurs. Les chiffres, la courbe et les verdicts suivent.',
    tabs: {
      walkthrough: 'Pas à pas',
      simulator: "L'instrument",
      macos: 'En pratique',
      foundations: 'Les sources',
    },
    reportError: 'Signaler une erreur',
    sourceCode: 'Code source',
    privacy:
      "Cette page ne conserve rien : ni cookie, ni mesure d'audience, ni compte. Ce que vous réglez vit dans la barre d'adresse, qui sert aussi à le partager.",
    languageLabel: 'Langue',
  },

  channels: CHANNELS,

  console: {
    yourTurn: 'À vous',
    howTo:
      'Manœuvrez un curseur à la souris, ou donnez-lui le focus et utilisez les flèches. Un double-clic le remet à sa place.',
  },

  walkthrough: {
    kicker: 'Pas à pas · une dizaine de minutes',
    headline: 'Trois affirmations tiennent dans une seule phrase',
    dek: "« Ça me fait gagner du temps » est la chose qu'on entend le plus à propos de l'IA au travail, et la moins utile. Répondez à six questions en lisant, et cette page calculera ce qu'elle vous achète réellement.",
    intro: (
      <>
        <p>
          Insistez auprès d'un développeur sur ce qui a changé depuis qu'il travaille avec un
          assistant, et la phrase se défait en trois :
        </p>
        <ul className="mb-5 list-disc space-y-2 pl-6">
          <li>Le même travail prend moins d'heures.</li>
          <li>Ces heures ne se ressemblent plus — plus légères, ou plus lourdes.</li>
          <li>On attend davantage de vous par jour qu'avant.</li>
        </ul>
        <p>
          Elles arrivent ensemble, alors elles sonnent comme une seule. Elles n'en sont pas une. La
          première a une limite mathématique dure qu'aucun modèle futur ne lèvera. La deuxième peut
          aller dans le sens inverse de la première. La troisième ne vous appartient pas vraiment.
        </p>
        <p>
          Rien de ce qui suit n'est nouveau, et rien ne parle d'IA. Le morceau le plus ancien est un
          livre sur le charbon de 1865. La nouveauté tient seulement à ce que les trois retombent
          désormais sur la même personne en même temps.
        </p>
      </>
    ),
    steps,
    curve: {
      kicker: 'La réponse',
      title: 'Lire la courbe que vous venez de produire',
      lead: (
        <p>
          Tout ce que vous avez réglé se trouve dans le tracé ci-dessous. Il est dessiné comme un
          oscilloscope parce que c'est ce qu'il est : une grandeur tracée contre une autre, en
          direct.
        </p>
      ),
      readings: ({ inputs, result: r }) => [
        <>
          <strong className="font-semibold">Les axes.</strong> De gauche à droite, la vitesse de
          l'assistant, de nulle à huit fois. De bas en haut, ce que vaut votre journée entière au
          bout du compte.
        </>,
        <>
          <strong className="font-semibold">Le tracé bleu</strong> est la règle de 1967 seule — la
          journée que vous auriez si rien n'avait jamais besoin d'être relu.
        </>,
        <>
          <strong className="font-semibold">Le tracé vert</strong> est le vôtre, vos{' '}
          <Live>{f.percent(inputs.review)}</Live> de vérification déduits. L'écart entre les deux
          est la facture de la question quatre.
        </>,
        <>
          <strong className="font-semibold">Le point lumineux</strong> est là où vous êtes :{' '}
          <Live>{f.timesShort(inputs.speed)}</Live> en abscisse, <Live>{f.times(r.gain)}</Live> en
          ordonnée.
        </>,
        <>
          <strong className="font-semibold">La ligne ambre en pointillés</strong> est là où votre
          propre tracé s'arrête : <Live>{f.times(r.effectiveCeiling)}</Live>, vérification
          comprise. Les pointillés bleus plus haut sont l'Amdahl théorique,{' '}
          <Live>{f.times(r.ceiling)}</Live> — ce que vous auriez si la relecture était gratuite.
          L'écart entre les deux lignes est la facture de la question quatre, à vitesse infinie.
        </>,
      ],
      contrast: (
        <p className="mt-6 max-w-[63ch]">
          Faites maintenant une seule chose. Poussez le curseur de vitesse à fond et regardez le
          point monter, s'aplatir, puis pratiquement s'arrêter — toute la moitié droite de ce
          graphique ne vaut presque rien pour vous. Puis manœuvrez le curseur de portée, et
          regardez le plafond lui-même se soulever. Ce contraste est tout l'argument de cette page.
        </p>
      ),
      tally: ({ inputs, result: r }) => (
        <>
          Où vous avez atterri : <Live>{f.times(r.gain)}</Live> pour un plafond de{' '}
          <Live>{f.times(r.ceiling)}</Live>, une journée de <Live>{f.hours(inputs.hours)}</Live>{' '}
          contre <Live>{f.hours(r.hoursWithout)}</Live>,{' '}
          {r.loadGap > 0 ? 'au prix de ' : 'en économisant '}
          <Live>{f.units(Math.abs(r.loadGap))}</Live> unités de charge, avec une barre qui a bougé
          de <Live>{f.percentSigned(r.visibleGain - 1)}</Live>.
        </>
      ),
      afterward: (
        <p className="max-w-[63ch]">
          Ces six chiffres valent maintenant pour toute la page, et ils voyagent dans la barre
          d'adresse : le lien dans votre navigateur est la version que vous venez de construire.
          L'onglet instrument est le même modèle avec toutes les commandes au même endroit, pour
          quand vous voudrez le contredire plutôt que vous laisser guider.
        </p>
      ),
      openInstrument: "Ouvrir l'instrument →",
      caveat: (
        <>
          <strong className="text-ink font-semibold">Une réserve, dite une fois.</strong> Rien de
          tout cela ne touche à la charge qu'on vous confie, aux attentes laissées délibérément
          floues, ni à un trouble que personne n'a pris en charge — les trois choses qui reviennent
          le plus régulièrement dans les burn-out à répétition. Chaque chiffre ici vaut exactement
          ce que valent vos estimations. C'est un instrument pour réfléchir, ce n'est pas une
          preuve.
        </>
      ),
    },
  },

  dayBars: {
    kicker: 'La même journée, de trois façons',
    title: "Pourquoi il y a un plafond, tout simplement",
    lead: (
      <p>
        Voici tout l'argument sans une seule courbe. Trois versions de la même journée de travail,
        dessinées à la même échelle.
      </p>
    ),
    without: "Sans l'outil",
    withAi: "Avec l'outil, tel que vous l'avez réglé",
    infinite: 'Avec un outil infiniment rapide',
    infiniteNote: (ceiling) =>
      `Voilà le plafond — ${ceiling} — et ce n'est rien d'autre que le bloc que l'outil n'a jamais touché.`,
    segments: {
      reachable: "Ce que l'outil peut atteindre",
      untouched: "Ce qu'il ne peut pas",
      accelerated: 'Accéléré',
      checking: 'Vérification',
    },
    caption: (
      <>
        <strong className="text-ink font-semibold">Ce qu'il faut voir.</strong> Le bloc{' '}
        <em>ce qu'il ne peut pas</em> a exactement la même largeur sur les trois lignes. Rendre
        l'assistant plus rapide raccourcit le bloc accéléré et ne fait rien d'autre. Rendez-le
        infiniment rapide et ce bloc disparaît complètement — il vous reste celui d'à côté, plus la
        vérification, qui ne disparaît pas parce qu'elle est une fraction du gain et non du
        travail. Ces deux-là ensemble sont le plafond.
      </>
    ),
  },

  simulator: {
    stepOne: {
      designator: 'Étape une',
      title: 'Mettez vos propres chiffres',
      sub: "Cinq réglages. Aucun n'a besoin d'être exact — l'enjeu n'est pas la troisième décimale, c'est le sens dans lequel la réponse bouge quand vous changez d'avis sur l'un d'eux.",
    },
    stepTwo: {
      designator: 'Étape deux',
      title: 'Qui repart avec le temps',
      sub: "Admettons que l'outil vous fasse vraiment gagner une heure. Reste à savoir à qui elle est — et cela, l'arithmétique ne le tranche pas. Une bonne semaine devient la semaine qu'on attendra la prochaine fois, et les attentes ne redescendent pas.",
    },
    metrics: {
      gain: ['Ce que vous gagnez vraiment', 'Une fois la vérification payée'],
      ceiling: ['Le plafond dur', "Où s'arrête un outil infiniment rapide, vérification comprise"],
      without: ['La même journée, sans IA', 'Pour produire ce que vous produisez'],
      gap: ['Surcharge', 'Positif : la journée courte coûte plus'],
      baseline: ['La nouvelle norme', "Ce qu'on attendra de vous désormais"],
      after: ['Ce que tenir coûte', 'Heures par jour, une fois la barre montée'],
      margin: ['Ce que vous gardez', "En heures d'avant"],
    },
    curveKicker: "La courbe qui s'aplatit",
    curveCaption: (
      <>
        <strong className="text-ink font-semibold">Comment lire ceci.</strong> De gauche à droite :
        la vitesse de l'outil. De bas en haut : ce que vous tirez de votre journée entière.
        Manœuvrez le curseur de vitesse et la ligne verte monte, puis cesse de monter — c'est toute
        l'histoire. La ligne ambre en pointillés est la limite qu'elle ne franchira jamais, et le
        seul moyen de déplacer cette limite est le deuxième curseur.
      </>
    ),
    metersKicker: "Une journée plus courte n'est pas une journée plus légère",
    meterWith: "Avec l'IA, vous travaillez",
    meterWithout: 'Sans elle, vous auriez travaillé',
    metersCaption:
      "Les segments passent à l'ambre au-delà du point où une journée de cette intensité cesse d'être répétable. La seconde barre est plus longue — mais la première peut vous coûter davantage, une fois comptée la lourdeur de chacune de ses heures.",
    method: (
      <>
        <strong className="text-ink font-semibold">Méthode.</strong> Le modèle est la loi d'Amdahl,
        corrigée de la part du gain qui repart en relecture. La charge est le produit des heures par
        la fatigue de chaque heure ; le seuil de 4 unités correspond à l'ordre de grandeur admis
        pour du travail intellectuel intense soutenable au quotidien, ce n'est pas une mesure de
        vous. Chaque chiffre ici vaut exactement ce que valent vos estimations. C'est un instrument
        pour réfléchir, ce n'est pas une preuve.
      </>
    ),
    share: { idle: 'Copier le lien de ce réglage', done: 'Lien copié' },
  },

  scope: {
    title:
      "Gain global en fonction de l'accélération de l'outil, à part accélérée constante. Le tracé s'aplatit à mesure que la vitesse monte et n'atteint jamais le plafond fixé par la portée.",
    ch1: 'Vérification déduite',
    ch2: 'Amdahl théorique',
    limit: 'Votre plafond, vitesse infinie',
    limitShort: 'PLAFOND',
    limitTheoretical: 'Limite d\'Amdahl, si la vérification était gratuite',
  },

  verdicts: {
    load: (result, inputs) => {
      switch (loadVerdict(result)) {
        case 'unsustainable':
          return `À ce réglage, il n'y a rien à comparer. Produire la même chose sans l'outil demanderait ${f.hours(result.hoursWithout)} de concentration dense chaque jour, et ce n'est pas une longue journée — c'est une journée que personne n'a. La comparaison se casse avant l'arithmétique.`;
        case 'heavier':
          return `Vous finissez plus tôt, et vous le payez. ${f.hours(inputs.hours)} au lieu de ${f.hours(result.hoursWithout)} — mais ${f.units(result.loadWith)} unités de charge contre ${f.units(result.loadWithout)}. Les heures gagnées sont réelles. Elles ne deviennent du repos que si vous en décidez ainsi.`;
        case 'lighter':
          return `Celui-ci joue vraiment en votre faveur : ${f.hours(result.hoursWithout - inputs.hours)} de moins au bureau, et ${f.units(-result.loadGap)} de charge en moins avec. Il n'y a rien à corriger ici.`;
      }
    },
    ratchet: (result, inputs) => {
      const rise = f.percent(result.visibleGain - 1);
      switch (ratchetVerdict(inputs.visible)) {
        case 'withheld':
          return "Vous en gardez presque tout, et la barre ne bouge pas. Reste à savoir ce que cela coûte : le jour où quelqu'un décide qui a fait quoi cette année, l'objectif n'a jamais été de paraître lent. C'était de paraître bon et régulier.";
        case 'surrendered':
          return `Vous livrez tout. La barre monte de ${rise} et y reste, et le jour où vous vous asseyez pour demander quelque chose, vous n'avez plus rien à échanger. Le gain est passé en totalité à votre employeur, définitivement.`;
        case 'partial':
          return `La barre monte de ${rise}, et elle ne redescendra pas. Il vous reste ${f.hours(result.marginKept)} en heures d'avant — à dépenser de préférence dans quelque chose qui n'apparaîtra jamais sur un tableau de bord : de la fiabilité, une lacune à combler, ou du repos.`;
      }
    },
  },

  macos: {
    designator: 'En pratique',
    title: 'Le seul chiffre que vous puissiez vraiment déplacer',
    sub: "Sur les cinq réglages de cette page, quatre appartiennent à quelqu'un d'autre. La part de votre travail que l'outil atteint dépend de la façon dont le travail est organisé. Sa vitesse est la feuille de route du fournisseur. Ce qu'il faut vérifier dépend de la fiabilité du modèle. Un seul se règle par la manière dont vous agencez votre journée.",
    lead: (
      <p className="mb-5 max-w-[62ch]">
        Celui-là, c'est la <strong className="font-semibold">fatigue</strong> — ce que vous coûte
        une heure de ce travail. Et ce n'est pas une humeur. Elle est faite de choses précises et
        ennuyeuses : la fréquence des interruptions, la durée d'une session avant que vous vous
        leviez, le nombre de fils d'agent que vous tenez en même temps, et si vous avez dormi.
        Chacune d'elles se configure sur la machine posée devant vous.
      </p>
    ),
    whereYouAre: {
      kicker: 'Où vous en êtes',
      sentence: ({ density, breakEven, gap, below, loadWith, loadWithout }) => (
        <>
          Votre fatigue est à <Live>{density}</Live>. Avec vos autres réglages, la bascule se situe
          à <Live>{breakEven}</Live> — la fatigue à partir de laquelle une journée plus courte coûte
          plus cher que la longue.{' '}
          {below ? (
            <>
              Vous êtes en dessous de <Live>{gap}</Live>. Ce qui suit sert à le rester quand la
              semaine se charge.
            </>
          ) : (
            <>
              Vous êtes au-dessus de <Live>{gap}</Live>, et c'est pourquoi l'instrument dit que
              votre journée est plus courte et plus lourde : {loadWith} unités de charge contre{' '}
              {loadWithout}. Rien de ce qui suit ne change ce que fait l'outil. Cela change ce que
              coûtent les heures.
            </>
          )}
        </>
      ),
    },
    ambition: (
      <p className="mb-5 max-w-[62ch]">
        Voilà l'annonce honnête pour tout ce qui suit : rien là-dedans ne vous rend plus rapide, et
        rien n'est un système de productivité. Cela défend les conditions qui décident si la densité
        est tenable — un vrai signal d'arrêt, un bloc que personne n'interrompt, et du sommeil. C'est
        toute l'ambition, et autant dire clairement qu'elle est modeste.
      </p>
    ),
    principle: (
      <>
        Principe directeur : aucune limite de temps sur les outils de travail. VS Code, terminal,
        Claude Code, visioconférence. Un compteur là-dessus vous apprend à cliquer{' '}
        <strong>Ignore Limit</strong> plusieurs fois par jour — et donc à balayer aussi les alertes
        qui comptent. On ne limite que ce qu'on est content de voir s'arrêter.
      </>
    ),
    measure: {
      title: "Commencer par mesurer, pas par bloquer",
      sub: "Laissez tourner une semaine avant de restreindre quoi que ce soit. Le rapport désignera les deux ou trois sites qui méritent vraiment une limite, et ce sont rarement ceux qu'on aurait devinés.",
      path: 'System Settings › Screen Time › App & Website Activity',
      body: (
        <p className="mb-3">Les autres options n'apparaissent qu'une fois cet interrupteur activé.</p>
      ),
    },
    schedule: {
      title: 'Barème par application',
      sub: "Quatre régimes. Le bon réglage est celui que vous ne contournez pas au bout d'une semaine.",
      hideUnlimited: "Masquer tout ce qui n'est pas limité",
      columns: { app: 'Application, site ou signal', mechanism: 'Mécanisme', threshold: 'Seuil' },
      budget: 'Budget distraction quotidien',
      budgetNote:
        "Somme des limites d'usage, signaux d'arrêt exclus. Au-delà d'1 h 30, la contrainte ne mord plus ; en dessous de 30 min, elle se contourne.",
      safari: (
        <>
          Screen Time ne suit et ne bloque les sites que dans Safari. Sous Chrome, Arc ou Firefox,
          les limites par URL ne tiennent pas : il faut une extension de blocage côté navigateur, ou
          basculer la navigation de loisir sur Safari — ce qui a l'avantage de séparer physiquement
          la veille technique de la dispersion.
        </>
      ),
    },
    downtime: {
      title: 'Downtime',
      sub: 'Le réglage le plus rentable du lot : il protège le sommeil, donc la récupération, donc tout le reste.',
      path: 'Screen Time › Downtime · puis › Always Allowed',
      bullets: [
        <>
          Début 1 h à 1 h 30 avant le coucher. Schedule : <em>Every Day</em>, ou <em>Custom</em> pour
          un horaire jour par jour.
        </>,
        <>
          Une alerte 30 min avant, via <em>Shortcuts</em> : un arrêt sans préavis se subit mal et se
          contourne.
        </>,
        <>
          Dans <em>Always Allowed</em>, ne gardez que Messages et Phone. Ni navigateur, ni terminal.
        </>,
        <>Le week-end : un horaire différent plutôt qu'une désactivation.</>,
      ],
    },
    appLimits: {
      title: 'App Limits',
      path: 'Screen Time › App Limits › Add Limit · options Every Day / Custom · Edit Apps',
      body: (
        <p className="mb-3">
          Une limite peut viser une application, une catégorie entière (<em>Social</em>,{' '}
          <em>Entertainment</em>…), ou un site saisi par son URL sous <em>Websites</em>, en bas de la
          liste. Pour les sites, préférez l'URL à la catégorie : c'est plus précis et cela évite les
          faux positifs sur vos propres outils.
        </p>
      ),
    },
    focus: {
      title: 'Focus',
      sub: 'Le vrai levier contre la fragmentation, indépendant de Screen Time.',
      path: 'System Settings › Focus › (+) · puis Focus Filters',
      deepWork: {
        title: 'Le Focus « Deep work »',
        bullets: [
          <>
            Deux blocs programmés, par exemple 9 h–11 h et 14 h–16 h. Programmés, jamais déclenchés à
            la main : ce qui exige une initiative au moment critique échoue.
          </>,
          <>
            Aucune notification sauf les appels d'un contact désigné (
            <em>Allow Notifications From</em>).
          </>,
          <>
            <em>Focus Filters</em> : canaux Slack non essentiels masqués, boîtes secondaires
            masquées, profil de navigateur dédié.
          </>,
          <>
            Pastilles coupées : <em>System Settings › Notifications › [app] › Badge app icon</em>.
          </>,
          <>
            La fin du bloc compte plus que son début : programmez la coupure automatique.
          </>,
        ],
      },
      calls: {
        title: 'Le Focus « Calls »',
        body: <p className="mb-3">Notifications coupées, partage d'écran propre.</p>,
      },
      reading: {
        title: 'Le Focus « Reading »',
        body: (
          <p className="mb-3">
            L'inverse : navigateur autorisé, IDE et agents coupés. Sans cela, une phase de veille
            dérive vers le code en dix minutes.
          </p>
        ),
      },
    },
    breaks: {
      title: "Pauses et signaux d'arrêt",
      sub: "macOS n'a pas de minuteur intégré. C'est le poste le plus important si l'hyperfocus est votre pente naturelle.",
      bullets: [
        <>
          Une automatisation <em>Shortcuts</em> à heure fixe : une alerte, ou un verrouillage
          d'écran.
        </>,
        <>
          Ou Stretchly (libre) / Time Out : micro-pause toutes les 20 min, pause longue toutes les
          heures.
        </>,
        <>
          Un repère de temps ambiant — compte à rebours en barre de menus, ou minuteur physique à
          disque. Une horloge qu'il faut penser à consulter ne sert à rien.
        </>,
        <>
          Des rappels corporels répétés pour boire et manger. La faim est le premier signal que la
          concentration écrase.
        </>,
        <>
          Une seule session d'agent à la fois. Trois en parallèle multiplient la charge, pas la
          production.
        </>,
      ],
    },
    teeth: {
      title: 'Donner du mordant',
      path: 'Screen Time › Lock Screen Time Settings',
      body: (
        <p className="mb-3">
          Un code est alors exigé pour accéder aux réglages et pour accorder du temps supplémentaire
          quand une limite expire. Générez-le au hasard et rangez-le dans votre gestionnaire de mots
          de passe : le délai d'accès casse l'impulsion sans vous enfermer dehors.
        </p>
      ),
      warning: (
        <>
          Aucun de ces réglages n'agit sur la charge qu'on vous confie, sur le flou des attentes, ni
          sur un TDAH non accompagné — les trois causes qui reviennent le plus dans les burn-out à
          répétition. L'outillage amortit ; il ne soigne pas. La médecine du travail est gratuite,
          accessible à votre initiative, et couverte par le secret médical.
        </>
      ),
    },
    footnote:
      "Tous les intitulés de menus et les noms de Focus sont donnés en anglais, parce que c'est ainsi qu'ils apparaissent sur un macOS configuré en anglais — ce que vous lisez ici correspond donc mot pour mot à ce que vous avez sous les yeux. Relevés sur macOS Tahoe 26. Ils changent d'une version à l'autre ; en cas de doute, l'aide d'Apple fait foi.",
    rows: {
      editors: { name: 'VS Code, terminal, iTerm2', why: "Outil de travail. Un compteur ici vous entraîne à ignorer toutes les alertes." },
      calls: { name: 'Zoom, Meet, Teams (visio)', why: 'Subi, pas choisi. Se règle par le calendrier.' },
      chat: { name: 'Slack, Teams (messagerie)', why: 'Deliver Quietly, pastilles coupées. Jamais de compteur.' },
      mail: { name: 'Mail, Outlook', why: 'Boîtes secondaires masquées. Relève groupée deux ou trois fois par jour.' },
      messages: { name: 'Messages, Téléphone', why: 'Rester joignable pendant Downtime.' },
      browsers: { name: 'Safari, Chrome, Arc', why: "Le navigateur est un outil de travail. On limite les sites, pas l'application." },
      music: { name: 'Spotify, Musique', why: 'Audio en fond, aucun coût attentionnel.' },
      social: { name: 'X, Reddit, LinkedIn', why: 'Catégorie Social ou URL. La coupure la plus rentable de toutes.' },
      aggregators: { name: 'Hacker News, agrégateurs', why: "La veille technique passe pour du travail. Elle n'en est pas." },
      video: { name: 'YouTube, Twitch', why: 'Tutoriels compris : le format vidéo dilate le temps.' },
      news: { name: "Sites d'actualité", why: 'Par URL plutôt que par catégorie, plus fiable.' },
      shortform: { name: 'Instagram, TikTok', why: 'Les seuls où une limite basse tient vraiment.' },
      games: { name: 'Steam, jeux', why: "Un horaire plutôt qu'un quota : le problème est l'heure, pas la durée." },
      seated: { name: 'Session sans se lever', why: 'Une alerte sonore répétée, pas une notification silencieuse.' },
      block: { name: 'Bloc de travail dense', why: 'Début ET fin automatiques. La coupure est le réglage qui compte.' },
      hydration: { name: 'Rappel boire et manger', why: "La faim est le premier signal que l'hyperfocus écrase." },
      warning: { name: 'Préavis avant Downtime', why: 'Une transition annoncée se respecte ; une coupure brutale se contourne.' },
      agents: { name: "Sessions d'agent simultanées", why: 'Une seule. Trois fils en parallèle multiplient la charge, pas la production.' },
    },
    mechanisms: {
      none: 'Aucun',
      callsFocus: 'Focus « Calls »',
      notifications: 'Notifications',
      focusFilters: 'Focus Filters',
      alwaysAllowed: 'Always Allowed',
      appLimitsUrl: 'App Limits (URL)',
      appLimitsDowntime: 'App Limits + Downtime',
      downtime: 'Downtime',
      stopSignal: "Signal d'arrêt",
      scheduledFocus: 'Focus programmé',
      shortcuts: 'Shortcuts',
      personalRule: 'Règle personnelle',
    },
    regimes: {
      relaxed: { label: 'Souple', note: "Pour une phase calme, ou pour commencer sans se braquer. La contrainte est surtout un repère." },
      standard: { label: 'Standard', note: 'Point de départ raisonnable pour une semaine de travail ordinaire.' },
      strict: { label: 'Strict', note: "Phase de récupération, ou retour après un épisode d'épuisement. Tenable quelques semaines, pas indéfiniment." },
      hyperfocus: { label: 'Hyperfocus', note: "Les quotas de distraction se relâchent, les signaux d'arrêt se resserrent. Le risque n'est pas de perdre trois heures sur Reddit, c'est la session de onze heures sans boire." },
    },
  },

  research: {
    cards: {
      jevons: {
        title: 'Le paradoxe de Jevons',
        body: "Rendez une ressource moins chère à utiliser et sa consommation totale augmente, au lieu de baisser. Jevons l'a remarqué à propos du charbon : des machines à vapeur plus efficaces ont conduit la Grande-Bretagne à en brûler bien davantage, pas moins. Le schéma a tenu depuis pour l'énergie et les transports.",
        so: "Appliqué à l'attention : rendre le code moins cher à produire conduit à produire plus de code. Cela ne conduit pas à des journées plus courtes.",
      },
      yerkes: {
        title: 'La courbe en U inversé',
        body: "L'idée familière selon laquelle la performance monte avec la pression jusqu'à un point, puis retombe. À manier avec précaution. L'expérience d'origine portait sur des souris, sur des tâches très simples, et un siècle de vulgarisation l'a étirée bien au-delà de ce que les données soutiennent.",
        so: "Utile comme image, pas comme mesure. Personne ne peut vous dire où se situe votre optimum, et il n'est pas le même d'un jour à l'autre.",
      },
      roy: {
        title: 'Restriction de production et effet cliquet',
        body: "Un sociologue se fait embaucher dans un atelier de Chicago et consigne ce qu'il observe. Les ouvriers payés à la pièce plafonnaient collectivement leur production, parce qu'une semaine exceptionnelle faisait réviser le tarif à la baisse — rendant toutes les semaines suivantes pires. Le pic devenait la norme attendue ; l'attente, elle, ne redescendait jamais.",
        so: "Se retenir ne fonctionne que si tout le monde le fait. Seul, vous perdez du terrain face à vos collègues sans ralentir le cliquet de façon mesurable.",
      },
      parkinson: {
        title: 'La loi de Parkinson',
        body: "Le travail se dilate jusqu'à occuper le temps disponible. Écrit comme une satire de l'administration britannique, et reconnu comme juste depuis. Un corollaire utile : une échéance courte abîme la qualité moins qu'on ne le craint, parce que l'essentiel de ce qu'elle supprime est l'hésitation.",
        so: "L'argument contre le fait de mesurer une journée à sa durée de présence. Remplir les heures ne produit pas plus de travail — cela produit le même, plus dilué.",
      },
      little: {
        title: 'La loi de Little',
        body: "Un résultat de théorie des files : le nombre de choses en cours égale leur cadence d'arrivée multipliée par le temps que chacune met à traverser. Retournez-la et elle dit que, à cadence donnée, réduire le nombre de choses ouvertes raccourcit proportionnellement le temps de chacune.",
        so: "Le seul argument pour « une chose à la fois » qui soit quantitatif plutôt que motivationnel. Il ne repose sur aucune hypothèse psychologique.",
      },
      amdahl: {
        title: "La loi d'Amdahl",
        body: "Accélérez une partie d'un travail et le reste continue exactement comme avant. Le gain sur l'ensemble est donc borné par ce que vous n'avez pas accéléré — et aucune puissance supplémentaire ne déplace cette borne. Amdahl parlait de processeurs ; le raisonnement vaut pour toute tâche faite de parties.",
        so: "Si six heures sur dix sont assistables, vous ne dépasserez jamais 2,5 fois, même avec un outil de vitesse illimitée. Élargir ce que l'outil atteint vaut plus que le rendre plus rapide.",
      },
      illich: {
        title: 'La contre-productivité',
        body: "Illich soutenait que les outils ont un seuil au-delà duquel ils produisent l'inverse de ce pour quoi ils ont été conçus. Son exemple : comptez les heures travaillées pour payer une voiture, ajoutez-y les heures passées à la conduire, et la voiture se révèle vous déplacer moins vite qu'un vélo.",
        so: "La question à poser sur un outil de productivité n'est donc pas s'il fait gagner du temps. C'est où se situe son point de retournement, et de quel côté vous êtes.",
      },
      goodhart: {
        title: 'La loi de Goodhart',
        body: "Dès qu'une mesure devient un objectif, elle cesse d'être une bonne mesure — parce que tout le monde se met à optimiser le chiffre plutôt que la chose que le chiffre représentait. Goodhart écrivait sur la politique monétaire ; c'est l'anthropologue Marilyn Strathern qui lui a donné la formulation qu'on cite aujourd'hui.",
        so: "Tout signal de productivité que vous rendez visible finira optimisé, par vous ou contre vous. Ce qui plaide fortement pour convertir un gain en choses que personne ne compte.",
      },
      brooks: {
        title: 'La loi de Brooks',
        body: "Ajouter des gens à un projet logiciel en retard le retarde davantage. La raison : le coût de maintenir tout le monde synchronisé croît plus vite que la capacité qu'apporte chaque nouvelle personne.",
        so: "Cela vaut aussi pour plusieurs sessions d'agent en parallèle. Trois fils simultanés sont trois choses à tenir en tête, et ce coût de coordination, c'est vous qui le payez, pas la machine.",
      },
      burnout: {
        title: 'Ce qui cause réellement le burn-out',
        body: "Trois programmes de recherche qui aboutissent à des réponses compatibles. La tension vient d'exigences fortes combinées à peu de latitude sur la façon d'y répondre (Karasek) ; d'un décalage durable entre ce que l'on donne et ce que l'on reçoit, reconnaissance et sécurité de l'emploi comprises (Siegrist). L'épuisement lui-même se manifeste sur trois axes : fatigue, cynisme, sentiment d'inefficacité (Maslach).",
        so: "Aucune de ces variables n'est un nombre d'heures. Une charge lourde mais choisie, reconnue, aux contours nets, abîme bien moins qu'une charge moyenne sous des attentes que personne n'énonce.",
      },
      gustafson: {
        title: 'La loi de Gustafson',
        body: "La réfutation, vingt ans plus tard. En pratique, personne ne garde une tâche de la même taille pour finir plus tôt : on prend une tâche plus grosse dans le même temps. Dès lors, le plafond cesse d'être ce qui vous limite.",
        so: "C'est le cliquet, écrit en arithmétique. Choisir entre les deux lois n'est pas une question technique : c'est savoir si le gain vous achète une fin de journée plus tôt ou une charge plus grosse.",
      },
      leroy: {
        title: 'Le résidu attentionnel',
        body: "Quand vous changez de tâche, une part de votre attention reste accrochée à la précédente — surtout si vous l'avez laissée inachevée. Leroy a montré que l'effet est mesurable : la performance sur la nouvelle tâche est dégradée, et le reste un moment.",
        so: "Le coût d'une interruption n'est pas la durée de l'interruption. C'est la plage de travail dégradé qui suit. À rapprocher de l'effet Zeigarnik de 1927 : l'inachevé revient en tête.",
      },
      acemoglu: {
        title: 'Pouvoir et progrès',
        body: "Mille ans de changement technique, et le constat qui les traverse : une technologie nouvelle n'améliore pas automatiquement le sort de tout le monde. Que les gains soient partagés ou captés dépend de qui détient le rapport de force au moment où elle arrive — le moulin médiéval a enrichi les abbés, et le premier siècle de machines industrielles a fait baisser le niveau de vie avant de le relever.",
        so: "La version longue de la dernière question de cette page. Le sort de votre propre gain ne se décide pas à la qualité de l'outil. Il se décide dans l'arrangement sous lequel vous travaillez, et les arrangements sont faits par des gens.",
      },
      economicIndex: {
        title: 'Mesurer la portée, enfin',
        body: "La seule tentative publique de mettre un chiffre sur le paramètre dont cette page dépend. Anthropic échantillonne ses propres conversations Claude.ai et son trafic API, les rattache à des tâches professionnelles, et les répartit entre augmentation — la personne garde les décisions — et automatisation, où le travail est délégué en entier. Le rapport de janvier 2026 situe ce partage à 52 % contre 45 %.",
        so: "À lire comme la meilleure estimation disponible de la portée, et rien de plus. C'est un fournisseur qui mesure son propre produit, il ne voit que Claude, et il observe des conversations plutôt que ce qu'est devenu le poste de qui que ce soit — limites que ses auteurs énoncent eux-mêmes.",
      },
    },
    designator: 'Les sources',
    title: "D'où vient tout ceci",
    sub: (count, from, to) =>
      `${count} travaux, dans l'ordre de leur publication — d'un livre sur le charbon britannique en ${from} à une étude d'usage en ${to}. Deux d'entre eux sont ce que l'instrument calcule réellement. Les autres sont là pour expliquer pourquoi les chiffres seuls ne suffisent pas, et dans trois cas pourquoi il faut les manier avec précaution.`,
    inInstrument: "Dans l'instrument",
    here: 'Ici',
    to: 'à',
    caveat: (
      <>
        Ces références sont données pour que vous alliez lire les originaux, pas comme preuve.
        Plusieurs sont des modèles ou des études de terrain isolées plutôt que des lois au sens
        physique, et deux d'entre elles — la courbe en U inversé surtout — ont été généralisées bien
        au-delà de ce que leurs données soutiennent.
      </>
    ),
    portraits: (
      <>
        <strong className="text-ink font-semibold">Portraits.</strong> Servis par Wikimedia Commons,
        pas par ce site, et utilisés sous la licence que porte chaque fichier. Là où Wikipédia n'a
        pas de photo libre, la plaque affiche des initiales.
      </>
    ),
  },
};
