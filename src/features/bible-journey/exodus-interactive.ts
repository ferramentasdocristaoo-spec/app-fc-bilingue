import { L, type JourneyInteractiveSection, type TabernaclePart } from "./genesis-interactive";
import type { BibleRef } from "./references";

/**
 * Camada interativa do Êxodo: paragens, quiz, família, tempo e Tabernáculo.
 *
 * ESTADO: PENDENTE DE REVISÃO HUMANA. Textos escritos para a Jornada a partir do texto
 * bíblico citado em cada `ref`; ainda não passaram por revisão teológica nem de tradução.
 */
export const exodusReviewStatus = "pendente-revisao-humana" as const;

const ex = (chapter: number, verse?: number, endVerse?: number, endChapter?: number): BibleRef =>
  ({ book: "exodus", chapter, verse, endVerse, endChapter });

const SCHNORR = { artist: "Julius Schnorr von Carolsfeld", year: "1860", license: "PD" };
const commons = (n: string) => `https://commons.wikimedia.org/wiki/File:Schnorr_von_Carolsfeld_Bibel_in_Bildern_1860_${n}.png`;

export const tabernacleParts: TabernaclePart[] = [
  { id: "gate", x: 8.5, y: 51, refs: [ex(27, 16)],
    name: L("A porta do átrio", "The courtyard gate", "La puerta del atrio", "La porte du parvis", "La porta del cortile", "Das Tor des Vorhofs"),
    text: L(
      "Uma só entrada, voltada a leste: vinte côvados de cortina em azul, púrpura, carmesim e linho fino, obra de bordador.",
      "A single entrance, facing east: twenty cubits of curtain in blue, purple, scarlet and fine linen, the work of an embroiderer.",
      "Una sola entrada, hacia el oriente: veinte codos de cortina azul, púrpura, carmesí y lino fino, obra de bordador.",
      "Une seule entrée, tournée vers l'orient : vingt coudées de rideau bleu, pourpre, cramoisi et de fin lin, ouvrage de brodeur.",
      "Un solo ingresso, rivolto a oriente: venti cubiti di cortina in azzurro, porpora, scarlatto e lino fino, opera di ricamatore.",
      "Ein einziger Eingang nach Osten: zwanzig Ellen Vorhang aus blauem und rotem Purpur, Karmesin und feinem Leinen, Stickerarbeit.") },
  { id: "altar", x: 26.4, y: 55, refs: [ex(27, 1, 8)],
    name: L("O altar de bronze", "The bronze altar", "El altar de bronce", "L'autel de bronze", "L'altare di bronzo", "Der Brandopferaltar"),
    text: L(
      "O primeiro objeto depois da porta: madeira de acácia coberta de bronze, cinco côvados de lado. Ali se ofereciam os holocaustos.",
      "The first object after the gate: acacia wood overlaid with bronze, five cubits square. Burnt offerings were made there.",
      "El primer objeto después de la puerta: madera de acacia cubierta de bronce, cinco codos por lado. Allí se ofrecían los holocaustos.",
      "Le premier objet après la porte : bois d'acacia couvert de bronze, cinq coudées de côté. On y offrait les holocaustes.",
      "Il primo oggetto dopo la porta: legno di acacia rivestito di bronzo, cinque cubiti di lato. Lì si offrivano gli olocausti.",
      "Das Erste hinter dem Tor: Akazienholz mit Bronze überzogen, fünf Ellen im Geviert. Hier wurden die Brandopfer dargebracht.") },
  { id: "laver", x: 40.9, y: 55, refs: [ex(30, 17, 21)],
    name: L("A pia de bronze", "The bronze basin", "La fuente de bronce", "La cuve de bronze", "La conca di bronzo", "Das Bronzebecken"),
    text: L(
      "Entre o altar e a tenda. Os sacerdotes lavavam as mãos e os pés antes de entrar ou de se aproximar do altar.",
      "Between the altar and the tent. The priests washed their hands and feet before entering or approaching the altar.",
      "Entre el altar y la tienda. Los sacerdotes se lavaban las manos y los pies antes de entrar o de acercarse al altar.",
      "Entre l'autel et la tente. Les prêtres se lavaient les mains et les pieds avant d'entrer ou de s'approcher de l'autel.",
      "Tra l'altare e la tenda. I sacerdoti si lavavano le mani e i piedi prima di entrare o di avvicinarsi all'altare.",
      "Zwischen Altar und Zelt. Die Priester wuschen Hände und Füße, bevor sie eintraten oder zum Altar traten.") },
  { id: "tent", x: 68.4, y: 52.7, refs: [ex(26, 1, 14)],
    name: L("A tenda", "The tent", "La tienda", "La tente", "La tenda", "Das Zelt"),
    text: L(
      "Cortinas de linho e de pelos de cabra, cobertas de peles. Por dentro, duas salas: o Lugar Santo e o Santo dos Santos.",
      "Curtains of linen and goats' hair, covered with skins. Inside are two rooms: the Holy Place and the Most Holy Place.",
      "Cortinas de lino y de pelo de cabra, cubiertas de pieles. Por dentro, dos salas: el Lugar Santo y el Lugar Santísimo.",
      "Des tentures de lin et de poil de chèvre, couvertes de peaux. À l'intérieur, deux salles : le lieu saint et le lieu très saint.",
      "Teli di lino e di pelo di capra, coperti di pelli. All'interno due ambienti: il Luogo Santo e il Santissimo.",
      "Teppiche aus Leinen und Ziegenhaar, mit Fellen bedeckt. Innen zwei Räume: das Heilige und das Allerheiligste.") },
  { id: "cloud", x: 71, y: 30, refs: [ex(40, 34, 38)],
    name: L("A nuvem da glória", "The cloud of glory", "La nube de la gloria", "La nuée de la gloire", "La nube della gloria", "Die Wolke der Herrlichkeit"),
    text: L(
      "Quando a obra acabou, a nuvem cobriu a tenda e a glória do Senhor a encheu. Quando a nuvem se erguia, o povo partia.",
      "When the work was finished, the cloud covered the tent and the glory of the Lord filled it. When the cloud lifted, the people set out.",
      "Al terminar la obra, la nube cubrió la tienda y la gloria del Señor la llenó. Cuando la nube se alzaba, el pueblo partía.",
      "L'ouvrage achevé, la nuée couvrit la tente et la gloire du Seigneur la remplit. Quand la nuée s'élevait, le peuple partait.",
      "Finita l'opera, la nube coprì la tenda e la gloria del Signore la riempì. Quando la nube si alzava, il popolo partiva.",
      "Als das Werk vollendet war, bedeckte die Wolke das Zelt, und die Herrlichkeit des Herrn erfüllte es. Hob sich die Wolke, brach das Volk auf.") },
  { id: "court", x: 50, y: 75, refs: [ex(27, 9, 19)],
    name: L("As cortinas do átrio", "The courtyard hangings", "Las cortinas del atrio", "Les toiles du parvis", "Le cortine del cortile", "Die Behänge des Vorhofs"),
    text: L(
      "Linho fino retorcido em colunas com bases de bronze: cem côvados por cinquenta, em volta de todo o santuário.",
      "Fine twisted linen on pillars with bronze bases: a hundred cubits by fifty, around the whole sanctuary.",
      "Lino fino torcido en columnas con basas de bronce: cien codos por cincuenta, alrededor de todo el santuario.",
      "Du fin lin retors sur des colonnes à bases de bronze : cent coudées sur cinquante, autour de tout le sanctuaire.",
      "Lino fino ritorto su colonne con basi di bronzo: cento cubiti per cinquanta, attorno a tutto il santuario.",
      "Gezwirntes feines Leinen an Säulen mit Bronzefüßen: hundert mal fünfzig Ellen rund um das ganze Heiligtum.") },
  { id: "camp", x: 36, y: 18, refs: [{ book: "numbers", chapter: 2 }],
    name: L("O acampamento das tribos", "The camp of the tribes", "El campamento de las tribus", "Le camp des tribus", "L'accampamento delle tribù", "Das Lager der Stämme"),
    text: L(
      "As doze tribos acampavam em volta, três de cada lado, com a tenda ao centro: Deus no meio do seu povo.",
      "The twelve tribes camped around it, three on each side, with the tent at the centre: God in the midst of his people.",
      "Las doce tribus acampaban alrededor, tres por cada lado, con la tienda en el centro: Dios en medio de su pueblo.",
      "Les douze tribus campaient autour, trois de chaque côté, la tente au centre : Dieu au milieu de son peuple.",
      "Le dodici tribù si accampavano intorno, tre per lato, con la tenda al centro: Dio in mezzo al suo popolo.",
      "Die zwölf Stämme lagerten ringsum, drei auf jeder Seite, das Zelt in der Mitte: Gott mitten unter seinem Volk.") },
  // Por dentro da tenda (planta com o leste à esquerda, como a gravura; por isso o norte fica em baixo).
  { id: "lampstand", plan: { x: 170, y: 52 }, refs: [ex(25, 31, 40), ex(26, 35)],
    name: L("O candelabro de ouro", "The golden lampstand", "El candelabro de oro", "Le chandelier d'or", "Il candelabro d'oro", "Der goldene Leuchter"),
    text: L(
      "Do lado sul do Lugar Santo, em frente à mesa: ouro puro batido e sete lâmpadas.",
      "On the south side of the Holy Place, opposite the table: hammered pure gold and seven lamps.",
      "En el lado sur del Lugar Santo, frente a la mesa: oro puro labrado y siete lámparas.",
      "Du côté sud du lieu saint, en face de la table : or pur battu et sept lampes.",
      "Sul lato sud del Luogo Santo, di fronte alla tavola: oro puro lavorato a martello e sette lampade.",
      "An der Südseite des Heiligen, dem Tisch gegenüber: getriebenes reines Gold und sieben Lampen.") },
  { id: "table", plan: { x: 170, y: 168 }, refs: [ex(25, 23, 30), ex(26, 35)],
    name: L("A mesa dos pães", "The table of the bread", "La mesa de los panes", "La table des pains", "La tavola dei pani", "Der Schaubrottisch"),
    text: L(
      "Do lado norte do Lugar Santo: madeira de acácia coberta de ouro, com os pães da presença sempre diante do Senhor.",
      "On the north side of the Holy Place: acacia wood overlaid with gold, with the bread of the Presence always before the Lord.",
      "En el lado norte del Lugar Santo: madera de acacia cubierta de oro, con los panes de la proposición siempre delante del Señor.",
      "Du côté nord du lieu saint : bois d'acacia couvert d'or, avec les pains de proposition toujours devant le Seigneur.",
      "Sul lato nord del Luogo Santo: legno di acacia rivestito d'oro, con i pani della presenza sempre davanti al Signore.",
      "An der Nordseite des Heiligen: Akazienholz mit Gold überzogen, mit den Schaubroten stets vor dem Herrn.") },
  { id: "incense", plan: { x: 345, y: 110 }, refs: [ex(30, 1, 10)],
    name: L("O altar do incenso", "The altar of incense", "El altar del incienso", "L'autel des parfums", "L'altare dell'incenso", "Der Räucheraltar"),
    text: L(
      "Diante do véu. Arão queimava ali incenso de manhã e ao entardecer, perpetuamente diante do Senhor.",
      "In front of the veil. Aaron burned incense there morning and evening, perpetually before the Lord.",
      "Delante del velo. Aarón quemaba allí incienso por la mañana y al anochecer, perpetuamente delante del Señor.",
      "Devant le voile. Aaron y brûlait le parfum matin et soir, perpétuellement devant le Seigneur.",
      "Davanti al velo. Aronne vi bruciava l'incenso al mattino e al tramonto, perennemente davanti al Signore.",
      "Vor dem Vorhang. Aaron verbrannte dort morgens und abends Räucherwerk, beständig vor dem Herrn.") },
  { id: "ark", plan: { x: 490, y: 110 }, refs: [ex(25, 10, 22), ex(26, 33, 34)],
    name: L("A Arca da Aliança", "The Ark of the Covenant", "El Arca del Pacto", "L'arche de l'alliance", "L'arca dell'alleanza", "Die Bundeslade"),
    text: L(
      "Atrás do véu, no Santo dos Santos: a arca com o testemunho, coberta pelo propiciatório e pelos querubins. Ali Deus diz que se encontrará com Moisés.",
      "Behind the veil, in the Most Holy Place: the ark with the testimony, covered by the mercy seat and the cherubim. There God says he will meet with Moses.",
      "Tras el velo, en el Lugar Santísimo: el arca con el testimonio, cubierta por el propiciatorio y los querubines. Allí Dios dice que se encontrará con Moisés.",
      "Derrière le voile, dans le lieu très saint : l'arche avec le témoignage, couverte du propitiatoire et des chérubins. C'est là que Dieu dit rencontrer Moïse.",
      "Dietro il velo, nel Santissimo: l'arca con la testimonianza, coperta dal propiziatorio e dai cherubini. Lì Dio dice che incontrerà Mosè.",
      "Hinter dem Vorhang, im Allerheiligsten: die Lade mit dem Zeugnis, bedeckt vom Sühnedeckel und den Cherubim. Dort, sagt Gott, will er Mose begegnen.") },
];

export const exodusInteractive: Record<string, JourneyInteractiveSection> = {
  deliverer: {
    stops: [
      { id: "slavery", placeId: "egypt", ref: ex(1, 8, 14), people: ["pharaoh"], text: L(
        "Um novo faraó, que não conhecera José, teme o crescimento de Israel e impõe-lhe trabalhos forçados.",
        "A new Pharaoh, who did not know Joseph, fears Israel's growth and forces them into hard labour.",
        "Un nuevo faraón, que no conoció a José, teme el crecimiento de Israel y le impone trabajos forzados.",
        "Un nouveau pharaon, qui n'avait pas connu Joseph, craint l'essor d'Israël et lui impose de durs travaux.",
        "Un nuovo faraone, che non aveva conosciuto Giuseppe, teme la crescita di Israele e gli impone lavori forzati.",
        "Ein neuer Pharao, der Josef nicht kannte, fürchtet Israels Wachstum und zwingt es zu harter Fronarbeit.") },
      { id: "nile", placeId: "egypt", title: L("Egito · junto ao Nilo", "Egypt · by the Nile", "Egipto · junto al Nilo", "Égypte · au bord du Nil", "Egitto · presso il Nilo", "Ägypten · am Nil"), ref: ex(2, 1, 10), people: ["moses", "miriam", "jochebed"], text: L(
        "O menino é escondido num cesto entre os juncos. A filha do faraó encontra-o, cria-o e chama-lhe Moisés.",
        "The child is hidden in a basket among the reeds. Pharaoh's daughter finds him, raises him and names him Moses.",
        "El niño es escondido en una cesta entre los juncos. La hija del faraón lo encuentra, lo cría y lo llama Moisés.",
        "L'enfant est caché dans une corbeille parmi les roseaux. La fille de Pharaon le trouve, l'élève et le nomme Moïse.",
        "Il bambino è nascosto in un cesto tra i giunchi. La figlia del faraone lo trova, lo alleva e lo chiama Mosè.",
        "Das Kind wird in einem Kästchen im Schilf versteckt. Die Tochter des Pharao findet es, zieht es auf und nennt es Mose.") },
      { id: "midian", placeId: "midian", ref: ex(2, 15, 22), people: ["moses", "zipporah"], text: L(
        "Moisés foge do faraó para a terra de Midiã. Ali casa com Zípora e torna-se pastor.",
        "Moses flees from Pharaoh to the land of Midian. There he marries Zipporah and becomes a shepherd.",
        "Moisés huye del faraón a la tierra de Madián. Allí se casa con Séfora y llega a ser pastor.",
        "Moïse fuit Pharaon vers le pays de Madian. Il y épouse Séphora et devient berger.",
        "Mosè fugge dal faraone nella terra di Madian. Lì sposa Zippora e diventa pastore.",
        "Mose flieht vor dem Pharao ins Land Midian. Dort heiratet er Zippora und wird Hirte.") },
      { id: "bush", placeId: "sinai", title: L("Horebe, o monte de Deus", "Horeb, the mountain of God", "Horeb, el monte de Dios", "Horeb, la montagne de Dieu", "Oreb, il monte di Dio", "Horeb, der Berg Gottes"), ref: ex(3, 1, 12), people: ["moses", "god"], text: L(
        "Da sarça que arde sem se consumir, Deus chama Moisés e envia-o: «Eu estarei contigo.»",
        "From the bush that burns without being consumed, God calls Moses and sends him: “I will be with you.”",
        "Desde la zarza que arde sin consumirse, Dios llama a Moisés y lo envía: «Yo estaré contigo».",
        "Du buisson qui brûle sans se consumer, Dieu appelle Moïse et l'envoie : « Je serai avec toi. »",
        "Dal roveto che arde senza consumarsi, Dio chiama Mosè e lo manda: «Io sarò con te».",
        "Aus dem Dornbusch, der brennt und nicht verbrennt, ruft Gott Mose und sendet ihn: „Ich will mit dir sein.“") },
      { id: "return", placeId: "egypt", ref: ex(4, 18, 31), people: ["moses", "aaron", "jethro"], text: L(
        "Moisés despede-se de Jetro e regressa. Com Arão, fala aos anciãos, e o povo crê e adora.",
        "Moses takes leave of Jethro and returns. With Aaron he speaks to the elders, and the people believe and worship.",
        "Moisés se despide de Jetro y regresa. Con Aarón habla a los ancianos, y el pueblo cree y adora.",
        "Moïse prend congé de Jéthro et revient. Avec Aaron, il parle aux anciens, et le peuple croit et adore.",
        "Mosè si congeda da Ietro e ritorna. Con Aronne parla agli anziani, e il popolo crede e adora.",
        "Mose verabschiedet sich von Jitro und kehrt zurück. Mit Aaron spricht er zu den Ältesten, und das Volk glaubt und betet an.") },
    ],
    checkpoint: {
      ref: ex(3, 1, 4), answer: 1,
      question: L("Onde Deus chama Moisés a partir da sarça ardente?", "Where does God call Moses from the burning bush?", "¿Dónde llama Dios a Moisés desde la zarza ardiente?", "Où Dieu appelle-t-il Moïse depuis le buisson ardent ?", "Dove Dio chiama Mosè dal roveto ardente?", "Wo ruft Gott Mose aus dem brennenden Dornbusch?"),
      options: L(["No palácio do faraó", "No Horebe, o monte de Deus", "Junto ao rio Nilo"], ["In Pharaoh's palace", "At Horeb, the mountain of God", "By the river Nile"], ["En el palacio del faraón", "En Horeb, el monte de Dios", "Junto al río Nilo"], ["Dans le palais de Pharaon", "À Horeb, la montagne de Dieu", "Au bord du Nil"], ["Nel palazzo del faraone", "All'Oreb, il monte di Dio", "Presso il fiume Nilo"], ["Im Palast des Pharao", "Am Horeb, dem Berg Gottes", "Am Nil"]),
      explanation: L("No Horebe (Êx 3:1). Moisés pastoreava o rebanho de Jetro quando viu a sarça.", "At Horeb (Exod 3:1). Moses was tending Jethro's flock when he saw the bush.", "En Horeb (Éx 3:1). Moisés pastoreaba el rebaño de Jetro cuando vio la zarza.", "À Horeb (Ex 3,1). Moïse faisait paître le troupeau de Jéthro lorsqu'il vit le buisson.", "All'Oreb (Es 3,1). Mosè pascolava il gregge di Ietro quando vide il roveto.", "Am Horeb (2. Mose 3,1). Mose hütete die Herde Jitros, als er den Busch sah."),
    },
    family: { ref: ex(6, 16, 20), abridged: true, root: { person: "levi", children: [
      { person: "kohath", children: [
        { person: "amram", spouses: ["jochebed"], highlight: true, children: [
          { person: "miriam" }, { person: "aaron" },
          { person: "moses", spouses: ["zipporah"], highlight: true, children: [{ person: "gershom" }, { person: "eliezer" }] },
        ] },
      ] },
    ] } },
    figure: { ...SCHNORR, src: "/jornada/exodo/schnorr-045-moises-salvo.webp", width: 720, height: 564, sourceUrl: commons("045"),
      title: L("A filha do faraó encontra o menino", "Pharaoh's daughter finds the child", "La hija del faraón encuentra al niño", "La fille de Pharaon trouve l'enfant", "La figlia del faraone trova il bambino", "Die Tochter des Pharao findet das Kind") },
    era: [
      { year: -1526, label: L("Nascimento de Moisés", "Birth of Moses", "Nacimiento de Moisés", "Naissance de Moïse", "Nascita di Mosè", "Geburt des Mose") },
    ],
  },
  confrontation: {
    stops: [
      { id: "demand", placeId: "egypt", ref: ex(5, 1, 9), people: ["moses", "aaron", "pharaoh"], text: L(
        "«Deixa ir o meu povo.» O faraó recusa e torna o trabalho ainda mais pesado.",
        "“Let my people go.” Pharaoh refuses and makes the work even harder.",
        "«Deja ir a mi pueblo». El faraón se niega y hace aún más pesado el trabajo.",
        "« Laisse aller mon peuple. » Pharaon refuse et alourdit encore le travail.",
        "«Lascia andare il mio popolo». Il faraone rifiuta e rende il lavoro ancora più duro.",
        "„Lass mein Volk ziehen.“ Der Pharao weigert sich und macht die Arbeit noch schwerer.") },
      { id: "plagues", placeId: "egypt", title: L("Egito · as pragas", "Egypt · the plagues", "Egipto · las plagas", "Égypte · les plaies", "Egitto · le piaghe", "Ägypten · die Plagen"), ref: ex(7, 14, 29, 10), people: ["moses", "aaron", "pharaoh"], text: L(
        "Das águas do Nilo às trevas, as pragas sucedem-se, e o coração do faraó continua endurecido.",
        "From the waters of the Nile to the darkness, plague follows plague, and Pharaoh's heart stays hardened.",
        "De las aguas del Nilo a las tinieblas, las plagas se suceden, y el corazón del faraón sigue endurecido.",
        "Des eaux du Nil aux ténèbres, les plaies se succèdent, et le cœur de Pharaon reste endurci.",
        "Dalle acque del Nilo alle tenebre, le piaghe si susseguono e il cuore del faraone resta indurito.",
        "Vom Wasser des Nils bis zur Finsternis folgt Plage auf Plage, und das Herz des Pharao bleibt verhärtet.") },
      { id: "goshen", placeId: "goshen", ref: ex(9, 26), people: [], text: L(
        "Só na terra de Gósen, onde viviam os filhos de Israel, não caiu a saraiva.",
        "Only in the land of Goshen, where the Israelites lived, was there no hail.",
        "Solo en la tierra de Gosén, donde vivían los hijos de Israel, no hubo granizo.",
        "Seul le pays de Gosen, où habitaient les fils d'Israël, fut épargné par la grêle.",
        "Soltanto nella terra di Gosen, dove abitavano gli Israeliti, non cadde la grandine.",
        "Nur im Land Goschen, wo die Israeliten wohnten, fiel kein Hagel.") },
      { id: "passover", title: L("A Páscoa", "The Passover", "La Pascua", "La Pâque", "La Pasqua", "Das Passa"), ref: ex(12, 1, 14), people: ["moses", "aaron"], text: L(
        "Cada família sacrifica um cordeiro e marca a porta com o sangue. Essa noite será lembrada de geração em geração.",
        "Each family sacrifices a lamb and marks the door with its blood. That night will be remembered from generation to generation.",
        "Cada familia sacrifica un cordero y marca la puerta con la sangre. Esa noche será recordada de generación en generación.",
        "Chaque famille sacrifie un agneau et marque la porte de son sang. Cette nuit sera rappelée de génération en génération.",
        "Ogni famiglia sacrifica un agnello e segna la porta con il sangue. Quella notte sarà ricordata di generazione in generazione.",
        "Jede Familie schlachtet ein Lamm und bestreicht die Tür mit dem Blut. An diese Nacht wird man von Generation zu Generation denken.") },
      { id: "rameses", placeId: "rameses", ref: ex(12, 29, 37), people: ["moses", "pharaoh"], text: L(
        "À meia-noite morrem os primogénitos do Egito, e o faraó manda-os sair. Israel parte de Ramessés em direção a Sucote.",
        "At midnight the firstborn of Egypt die, and Pharaoh sends them away. Israel sets out from Rameses towards Succoth.",
        "A medianoche mueren los primogénitos de Egipto, y el faraón los despide. Israel parte de Ramesés hacia Sucot.",
        "À minuit, les premiers-nés d'Égypte meurent, et Pharaon les renvoie. Israël part de Ramsès vers Soukkoth.",
        "A mezzanotte muoiono i primogeniti d'Egitto e il faraone li manda via. Israele parte da Ramses verso Succot.",
        "Um Mitternacht sterben die Erstgeborenen Ägyptens, und der Pharao schickt sie fort. Israel bricht von Ramses nach Sukkot auf.") },
    ],
    checkpoint: {
      ref: ex(12, 7, 13), answer: 1,
      question: L("O que Israel põe nas portas na noite da Páscoa?", "What does Israel put on the doors on Passover night?", "¿Qué pone Israel en las puertas la noche de la Pascua?", "Que met Israël sur les portes la nuit de la Pâque ?", "Che cosa mette Israele sulle porte la notte di Pasqua?", "Was streicht Israel in der Passanacht an die Türen?"),
      options: L(["Azeite", "O sangue do cordeiro", "Água do Nilo"], ["Oil", "The blood of the lamb", "Water from the Nile"], ["Aceite", "La sangre del cordero", "Agua del Nilo"], ["De l'huile", "Le sang de l'agneau", "De l'eau du Nil"], ["Olio", "Il sangue dell'agnello", "Acqua del Nilo"], ["Öl", "Das Blut des Lammes", "Nilwasser"]),
      explanation: L("O sangue do cordeiro: «vendo o sangue, passarei adiante» (Êx 12:13).", "The blood of the lamb: “when I see the blood, I will pass over” (Exod 12:13).", "La sangre del cordero: «veré la sangre y pasaré» (Éx 12:13).", "Le sang de l'agneau : « je verrai le sang et je passerai » (Ex 12,13).", "Il sangue dell'agnello: «vedrò il sangue e passerò oltre» (Es 12,13).", "Das Blut des Lammes: „Wenn ich das Blut sehe, gehe ich vorüber“ (2. Mose 12,13)."),
    },
    figure: { ...SCHNORR, src: "/jornada/exodo/schnorr-048-diante-do-farao.webp", width: 720, height: 596, sourceUrl: commons("048"),
      title: L("Moisés e Arão diante do faraó", "Moses and Aaron before Pharaoh", "Moisés y Aarón ante el faraón", "Moïse et Aaron devant Pharaon", "Mosè e Aronne davanti al faraone", "Mose und Aaron vor dem Pharao") },
    era: [
      { year: -1446, label: L("A saída do Egito", "The departure from Egypt", "La salida de Egipto", "La sortie d'Égypte", "L'uscita dall'Egitto", "Der Auszug aus Ägypten") },
    ],
  },
  deliverance: {
    stops: [
      { id: "pillar", placeId: "succoth", ref: ex(13, 20, 22), people: ["moses"], text: L(
        "De Sucote, o povo avança para a orla do deserto. O Senhor vai à frente: coluna de nuvem de dia, coluna de fogo de noite.",
        "From Succoth the people move to the edge of the wilderness. The Lord goes ahead: a pillar of cloud by day, a pillar of fire by night.",
        "Desde Sucot, el pueblo avanza hasta el borde del desierto. El Señor va delante: columna de nube de día, columna de fuego de noche.",
        "De Soukkoth, le peuple avance jusqu'au bord du désert. Le Seigneur le précède : colonne de nuée le jour, colonne de feu la nuit.",
        "Da Succot il popolo avanza fino al margine del deserto. Il Signore lo precede: colonna di nube di giorno, colonna di fuoco di notte.",
        "Von Sukkot zieht das Volk an den Rand der Wüste. Der Herr geht voran: am Tag in einer Wolkensäule, nachts in einer Feuersäule.") },
      { id: "sea", placeId: "red-sea", ref: ex(14, 21, 31), people: ["moses", "pharaoh"], text: L(
        "As águas abrem-se e Israel passa a seco; depois voltam e cobrem o exército do faraó. O local exato é debatido.",
        "The waters part and Israel crosses on dry ground; then they return and cover Pharaoh's army. The exact place is debated.",
        "Las aguas se abren e Israel pasa en seco; después vuelven y cubren al ejército del faraón. El lugar exacto se debate.",
        "Les eaux s'ouvrent et Israël passe à sec ; puis elles reviennent et couvrent l'armée de Pharaon. Le lieu exact est débattu.",
        "Le acque si aprono e Israele passa all'asciutto; poi tornano e coprono l'esercito del faraone. Il luogo esatto è discusso.",
        "Das Wasser teilt sich, und Israel geht trockenen Fußes hindurch; dann kehrt es zurück und bedeckt das Heer des Pharao. Der genaue Ort ist umstritten.") },
      { id: "marah", placeId: "marah", ref: ex(15, 22, 25), people: ["moses"], text: L(
        "Depois de três dias sem água, as águas de Mara são amargas. Moisés lança nelas um pedaço de madeira, e elas tornam-se doces.",
        "After three days without water, the waters of Marah are bitter. Moses throws a piece of wood in, and they become sweet.",
        "Tras tres días sin agua, las aguas de Mara son amargas. Moisés echa en ellas un madero, y se vuelven dulces.",
        "Après trois jours sans eau, les eaux de Mara sont amères. Moïse y jette un morceau de bois, et elles deviennent douces.",
        "Dopo tre giorni senz'acqua, le acque di Mara sono amare. Mosè vi getta un legno e diventano dolci.",
        "Nach drei Tagen ohne Wasser ist das Wasser von Mara bitter. Mose wirft ein Holz hinein, und es wird süß.") },
      { id: "elim", placeId: "elim", ref: ex(15, 27), people: [], text: L(
        "Em Elim há doze fontes e setenta palmeiras, e o povo acampa junto às águas.",
        "At Elim there are twelve springs and seventy palm trees, and the people camp by the water.",
        "En Elim hay doce fuentes y setenta palmeras, y el pueblo acampa junto a las aguas.",
        "À Élim, il y a douze sources et soixante-dix palmiers, et le peuple campe près des eaux.",
        "A Elim ci sono dodici sorgenti e settanta palme, e il popolo si accampa presso le acque.",
        "In Elim gibt es zwölf Quellen und siebzig Palmen, und das Volk lagert am Wasser.") },
      { id: "manna", title: L("O maná no deserto de Sim", "Manna in the wilderness of Sin", "El maná en el desierto de Sin", "La manne au désert de Sin", "La manna nel deserto di Sin", "Das Manna in der Wüste Sin"), ref: ex(16, 1, 15), people: ["moses", "aaron"], text: L(
        "O povo murmura com fome. Deus dá pão do céu, recolhido a cada manhã.",
        "The people grumble in their hunger. God gives bread from heaven, gathered each morning.",
        "El pueblo murmura de hambre. Dios da pan del cielo, recogido cada mañana.",
        "Le peuple murmure, affamé. Dieu donne le pain du ciel, recueilli chaque matin.",
        "Il popolo mormora per la fame. Dio dà pane dal cielo, raccolto ogni mattina.",
        "Das Volk murrt vor Hunger. Gott gibt Brot vom Himmel, das jeden Morgen gesammelt wird.") },
      { id: "rephidim", placeId: "rephidim", ref: ex(17, 1, 13), people: ["moses", "aaron", "hur", "joshua"], text: L(
        "Água sai da rocha. Na batalha contra Amaleque, Arão e Hur sustentam as mãos de Moisés até ao pôr do sol.",
        "Water comes from the rock. In the battle against Amalek, Aaron and Hur hold up Moses' hands until sunset.",
        "Sale agua de la roca. En la batalla contra Amalec, Aarón y Hur sostienen las manos de Moisés hasta la puesta del sol.",
        "L'eau jaillit du rocher. Dans le combat contre Amalek, Aaron et Hur soutiennent les mains de Moïse jusqu'au coucher du soleil.",
        "L'acqua sgorga dalla roccia. Nella battaglia contro Amalec, Aronne e Cur sostengono le mani di Mosè fino al tramonto.",
        "Aus dem Felsen kommt Wasser. In der Schlacht gegen Amalek stützen Aaron und Hur die Hände des Mose bis zum Sonnenuntergang.") },
    ],
    checkpoint: {
      ref: ex(13, 21, 22), answer: 2,
      question: L("Como o Senhor guia o povo durante a noite?", "How does the Lord guide the people at night?", "¿Cómo guía el Señor al pueblo durante la noche?", "Comment le Seigneur guide-t-il le peuple la nuit ?", "Come guida il Signore il popolo di notte?", "Wie führt der Herr das Volk bei Nacht?"),
      options: L(["Com uma estrela", "Com uma coluna de nuvem", "Com uma coluna de fogo"], ["With a star", "With a pillar of cloud", "With a pillar of fire"], ["Con una estrella", "Con una columna de nube", "Con una columna de fuego"], ["Par une étoile", "Par une colonne de nuée", "Par une colonne de feu"], ["Con una stella", "Con una colonna di nube", "Con una colonna di fuoco"], ["Mit einem Stern", "Mit einer Wolkensäule", "Mit einer Feuersäule"]),
      explanation: L("Coluna de fogo de noite e de nuvem de dia (Êx 13:21–22). Nunca deixou o povo.", "A pillar of fire by night and of cloud by day (Exod 13:21–22). It never left the people.", "Columna de fuego de noche y de nube de día (Éx 13:21–22). Nunca dejó al pueblo.", "Une colonne de feu la nuit et de nuée le jour (Ex 13,21-22). Elle ne quitta jamais le peuple.", "Colonna di fuoco di notte e di nube di giorno (Es 13,21-22). Non lasciò mai il popolo.", "Nachts eine Feuersäule und tagsüber eine Wolkensäule (2. Mose 13,21–22). Sie wich nie vom Volk."),
    },
    figure: { ...SCHNORR, src: "/jornada/exodo/schnorr-051-mar-vermelho.webp", width: 720, height: 583, sourceUrl: commons("051"),
      title: L("As águas cobrem o exército do faraó", "The waters cover Pharaoh's army", "Las aguas cubren al ejército del faraón", "Les eaux couvrent l'armée de Pharaon", "Le acque coprono l'esercito del faraone", "Das Wasser bedeckt das Heer des Pharao") },
    era: [],
  },
  covenant: {
    stops: [
      { id: "arrival", placeId: "sinai", ref: ex(19, 1, 6), people: ["moses"], text: L(
        "No terceiro mês, Israel acampa diante do monte. Deus chama-o «reino de sacerdotes e nação santa».",
        "In the third month, Israel camps before the mountain. God calls them “a kingdom of priests and a holy nation”.",
        "Al tercer mes, Israel acampa frente al monte. Dios lo llama «reino de sacerdotes y nación santa».",
        "Au troisième mois, Israël campe devant la montagne. Dieu l'appelle « un royaume de prêtres et une nation sainte ».",
        "Nel terzo mese Israele si accampa davanti al monte. Dio lo chiama «regno di sacerdoti e nazione santa».",
        "Im dritten Monat lagert Israel vor dem Berg. Gott nennt es „ein Königreich von Priestern und ein heiliges Volk“.") },
      { id: "commandments", placeId: "sinai", title: L("Os Dez Mandamentos", "The Ten Commandments", "Los Diez Mandamientos", "Les dix commandements", "I dieci comandamenti", "Die Zehn Gebote"), ref: ex(20, 1, 17), people: ["god", "moses"], text: L(
        "«Eu sou o Senhor teu Deus, que te tirei do Egito.» A Lei começa pela libertação já recebida.",
        "“I am the Lord your God, who brought you out of Egypt.” The Law begins with the deliverance already received.",
        "«Yo soy el Señor tu Dios, que te saqué de Egipto». La Ley comienza por la liberación ya recibida.",
        "« Je suis le Seigneur ton Dieu, qui t'ai fait sortir d'Égypte. » La Loi commence par la délivrance déjà reçue.",
        "«Io sono il Signore tuo Dio, che ti ho fatto uscire dall'Egitto». La Legge inizia dalla liberazione già ricevuta.",
        "„Ich bin der Herr, dein Gott, der dich aus Ägypten geführt hat.“ Das Gesetz beginnt mit der schon empfangenen Befreiung.") },
      { id: "blood", placeId: "sinai", title: L("A aliança selada", "The covenant sealed", "El pacto sellado", "L'alliance scellée", "L'alleanza sigillata", "Der besiegelte Bund"), ref: ex(24, 3, 8), people: ["moses"], text: L(
        "O povo responde: «Faremos tudo o que o Senhor disse.» Moisés asperge o sangue da aliança.",
        "The people answer: “We will do everything the Lord has said.” Moses sprinkles the blood of the covenant.",
        "El pueblo responde: «Haremos todo lo que el Señor ha dicho». Moisés rocía la sangre del pacto.",
        "Le peuple répond : « Nous ferons tout ce que le Seigneur a dit. » Moïse répand le sang de l'alliance.",
        "Il popolo risponde: «Faremo tutto ciò che il Signore ha detto». Mosè asperge il sangue dell'alleanza.",
        "Das Volk antwortet: „Alles, was der Herr gesagt hat, wollen wir tun.“ Mose besprengt es mit dem Blut des Bundes.") },
      { id: "forty", placeId: "sinai", title: L("Quarenta dias no monte", "Forty days on the mountain", "Cuarenta días en el monte", "Quarante jours sur la montagne", "Quaranta giorni sul monte", "Vierzig Tage auf dem Berg"), ref: ex(24, 15, 18), people: ["moses"], text: L(
        "A nuvem cobre o monte. Moisés entra nela e fica lá quarenta dias e quarenta noites.",
        "The cloud covers the mountain. Moses enters it and stays there forty days and forty nights.",
        "La nube cubre el monte. Moisés entra en ella y permanece allí cuarenta días y cuarenta noches.",
        "La nuée couvre la montagne. Moïse y entre et y reste quarante jours et quarante nuits.",
        "La nube copre il monte. Mosè vi entra e vi rimane quaranta giorni e quaranta notti.",
        "Die Wolke bedeckt den Berg. Mose geht hinein und bleibt dort vierzig Tage und vierzig Nächte.") },
    ],
    checkpoint: {
      ref: ex(24, 18), answer: 1,
      question: L("Quanto tempo Moisés fica no monte?", "How long does Moses stay on the mountain?", "¿Cuánto tiempo permanece Moisés en el monte?", "Combien de temps Moïse reste-t-il sur la montagne ?", "Quanto tempo resta Mosè sul monte?", "Wie lange bleibt Mose auf dem Berg?"),
      options: L(["Sete dias", "Quarenta dias e quarenta noites", "Um ano"], ["Seven days", "Forty days and forty nights", "One year"], ["Siete días", "Cuarenta días y cuarenta noches", "Un año"], ["Sept jours", "Quarante jours et quarante nuits", "Un an"], ["Sette giorni", "Quaranta giorni e quaranta notti", "Un anno"], ["Sieben Tage", "Vierzig Tage und vierzig Nächte", "Ein Jahr"]),
      explanation: L("Quarenta dias e quarenta noites (Êx 24:18). É nesse tempo que recebe as instruções do Tabernáculo.", "Forty days and forty nights (Exod 24:18). In that time he receives the instructions for the Tabernacle.", "Cuarenta días y cuarenta noches (Éx 24:18). En ese tiempo recibe las instrucciones del Tabernáculo.", "Quarante jours et quarante nuits (Ex 24,18). C'est alors qu'il reçoit les instructions pour le tabernacle.", "Quaranta giorni e quaranta notti (Es 24,18). In quel tempo riceve le istruzioni per il tabernacolo.", "Vierzig Tage und vierzig Nächte (2. Mose 24,18). In dieser Zeit erhält er die Anweisungen für die Stiftshütte."),
    },
    figure: { ...SCHNORR, src: "/jornada/exodo/schnorr-057-tabuas-diante-do-povo.webp", width: 720, height: 595, sourceUrl: commons("057"),
      title: L("Moisés com as tábuas diante do povo", "Moses with the tablets before the people", "Moisés con las tablas ante el pueblo", "Moïse avec les tables devant le peuple", "Mosè con le tavole davanti al popolo", "Mose mit den Tafeln vor dem Volk") },
    era: [],
  },
  tabernacle: {
    stops: [
      { id: "plan", placeId: "sinai", title: L("«Farão para mim um santuário»", "“Let them make me a sanctuary”", "«Harán un santuario para mí»", "« Qu'ils me fassent un sanctuaire »", "«Mi facciano un santuario»", "„Sie sollen mir ein Heiligtum machen“"), ref: ex(25, 8, 9), people: ["god", "moses"], text: L(
        "Deus dá o motivo de toda a obra: habitar no meio do povo. Moisés recebe o modelo no monte.",
        "God gives the reason for the whole work: to dwell among the people. Moses receives the pattern on the mountain.",
        "Dios da el motivo de toda la obra: habitar en medio del pueblo. Moisés recibe el modelo en el monte.",
        "Dieu donne la raison de tout l'ouvrage : habiter au milieu du peuple. Moïse reçoit le modèle sur la montagne.",
        "Dio dà il motivo di tutta l'opera: abitare in mezzo al popolo. Mosè riceve il modello sul monte.",
        "Gott nennt den Grund des ganzen Werks: mitten unter dem Volk zu wohnen. Mose empfängt das Vorbild auf dem Berg.") },
      { id: "calf", placeId: "sinai", title: L("O bezerro de ouro", "The golden calf", "El becerro de oro", "Le veau d'or", "Il vitello d'oro", "Das goldene Kalb"), ref: ex(32, 1, 14), people: ["aaron", "moses"], text: L(
        "Enquanto Moisés está no monte, o povo faz um bezerro de ouro. Moisés intercede por eles diante de Deus.",
        "While Moses is on the mountain, the people make a golden calf. Moses intercedes for them before God.",
        "Mientras Moisés está en el monte, el pueblo hace un becerro de oro. Moisés intercede por ellos ante Dios.",
        "Pendant que Moïse est sur la montagne, le peuple fait un veau d'or. Moïse intercède pour eux devant Dieu.",
        "Mentre Mosè è sul monte, il popolo fa un vitello d'oro. Mosè intercede per loro davanti a Dio.",
        "Während Mose auf dem Berg ist, macht das Volk ein goldenes Kalb. Mose tritt vor Gott für sie ein.") },
      { id: "glory", placeId: "sinai", title: L("A glória enche a tenda", "The glory fills the tent", "La gloria llena la tienda", "La gloire remplit la tente", "La gloria riempie la tenda", "Die Herrlichkeit erfüllt das Zelt"), ref: ex(40, 34, 38), people: ["moses"], text: L(
        "A obra termina e a nuvem desce. A partir daqui, a nuvem marca quando o povo parte e quando fica.",
        "The work ends and the cloud comes down. From here on, the cloud shows when the people move and when they stay.",
        "La obra termina y la nube desciende. Desde aquí, la nube marca cuándo parte el pueblo y cuándo se queda.",
        "L'ouvrage s'achève et la nuée descend. Désormais, la nuée indique quand le peuple part et quand il reste.",
        "L'opera finisce e la nube scende. Da qui in poi, la nube indica quando il popolo parte e quando resta.",
        "Das Werk ist vollendet, und die Wolke kommt herab. Von nun an zeigt sie, wann das Volk aufbricht und wann es bleibt.") },
      { id: "kadesh", placeId: "kadesh-barnea", ref: { book: "numbers", chapter: 13, verse: 26, endChapter: 14, endVerse: 34 }, people: ["caleb", "joshua"], text: L(
        "Para lá do Êxodo: os espias voltam de Canaã, o povo recusa-se a entrar e vagueará quarenta anos.",
        "Beyond Exodus: the spies return from Canaan, the people refuse to enter and will wander for forty years.",
        "Más allá del Éxodo: los espías vuelven de Canaán, el pueblo se niega a entrar y vagará cuarenta años.",
        "Au-delà de l'Exode : les espions reviennent de Canaan, le peuple refuse d'entrer et errera quarante ans.",
        "Oltre l'Esodo: gli esploratori tornano da Canaan, il popolo rifiuta di entrare e vagherà per quarant'anni.",
        "Über das Buch Exodus hinaus: Die Kundschafter kehren aus Kanaan zurück, das Volk weigert sich und wird vierzig Jahre umherziehen.") },
      { id: "nebo", placeId: "nebo", ref: { book: "deuteronomy", chapter: 34, verse: 1, endVerse: 9 }, people: ["moses", "joshua"], text: L(
        "Do monte Nebo, Moisés vê a terra prometida e morre em Moabe. Josué continuará a caminhada.",
        "From Mount Nebo, Moses sees the promised land and dies in Moab. Joshua will carry the journey on.",
        "Desde el monte Nebo, Moisés ve la tierra prometida y muere en Moab. Josué continuará el camino.",
        "Du mont Nebo, Moïse voit la terre promise et meurt en Moab. Josué poursuivra la route.",
        "Dal monte Nebo, Mosè vede la terra promessa e muore in Moab. Giosuè continuerà il cammino.",
        "Vom Berg Nebo aus sieht Mose das verheißene Land und stirbt in Moab. Josua führt den Weg weiter.") },
    ],
    checkpoint: {
      ref: ex(40, 34, 35), answer: 0,
      question: L("O que enche o Tabernáculo quando a obra termina?", "What fills the Tabernacle when the work is finished?", "¿Qué llena el Tabernáculo cuando termina la obra?", "Qu'est-ce qui remplit le tabernacle quand l'ouvrage s'achève ?", "Che cosa riempie il tabernacolo quando l'opera è finita?", "Was erfüllt die Stiftshütte, als das Werk vollendet ist?"),
      options: L(["A glória do Senhor", "A fumaça do altar", "O som das trombetas"], ["The glory of the Lord", "The smoke of the altar", "The sound of trumpets"], ["La gloria del Señor", "El humo del altar", "El sonido de las trompetas"], ["La gloire du Seigneur", "La fumée de l'autel", "Le son des trompettes"], ["La gloria del Signore", "Il fumo dell'altare", "Il suono delle trombe"], ["Die Herrlichkeit des Herrn", "Der Rauch des Altars", "Der Klang der Posaunen"]),
      explanation: L("A glória do Senhor, a tal ponto que nem Moisés podia entrar (Êx 40:34–35).", "The glory of the Lord, so much that even Moses could not enter (Exod 40:34–35).", "La gloria del Señor, a tal punto que ni Moisés podía entrar (Éx 40:34–35).", "La gloire du Seigneur, au point que Moïse lui-même ne pouvait entrer (Ex 40,34-35).", "La gloria del Signore, al punto che nemmeno Mosè poteva entrare (Es 40,34-35).", "Die Herrlichkeit des Herrn, sodass nicht einmal Mose hineingehen konnte (2. Mose 40,34–35)."),
    },
    family: { ref: ex(6, 23), root: { person: "aaron", highlight: true, children: [{ person: "nadab" }, { person: "abihu" }, { person: "eleazar" }, { person: "ithamar" }] } },
    tabernacle: {
      parts: tabernacleParts,
      figure: { src: "/jornada/exodo/tabernaculo-cima-v2.webp", width: 1280, height: 853, artist: "", year: "", license: "AI", sourceUrl: "",
        title: L("O Tabernáculo visto de cima", "The Tabernacle from above", "El Tabernáculo visto desde arriba", "Le tabernacle vu d'en haut", "Il tabernacolo visto dall'alto", "Die Stiftshütte von oben") },
    },
    era: [
      { year: -1445, label: L("O Tabernáculo é erguido", "The Tabernacle is set up", "Se levanta el Tabernáculo", "Le tabernacle est dressé", "Il tabernacolo è innalzato", "Die Stiftshütte wird aufgerichtet") },
    ],
  },
};
