import { L, type JourneyInteractiveSection } from "./genesis-interactive";
import type { BibleRef } from "./references";

/**
 * Camada interativa de Josué: paragens, quiz, família e tempo por movimento.
 * Lugares em places.ts + joshua-places.ts; pessoas em journeyPeople + joshua-people.ts.
 *
 * ESTADO: PENDENTE DE REVISÃO HUMANA. Textos escritos para a Jornada a partir do texto
 * bíblico citado em cada `ref`; ainda não passaram por revisão teológica nem de tradução.
 * Datas: cronologia tradicional (saída do Egito c. 1446 a.C.), todas aproximadas.
 */
export const joshuaReviewStatus = "pendente-revisao-humana" as const;

const js = (chapter: number, verse?: number, endVerse?: number, endChapter?: number): BibleRef =>
  ({ book: "joshua", chapter, verse, endVerse, endChapter });

export const joshuaInteractive: Record<string, JourneyInteractiveSection> = {
  commission: {
    stops: [
      { id: "commission", placeId: "shittim", ref: js(1, 1, 9), people: ["joshua", "god", "moses"], text: L(
        "Moisés morreu. O Senhor manda Josué atravessar o Jordão com o povo: «Sê forte e corajoso… o Senhor, teu Deus, está contigo.»",
        "Moses has died. The Lord tells Joshua to cross the Jordan with the people: “Be strong and courageous… the Lord your God is with you.”",
        "Moisés ha muerto. El Señor manda a Josué cruzar el Jordán con el pueblo: «Esfuérzate y sé valiente… el Señor tu Dios estará contigo».",
        "Moïse est mort. Le Seigneur demande à Josué de passer le Jourdain avec le peuple : « Fortifie-toi et prends courage… le Seigneur ton Dieu est avec toi. »",
        "Mosè è morto. Il Signore ordina a Giosuè di attraversare il Giordano con il popolo: «Sii forte e coraggioso… il Signore tuo Dio è con te».",
        "Mose ist gestorben. Der Herr sagt Josua, er solle mit dem Volk über den Jordan ziehen: „Sei getrost und unverzagt … der Herr, dein Gott, ist mit dir.“") },
      { id: "spies", placeId: "jericho", ref: js(2, 1, 21), people: ["rahab"], text: L(
        "Dois espias saem de Sitim e entram na casa de Raabe, em Jericó. Ela esconde os homens no terraço e pede que a sua família seja poupada. O sinal será um cordão escarlate na janela.",
        "Two spies leave Shittim and enter the house of Rahab in Jericho. She hides them on the roof and asks that her family be spared. The sign will be a scarlet cord in the window.",
        "Dos espías salen de Sitim y entran en casa de Rahab, en Jericó. Ella los esconde en el terrado y pide que su familia sea perdonada. La señal será un cordón de grana en la ventana.",
        "Deux espions partent de Shittim et entrent chez Rahab, à Jéricho. Elle les cache sur le toit et demande que sa famille soit épargnée. Le signe sera un cordon écarlate à la fenêtre.",
        "Due spie partono da Sittim ed entrano nella casa di Raab, a Gerico. Lei le nasconde sulla terrazza e chiede che la sua famiglia sia risparmiata. Il segno sarà una cordicella scarlatta alla finestra.",
        "Zwei Kundschafter ziehen von Schittim aus und kommen in das Haus Rahabs in Jericho. Sie versteckt sie auf dem Dach und bittet, ihre Familie zu verschonen. Das Zeichen ist eine rote Schnur im Fenster.") },
      { id: "crossing", placeId: "jordan", title: L("Jordão · a travessia", "Jordan · the crossing", "Jordán · el cruce", "Jourdain · la traversée", "Giordano · il passaggio", "Jordan · der Durchzug"), ref: js(3, 14, 17), people: ["joshua"], text: L(
        "O rio está cheio, no tempo da colheita. Quando os sacerdotes que levam a arca entram na água, ela para de correr desde Adã, bem longe. O povo atravessa em terra seca, diante de Jericó.",
        "The river is in flood at harvest time. When the priests carrying the ark step into the water, it stops flowing, far upstream at Adam. The people cross on dry ground opposite Jericho.",
        "El río está crecido, en tiempo de la siega. Cuando los sacerdotes que llevan el arca entran en el agua, esta se detiene lejos, en Adam. El pueblo pasa en seco frente a Jericó.",
        "Le fleuve déborde, au temps de la moisson. Quand les prêtres qui portent l'arche entrent dans l'eau, elle s'arrête au loin, à Adam. Le peuple passe à sec en face de Jéricho.",
        "Il fiume è in piena, al tempo della mietitura. Quando i sacerdoti che portano l'arca entrano nell'acqua, essa si ferma lontano, ad Adam. Il popolo passa all'asciutto di fronte a Gerico.",
        "Der Jordan ist zur Erntezeit über die Ufer getreten. Als die Priester mit der Lade ins Wasser treten, staut es sich weit oben bei Adam. Das Volk zieht trocken hindurch, Jericho gegenüber.") },
      { id: "stones", placeId: "gilgal", ref: js(4, 19, 24), people: ["joshua"], text: L(
        "No décimo dia do primeiro mês, o povo acampa em Gilgal. Josué ergue ali as doze pedras tiradas do Jordão, para que os filhos saibam o que o Senhor fez.",
        "On the tenth day of the first month, the people camp at Gilgal. Joshua sets up there the twelve stones taken from the Jordan, so that the children will know what the Lord did.",
        "El día diez del mes primero, el pueblo acampa en Gilgal. Josué levanta allí las doce piedras sacadas del Jordán, para que los hijos sepan lo que hizo el Señor.",
        "Le dixième jour du premier mois, le peuple campe à Guilgal. Josué y dresse les douze pierres tirées du Jourdain, pour que les enfants sachent ce que le Seigneur a fait.",
        "Il decimo giorno del primo mese il popolo si accampa a Gàlgala. Giosuè vi erige le dodici pietre prese dal Giordano, perché i figli sappiano ciò che il Signore ha fatto.",
        "Am zehnten Tag des ersten Monats lagert das Volk in Gilgal. Josua richtet dort die zwölf Steine aus dem Jordan auf, damit die Kinder wissen, was der Herr getan hat.") },
      { id: "passover", placeId: "gilgal", title: L("Gilgal · a Páscoa", "Gilgal · the Passover", "Gilgal · la Pascua", "Guilgal · la Pâque", "Gàlgala · la Pasqua", "Gilgal · das Passa"), ref: js(5, 2, 12), people: ["joshua"], text: L(
        "A geração nascida no deserto é circuncidada. Israel celebra a Páscoa nas planícies de Jericó. No dia seguinte, come do fruto da terra, e o maná cessa.",
        "The generation born in the wilderness is circumcised. Israel keeps the Passover on the plains of Jericho. The next day they eat the produce of the land, and the manna stops.",
        "La generación nacida en el desierto es circuncidada. Israel celebra la Pascua en los llanos de Jericó. Al día siguiente come del fruto de la tierra, y el maná cesa.",
        "La génération née au désert est circoncise. Israël célèbre la Pâque dans les plaines de Jéricho. Le lendemain, il mange les produits du pays, et la manne cesse.",
        "La generazione nata nel deserto è circoncisa. Israele celebra la Pasqua nelle steppe di Gerico. Il giorno dopo mangia i frutti della terra, e la manna cessa.",
        "Die in der Wüste geborene Generation wird beschnitten. Israel feiert das Passa in den Steppen von Jericho. Am nächsten Tag isst es vom Ertrag des Landes, und das Manna hört auf.") },
      { id: "commander", placeId: "jericho", title: L("Perto de Jericó · o príncipe do exército", "Near Jericho · the commander of the army", "Cerca de Jericó · el príncipe del ejército", "Près de Jéricho · le chef de l'armée", "Presso Gerico · il capo dell'esercito", "Bei Jericho · der Fürst des Heeres"), ref: js(5, 13, 15), people: ["joshua"], text: L(
        "Perto de Jericó, Josué vê um homem com uma espada na mão: é o príncipe do exército do Senhor. Josué cai com o rosto em terra e tira as sandálias, porque o lugar é santo.",
        "Near Jericho, Joshua sees a man with a drawn sword: the commander of the Lord's army. Joshua falls face down and removes his sandals, for the place is holy.",
        "Cerca de Jericó, Josué ve a un hombre con una espada desenvainada: es el príncipe del ejército del Señor. Josué cae rostro en tierra y se quita el calzado, porque el lugar es santo.",
        "Près de Jéricho, Josué voit un homme, l'épée nue à la main : c'est le chef de l'armée du Seigneur. Josué tombe face contre terre et ôte ses sandales, car le lieu est saint.",
        "Presso Gerico, Giosuè vede un uomo con la spada sguainata: è il capo dell'esercito del Signore. Giosuè cade con la faccia a terra e si toglie i sandali, perché il luogo è santo.",
        "Bei Jericho sieht Josua einen Mann mit gezücktem Schwert: den Fürsten über das Heer des Herrn. Josua fällt nieder und zieht die Schuhe aus, denn der Ort ist heilig.") },
    ],
    checkpoint: {
      ref: js(2, 18, 21), answer: 2,
      question: L("Que sinal Raabe devia prender na janela?", "What sign was Rahab to tie in the window?", "¿Qué señal debía atar Rahab a la ventana?", "Quel signe Rahab devait-elle attacher à la fenêtre ?", "Quale segno doveva legare Raab alla finestra?", "Welches Zeichen sollte Rahab ins Fenster binden?"),
      options: L(["Um ramo de oliveira", "Um pano branco", "Um cordão escarlate"], ["An olive branch", "A white cloth", "A scarlet cord"], ["Una rama de olivo", "Un paño blanco", "Un cordón de grana"], ["Un rameau d'olivier", "Un linge blanc", "Un cordon écarlate"], ["Un ramo d'ulivo", "Un panno bianco", "Una cordicella scarlatta"], ["Einen Ölzweig", "Ein weißes Tuch", "Eine rote Schnur"]),
      explanation: L("Um cordão de fio escarlate (Js 2:18-21). Quem ficasse na casa de Raabe seria poupado.", "A scarlet cord (Josh 2:18–21). Everyone who stayed in Rahab's house would be spared.", "Un cordón de grana (Jos 2:18-21). Quien quedara en la casa de Rahab sería perdonado.", "Un cordon écarlate (Jos 2,18-21). Tous ceux qui resteraient dans la maison de Rahab seraient épargnés.", "Una cordicella scarlatta (Gs 2,18-21). Chi restava nella casa di Raab sarebbe stato risparmiato.", "Eine rote Schnur (Jos 2,18–21). Wer in Rahabs Haus blieb, sollte verschont werden."),
    },
    era: [
      { year: -1406, label: L("Israel atravessa o Jordão", "Israel crosses the Jordan", "Israel cruza el Jordán", "Israël passe le Jourdain", "Israele attraversa il Giordano", "Israel zieht über den Jordan") },
    ],
  },
  conquest: {
    stops: [
      { id: "jericho", placeId: "jericho", ref: js(6, 15, 25), people: ["joshua", "rahab"], text: L(
        "No sétimo dia, o povo dá sete voltas à cidade. Ao som das trombetas e do grito, a muralha cai. A cidade é consagrada à destruição, com pessoas e animais, e queimada. Raabe e a sua família são poupadas.",
        "On the seventh day the people march around the city seven times. At the sound of the trumpets and the shout, the wall falls. The city, with its people and animals, is devoted to destruction and burned. Rahab and her family are spared.",
        "El séptimo día, el pueblo rodea la ciudad siete veces. Al sonido de las trompetas y del grito, el muro cae. La ciudad, con personas y animales, es consagrada a la destrucción y quemada. Rahab y su familia son perdonadas.",
        "Le septième jour, le peuple fait sept fois le tour de la ville. Au son des trompettes et du cri, la muraille s'écroule. La ville, avec ses habitants et ses bêtes, est vouée à l'interdit et brûlée. Rahab et sa famille sont épargnées.",
        "Il settimo giorno il popolo gira sette volte attorno alla città. Al suono delle trombe e al grido, le mura crollano. La città, con persone e animali, è votata allo sterminio e bruciata. Raab e la sua famiglia sono risparmiate.",
        "Am siebten Tag zieht das Volk siebenmal um die Stadt. Beim Schall der Posaunen und beim Kriegsgeschrei fällt die Mauer. Die Stadt mit Menschen und Tieren wird dem Bann geweiht und verbrannt. Rahab und ihre Familie werden verschont.") },
      { id: "ai", placeId: "ai", ref: js(7, 1, 29, 8), people: ["joshua", "achan"], text: L(
        "Acã toma do que fora consagrado, e Israel é derrotado em Ai. Acã confessa; ele e os seus filhos são apedrejados no vale de Acor. Depois, com uma emboscada, Israel toma Ai.",
        "Achan takes some of the devoted things, and Israel is defeated at Ai. Achan confesses; he and his children are stoned in the Valley of Achor. Then, with an ambush, Israel takes Ai.",
        "Acán toma de lo consagrado, e Israel es derrotado en Hai. Acán confiesa; él y sus hijos son apedreados en el valle de Acor. Después, con una emboscada, Israel toma Hai.",
        "Akân prend de ce qui était voué à l'interdit, et Israël est battu à Aï. Akân avoue ; lui et ses enfants sont lapidés dans la vallée d'Akor. Puis, par une embuscade, Israël prend Aï.",
        "Acan prende delle cose votate allo sterminio, e Israele è sconfitto ad Ai. Acan confessa; lui e i suoi figli sono lapidati nella valle di Acor. Poi, con un'imboscata, Israele prende Ai.",
        "Achan nimmt vom Gebannten, und Israel wird bei Ai geschlagen. Achan bekennt; er und seine Kinder werden im Tal Achor gesteinigt. Danach nimmt Israel Ai durch einen Hinterhalt ein.") },
      { id: "ebal", placeId: "mount-ebal", ref: js(8, 30, 35), people: ["joshua", "moses"], text: L(
        "Josué constrói um altar no monte Ebal e escreve nas pedras uma cópia da lei de Moisés. Metade do povo fica diante do Gerizim, metade diante do Ebal, e ele lê as bênçãos e as maldições.",
        "Joshua builds an altar on Mount Ebal and writes on the stones a copy of the law of Moses. Half the people stand facing Gerizim, half facing Ebal, and he reads the blessings and the curses.",
        "Josué edifica un altar en el monte Ebal y escribe en las piedras una copia de la ley de Moisés. La mitad del pueblo está frente al Gerizim, la otra mitad frente al Ebal, y él lee las bendiciones y las maldiciones.",
        "Josué bâtit un autel sur le mont Ébal et écrit sur les pierres une copie de la loi de Moïse. La moitié du peuple se tient face au Garizim, l'autre face à l'Ébal, et il lit les bénédictions et les malédictions.",
        "Giosuè costruisce un altare sul monte Ebal e scrive sulle pietre una copia della legge di Mosè. Metà del popolo sta di fronte al Garizim, metà di fronte all'Ebal, ed egli legge le benedizioni e le maledizioni.",
        "Josua baut auf dem Berg Ebal einen Altar und schreibt auf die Steine eine Abschrift des Gesetzes des Mose. Die eine Hälfte des Volkes steht zum Garizim hin, die andere zum Ebal, und er liest Segen und Fluch vor.") },
      { id: "gibeon", placeId: "gibeon", ref: js(9, 3, 27), people: ["joshua"], text: L(
        "Os gibeonitas chegam com pão seco e odres rasgados, dizendo que vêm de longe. Israel não consulta o Senhor e faz um tratado com eles. Descoberto o engano, são poupados, mas passam a cortar lenha e a tirar água para a casa de Deus.",
        "The Gibeonites come with dry bread and torn wineskins, claiming to be from far away. Israel does not ask the Lord and makes a treaty with them. When the trick is found out, they are spared but become woodcutters and water carriers for the house of God.",
        "Los gabaonitas llegan con pan seco y odres rotos, diciendo que vienen de lejos. Israel no consulta al Señor y hace un pacto con ellos. Descubierto el engaño, son perdonados, pero pasan a cortar leña y sacar agua para la casa de Dios.",
        "Les Gabaonites arrivent avec du pain sec et des outres déchirées, disant venir de loin. Israël ne consulte pas le Seigneur et conclut un traité avec eux. La ruse découverte, ils sont épargnés, mais deviennent coupeurs de bois et porteurs d'eau pour la maison de Dieu.",
        "I Gabaoniti arrivano con pane secco e otri strappati, dicendo di venire da lontano. Israele non consulta il Signore e stipula un'alleanza con loro. Scoperto l'inganno, sono risparmiati, ma diventano tagliatori di legna e portatori d'acqua per la casa di Dio.",
        "Die Gibeoniter kommen mit trockenem Brot und zerrissenen Schläuchen und sagen, sie kämen von weit her. Israel fragt den Herrn nicht und schließt einen Bund mit ihnen. Als die List auffliegt, werden sie verschont, müssen aber Holz hauen und Wasser tragen für das Haus Gottes.") },
      { id: "aijalon", placeId: "aijalon-valley", ref: js(10, 1, 14), people: ["joshua", "adoni-zedek"], text: L(
        "Adoni-Zedeque, rei de Jerusalém, e outros quatro reis atacam Gibeom. Josué sobe de Gilgal durante a noite. O Senhor lança grandes pedras do céu, e Josué diz: «Sol, detém-te em Gibeom; e tu, lua, no vale de Aijalom.»",
        "Adoni-zedek, king of Jerusalem, and four other kings attack Gibeon. Joshua marches up from Gilgal all night. The Lord throws down large stones from heaven, and Joshua says: “Sun, stand still at Gibeon, and moon, in the Valley of Aijalon.”",
        "Adonisedec, rey de Jerusalén, y otros cuatro reyes atacan Gabaón. Josué sube de Gilgal toda la noche. El Señor arroja grandes piedras del cielo, y Josué dice: «Sol, detente en Gabaón; y tú, luna, en el valle de Ajalón».",
        "Adoni-Tsédeq, roi de Jérusalem, et quatre autres rois attaquent Gabaon. Josué monte de Guilgal toute la nuit. Le Seigneur fait tomber du ciel de grosses pierres, et Josué dit : « Soleil, arrête-toi sur Gabaon, et toi, lune, sur la vallée d'Ayyalôn ! »",
        "Adoni-Sedek, re di Gerusalemme, e altri quattro re attaccano Gàbaon. Giosuè sale da Gàlgala per tutta la notte. Il Signore fa cadere dal cielo grosse pietre, e Giosuè dice: «Sole, fermati su Gàbaon; luna, sulla valle di Aialon».",
        "Adoni-Zedek, der König von Jerusalem, und vier weitere Könige greifen Gibeon an. Josua zieht die ganze Nacht von Gilgal herauf. Der Herr lässt große Steine vom Himmel fallen, und Josua spricht: „Sonne, steh still zu Gibeon, und Mond, im Tal Ajalon!“") },
      { id: "hazor", placeId: "hazor", ref: js(11, 1, 15), people: ["joshua", "jabin"], text: L(
        "Jabim, rei de Hazor, reúne os reis do norte junto às águas de Merom. Josué ataca de surpresa e vence a coligação. Hazor, a cabeça desses reinos, é tomada; os seus habitantes são mortos, e a cidade é queimada.",
        "Jabin, king of Hazor, gathers the northern kings at the waters of Merom. Joshua attacks suddenly and defeats the alliance. Hazor, the head of those kingdoms, is taken; its people are killed and the city is burned.",
        "Jabín, rey de Hazor, reúne a los reyes del norte junto a las aguas de Merom. Josué ataca por sorpresa y vence a la coalición. Hazor, cabeza de esos reinos, es tomada; sus habitantes mueren y la ciudad es quemada.",
        "Jabîn, roi de Hatsor, rassemble les rois du nord près des eaux de Mérom. Josué attaque par surprise et bat la coalition. Hatsor, la capitale de ces royaumes, est prise ; ses habitants sont tués et la ville est brûlée.",
        "Iabin, re di Cazor, raduna i re del nord presso le acque di Merom. Giosuè attacca di sorpresa e sconfigge la coalizione. Cazor, capitale di quei regni, è presa; i suoi abitanti sono uccisi e la città è bruciata.",
        "Jabin, der König von Hazor, sammelt die Könige des Nordens am Wasser Merom. Josua greift überraschend an und schlägt das Bündnis. Hazor, das Haupt dieser Königreiche, wird eingenommen; seine Bewohner werden getötet, und die Stadt wird verbrannt.") },
    ],
    checkpoint: {
      ref: js(9, 3, 15), answer: 1,
      question: L("Como os gibeonitas conseguiram um tratado com Israel?", "How did the Gibeonites obtain a treaty with Israel?", "¿Cómo consiguieron los gabaonitas un pacto con Israel?", "Comment les Gabaonites obtinrent-ils un traité avec Israël ?", "Come ottennero i Gabaoniti un'alleanza con Israele?", "Wie erlangten die Gibeoniter einen Bund mit Israel?"),
      options: L(["Ofereceram prata e ouro", "Fingiram vir de uma terra distante", "Mostraram uma carta de Moisés"], ["They offered silver and gold", "They pretended to come from a distant land", "They showed a letter from Moses"], ["Ofrecieron plata y oro", "Fingieron venir de una tierra lejana", "Mostraron una carta de Moisés"], ["Ils offrirent de l'argent et de l'or", "Ils feignirent de venir d'un pays lointain", "Ils montrèrent une lettre de Moïse"], ["Offrirono argento e oro", "Finsero di venire da una terra lontana", "Mostrarono una lettera di Mosè"], ["Sie boten Silber und Gold an", "Sie gaben vor, aus einem fernen Land zu kommen", "Sie zeigten einen Brief des Mose"]),
      explanation: L("Levaram pão seco e roupas gastas para parecer que vinham de longe (Js 9:4-6). Os homens de Israel não consultaram o Senhor (9:14).", "They brought dry bread and worn-out clothes to look as if they came from far away (Josh 9:4–6). The men of Israel did not ask the Lord (9:14).", "Llevaron pan seco y ropa gastada para parecer que venían de lejos (Jos 9:4-6). Los hombres de Israel no consultaron al Señor (9:14).", "Ils apportèrent du pain sec et des vêtements usés pour paraître venir de loin (Jos 9,4-6). Les hommes d'Israël ne consultèrent pas le Seigneur (9,14).", "Portarono pane secco e vesti logore per sembrare venuti da lontano (Gs 9,4-6). Gli uomini d'Israele non consultarono il Signore (9,14).", "Sie brachten trockenes Brot und abgetragene Kleider mit, um wie aus der Ferne zu wirken (Jos 9,4–6). Die Männer Israels befragten den Herrn nicht (9,14)."),
    },
    era: [
      { year: -1406, label: L("Queda de Jericó", "Fall of Jericho", "Caída de Jericó", "Chute de Jéricho", "Caduta di Gerico", "Fall Jerichos") },
    ],
  },
  inheritance: {
    stops: [
      { id: "remaining", title: L("A terra que ainda resta", "The land that remains", "La tierra que aún queda", "Le pays qui reste", "La terra che rimane", "Das Land, das noch übrig ist"), ref: js(13, 1, 8), people: ["joshua", "god"], text: L(
        "Josué está velho, e muita terra ainda não foi tomada. O Senhor manda repartir a terra entre as nove tribos e meia; as outras já receberam a sua parte a leste do Jordão.",
        "Joshua is old, and much land has not yet been taken. The Lord tells him to divide the land among the nine and a half tribes; the others have already received their share east of the Jordan.",
        "Josué es viejo, y queda mucha tierra por tomar. El Señor manda repartir la tierra entre las nueve tribus y media; las demás ya recibieron su parte al este del Jordán.",
        "Josué est vieux, et beaucoup de pays reste à prendre. Le Seigneur lui demande de partager le pays entre les neuf tribus et demie ; les autres ont déjà reçu leur part à l'est du Jourdain.",
        "Giosuè è vecchio, e molta terra resta da prendere. Il Signore gli chiede di dividere la terra tra le nove tribù e mezza; le altre hanno già ricevuto la loro parte a est del Giordano.",
        "Josua ist alt, und viel Land ist noch nicht eingenommen. Der Herr sagt ihm, er solle das Land unter die neuneinhalb Stämme verteilen; die übrigen haben ihr Erbteil schon östlich des Jordan erhalten.") },
      { id: "caleb", placeId: "hebron", title: L("Hebron", "Hebron", "Hebrón", "Hébron", "Ebron", "Hebron"), ref: js(14, 6, 15), people: ["caleb", "joshua"], text: L(
        "Em Gilgal, Calebe lembra a promessa de Moisés. Aos 85 anos, diz que continua tão forte como no dia em que foi espiar a terra. Josué abençoa Calebe, e Hebron passa a ser a sua herança.",
        "At Gilgal, Caleb recalls Moses' promise. At 85, he says he is as strong as on the day he went to spy out the land. Joshua blesses him and gives him Hebron as his inheritance.",
        "En Gilgal, Caleb recuerda la promesa de Moisés. A los 85 años dice que sigue tan fuerte como el día en que fue a reconocer la tierra. Josué lo bendice y le da Hebrón como heredad.",
        "À Guilgal, Caleb rappelle la promesse de Moïse. À 85 ans, il se dit aussi fort qu'au jour où il alla explorer le pays. Josué le bénit et lui donne Hébron en héritage.",
        "A Gàlgala, Caleb ricorda la promessa di Mosè. A 85 anni dice di essere forte come il giorno in cui andò a esplorare la terra. Giosuè lo benedice e gli dà Ebron in eredità.",
        "In Gilgal erinnert Kaleb an die Zusage des Mose. Mit 85 Jahren sagt er, er sei noch so stark wie an dem Tag, als er das Land erkundete. Josua segnet ihn und gibt ihm Hebron zum Erbteil.") },
      { id: "debir", placeId: "debir", ref: js(15, 13, 19), people: ["caleb", "othniel", "achsah"], text: L(
        "Calebe promete a filha, Acsa, a quem tomar Quiriate-Sefer, que é Debir. Otniel toma a cidade e casa com Acsa. Ela pede ao pai fontes de água e recebe as de cima e as de baixo.",
        "Caleb promises his daughter Achsah to whoever takes Kiriath-sepher, that is, Debir. Othniel takes the city and marries Achsah. She asks her father for springs of water and receives the upper and lower springs.",
        "Caleb promete a su hija Acsa a quien tome Quiriat-séfer, que es Debir. Otoniel toma la ciudad y se casa con Acsa. Ella pide a su padre fuentes de agua y recibe las de arriba y las de abajo.",
        "Caleb promet sa fille Aksa à celui qui prendra Qiryath-Sépher, c'est-à-dire Debir. Otniel prend la ville et épouse Aksa. Elle demande à son père des sources d'eau et reçoit les sources d'en haut et celles d'en bas.",
        "Caleb promette la figlia Acsa a chi prenderà Kiriat-Sefer, cioè Debir. Otniel prende la città e sposa Acsa. Lei chiede al padre sorgenti d'acqua e riceve quelle superiori e quelle inferiori.",
        "Kaleb verspricht seine Tochter Achsa dem, der Kirjat-Sefer, das ist Debir, einnimmt. Otniël nimmt die Stadt ein und heiratet Achsa. Sie bittet ihren Vater um Wasserquellen und erhält die oberen und die unteren Quellen.") },
      { id: "shiloh", placeId: "shiloh", ref: js(18, 1, 10), people: ["joshua"], text: L(
        "Toda a congregação de Israel vai a Siló e ali arma a tenda do encontro. Sete tribos ainda não têm herança. Três homens por tribo percorrem a terra e escrevem a sua descrição; depois, Josué lança as sortes diante do Senhor.",
        "The whole congregation of Israel assembles at Shiloh and sets up the tent of meeting there. Seven tribes still have no inheritance. Three men from each tribe walk through the land and write a description of it; then Joshua casts lots before the Lord.",
        "Toda la congregación de Israel se reúne en Silo y levanta allí el tabernáculo de reunión. Siete tribus aún no tienen heredad. Tres hombres por tribu recorren la tierra y la describen por escrito; después Josué echa suertes delante del Señor.",
        "Toute l'assemblée d'Israël se réunit à Silo et y dresse la tente de la rencontre. Sept tribus n'ont pas encore d'héritage. Trois hommes par tribu parcourent le pays et le décrivent par écrit ; puis Josué tire au sort devant le Seigneur.",
        "Tutta la comunità d'Israele si raduna a Silo e vi erige la tenda del convegno. Sette tribù non hanno ancora eredità. Tre uomini per tribù percorrono la terra e la descrivono per iscritto; poi Giosuè getta le sorti davanti al Signore.",
        "Die ganze Gemeinde Israels versammelt sich in Silo und richtet dort das Zelt der Begegnung auf. Sieben Stämme haben noch kein Erbteil. Je drei Männer pro Stamm durchziehen das Land und beschreiben es; dann wirft Josua das Los vor dem Herrn.") },
      { id: "timnath", placeId: "timnath-serah", ref: js(19, 49, 51), people: ["joshua", "eleazar"], text: L(
        "Terminada a partilha, os israelitas dão a Josué a cidade que ele pediu: Timnate-Sera, na região montanhosa de Efraim. Ele reconstrói a cidade e passa a morar nela.",
        "When the division is finished, the Israelites give Joshua the city he asked for: Timnath-serah, in the hill country of Ephraim. He rebuilds the city and settles there.",
        "Terminado el reparto, los israelitas dan a Josué la ciudad que pidió: Timnat-sera, en los montes de Efraín. Él reedifica la ciudad y habita en ella.",
        "Le partage achevé, les Israélites donnent à Josué la ville qu'il a demandée : Timnath-Sérah, dans la montagne d'Éphraïm. Il rebâtit la ville et s'y établit.",
        "Finita la spartizione, gli Israeliti danno a Giosuè la città che ha chiesto: Timnat-Serach, sulle montagne di Èfraim. Egli ricostruisce la città e vi abita.",
        "Nach der Verteilung geben die Israeliten Josua die Stadt, um die er gebeten hat: Timnat-Serach im Gebirge Ephraim. Er baut die Stadt auf und wohnt darin.") },
      { id: "refuge", placeId: "kedesh", title: L("Quedes · cidade de refúgio", "Kedesh · city of refuge", "Cedes · ciudad de refugio", "Qédesh · ville de refuge", "Kedes · città di rifugio", "Kedesch · Zufluchtsstadt"), ref: js(20, 1, 9), people: ["god", "joshua"], text: L(
        "O Senhor manda separar cidades de refúgio. Quem matar alguém sem intenção pode fugir para lá e ser julgado com justiça. A primeira citada é Quedes, na Galileia.",
        "The Lord commands that cities of refuge be set apart. Whoever kills someone unintentionally can flee there and receive a fair hearing. The first one named is Kedesh in Galilee.",
        "El Señor manda señalar ciudades de refugio. Quien mate a alguien sin intención puede huir allí y ser juzgado con justicia. La primera nombrada es Cedes, en Galilea.",
        "Le Seigneur ordonne de désigner des villes de refuge. Celui qui tue quelqu'un sans le vouloir peut s'y enfuir et être jugé équitablement. La première nommée est Qédesh, en Galilée.",
        "Il Signore ordina di stabilire città di rifugio. Chi uccide qualcuno senza volerlo può fuggirvi ed essere giudicato con giustizia. La prima nominata è Kedes, in Galilea.",
        "Der Herr gebietet, Zufluchtsstädte zu bestimmen. Wer jemanden ohne Absicht tötet, kann dorthin fliehen und ein gerechtes Verfahren erhalten. Als erste wird Kedesch in Galiläa genannt.") },
    ],
    checkpoint: {
      ref: js(21, 43, 45), answer: 0,
      question: L("Como o livro resume as promessas do Senhor a Israel?", "How does the book sum up the Lord's promises to Israel?", "¿Cómo resume el libro las promesas del Señor a Israel?", "Comment le livre résume-t-il les promesses du Seigneur à Israël ?", "Come riassume il libro le promesse del Signore a Israele?", "Wie fasst das Buch die Zusagen des Herrn an Israel zusammen?"),
      options: L(["Nenhuma falhou; todas se cumpriram", "Só algumas se cumpriram", "Ficaram para outra geração"], ["None failed; all came to pass", "Only some came to pass", "They were left for another generation"], ["Ninguna faltó; todas se cumplieron", "Solo algunas se cumplieron", "Quedaron para otra generación"], ["Aucune n'a manqué ; toutes se sont accomplies", "Seules quelques-unes se sont accomplies", "Elles furent laissées à une autre génération"], ["Nessuna è venuta meno; tutte si sono compiute", "Solo alcune si sono compiute", "Furono lasciate a un'altra generazione"], ["Keine blieb aus; alle trafen ein", "Nur einige trafen ein", "Sie blieben einer anderen Generation überlassen"]),
      explanation: L("«Nenhuma palavra falhou de todas as boas palavras que o Senhor falara à casa de Israel; tudo se cumpriu» (Js 21:45).", "“Not one word of all the good promises the Lord had made to the house of Israel failed; all came to pass” (Josh 21:45).", "«No faltó palabra de todas las buenas promesas que el Señor había hecho a la casa de Israel; todo se cumplió» (Jos 21:45).", "« Aucune de toutes les bonnes paroles que le Seigneur avait dites à la maison d'Israël ne resta sans effet : toutes s'accomplirent » (Jos 21,45).", "«Non venne meno neppure una delle buone promesse che il Signore aveva fatto alla casa d'Israele: tutto si compì» (Gs 21,45).", "„Es fehlte nichts an all dem Guten, das der Herr dem Haus Israel zugesagt hatte; alles traf ein“ (Jos 21,45)."),
    },
    family: { ref: js(15, 16, 17), root: { person: "caleb", children: [
      { person: "achsah", spouses: ["othniel"], highlight: true },
    ] } },
    era: [
      { year: -1399, label: L("Calebe recebe Hebron", "Caleb receives Hebron", "Caleb recibe Hebrón", "Caleb reçoit Hébron", "Caleb riceve Ebron", "Kaleb erhält Hebron") },
    ],
  },
  renewal: {
    stops: [
      { id: "altar", placeId: "jordan", title: L("Junto ao Jordão · o altar", "By the Jordan · the altar", "Junto al Jordán · el altar", "Près du Jourdain · l'autel", "Presso il Giordano · l'altare", "Am Jordan · der Altar"), ref: js(22, 10, 34), people: ["phinehas"], text: L(
        "As tribos de Rúben, Gade e metade de Manassés voltam para o leste e erguem um grande altar junto ao Jordão. As outras tribos ajuntam o povo em Siló para a guerra, mas primeiro enviam Fineias. O altar não é para sacrifícios: é uma testemunha de que todos servem ao Senhor.",
        "The tribes of Reuben, Gad and half of Manasseh return east and build a large altar by the Jordan. The other tribes gather at Shiloh for war but first send Phinehas. The altar is not for sacrifices: it is a witness that all serve the Lord.",
        "Las tribus de Rubén, Gad y la media tribu de Manasés vuelven al este y edifican un gran altar junto al Jordán. Las demás tribus se reúnen en Silo para la guerra, pero antes envían a Finees. El altar no es para sacrificios: es un testimonio de que todos sirven al Señor.",
        "Les tribus de Ruben, de Gad et la demi-tribu de Manassé rentrent à l'est et bâtissent un grand autel près du Jourdain. Les autres tribus se rassemblent à Silo pour la guerre, mais envoient d'abord Phinéas. L'autel n'est pas pour les sacrifices : il est un témoin que tous servent le Seigneur.",
        "Le tribù di Ruben, di Gad e metà di Manasse tornano a est e costruiscono un grande altare presso il Giordano. Le altre tribù si radunano a Silo per la guerra, ma prima mandano Pincas. L'altare non è per i sacrifici: è un testimone che tutti servono il Signore.",
        "Die Stämme Ruben, Gad und der halbe Stamm Manasse kehren nach Osten zurück und bauen am Jordan einen großen Altar. Die übrigen Stämme versammeln sich in Silo zum Krieg, senden aber zuerst Pinhas. Der Altar ist nicht für Opfer: Er ist ein Zeuge, dass alle dem Herrn dienen.") },
      { id: "farewell", title: L("Josué reúne os líderes", "Joshua gathers the leaders", "Josué reúne a los líderes", "Josué rassemble les chefs", "Giosuè raduna i capi", "Josua versammelt die Ältesten"), ref: js(23, 1, 16), people: ["joshua"], text: L(
        "Já velho, Josué chama os anciãos, os chefes, os juízes e os oficiais. Lembra que o Senhor lutou por Israel e pede que amem o Senhor, seu Deus. Avisa que, se se afastarem dele, perderão a boa terra.",
        "Now old, Joshua summons the elders, heads, judges and officers. He reminds them that the Lord fought for Israel and urges them to love the Lord their God. He warns that if they turn away, they will lose the good land.",
        "Ya anciano, Josué convoca a los ancianos, jefes, jueces y oficiales. Les recuerda que el Señor peleó por Israel y les pide que amen al Señor su Dios. Advierte que, si se apartan, perderán la buena tierra.",
        "Devenu vieux, Josué convoque les anciens, les chefs, les juges et les officiers. Il rappelle que le Seigneur a combattu pour Israël et les exhorte à aimer le Seigneur leur Dieu. Il avertit que, s'ils se détournent, ils perdront ce bon pays.",
        "Ormai vecchio, Giosuè convoca gli anziani, i capi, i giudici e gli scribi. Ricorda che il Signore ha combattuto per Israele e li esorta ad amare il Signore loro Dio. Avverte che, se si allontaneranno, perderanno la buona terra.",
        "Alt geworden, ruft Josua die Ältesten, Häupter, Richter und Amtleute zusammen. Er erinnert daran, dass der Herr für Israel gekämpft hat, und mahnt sie, den Herrn, ihren Gott, zu lieben. Er warnt: Wenn sie sich abwenden, werden sie das gute Land verlieren.") },
      { id: "choose", placeId: "shechem", ref: js(24, 1, 15), people: ["joshua", "abraham"], text: L(
        "Em Siquém, Josué recorda a história de Israel desde Abraão. Depois diz ao povo: «Escolhei hoje a quem sirvais… Eu e a minha casa serviremos ao Senhor.»",
        "At Shechem, Joshua recounts Israel's history from Abraham onward. Then he tells the people: “Choose this day whom you will serve… As for me and my house, we will serve the Lord.”",
        "En Siquem, Josué recuerda la historia de Israel desde Abraham. Luego dice al pueblo: «Escogeos hoy a quién sirváis… Yo y mi casa serviremos al Señor».",
        "À Sichem, Josué retrace l'histoire d'Israël depuis Abraham. Puis il dit au peuple : « Choisissez aujourd'hui qui vous voulez servir… Moi et ma maison, nous servirons le Seigneur. »",
        "A Sichem, Giosuè ripercorre la storia d'Israele a partire da Abramo. Poi dice al popolo: «Scegliete oggi chi volete servire… Io e la mia casa serviremo il Signore».",
        "In Sichem erzählt Josua die Geschichte Israels seit Abraham. Dann sagt er zum Volk: „Wählt euch heute, wem ihr dienen wollt … Ich aber und mein Haus wollen dem Herrn dienen.“") },
      { id: "covenant", placeId: "shechem", title: L("Siquém · a pedra testemunha", "Shechem · the witness stone", "Siquem · la piedra testigo", "Sichem · la pierre témoin", "Sichem · la pietra testimone", "Sichem · der Zeugenstein"), ref: js(24, 19, 28), people: ["joshua"], text: L(
        "Josué avisa que servir ao Senhor é coisa séria, mas o povo insiste: «Serviremos ao Senhor.» Ele faz uma aliança, escreve as palavras no livro da lei e ergue uma grande pedra debaixo do carvalho, como testemunha.",
        "Joshua warns that serving the Lord is serious, but the people insist: “We will serve the Lord.” He makes a covenant, writes the words in the book of the law and sets up a large stone under the oak as a witness.",
        "Josué advierte que servir al Señor es algo serio, pero el pueblo insiste: «Serviremos al Señor». Él hace un pacto, escribe las palabras en el libro de la ley y levanta una gran piedra debajo de la encina, como testigo.",
        "Josué avertit que servir le Seigneur est chose sérieuse, mais le peuple insiste : « Nous servirons le Seigneur. » Il conclut une alliance, écrit ces paroles dans le livre de la loi et dresse une grande pierre sous le chêne, comme témoin.",
        "Giosuè avverte che servire il Signore è cosa seria, ma il popolo insiste: «Serviremo il Signore». Egli conclude un'alleanza, scrive le parole nel libro della legge e innalza una grande pietra sotto la quercia, come testimone.",
        "Josua warnt, dass der Dienst für den Herrn ernst ist, doch das Volk bleibt dabei: „Wir wollen dem Herrn dienen.“ Er schließt einen Bund, schreibt die Worte in das Buch des Gesetzes und richtet unter der Eiche einen großen Stein als Zeugen auf.") },
      { id: "burial", placeId: "timnath-serah", ref: js(24, 29, 31), people: ["joshua"], text: L(
        "Josué, servo do Senhor, morre aos 110 anos e é sepultado em Timnate-Sera. Israel serve ao Senhor durante os dias de Josué e dos anciãos que viveram depois dele.",
        "Joshua, the servant of the Lord, dies at 110 and is buried at Timnath-serah. Israel serves the Lord throughout the days of Joshua and of the elders who outlived him.",
        "Josué, siervo del Señor, muere a los 110 años y es sepultado en Timnat-sera. Israel sirve al Señor todos los días de Josué y de los ancianos que le sobrevivieron.",
        "Josué, serviteur du Seigneur, meurt à 110 ans et est enseveli à Timnath-Sérah. Israël sert le Seigneur pendant toute la vie de Josué et des anciens qui lui survécurent.",
        "Giosuè, servo del Signore, muore a 110 anni ed è sepolto a Timnat-Serach. Israele serve il Signore per tutta la vita di Giosuè e degli anziani che gli sopravvissero.",
        "Josua, der Knecht des Herrn, stirbt mit 110 Jahren und wird in Timnat-Serach begraben. Israel dient dem Herrn, solange Josua lebte und die Ältesten, die ihn überlebten.") },
      { id: "bones", placeId: "shechem", title: L("Siquém · os ossos de José", "Shechem · the bones of Joseph", "Siquem · los huesos de José", "Sichem · les ossements de Joseph", "Sichem · le ossa di Giuseppe", "Sichem · die Gebeine Josefs"), ref: js(24, 32, 33), people: ["joseph", "jacob", "eleazar", "phinehas"], text: L(
        "Os ossos de José, trazidos do Egito, são sepultados em Siquém, no campo que Jacob comprara. Morre também Eleazar, filho de Arão, e é sepultado na colina de Fineias, seu filho.",
        "Joseph's bones, brought up from Egypt, are buried at Shechem, in the field Jacob had bought. Eleazar son of Aaron also dies and is buried at the hill of his son Phinehas.",
        "Los huesos de José, traídos de Egipto, son sepultados en Siquem, en el campo que Jacob había comprado. Muere también Eleazar, hijo de Aarón, y es sepultado en el collado de Finees, su hijo.",
        "Les ossements de Joseph, remontés d'Égypte, sont ensevelis à Sichem, dans le champ que Jacob avait acheté. Éléazar, fils d'Aaron, meurt aussi et est enseveli sur la colline de Phinéas, son fils.",
        "Le ossa di Giuseppe, portate dall'Egitto, sono sepolte a Sichem, nel campo che Giacobbe aveva acquistato. Muore anche Eleazar, figlio di Aronne, ed è sepolto sulla collina di Pincas, suo figlio.",
        "Die Gebeine Josefs, aus Ägypten heraufgebracht, werden in Sichem begraben, auf dem Feld, das Jakob gekauft hatte. Auch Eleasar, Aarons Sohn, stirbt und wird auf dem Hügel seines Sohnes Pinhas begraben.") },
    ],
    checkpoint: {
      ref: js(24, 14, 18), answer: 1,
      question: L("O que Josué declara diante do povo em Siquém?", "What does Joshua declare before the people at Shechem?", "¿Qué declara Josué ante el pueblo en Siquem?", "Que déclare Josué devant le peuple à Sichem ?", "Che cosa dichiara Giosuè davanti al popolo a Sichem?", "Was erklärt Josua vor dem Volk in Sichem?"),
      options: L(["Voltaremos para o Egito", "Eu e a minha casa serviremos ao Senhor", "Faremos um rei sobre Israel"], ["We will go back to Egypt", "As for me and my house, we will serve the Lord", "We will set a king over Israel"], ["Volveremos a Egipto", "Yo y mi casa serviremos al Señor", "Pondremos un rey sobre Israel"], ["Nous retournerons en Égypte", "Moi et ma maison, nous servirons le Seigneur", "Nous établirons un roi sur Israël"], ["Torneremo in Egitto", "Io e la mia casa serviremo il Signore", "Metteremo un re su Israele"], ["Wir kehren nach Ägypten zurück", "Ich und mein Haus wollen dem Herrn dienen", "Wir setzen einen König über Israel"]),
      explanation: L("Josué pede ao povo que escolha a quem servir e dá o exemplo da própria casa (Js 24:15). O povo responde que também servirá ao Senhor (24:18).", "Joshua asks the people to choose whom they will serve and sets the example of his own household (Josh 24:15). The people answer that they too will serve the Lord (24:18).", "Josué pide al pueblo que escoja a quién servir y da el ejemplo de su propia casa (Jos 24:15). El pueblo responde que también servirá al Señor (24:18).", "Josué demande au peuple de choisir qui servir et donne l'exemple de sa propre maison (Jos 24,15). Le peuple répond qu'il servira lui aussi le Seigneur (24,18).", "Giosuè chiede al popolo di scegliere chi servire e dà l'esempio della propria casa (Gs 24,15). Il popolo risponde che anch'esso servirà il Signore (24,18).", "Josua fordert das Volk auf zu wählen, wem es dienen will, und geht mit seinem eigenen Haus voran (Jos 24,15). Das Volk antwortet, auch es wolle dem Herrn dienen (24,18)."),
    },
    family: { ref: js(24, 33), root: { person: "aaron", children: [
      { person: "eleazar", children: [{ person: "phinehas", highlight: true }] },
    ] } },
    era: [
      { year: -1375, label: L("Morte de Josué", "Death of Joshua", "Muerte de Josué", "Mort de Josué", "Morte di Giosuè", "Tod Josuas") },
    ],
  },
};
