/* Bouliw · English / French.
   The page is written in English. This swaps in the French copy, remembers the choice and
   otherwise follows the browser language. */
(() => {
  const KEY = 'bouliw-lang';
  const FR = {
    "t0": "Aller aux projets",
    "t1": "Des logiciels qui travaillent <em>là où sont vos&nbsp;fichiers.</em>",
    "t2": "Je développe des applications et des outils en ligne de commande pour régler des problèmes que j'ai vraiment, puis je les publie en open source. La plupart tournent entièrement en local : vidéos, audio, logs et documents restent sur la machine.",
    "t3": "Premier montage pour Final Cut Pro",
    "t4": "Transcription des appels",
    "t5": "Détection logs et agents IA",
    "t6": "Assistant vocal en local",
    "t7": "Prompteur qui suit la voix",
    "t8": "Réparation de bibliothèque musicale",
    "t9": "OCR privé",
    "t10": "Outils Mac du quotidien",
    "t11": "Correctif upstream, fusionné",
    "t12": "Télécharger pour Mac",
    "t13": "Code source sur GitHub",
    "t14": "01 · Montage vidéo",
    "t15": "Transforme un dossier de rushes en premier montage dans Final Cut Pro.",
    "t16": "Glissez un dossier sur la fenêtre et appuyez sur Edit. Whisper transcrit chaque mot avec son horodatage sur le Mac, puis le modèle de langage de votre choix choisit les prises. Les scripts transforment ses coupes en une timeline FCPXML précise à l'image près, avec sous-titres et jusqu'à trois Shorts verticaux. Chaque timeline est vérifiée avec la DTD fournie dans Final Cut Pro avant d'être importée.",
    "t17": "Test réel : 47 min de vlog en 4K sont devenues un premier montage de 22 min et trois Shorts, en 31 min.",
    "t18": "02 · Transcription des appels",
    "t19": "La transcription de vos appels et de vos cours, sur Mac et sur Windows, avec chaque voix distinguée.",
    "t20": "Sur Mac, choisissez Teams, Zoom ou Chrome dans la barre des menus et Earshot ne transcrit que le son de cette app, en direct ou une fois l'appel terminé. Il capte la sortie de l'app elle-même grâce à Core Audio : les sons du système restent hors de la transcription, et aucun bot ne rejoint l'appel.",
    "t21": "Sur Windows, il enregistre le son du PC et votre micro sur deux pistes, puis écrit la transcription à la fin de l'appel, chaque voix distinguée. Sur Mac, le nom des intervenants dans Teams vient de ses sous-titres en direct, les sessions sont classées sous leur événement du calendrier, et des sous-titres en direct peuvent flotter au-dessus de n'importe quelle fenêtre.",
    "t22": "Rien n'est envoyé en ligne : la capture et la transcription tournent toutes les deux sur votre ordinateur.",
    "t23": "03 · Détection des menaces",
    "t24": "Un outil blue team qui transforme des logs bruts en un rapport lisible par un analyste.",
    "t25": "Vigie lit les journaux d'événements Windows (Sysmon et PowerShell compris), les fichiers auth.log de Linux, le journal unifié de macOS et les journaux d'activité des agents IA et des applications LLM. Il y applique des règles Sigma avec son propre moteur et rattache chaque alerte à MITRE ATT&amp;CK hors ligne, ou aux Top 10 de l'OWASP quand la cible est un système d'IA. Il fonctionne sur des logs collectés ou en direct, depuis une application ou le terminal.",
    "t26": "Des règles de corrélation repèrent la force brute, le password spraying et une connexion réussie juste après une attaque par force brute. Côté IA, Vigie signale les injections de prompt, les fuites de prompt système et les outils MCP dont la description cache des instructions pour le modèle.",
    "t27": "53 règles Sigma, chacune testée avec des cas positifs et négatifs.",
    "t28": "Exemple de rapport",
    "t28b": "Télécharger pour Windows et Mac",
    "t29": "04 · Assistant vocal",
    "t30": "Un assistant vocal pour macOS qui tourne à 100&nbsp;% sur le Mac.",
    "t31": "Maintenez une touche ou dites son nom, puis parlez en français ou en anglais : ouvrir des apps, piloter YouTube dans Safari, lancer des minuteurs, envoyer un message ou dicter. Les commandes simples passent par des règles en 0,2&nbsp;s environ, et un modèle local n'intervient que pour les demandes libres.",
    "t32": "Aucun serveur ne tourne, même pas sur localhost. Les messages et les rappels sont relus d'abord, et Boulito attend un oui clair.",
    "t33": "Parakeet et Qwen 3.5 tournent avec MLX, sans aucun port ouvert.",
    "t34": "\n      <li>«&nbsp;Ouvre Notes&nbsp;»</li>\n      <li>«&nbsp;Lance la deuxième&nbsp;»</li>\n      <li>«&nbsp;Passe la pub&nbsp;»</li>\n      <li>«&nbsp;Minuteur 10 minutes&nbsp;»</li>\n      <li lang=\"en\">“Pause it” <small>EN</small></li>\n    ",
    "t35": "05 · Prompteur",
    "t36": "Un prompteur qui suit votre voix en français et en anglais, entièrement sur le Mac.",
    "t37": "Le texte s'affiche sous l'encoche du MacBook ou dans une fenêtre flottante, et chaque mot s'allume quand vous le prononcez. Dites «&nbsp;on la refait&nbsp;» ou «&nbsp;take two&nbsp;», ou relisez simplement la phrase : le texte revient en arrière et la reprise est notée avec son minutage, dans un fichier de session qu'un outil de montage peut utiliser.",
    "t38": "C'est un fork de <a class=\"more\" href=\"https://github.com/f/textream\">Textream</a>.",
    "t39": "Reconnaissance vocale en local avec SpeechAnalyzer. Pas de compte, pas de statistiques.",
    "t40": "Takeline suit votre voix, <mark>mot</mark> <span class=\"next\">par mot, et revient en arrière quand vous relisez une phrase.</span>",
    "t41": "↺ Reprise notée · 00:42",
    "t42": "06 · Bibliothèque musicale",
    "t43": "Répare une bibliothèque Musique de macOS pleine de fichiers locaux.",
    "t44": "Il est pensé pour les rips YouTube et les albums enregistrés en un seul long fichier. trackmend nettoie les titres et retrouve sur Deezer la vraie pochette, l'album, l'année et le numéro de piste. Il ajoute aussi les paroles depuis LRCLIB et supprime les doublons. Les albums complets sont découpés en une piste par chanson.",
    "t45": "Les modifications passent par l'app Musique elle-même : chaque piste est retrouvée par son identifiant persistant, donc Musique les prend toutes en compte.",
    "t46": "Simulation par défaut. Chaque modification est d'abord sauvegardée, et <code>trackmend undo</code> remet tout comme avant.",
    "t47": "07 · OCR privé",
    "t48": "OCR et extraction de texte en local pour un dossier de paperasse.",
    "t49": "Donnez-lui des PDF scannés et des photos de tickets prises au téléphone : vous obtenez un fichier texte brut par document, plus un manifeste que grep ou n'importe quel autre outil peut lire. L'OCR tourne sur le Mac avec Apple Vision, et les originaux ne sont jamais modifiés.",
    "t50": "Les traitements sont incrémentaux : seuls les documents modifiés sont traités à nouveau.",
    "t51": "Zéro dépendance : la bibliothèque standard de Python et les frameworks fournis avec macOS.",
    "t52": "08 · Outils du quotidien",
    "t53": "De petits outils que j'utilise tous les jours, dans un seul script d'installation.",
    "t54": "HeadsetGuard empêche un casque Bluetooth de couper les sons courts, CleanLinks retire les paramètres de suivi des liens copiés, et des actions rapides du Finder transcrivent une vidéo ou la compressent pour Discord. Deux actions de partage de Safari téléchargent une vidéo ou l'envoient sur une TV LG, au moment où vous en êtes.",
    "t55": "La plupart tournent en arrière-plan, en tant que launch agents.",
    "t56": "Relancer <code>./install.sh</code> met tout à jour sur place.",
    "t57": "casque Bluetooth : plus de sons coupés, son micro n'est jamais choisi automatiquement",
    "t58": "retire les paramètres de suivi (utm, fbclid, ?si=…) des liens copiés",
    "t59": "compteur de FPS Metal dans les jeux",
    "t60": "Finder : Transcrire, Compresser pour Discord, Alléger le PDF, Retirer les métadonnées",
    "t61": "menu Partager : Télécharger la vidéo (yt-dlp, mis à jour chaque jour)",
    "t62": "menu Partager : envoyer une vidéo YouTube ou une chaîne Twitch sur une TV LG",
    "t63": "Safari : image dans l'image automatique quand vous changez d'onglet",
    "t64": "fond d'écran du système synchronisé avec Wallper",
    "t65": "FineTune recompilé : volume par app, périphériques audio laissés à macOS",
    "t66": "Correctif d'une ligne dans la formule whisper.cpp, fusionné dans homebrew-core.",
    "t67": "Après l'installation de whisper.cpp, les avertissements de Homebrew renvoyaient vers un hébergeur de modèles qui répond désormais par une erreur 404. J'ai remplacé le lien par le dossier des modèles du dépôt upstream, qui liste les modèles disponibles et comment les télécharger.",
    "t68": "Fusionné le 13 oct. 2026",
    "t69": "Client Jellyfin stylé",
    "t70": "09 · Home cinéma",
    "t71": "Un client stylé pour ma médiathèque Jellyfin, sur le Mac, une TV LG et les téléphones.",
    "t72": "Une seule app web en TypeScript : elle s'installe depuis Safari sur le Mac et les téléphones, et devient une app webOS sur la TV, où chaque appui sur la télécommande répond instantanément. Jellyfin reste le moteur ; Lantern ne remplace que l'interface.",
    "t73": "Les films d'une collection deviennent des sagas, les recommandations viennent d'un petit moteur qui tourne dans l'app et apprend de ce que je regarde, et le lecteur choisit seul entre lecture directe et flux du serveur, avec saut du générique, aperçus sur la barre de lecture et épisode suivant.",
    "t74": "Huit styles, chacun avec ses animations, ses sons d'interface et sa musique d'ambiance générative.",
    "t75": "Référencé dans Awesome MLX"
  };
  const FR_ATTR = {
    "a0": "Ailleurs",
    "a1": "Projets",
    "a2": "Formes d'onde d'une prise brute de 30,7 s avec les passages gardés en surbrillance, puis le premier montage de 16,3 s qui en est tiré",
    "a3": "Fenêtre de Roughcut : les rushes de démo sont prêts, un montage de 20 minutes et trois Shorts, avec un bouton Ouvrir dans Final Cut Pro",
    "a4": "Le panneau d'Earshot dans la barre des menus liste les apps qui jouent du son, puis la transcription en direct d'un cours sur Teams se remplit avec le nom des intervenants (données de démo)",
    "a5": "Haut d'un rapport HTML de Vigie : le verdict, le nombre d'alertes par gravité et les tactiques MITRE ATT&CK correspondantes",
    "a6": "L'icône de Boulito à côté d'exemples de commandes vocales : Ouvre Notes, Lance la deuxième, Passe la pub, Minuteur 10 minutes, Pause it",
    "a7": "Illustration : un texte sous l'encoche du MacBook, avec le mot en cours de lecture surligné et une reprise notée",
    "a8": "Rapport d'analyse de trackmend sur une bibliothèque d'exemple de douze fichiers, avant et après les commandes de tags, de paroles et de dédoublonnage",
    "a9": "Terminal : des documents fictifs extraits en texte, puis le texte OCR d'une quittance de loyer scannée",
    "a10": "La modification d'une ligne dans Formula/w/whisper.cpp.rb",
    "a11": "La page d'accueil de Lantern dans le style P5 : une grande bannière pour une saga, puis des rangées de titres"
  };
  const TITLE_FR = "Bouliw · Des logiciels qui travaillent là où sont vos fichiers";
  const root = document.documentElement;
  const btn = document.querySelector('.lang-toggle');
  const nodes = [...document.querySelectorAll('[data-i18n]')];
  const en = new Map(nodes.map(n => [n, n.innerHTML]));
  const attrNodes = [...document.querySelectorAll('[data-i18n-alt], [data-i18n-aria]')];
  const enAttr = new Map(attrNodes.map(n => [n, { alt: n.getAttribute('alt'), aria: n.getAttribute('aria-label') }]));
  const titleEn = document.title;
  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const save = v => { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked: the choice just isn't kept */ } };
  let current = 'en';

  function apply(lang) {
    const fr = lang === 'fr';
    nodes.forEach(n => { n.innerHTML = fr ? FR[n.dataset.i18n] : en.get(n); });
    attrNodes.forEach(n => {
      const orig = enAttr.get(n);
      if (n.dataset.i18nAlt) n.setAttribute('alt', fr ? FR_ATTR[n.dataset.i18nAlt] : orig.alt);
      if (n.dataset.i18nAria) n.setAttribute('aria-label', fr ? FR_ATTR[n.dataset.i18nAria] : orig.aria);
    });
    document.title = fr ? TITLE_FR : titleEn;
    root.lang = lang;
    current = lang;
    if (btn) {
      // The button offers the other language, named in that language.
      btn.setAttribute('aria-label', fr ? 'English' : 'Français');
      btn.setAttribute('lang', fr ? 'en' : 'fr');
      btn.title = fr ? 'English' : 'Version française';
    }
  }

  let want = read();
  if (want !== 'fr' && want !== 'en') {
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    want = /^fr\b/i.test(nav) ? 'fr' : 'en';
  }
  apply(want);
  root.classList.remove('i18n-pending');

  if (btn) btn.addEventListener('click', () => {
    const next = current === 'fr' ? 'en' : 'fr';
    save(next);
    document.dispatchEvent(new Event('bouliw:beforelang'));
    apply(next);
    document.dispatchEvent(new Event('bouliw:afterlang'));
  });
})();
