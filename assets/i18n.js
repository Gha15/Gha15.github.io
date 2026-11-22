/* =====================================================================
   Matix language setting: English / French (1.0.0)
   - Picked with the 🌐 button in the top bar, remembered on this device.
   - W.tr(text)  translates one UI string (used by the Arcade).
   - W.trq(text) translates generated math/problem text (Arcade questions).
   - A small observer also translates the site's own text (menu, home page,
     sign-in, account) and puts the English back when you switch back.
   ===================================================================== */
(function(){
'use strict';
var W=window,D=document;
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch(e){return null;}}
var LANGS=['en','fr'];
var lang=(function(){var v=ls('mx_lang');if(v==='fr'||v==='en')return v;try{if(/^fr/i.test(navigator.language||''))return 'fr';}catch(e){}return 'en';})();

/* French school levels for Grade 1 ... 12 */
var FRG=[null,'CP','CE1','CE2','CM1','CM2','6ème','5ème','4ème','3ème','Seconde','Première','Terminale'];
var FR={
/* ---- site ---- */
'Skip to content':'Passer au contenu','Interactive games':'Jeux interactifs','Download app':'Télécharger l’app','Privacy':'Confidentialité','Close':'Fermer','Main':'Principal',
'Sign in':'Se connecter','Sign out':'Se déconnecter','My account':'Mon compte','Owner':'Propriétaire','Loading…':'Chargement…','Later':'Plus tard','Save':'Enregistrer','Confirm':'Confirmer',
'Sign in to Matix':'Connexion à Matix','Use your username or email, and the same password as the app.':'Utilise ton nom d’utilisateur ou ton e-mail, et le même mot de passe que dans l’app.',
'Username or email':'Nom d’utilisateur ou e-mail','Username':'Nom d’utilisateur','Email':'E-mail','Password':'Mot de passe','New password':'Nouveau mot de passe','Repeat new password':'Répète le nouveau mot de passe','Current password':'Mot de passe actuel','New email':'Nouvel e-mail',
' Keep me signed in on this device':' Garder ma session ouverte sur cet appareil','Keep me signed in on this device':'Garder ma session ouverte sur cet appareil',
'Forgot your password?':'Mot de passe oublié ?','New to Matix? ':'Nouveau sur Matix ? ','Create an account':'Créer un compte','Create account':'Créer le compte','Create your Matix account':'Crée ton compte Matix',
'It works in the app too. We send a code to your email to check it is yours.':'Il fonctionne aussi dans l’app. Nous envoyons un code à ton e-mail pour vérifier qu’il est bien à toi.',
'Already have an account? ':'Tu as déjà un compte ? ','📬 Check your email':'📬 Vérifie ton e-mail','We sent a 6-digit code to ':'Nous avons envoyé un code à 6 chiffres à ','. It works for 15 minutes.':'. Il est valable 15 minutes.','.':'.',
'Verify my email':'Vérifier mon e-mail','Send a new code':'Envoyer un nouveau code','6-digit code':'Code à 6 chiffres','🔑 Forgot your password?':'🔑 Mot de passe oublié ?',
'Type your username and the email on your account. We will email you a 6-digit code.':'Saisis ton nom d’utilisateur et l’e-mail de ton compte. Nous t’enverrons un code à 6 chiffres.',
'Send reset code':'Envoyer le code','← Back to sign in':'← Retour à la connexion','Back to sign in':'Retour à la connexion','Change password':'Changer le mot de passe','Send code':'Envoyer le code',
'That code expired. Send a new one.':'Ce code a expiré. Envoie-en un nouveau.','Too many wrong tries. Send a new code.':'Trop d’essais ratés. Envoie un nouveau code.','No active code. Send a new one.':'Aucun code actif. Envoie-en un nouveau.','Wrong code.':'Code incorrect.',
'Email sending is not set up yet. Ask the owner.':'L’envoi d’e-mails n’est pas encore configuré. Demande au propriétaire.','Could not send the email. Check your connection and try again.':'Impossible d’envoyer l’e-mail. Vérifie ta connexion et réessaie.',
'Enter your username (or email) and password.':'Saisis ton nom d’utilisateur (ou e-mail) et ton mot de passe.','No account uses that email.':'Aucun compte n’utilise cet e-mail.','Wrong username/email or password.':'Nom d’utilisateur, e-mail ou mot de passe incorrect.',
'This account has been suspended by the owner.':'Ce compte a été suspendu par le propriétaire.','Could not reach Matix. Check your connection.':'Impossible de joindre Matix. Vérifie ta connexion.',
'Pick a username with at least 2 letters or numbers.':'Choisis un nom d’utilisateur d’au moins 2 lettres ou chiffres.','Enter a real email address.':'Saisis une vraie adresse e-mail.','Use a password with at least 4 characters.':'Utilise un mot de passe d’au moins 4 caractères.',
'That username is taken.':'Ce nom d’utilisateur est déjà pris.','That email is already used by another account.':'Cet e-mail est déjà utilisé par un autre compte.','Something went wrong. Try again.':'Un problème est survenu. Réessaie.',
'Type your username and a real email address.':'Saisis ton nom d’utilisateur et une vraie adresse e-mail.','This account has no email connected yet. Ask the owner for help.':'Ce compte n’a pas encore d’e-mail. Demande de l’aide au propriétaire.',
'That username and email do not match.':'Ce nom d’utilisateur et cet e-mail ne correspondent pas.','Password too short (min 4).':'Mot de passe trop court (4 minimum).','The two passwords are different.':'Les deux mots de passe sont différents.',
'You can verify your email any time from your account.':'Tu peux vérifier ton e-mail à tout moment depuis ton compte.','📬 New code sent':'📬 Nouveau code envoyé','✅ Email verified':'✅ E-mail vérifié','✅ Email changed':'✅ E-mail modifié','✅ Saved':'✅ Enregistré',
'We could not send the code now. Verify later from your account.':'Impossible d’envoyer le code maintenant. Vérifie plus tard depuis ton compte.',
'🔑 Password changed. Sign in with your new password.':'🔑 Mot de passe modifié. Connecte-toi avec ton nouveau mot de passe.','🔑 Password changed. Other devices were signed out.':'🔑 Mot de passe modifié. Les autres appareils ont été déconnectés.',
'Wrong password.':'Mot de passe incorrect.','Could not save. Check your connection.':'Impossible d’enregistrer. Vérifie ta connexion.','Could not load your account. Check your connection.':'Impossible de charger ton compte. Vérifie ta connexion.',
'👤 My account':'👤 Mon compte','Your email and password. Your email is private: nobody else can see it.':'Ton e-mail et ton mot de passe. Ton e-mail est privé : personne d’autre ne peut le voir.',
'Verified':'Vérifié','Not verified':'Non vérifié','not connected':'non connecté','Change email':'Changer l’e-mail','Connect email':'Associer un e-mail','Show':'Afficher','Hide':'Masquer','✅ Verify my email':'✅ Vérifier mon e-mail',
'🔑 Change password':'🔑 Changer le mot de passe','Sign in to use':'Connecte-toi pour utiliser','Use your Matix account, or create one in a few seconds.':'Utilise ton compte Matix, ou crées-en un en quelques secondes.','Games could not load.':'Impossible de charger les jeux.',
'📲 The Matix app':'📲 L’app Matix','Math you can ':'Des maths à ','watch, play':'regarder, jouer',' and share.':' et partager.',
'103 one-minute video lessons from Grade 1 to college, 21 math games you can play at home or in class, end-to-end encrypted chat and friends. Made by and for the Matix math club.':'103 leçons vidéo d’une minute du niveau 1 à l’université, 21 jeux de maths à jouer à la maison ou en classe, un chat chiffré de bout en bout et des amis. Fait par et pour le club de maths Matix.',
'Everything in one app':'Tout dans une seule app','Free, made for students, and it works offline once installed.':'Gratuite, pensée pour les élèves, et elle fonctionne hors ligne une fois installée.',
'🎬 Grade 1 to college':'🎬 Du niveau 1 à l’université','One-minute animated lessons: from how to add, through fractions and equations, to derivatives, integrals and matrices. Each one ends with a quiz.':'Des leçons animées d’une minute : de l’addition aux fractions et aux équations, jusqu’aux dérivées, intégrales et matrices. Chacune se termine par un quiz.',
'🎮 Matix Arcade':'🎮 Matix Arcade','21 games + smart-board class exercises: Castle Defense, Owl Flight, Bomb Defuse, Math Race, Number Snake, Asteroid Answers and more. Play at home, or in class with two teams.':'21 jeux + exercices de classe pour tableau interactif : Défense du château, Vol du hibou, Désamorçage, Course de maths, Serpent des nombres, Réponses astéroïdes et plus. À la maison, ou en classe avec deux équipes.',
'🔒 Encrypted Math Chat':'🔒 Chat de maths chiffré','Chat with the club, send equations and stickers. Messages are end-to-end encrypted: only you and your friend can read them.':'Discute avec le club, envoie des équations et des autocollants. Les messages sont chiffrés de bout en bout : toi et ton ami(e) seuls pouvez les lire.',
'🤝 Friends & points':'🤝 Amis et points','Add friends, earn points, climb the leaderboard and share ideas with the club.':'Ajoute des amis, gagne des points, grimpe au classement et partage tes idées avec le club.',
'♿ Easy for everyone':'♿ Facile pour tous','Bigger text, high contrast, bigger buttons, dark mode and reduced motion, plus Arabic, French and Spanish.':'Texte plus grand, contraste élevé, gros boutons, mode sombre et animations réduites, plus l’arabe, le français et l’espagnol.',
'✨ Matix AI':'✨ Matix IA','Stuck? Ask Matix AI. It shows its working step by step, like a patient tutor.':'Bloqué ? Demande à Matix IA. Elle montre son raisonnement étape par étape, comme un tuteur patient.',
'From counting to calculus':'Du comptage au calcul différentiel','A peek at the video course.':'Un aperçu du cours vidéo.','Get Matix':'Obtenir Matix','Install it and start with any grade.':'Installe-la et commence au niveau de ton choix.',
'Grade 1 · Counting to 10':'CP · Compter jusqu’à 10','Grade 4 · 6 and 7 times tables':'CM1 · Tables de 6 et de 7','Grade 7 · Probability':'5ème · Probabilités','Grade 8 · Slope':'4ème · Pente','Grade 11 · The unit circle':'Première · Le cercle trigonométrique','Grade 12 · The integral':'Terminale · L’intégrale','College · Matrices':'Université · Matrices',
'Grade 3 · Fractions \u00a0 Grade 12 · Derivatives':'CE2 · Fractions \u00a0 Terminale · Dérivées','Team A':'Équipe A','Team B':'Équipe B','Grade 8 · Pythagoras · 1:01':'4ème · Pythagore · 1:01','Grade 3 · Fractions':'CE2 · Fractions','Grade 12 · Derivatives':'Terminale · Dérivées',
'Get it on':'Disponible sur','Download on the':'Télécharger sur','Coming soon':'Bientôt disponible','🔒 Coming soon':'🔒 Bientôt disponible',
'Language':'Langue',
/* ---- arcade ---- */
'Matix Arcade':'Matix Arcade','Real games, real maths. Pick your grade and the games and questions are made for it.':'De vrais jeux, de vraies maths. Choisis ton niveau : les jeux et les questions sont faits pour lui.','games':'jeux','games for':'jeux pour','smart-board exercises':'exercices pour tableau interactif','Smart-board exercises':'Exercices pour tableau interactif',
'At home':'À la maison','In class':'En classe','Where are you playing?':'Où joues-tu ?','Difficulty':'Difficulté','Pick the class':'Choisis la classe','Grade':'Niveau','Grades':'Niveaux','All grades':'Tous niveaux','College':'Université',
'Only my grade':'Seulement mon niveau','Show all games':'Voir tous les jeux','Team games':'Jeux d’équipe','Team A name':'Nom de l’équipe A','Team B name':'Nom de l’équipe B','Next to play':'Prochaine équipe','switch':'changer','reset scores':'remettre à zéro',
'Class mode is for the smart board. Pick an exercise below: a big problem, a pen board for working it out, and the worked answer to reveal. Two teams take turns and the points add up.':'Le mode classe est fait pour le tableau interactif. Choisis un exercice : un grand problème, un tableau avec stylo pour le résoudre, et la solution détaillée à dévoiler. Deux équipes jouent à tour de rôle et les points s’additionnent.',
'Best':'Record','Exit game':'Quitter le jeu','Exit':'Quitter','Lives':'Vies','Pause':'Pause','Resume':'Reprendre','Paused':'En pause','Game over':'Partie terminée','New best score!':'Nouveau record !','Play again':'Rejouer','Back to games':'Retour aux jeux','Pick another game':'Choisir un autre jeu','Pick another exercise':'Choisir un autre exercice',
'scored':'a marqué','your turn':'à toi de jouer','Total this class':'Total de la classe','wins this round!':'gagne cette manche !','It\u2019s a tie!':'Égalité !','Question':'Question','Pen':'Stylo','Eraser':'Gomme','Undo':'Annuler','Clear':'Effacer','Show answer':'Voir la réponse','Check order':'Vérifier l’ordre','No points':'Aucun point','steals':'vole','Perfect order!':'Ordre parfait !','Not quite. The right order is:':'Pas tout à fait. Le bon ordre est :',
'Smallest \u2192 largest':'Du plus petit au plus grand','Largest \u2192 smallest':'Du plus grand au plus petit',
'Asteroid Answers':'Réponses astéroïdes','Blast the asteroid with the right answer before it hits your ship.':'Détruis l’astéroïde portant la bonne réponse avant qu’il touche ton vaisseau.',
'True or False Rush':'Vrai ou Faux express','Is it right or wrong? Decide before the time bar runs out. The bar gets shorter and shorter.':'Juste ou faux ? Décide avant la fin de la barre de temps. Elle raccourcit de plus en plus.','TRUE':'VRAI','FALSE':'FAUX','True or false?':'Vrai ou faux ?','Nope!':'Non !',
'Castle Defense':'Défense du château','Monsters march on your castle. Answer the sum over the front monster to zap it. Wrong answers make it run faster!':'Des monstres marchent sur ton château. Résous le calcul du premier monstre pour le foudroyer. Une erreur le fait courir plus vite !','A monster broke in!':'Un monstre est entré !',
'Owl Flight':'Vol du hibou','Tap to flap. Fly Hoot through the gap with the right answer. Hitting a post, the ground or a wrong gap costs a life.':'Touche pour battre des ailes. Fais passer Hoot dans l’ouverture de la bonne réponse. Un poteau, le sol ou une mauvaise ouverture coûte une vie.','Tap to fly!':'Touche pour voler !','Wrong gap!':'Mauvaise ouverture !','Bonk!':'Aïe !',
'Balloon Pop':'Éclate-ballons','Pop every balloon that follows the rule. Watch out, the rule changes!':'Éclate tous les ballons qui suivent la règle. Attention, la règle change !','Pop the EVEN numbers':'Éclate les nombres PAIRS','Pop the ODD numbers':'Éclate les nombres IMPAIRS','Pop numbers bigger than 10':'Éclate les nombres plus grands que 10','Pop multiples of ':'Éclate les multiples de ','Pop: ':'Éclate : ',
'Number Snake':'Serpent des nombres','Steer the snake to the coin with the right answer. Wrong coins, walls and your own tail cost a life. Swipe, tap or use the arrows.':'Dirige le serpent vers la pièce portant la bonne réponse. Mauvaises pièces, murs et ta propre queue coûtent une vie. Glisse, touche ou utilise les flèches.','Wrong coin!':'Mauvaise pièce !',
'Bomb Defuse':'Désamorçage','Cut all three wires by answering right before the fuse burns down. Wrong answers burn the fuse faster!':'Coupe les trois fils en répondant juste avant que la mèche brûle. Une erreur la fait brûler plus vite !','The fuse burns faster!':'La mèche brûle plus vite !','Defused!':'Désamorcée !','Boom!':'Boum !','Wire':'Fil',
'Math Race':'Course de maths','Every right answer boosts your orange car. Beat the purple car to the finish, or lose a life. Each race gets harder.':'Chaque bonne réponse propulse ta voiture orange. Bats la voiture violette à l’arrivée, sinon tu perds une vie. Chaque course est plus difficile.','You win!':'Tu gagnes !','The purple car won!':'La voiture violette a gagné !','Spin out!':'Tête-à-queue !','Race':'Course','You':'Toi',
'Stepping Stones':'Pierres de la rivière','Hop Hoot across the river on the stone with the right answer before the stones sink. A wrong stone is a splash!':'Fais sauter Hoot sur la pierre de la bonne réponse avant qu’elles coulent. Une mauvaise pierre, c’est plouf !','Splash!':'Plouf !','The stones sank!':'Les pierres ont coulé !',
'Fruit Catcher':'Attrape-fruits','Slide the basket to catch the fruit with the right answer. Catch a wrong one, or let the right one fall, and you lose a life.':'Glisse le panier pour attraper le fruit de la bonne réponse. Un mauvais fruit, ou la bonne réponse qui tombe, et tu perds une vie.','Catch':'Attrape','Splat!':'Splat !','Yuck!':'Beurk !','You let it fall!':'Tu l’as laissé tomber !',
'Fruit Market Sums':'Marché aux fruits','Fill the basket so the prices add up to exactly the target.':'Remplis le panier pour que les prix totalisent exactement la cible.','Target':'Cible','Basket':'Panier','Basket emptied':'Panier vidé','Out of fruit!':'Plus de fruits !','Exactly right!':'Exactement !',
'Pizza Fractions':'Fractions pizza','Tap the slices to serve exactly the fraction the customer orders.':'Touche les parts pour servir exactement la fraction commandée.','Serve':'Sers','of the pizza':'de la pizza',
'Owl Runner':'Hibou coureur','Steer Hoot into the lane with the right answer. Swipe, tap a lane, or use the arrow keys.':'Dirige Hoot dans la voie de la bonne réponse. Glisse, touche une voie ou utilise les flèches.','Crash!':'Crash !','Wrong! It got faster':'Faux ! Ça va plus vite',
'Memory Match':'Mémoire','Flip two cards: match each question with its answer in as few moves as you can.':'Retourne deux cartes : associe chaque question à sa réponse en un minimum de coups.','Moves':'Coups',
'Search games':'Chercher un jeu','They got away!':'Ils se sont échappés !','Biggest to smallest':'Du plus grand au plus petit','Which is smaller?':'Laquelle est la plus petite ?','is not next':'n\'est pas le suivant','Answer the question before the timer runs out. Your character cheers every right answer.':'Réponds avant la fin du chrono. Ton personnage fête chaque bonne réponse.','True or false? Decide before the time bar runs out. It gets shorter and shorter.':'Vrai ou faux ? Décide avant la fin de la barre de temps. Elle raccourcit de plus en plus.','Two cards, one winner. Tap the smaller value, fast.':'Deux cartes, un gagnant. Touche la plus petite valeur, vite.','Two cards, one winner. Tap the bigger value, fast.':'Deux cartes, un gagnant. Touche la plus grande valeur, vite.','Tap every card that fits the rule: multiples, primes, squares, factors. A wrong tap costs a heart.':'Touche chaque carte qui suit la règle : multiples, nombres premiers, carrés, diviseurs. Une erreur coûte un cœur.','Fish Quiz':'Quiz des poissons','A school of fish swims by, each one carrying an answer. Tap the fish with the right one before they all swim away!':'Un banc de poissons passe, chacun portant une réponse. Touche celui qui a la bonne avant qu\'ils ne s\'enfuient !','They swam away!':'Ils sont partis !','Star Order':'Ordre des étoiles','Stars light up the evening sky. Tap them from the smallest number to the biggest. Fractions, roots and logs join in as you grow!':'Des étoiles brillent dans le ciel du soir. Touche-les du plus petit au plus grand. Fractions, racines et logarithmes arrivent avec l\'âge !','Smallest to biggest':'Du plus petit au plus grand','Great order!':'Bien rangé !','is not the smallest left':'n\'est pas le plus petit restant','Gem Hunt':'Chasse aux gemmes','Dig up every gem that fits the rule: multiples, primes, squares, factors. Miss one when time is up, or dig a wrong one, and you lose a heart.':'Déterre toutes les gemmes qui suivent la règle : multiples, nombres premiers, carrés, diviseurs. En rater une ou en creuser une mauvaise coûte un cœur.','Multiples of':'Multiples de','Prime numbers':'Nombres premiers','Perfect squares':'Carrés parfaits','Perfect cubes':'Cubes parfaits','Factors of':'Diviseurs de','All found!':'Toutes trouvées !','does not fit':'ne convient pas','Bigger Duel':'Duel des grands','Two cards, one winner. Tap the bigger value, fast. From 38 vs 83 to 5/8 vs 0.6, and √50 vs 7 for the older players.':'Deux cartes, un gagnant. Touche la plus grande valeur, vite. De 38 contre 83 à 5/8 contre 0,6, et √50 contre 7 pour les plus grands.','Which is bigger?':'Laquelle est la plus grande ?','Number Bonds':'Complémentaires','Tap two floating numbers that add up to the target. Wrong pair costs a heart, and the clock keeps ticking!':'Touche deux nombres flottants dont la somme vaut la cible. Une mauvaise paire coûte un cœur, et le temps file !','Make':'Fais','All paired!':'Tout est associé !','Time up!':'Temps écoulé !',
'Clock Master':'Maître de l’horloge','Read the clock before time runs out. From o\u2019clock and half past all the way to \u201cwhat time will it be in 1 h 35 min?\u201d':'Lis l’horloge avant la fin du temps. De l’heure pile et la demie jusqu’à « quelle heure sera-t-il dans 1 h 35 min ? »','What time is it?':'Quelle heure est-il ?','In':'Dans','it will be':'il sera','Too slow!':'Trop lent !','Not quite!':'Pas tout à fait !',
'Number Line Sniper':'Tireur de droite numérique','A marker races along the number line. Tap to stop it right on the target: whole numbers, fractions, negatives, roots, \u03c0 and logs.':'Un repère file le long de la droite numérique. Touche pour l’arrêter pile sur la cible : entiers, fractions, négatifs, racines, \u03c0 et logarithmes.','Stop on':'Arrête sur','Tap or press space to stop':'Touche ou appuie sur espace pour arrêter','Bullseye!':'En plein dans le mille !','Close!':'Presque !','Missed':'Raté',
'Angle Hunter':'Chasseur d’angles','Read angles, find the missing angle in a triangle, and crack regular polygons. Every wrong guess costs a heart.':'Lis des angles, trouve l’angle manquant d’un triangle et résous des polygones réguliers. Chaque erreur coûte un cœur.','How big is this angle?':'Quelle est la mesure de cet angle ?','Missing angle in the triangle?':'Angle manquant du triangle ?','One angle of a regular':'Un angle d’un','Largest angle?':'Le plus grand angle ?',
'pentagon':'pentagone régulier','hexagon':'hexagone régulier','octagon':'octogone régulier','nonagon':'ennéagone régulier','decagon':'décagone régulier','dodecagon':'dodécagone régulier',
'Factor Frenzy':'Frénésie des diviseurs','Bubbles float up. Pop only the ones that fit the rule: multiples, factors, primes, squares\u2026 Pop a wrong one and you lose a heart.':'Des bulles montent. Éclate seulement celles qui suivent la règle : multiples, diviseurs, nombres premiers, carrés… Une mauvaise bulle coûte un cœur.','Multiples of ':'Multiples de ','Factors of ':'Diviseurs de ','Prime numbers':'Nombres premiers','Perfect squares':'Carrés parfaits','Primes OR perfect squares':'Premiers OU carrés parfaits','Odd multiples of 3':'Multiples impairs de 3','does not fit!':'ne convient pas !','does not fit the rule':'ne suit pas la règle',
'Graph Match':'Lecture de graphiques','Read slopes, intercepts, vertices and tangents straight off a graph. The grid gets trickier each grade.':'Lis pentes, ordonnées à l’origine, sommets et tangentes directement sur le graphique. La grille se complique à chaque niveau.','Slope of the line?':'Pente de la droite ?','Where does the line cross the y-axis?':'Où la droite coupe-t-elle l’axe des y ?','x-intercept of the line?':'Abscisse à l’origine de la droite ?','y-intercept of the line?':'Ordonnée à l’origine de la droite ?','x-coordinate of the vertex?':'Abscisse du sommet ?','y-coordinate of the vertex?':'Ordonnée du sommet ?','so y at x =':'donc y quand x =','slope of the tangent at x =':'pente de la tangente en x =',
'Unit Circle Dash':'Course du cercle trigonométrique','Sine, cosine and tangent of the famous angles. Starts in the first quadrant, finishes in radians.':'Sinus, cosinus et tangente des angles célèbres. On commence dans le premier quadrant, on finit en radians.',
'Solve on the Board':'Résoudre au tableau','A real worked problem for your grade. Work it out on the board with the pen, then reveal the steps.':'Un vrai problème détaillé pour ton niveau. Résous-le au tableau avec le stylo, puis dévoile les étapes.',
'Mental Math Sprint':'Sprint de calcul mental','One hard question, a ring counting down. Shout the answer, then reveal. 10 rounds.':'Une question difficile, un cercle qui décompte. Dis la réponse à voix haute, puis dévoile-la. 10 manches.',
'Word Problem':'Problème écrit','A story problem for your grade. Write the plan on the board, solve it, then check.':'Un problème à énoncé pour ton niveau. Écris le plan au tableau, résous-le, puis vérifie.',
'Order It':'Dans l’ordre','Drag the cards into order, smallest to largest (or the other way round). Numbers, fractions, roots, logs\u2026':'Glisse les cartes dans l’ordre, du plus petit au plus grand (ou l’inverse). Nombres, fractions, racines, logarithmes…',
'Distance':'Distance','Order':'Ordre','That is':'C’est','not':'pas','combo!':'combo !'
};
/* generated sentences with a changing tail (anchored, first match wins) */
var RULES=[
 [/^Grade (\d+) \u00b7 (.+)$/,function(m){return (FRG[+m[1]]||'Niveau '+m[1])+' \u00b7 '+tr(m[2]);}],
 [/^Grade (\d+)$/,function(m){return FRG[+m[1]]||m[0];}],[/^College \u00b7 (.+)$/,function(m){return 'Université \u00b7 '+tr(m[1]);}],
 [/^(Grade \d+ \u00b7 .+|College \u00b7 .+) lesson$/,function(m){return 'Leçon : '+tr(m[1]);}],
 [/^Tries left: (\d+)$/,'Essais restants : $1'],[/^ Tries left: (\d+)$/,' Essais restants : $1'],
 [/^Wait a moment before asking for another code \((\d+)s\)\.$/,'Attends un instant avant de demander un autre code ($1 s).'],
 [/^(\ud83d\udc4b) Signed in as @(.+)$/,'$1 Connecté en tant que @$2'],[/^(\ud83c\udf89) Welcome to Matix, @(.+)!$/,'$1 Bienvenue sur Matix, @$2 !'],
 [/^Sign in to use (.+)$/,function(m){return 'Connecte-toi pour utiliser '+tr(m[1]);}],
 [/^Divisible by both (\d+) and (\d+)$/,'Divisibles par $1 et par $2'],
 [/^Factors of (\d+)$/,'Diviseurs de $1'],[/^Multiples of (\d+)$/,'Multiples de $1'],[/^Pop multiples of (\d+)$/,'Éclate les multiples de $1'],
 [/^Pop: (.+)$/,function(m){return 'Éclate : '+trq(m[1]);}]
];
/* question / board text: global substitutions, longest first */
var Q=[
 [/(\d)%/g,'$1 %'],
 [/Half of (\d+)/g,'Moitié de $1'],[/Perimeter of a (\d+) by (\d+) rectangle/g,'Périmètre d’un rectangle de $1 sur $2'],[/Area of a triangle, base (\d+), height (\d+)/g,'Aire d’un triangle, base $1, hauteur $2'],
 [/GCF of (\d+) and (\d+) is (\d+)/g,'Le PGCD de $1 et de $2 est $3'],[/LCM of/g,'PPCM de'],[/GCF of/g,'PGCD de'],
 [/\$(\d+) goes up (\d+) ?%\. New price/g,'Un prix de $1 $ augmente de $2 %. Nouveau prix'],
 [/Slope through/g,'Pente par'],[/larger root/g,'plus grande racine'],[/Discriminant of/g,'Discriminant de'],[/Line through/g,'Droite par'],[/: y-intercept/g,' : ordonnée à l’origine'],
 [/Right triangle, legs (\d+) and (\d+): hypotenuse/g,'Triangle rectangle, côtés $1 et $2 : hypoténuse'],[/Right triangle, hypotenuse (\d+) and a leg (\d+): other leg/g,'Triangle rectangle, hypoténuse $1 et un côté $2 : autre côté'],
 [/pentagon/g,'pentagone'],[/hexagon/g,'hexagone'],[/heptagon/g,'heptagone'],[/octagon/g,'octogone'],[/nonagon/g,'ennéagone'],[/dodecagon/g,'dodécagone'],[/decagon/g,'décagone'],
 [/Sum of the interior angles of a /g,'Somme des angles intérieurs d’un '],[/Vertex x of/g,'Abscisse du sommet de'],[/Sequence/g,'Suite'],[/term (\d+)/g,'terme $1'],[/Distance from/g,'Distance de'],
 [/Sum of the first (\d+) terms of/g,'Somme des $1 premiers termes de'],[/Geometric:/g,'Géométrique :'],[/Real part of/g,'Partie réelle de'],[/Largest eigenvalue of/g,'Plus grande valeur propre de'],[/: z-part/g,' : composante z'],
 /* board */
 [/Make a ten:/g,'Fais une dizaine :'],[/ needs (\d+) to make 10/g,' a besoin de $1 pour faire 10'],[/Split (\d+) into (\d+) and (\d+)/g,'Sépare $1 en $2 et $3'],[/Fill the gap:/g,'Complète :'],[/Count up from (\d+) to (\d+)/g,'Compte de $1 à $2'],
 [/(\w+) has (\d+) stickers\.\nGets (\d+) more, then gives (\d+) away\.\nHow many now\?/g,'$1 a $2 autocollants.\nEn reçoit $3 de plus, puis en donne $4.\nCombien d’autocollants y a-t-il maintenant ?'],
 [/Add using tens and ones:/g,'Additionne avec les dizaines et les unités :'],[/Tens:/g,'Dizaines :'],[/Ones:/g,'Unités :'],[/Together:/g,'Ensemble :'],[/Subtract:/g,'Soustrais :'],[/Count back (\d+) from (\d+)/g,'Recule de $1 depuis $2'],[/Then back (\d+) more/g,'Puis recule encore de $1'],
 [/(\w+) has (\d+) bags with (\d+) marbles in each\.\nHow many marbles in all\?/g,'$1 a $2 sacs avec $3 billes dans chacun.\nCombien de billes en tout ?'],[/ groups of /g,' groupes de '],
 [/Break it apart:/g,'Décompose :'],[/Add:/g,'Additionne :'],[/Divide:/g,'Divise :'],[/Think:/g,'Pense :'],
 [/A garden is (\d+) m by (\d+) m\.\nFind the area AND the perimeter\./g,'Un jardin mesure $1 m sur $2 m.\nTrouve l’aire ET le périmètre.'],[/Area (\d+) m\u00b2, perimeter (\d+) m/g,'Aire $1 m², périmètre $2 m'],[/Area =/g,'Aire ='],[/Perimeter =/g,'Périmètre ='],
 [/Add the fractions:/g,'Additionne les fractions :'],[/Same denominator: keep/g,'Même dénominateur : garde'],[/Add the tops:/g,'Additionne les numérateurs :'],
 [/Order of operations:/g,'Ordre des opérations :'],[/Multiply first:/g,'Multiplie d’abord :'],[/Multiply:/g,'Multiplie :'],[/Multiply them/g,'Multiplie-les'],
 [/(\w+) packs (\d+) boxes of (\d+) pencils,\nthen adds (\d+) loose pencils\.\nHow many pencils\?/g,'$1 emballe $2 boîtes de $3 crayons,\npuis ajoute $4 crayons seuls.\nCombien de crayons ?'],
 [/Common denominator:/g,'Dénominateur commun :'],[/Find (\d+) ?% of (\d+)\./g,'Trouve $1 % de $2.'],[/(\d) ?% of /g,'$1 % de '],
 [/Paint is mixed (\d+) : (\d+)\.\nA batch has (\d+) litres in total\.\nHow much of each\?/g,'On mélange de la peinture dans le rapport $1 : $2.\nUn lot fait $3 litres au total.\nCombien de chaque ?'],[/ L and /g,' L et '],[/Parts:/g,'Parts :'],[/One part =/g,'Une part ='],
 [/Evaluate:/g,'Calcule :'],[/Exponent:/g,'Exposant :'],[/Simplify the ratio/g,'Simplifie le rapport'],[/Divide both by/g,'Divise les deux par'],
 [/A \$(\d+) jacket is (\d+) ?%\s?off\.\nWhat is the sale price\?/g,'Une veste à $1 $ est soldée de $2 %.\nQuel est le prix soldé ?'],[/Discount =/g,'Réduction ='],[/Discount:/g,'Réduction :'],
 [/Solve for x:/g,'Résous pour x :'],[/Add (\d+) to both sides/g,'Ajoute $1 des deux côtés'],[/Subtract (\d+)x from both sides/g,'Soustrais $1x des deux côtés'],[/Subtract (\d+) from both sides/g,'Soustrais $1 des deux côtés'],[/Subtract (\d+):/g,'Soustrais $1 :'],[/Divide by (\d+)/g,'Divise par $1'],[/Solve:/g,'Résous :'],[/Move the (-?\d+)/g,'Déplace le $1'],
 [/(\w+) is 3 times as old as (\w+)\.\nIn (\d+) years their ages add to (\d+)\.\nHow old is the younger one now\?/g,'$1 a 3 fois l’âge de $2.\nDans $3 ans, la somme de leurs âges est $4.\nQuel âge a le plus jeune maintenant ?'],[/Younger = x, older = 3x/g,'Plus jeune = x, plus âgé = 3x'],[/In (\d+) years:/g,'Dans $1 ans :'],
 [/Find the slope and the equation of the line through\n/g,'Trouve la pente et l’équation de la droite passant par\n'],[/Slope =/g,'Pente ='],[/plug in/g,'remplace avec'],
 [/A ladder (\d+) m long leans on a wall\.\nIts base is (\d+) m from the wall\.\nHow high does it reach\?/g,'Une échelle de $1 m est appuyée contre un mur.\nSon pied est à $2 m du mur.\nÀ quelle hauteur arrive-t-elle ?'],[/Right triangle: a/g,'Triangle rectangle : a'],
 [/Expand and simplify:/g,'Développe et simplifie :'],[/Combine x terms:/g,'Regroupe les termes en x :'],[/Combine numbers:/g,'Regroupe les nombres :'],
 [/Solve by factoring:/g,'Résous par factorisation :'],[/Find two numbers: product (-?\d+), sum/g,'Trouve deux nombres : produit $1, somme'],[/Solve the system:/g,'Résous le système :'],[/Add the equations:/g,'Additionne les équations :'],
 [/In a right triangle the opposite side is (\d+)\nand the hypotenuse is (\d+)\.\nFind sin \u03b8, cos \u03b8 and tan \u03b8\./g,'Dans un triangle rectangle, le côté opposé mesure $1\net l’hypoténuse $2.\nTrouve sin \u03b8, cos \u03b8 et tan \u03b8.'],[/Adjacent:/g,'Adjacent :'],[/sin = opp\/hyp, cos = adj\/hyp, tan = opp\/adj/g,'sin = opposé/hypoténuse, cos = adjacent/hypoténuse, tan = opposé/adjacent'],
 [/Find the vertex of the parabola/g,'Trouve le sommet de la parabole'],[/Vertex form:/g,'Forme canonique :'],
 [/Find the distance and the midpoint\nbetween/g,'Trouve la distance et le milieu\nentre'],[/distance (\d+),  midpoint/g,'distance $1,  milieu'],[/Midpoint = average of the x\u2019s and y\u2019s/g,'Milieu = moyenne des x et des y'],[/Midpoint/g,'Milieu'],
 [/An arithmetic sequence starts/g,'Une suite arithmétique commence par'],[/Find term (\d+) and the sum of the first (\d+) terms\./g,'Trouve le terme $1 et la somme des $2 premiers termes.'],[/term = (\d+),  sum =/g,'terme = $1,  somme ='],
 [/Write (\d+) as/g,'Écris $1 comme'],[/Differentiate \(chain rule\):/g,'Dérive (composée) :'],[/Differentiate:/g,'Dérive :'],[/Power rule:/g,'Règle de puissance :'],[/Bring each power down and subtract 1/g,'Descends chaque exposant et soustrais 1'],[/Constants disappear/g,'Les constantes disparaissent'],
 [/Find lim/g,'Trouve lim'],[/Factor:/g,'Factorise :'],[/Cancel:/g,'Simplifie :'],[/Plug in x =/g,'Remplace x ='],[/Integrate:/g,'Intègre :'],[/Raise each power by 1, divide by the new power/g,'Augmente chaque exposant de 1, divise par le nouvel exposant'],[/Add \+ C/g,'Ajoute + C'],
 [/Use the chain rule:/g,'Utilise la dérivée d’une composée :'],[/Outer:/g,'Extérieure :'],[/Inner derivative:/g,'Dérivée intérieure :'],
 [/Solve for 0\u00b0 \u2264 x \u2264 360\u00b0:/g,'Résous pour 0° ≤ x ≤ 360° :'],[/First quadrant:/g,'Premier quadrant :'],[/Second quadrant:/g,'Deuxième quadrant :'],
 [/Multiply the matrices:/g,'Multiplie les matrices :'],[/Row \u00d7 column for each entry/g,'Ligne × colonne pour chaque terme'],[/Top-left:/g,'Haut gauche :'],[/Top-right:/g,'Haut droite :'],
 [/Find the sum of the series/g,'Trouve la somme de la série'],[/Geometric, ratio r =/g,'Géométrique, raison r ='],[/Sum =/g,'Somme ='],[/Eigenvalues of/g,'Valeurs propres de'],[/Symmetric:/g,'Symétrique :'],
 [/(\w+) has (\d+) marbles, wins (\d+) more and loses (\d+)\.\nHow many marbles does \w+ have now\?/g,'$1 a $2 billes, en gagne $3 de plus et en perd $4.\nCombien de billes y a-t-il maintenant ?'],
 [/A shelf holds (\d+) books in each of (\d+) rows\.\nHow many books are there\?/g,'Une étagère contient $1 livres dans chacune de ses $2 rangées.\nCombien de livres y a-t-il ?'],[/ rows \u00d7 /g,' rangées × '],[/ books = /g,' livres = '],
 [/A bakery makes (\d+) trays of (\d+) rolls\.\n(\d+) rolls are burnt\. How many good rolls are left\?/g,'Une boulangerie fait $1 plateaux de $2 petits pains.\n$3 petits pains sont brûlés. Combien de bons petits pains reste-t-il ?'],
 [/(\d+) students sit in equal teams of (\d+)\.\nHow many teams\? If 2 more teams join, how many students now\?/g,'$1 élèves forment des équipes égales de $2.\nCombien d’équipes ? Si 2 équipes de plus se joignent, combien d’élèves y a-t-il ?'],[/2 more teams = (\d+) more students/g,'2 équipes de plus = $1 élèves de plus'],[/ teams,  /g,' équipes,  '],[/ students/g,' élèves'],
 [/A bus drives (\d+) km every hour for (\d+) hours,\nthen another (\d+) km\. Total distance\?/g,'Un bus roule $1 km chaque heure pendant $2 heures,\npuis encore $3 km. Distance totale ?'],
 [/A game costs \$(\d+)\. It is (\d+) ?%\s?off, then you pay \$5 for shipping\.\nWhat is the total\?/g,'Un jeu coûte $1 $. Il est soldé de $2 %, puis tu paies 5 $ de livraison.\nQuel est le total ?'],[/Add shipping:/g,'Ajoute la livraison :'],
 [/Two numbers add to (\d+) and differ by (\d+)\.\nFind both numbers\./g,'Deux nombres ont pour somme $1 et pour différence $2.\nTrouve les deux nombres.'],
 [/Three consecutive integers add to (\d+)\.\nWhat are they\?/g,'Trois entiers consécutifs ont pour somme $1.\nQuels sont-ils ?'],
 [/A rectangle is (\d+) m longer than it is wide\.\nIts area is (\d+) m\u00b2\. Find the width\./g,'Un rectangle est plus long de $1 m que large.\nSon aire est $2 m². Trouve la largeur.'],[/\(length can\u2019t be negative\)/g,'(la longueur ne peut pas être négative)'],
 [/Two cars leave the same point in opposite directions\nat (\d+) km\/h and (\d+) km\/h\.\nHow far apart after (\d+) hours\?/g,'Deux voitures partent du même point en sens opposés\nà $1 km/h et $2 km/h.\nQuelle distance les sépare après $3 heures ?'],[/Gap grows at/g,'L’écart grandit de'],
 [/A culture of (\d+) bacteria doubles every (\d+) hours\.\nHow many after (\d+) hours\?/g,'Une culture de $1 bactéries double toutes les $2 heures.\nCombien après $3 heures ?'],[/Doublings:/g,'Doublements :'],
 [/A ball\u2019s height is h\(t\) = (\d+)t\u00b2 \+ 3t metres\.\nFind its speed \(dh\/dt\) at t = (\d+) s\./g,'La hauteur d’une balle est h(t) = $1t² + 3t mètres.\nTrouve sa vitesse (dh/dt) à t = $2 s.'],
 [/A square\u2019s side grows (\d+) cm\/s\.\nHow fast is its area growing when the side is (\d+) cm\?/g,'Le côté d’un carré augmente de $1 cm/s.\nQuelle est la vitesse de croissance de son aire quand le côté mesure $2 cm ?'],
 [/You have (\d+) m of fence for a rectangular pen\.\nWhat is the largest area you can enclose\?/g,'Tu as $1 m de clôture pour un enclos rectangulaire.\nQuelle est la plus grande aire que tu peux entourer ?'],[/maximum at/g,'maximum en'],
 [/ at \(/g,' en ('],[/ and /g,' et '],[/ or /g,' ou '],[/ to /g,' à ']
];
function trq(s){s=String(s==null?'':s);if(lang!=='fr')return s;for(var i=0;i<Q.length;i++)s=s.replace(Q[i][0],Q[i][1]);return s;}
function tr(s){s=String(s==null?'':s);if(lang!=='fr')return s;
  if(Object.prototype.hasOwnProperty.call(FR,s))return FR[s];
  for(var i=0;i<RULES.length;i++){var m=RULES[i][0].exec(s);if(m)return typeof RULES[i][1]==='function'?RULES[i][1](m):s.replace(RULES[i][0],RULES[i][1]);}
  return s;}
/* translate a DOM text, keeping its leading and trailing spaces */
function trNode(s){var t=s.trim();if(!t)return s;var out=tr(t);if(out===t&&lang==='fr'){/* try the untrimmed form too */var u=tr(s);return u;}var a=s.slice(0,s.indexOf(t)),b=s.slice(s.indexOf(t)+t.length);return a+out+b;}

var busy=false;
var ATTRS=['placeholder','aria-label','title','alt'];
function walk(root){
  if(!root)return;
  if(root.nodeType===3){textNode(root);return;}
  if(root.nodeType!==1)return;
  if(/^(SCRIPT|STYLE|CANVAS|TEXTAREA)$/.test(root.nodeName))return;
  if(root.getAttribute&&root.getAttribute('translate')==='no')return;
  attrs(root);
  for(var n=root.firstChild;n;n=n.nextSibling)walk(n);
}
function textNode(n){
  var cur=n.nodeValue;
  if(n.__t===undefined||cur!==n.__t){n.__o=cur;}
  var want=lang==='fr'?trNode(n.__o):n.__o;
  if(want!==cur){n.__t=want;n.nodeValue=want;}else n.__t=cur;
}
function attrs(el){
  for(var i=0;i<ATTRS.length;i++){var a=ATTRS[i];if(!el.hasAttribute||!el.hasAttribute(a))continue;
    var key='__o_'+a,tk='__t_'+a,cur=el.getAttribute(a);
    if(el[tk]===undefined||cur!==el[tk])el[key]=cur;
    var want=lang==='fr'?trNode(el[key]):el[key];
    if(want!==cur){el[tk]=want;el.setAttribute(a,want);}else el[tk]=cur;}
}
function run(root){busy=true;try{walk(root||D.body);D.title=titleFor();}finally{busy=false;}}
var TITLE_EN=D.title;
function titleFor(){return lang==='fr'?'Matix le club de maths':TITLE_EN;}
var mo=null;
function observe(){
  if(mo||!W.MutationObserver)return;
  mo=new MutationObserver(function(list){if(busy)return;busy=true;try{
    list.forEach(function(m){
      if(m.type==='characterData')textNode(m.target);
      else if(m.type==='attributes'){if(m.target.nodeType===1)attrs(m.target);}
      else m.addedNodes.forEach(function(n){walk(n);});
    });}finally{busy=false;}});
  mo.observe(D.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS});
}

function setLang(l){
  if(LANGS.indexOf(l)<0)return;lang=l;ls('mx_lang',l);
  D.documentElement.lang=l;paintBtn();run(D.body);
  try{W.dispatchEvent(new CustomEvent('mxlang',{detail:l}));}catch(e){}
}
function paintBtn(){var b=D.getElementById('langBtn');if(!b)return;
  b.innerHTML='<span aria-hidden="true">\uD83C\uDF10</span> <b>'+(lang==='fr'?'FR':'EN')+'</b>';
  b.setAttribute('aria-label',lang==='fr'?'Langue : français. Passer à l’anglais':'Language: English. Switch to French');
  b.title=lang==='fr'?'Passer à l’anglais':'Passer au français';b.__o_aria=1;}
function boot(){
  D.documentElement.lang=lang;
  var b=D.getElementById('langBtn');
  if(b){b.onclick=function(){setLang(lang==='fr'?'en':'fr');};paintBtn();}
  run(D.body);observe();
}
W.trAdd=function(o){for(var k in o)FR[k]=o[k];};W.tr=tr;W.FRG=FRG;W.trq=trq;W.mxLang={get:function(){return lang;},set:setLang};
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);else boot();
})();
