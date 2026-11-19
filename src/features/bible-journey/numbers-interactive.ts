import { L, type JourneyInteractiveSection } from "./genesis-interactive";
import type { BibleRef } from "./references";

/**
 * Camada interativa de Números: paradas, quiz, família e tempo por movimento.
 *
 * ESTADO: PENDENTE DE REVISÃO HUMANA. Textos escritos para a Jornada a partir do texto
 * bíblico citado em cada `ref`; ainda não passaram por revisão teológica nem de tradução.
 * Lugares novos em numbers-places.ts; pessoas novas em numbers-people.ts.
 * Datas: cronologia tradicional (saída do Egito c. 1446 a.C.), sempre aproximadas.
 */
export const numbersReviewStatus = "pendente-revisao-humana" as const;

const nm = (chapter: number, verse?: number, endVerse?: number, endChapter?: number): BibleRef =>
  ({ book: "numbers", chapter, verse, endVerse, endChapter });

export const numbersInteractive: Record<string, JourneyInteractiveSection> = {
  preparation: {
    stops: [
      { id: "census", placeId: "sinai", ref: nm(1, 1, 3), people: ["moses", "aaron"], text: L(
        "No segundo ano após a saída do Egito, no deserto do Sinai, Deus manda contar os homens de vinte anos para cima, tribo por tribo.",
        "In the second year after leaving Egypt, in the wilderness of Sinai, God orders a count of the men twenty years old and upward, tribe by tribe.",
        "En el segundo año tras la salida de Egipto, en el desierto del Sinaí, Dios manda contar a los hombres de veinte años para arriba, tribu por tribu.",
        "La deuxième année après la sortie d'Égypte, au désert du Sinaï, Dieu ordonne de compter les hommes de vingt ans et plus, tribu par tribu.",
        "Nel secondo anno dopo l'uscita dall'Egitto, nel deserto del Sinai, Dio ordina di contare gli uomini dai vent'anni in su, tribù per tribù.",
        "Im zweiten Jahr nach dem Auszug aus Ägypten, in der Wüste Sinai, lässt Gott die Männer ab zwanzig Jahren zählen, Stamm für Stamm.") },
      { id: "camp", title: L("O acampamento em volta da tenda", "The camp around the tent", "El campamento alrededor de la tienda", "Le camp autour de la tente", "L'accampamento intorno alla tenda", "Das Lager um das Zelt"), ref: nm(2, 1, 2), people: ["moses", "aaron"], text: L(
        "Cada tribo acampa junto à sua bandeira, a certa distância, com a tenda do encontro no centro.",
        "Each tribe camps by its own banner, at a distance, with the tent of meeting at the centre.",
        "Cada tribu acampa junto a su estandarte, a cierta distancia, con la tienda del encuentro en el centro.",
        "Chaque tribu campe près de sa bannière, à distance, autour de la tente de la rencontre.",
        "Ogni tribù si accampa presso la propria insegna, a una certa distanza, con la tenda del convegno al centro.",
        "Jeder Stamm lagert bei seinem Banner, in einigem Abstand, mit dem Zelt der Begegnung in der Mitte.") },
      { id: "priests", title: L("Os filhos de Arão", "The sons of Aaron", "Los hijos de Aarón", "Les fils d'Aaron", "I figli di Aronne", "Die Söhne Aarons"), ref: nm(3, 2, 4), people: ["aaron", "nadab", "abihu", "eleazar", "ithamar"], text: L(
        "Nadabe e Abiú morreram diante do Senhor ao oferecer fogo estranho. Eleazar e Itamar servem como sacerdotes ao lado de Arão.",
        "Nadab and Abihu died before the Lord when they offered unauthorized fire. Eleazar and Ithamar serve as priests alongside Aaron.",
        "Nadab y Abiú murieron delante del Señor al ofrecer fuego extraño. Eleazar e Itamar sirven como sacerdotes junto a Aarón.",
        "Nadab et Abihu sont morts devant le Seigneur en offrant un feu étranger. Éléazar et Ithamar exercent le sacerdoce aux côtés d'Aaron.",
        "Nadab e Abiu morirono davanti al Signore offrendo un fuoco illegittimo. Eleazar e Itamar servono come sacerdoti accanto ad Aronne.",
        "Nadab und Abihu starben vor dem Herrn, als sie fremdes Feuer darbrachten. Eleasar und Itamar dienen neben Aaron als Priester.") },
      { id: "blessing", title: L("A bênção sacerdotal", "The priestly blessing", "La bendición sacerdotal", "La bénédiction sacerdotale", "La benedizione sacerdotale", "Der priesterliche Segen"), ref: nm(6, 22, 27), people: ["aaron"], text: L(
        "«O Senhor te abençoe e te guarde.» Assim os sacerdotes põem o nome do Senhor sobre Israel, e ele abençoa o povo.",
        "“The Lord bless you and keep you.” So the priests put the Lord's name on Israel, and he blesses the people.",
        "«El Señor te bendiga y te guarde.» Así los sacerdotes ponen el nombre del Señor sobre Israel, y él bendice al pueblo.",
        "« Que le Seigneur te bénisse et te garde. » Ainsi les prêtres placent le nom du Seigneur sur Israël, et lui bénit le peuple.",
        "«Ti benedica il Signore e ti custodisca.» Così i sacerdoti pongono il nome del Signore su Israele, ed egli benedice il popolo.",
        "„Der Herr segne dich und behüte dich.“ So legen die Priester den Namen des Herrn auf Israel, und er segnet das Volk.") },
      { id: "cloud", placeId: "sinai", ref: nm(9, 15, 23), people: ["moses"], text: L(
        "A nuvem cobre o tabernáculo. Quando ela sobe, o povo parte; quando pousa, o povo acampa. Tudo segundo a ordem do Senhor.",
        "The cloud covers the tabernacle. When it lifts, the people set out; when it settles, they camp. All at the Lord's command.",
        "La nube cubre el tabernáculo. Cuando se alza, el pueblo parte; cuando se posa, acampa. Todo según la orden del Señor.",
        "La nuée couvre la demeure. Quand elle s'élève, le peuple part ; quand elle s'arrête, il campe. Tout sur l'ordre du Seigneur.",
        "La nube copre la dimora. Quando si alza, il popolo parte; quando si posa, si accampa. Tutto secondo l'ordine del Signore.",
        "Die Wolke bedeckt die Wohnung. Hebt sie sich, bricht das Volk auf; lässt sie sich nieder, lagert es. Alles auf Befehl des Herrn.") },
      { id: "departure", placeId: "paran", ref: nm(10, 11, 33), people: ["moses", "hobab"], text: L(
        "A nuvem sobe e Israel deixa o Sinai rumo ao deserto de Parã. Moisés pede a Hobabe que vá com o povo e seja os seus olhos no deserto.",
        "The cloud lifts and Israel leaves Sinai for the wilderness of Paran. Moses asks Hobab to come with them and be their eyes in the wilderness.",
        "La nube se alza e Israel deja el Sinaí rumbo al desierto de Parán. Moisés pide a Hobab que vaya con ellos y les sirva de ojos en el desierto.",
        "La nuée s'élève et Israël quitte le Sinaï pour le désert de Paran. Moïse demande à Hobab de venir avec eux et d'être leurs yeux au désert.",
        "La nube si alza e Israele lascia il Sinai verso il deserto di Paran. Mosè chiede a Obab di andare con loro e di essere i loro occhi nel deserto.",
        "Die Wolke hebt sich, und Israel bricht vom Sinai in die Wüste Paran auf. Mose bittet Hobab mitzukommen und ihr Auge in der Wüste zu sein.") },
    ],
    checkpoint: {
      ref: nm(9, 17, 18), answer: 0,
      question: L("O que indicava a Israel quando partir e quando acampar?", "What told Israel when to set out and when to camp?", "¿Qué indicaba a Israel cuándo partir y cuándo acampar?", "Qu'est-ce qui indiquait à Israël quand partir et quand camper ?", "Che cosa indicava a Israele quando partire e quando accamparsi?", "Was zeigte Israel an, wann es aufbrechen und wann es lagern sollte?"),
      options: L(
        ["A nuvem sobre o tabernáculo", "Um sorteio feito pelos anciãos", "A decisão de cada tribo"],
        ["The cloud over the tabernacle", "Lots cast by the elders", "Each tribe's own decision"],
        ["La nube sobre el tabernáculo", "Un sorteo hecho por los ancianos", "La decisión de cada tribu"],
        ["La nuée au-dessus de la demeure", "Un tirage au sort par les anciens", "La décision de chaque tribu"],
        ["La nube sopra la dimora", "Un sorteggio fatto dagli anziani", "La decisione di ogni tribù"],
        ["Die Wolke über der Wohnung", "Ein Los der Ältesten", "Die Entscheidung jedes Stammes"]),
      explanation: L(
        "A nuvem (Nm 9:17–18). Quando ela se levantava, partiam; onde pousava, acampavam, segundo a ordem do Senhor.",
        "The cloud (Num 9:17–18). Whenever it lifted they set out; where it settled they camped, at the Lord's command.",
        "La nube (Nm 9:17–18). Cuando se alzaba, partían; donde se posaba, acampaban, según la orden del Señor.",
        "La nuée (Nb 9,17–18). Quand elle s'élevait, ils partaient ; là où elle s'arrêtait, ils campaient, sur l'ordre du Seigneur.",
        "La nube (Nm 9,17–18). Quando si alzava, partivano; dove si posava, si accampavano, secondo l'ordine del Signore.",
        "Die Wolke (4. Mose 9,17–18). Hob sie sich, brachen sie auf; wo sie sich niederließ, lagerten sie, auf Befehl des Herrn."),
    },
    family: { ref: nm(3, 2, 4), root: { person: "aaron", highlight: true, children: [
      { person: "nadab" }, { person: "abihu" }, { person: "eleazar", highlight: true }, { person: "ithamar" },
    ] } },
    era: [
      { year: -1445, label: L("Recenseamento no Sinai", "Census at Sinai", "Censo en el Sinaí", "Recensement au Sinaï", "Censimento al Sinai", "Volkszählung am Sinai") },
    ],
  },
  departure: {
    stops: [
      { id: "taberah", placeId: "taberah", ref: nm(11, 1, 3), people: ["moses"], text: L(
        "O povo reclama e um fogo do Senhor queima a extremidade do acampamento. Moisés ora e o fogo cessa. O lugar recebe o nome de Taberá, «incêndio».",
        "The people complain and fire from the Lord burns the edge of the camp. Moses prays and the fire dies down. The place is called Taberah, “burning”.",
        "El pueblo se queja y un fuego del Señor quema el extremo del campamento. Moisés ora y el fuego se apaga. El lugar se llama Taberá, «incendio».",
        "Le peuple se plaint et un feu du Seigneur brûle l'extrémité du camp. Moïse prie et le feu s'éteint. Le lieu est appelé Tabeéra, « incendie ».",
        "Il popolo si lamenta e un fuoco del Signore brucia l'estremità dell'accampamento. Mosè prega e il fuoco si spegne. Il luogo si chiama Tabera, «incendio».",
        "Das Volk klagt, und ein Feuer des Herrn brennt am Rand des Lagers. Mose betet, und das Feuer erlischt. Der Ort heißt Tabera, „Brand“.") },
      { id: "elders", title: L("Os setenta anciãos", "The seventy elders", "Los setenta ancianos", "Les soixante-dix anciens", "I settanta anziani", "Die siebzig Ältesten"), ref: nm(11, 16, 29), people: ["moses", "eldad", "medad", "joshua"], text: L(
        "Moisés não aguenta levar o povo sozinho. Deus põe o Espírito sobre setenta anciãos. Eldade e Medade profetizam no acampamento, e Moisés diz: «Quem dera todo o povo do Senhor fosse profeta!»",
        "Moses cannot carry the people alone. God puts the Spirit on seventy elders. Eldad and Medad prophesy in the camp, and Moses says: “Would that all the Lord's people were prophets!”",
        "Moisés no puede llevar solo al pueblo. Dios pone el Espíritu sobre setenta ancianos. Eldad y Medad profetizan en el campamento, y Moisés dice: «¡Ojalá todo el pueblo del Señor fuera profeta!»",
        "Moïse ne peut porter seul le peuple. Dieu met l'Esprit sur soixante-dix anciens. Eldad et Médad prophétisent dans le camp, et Moïse dit : « Si seulement tout le peuple du Seigneur était prophète ! »",
        "Mosè non può portare da solo il popolo. Dio pone lo Spirito su settanta anziani. Eldad e Medad profetizzano nell'accampamento, e Mosè dice: «Fossero tutti profeti nel popolo del Signore!»",
        "Mose kann das Volk nicht allein tragen. Gott legt den Geist auf siebzig Älteste. Eldad und Medad weissagen im Lager, und Mose sagt: „Wollte Gott, dass alle im Volk des Herrn Propheten wären!“") },
      { id: "quail", placeId: "kibroth-hattaavah", ref: nm(11, 31, 34), people: [], text: L(
        "Um vento traz codornizes ao acampamento. O povo que desejava carne é ferido por uma praga. O lugar recebe o nome de Quibrote-Hataavá, «sepulcros do desejo».",
        "A wind brings quail to the camp. The people who craved meat are struck by a plague. The place is called Kibroth-hattaavah, “graves of craving”.",
        "Un viento trae codornices al campamento. El pueblo que deseaba carne es herido por una plaga. El lugar se llama Kibrot-hataava, «tumbas del deseo».",
        "Un vent amène des cailles au camp. Le peuple qui convoitait la viande est frappé d'un fléau. Le lieu est appelé Qibroth-Hattaava, « tombes de la convoitise ».",
        "Un vento porta quaglie all'accampamento. Il popolo che bramava carne è colpito da una piaga. Il luogo si chiama Kibrot-Taava, «sepolcri dell'ingordigia».",
        "Ein Wind bringt Wachteln ins Lager. Das Volk, das nach Fleisch gierte, wird von einer Plage getroffen. Der Ort heißt Kibrot-Hattaawa, „Gräber der Gier“.") },
      { id: "miriam", placeId: "hazeroth", ref: nm(12, 1, 15), people: ["miriam", "aaron", "moses"], text: L(
        "Em Hazerote, Miriam e Arão falam contra Moisés. Miriam fica leprosa; Moisés clama: «Ó Deus, cura-a!» Ela fica sete dias fora do acampamento, e o povo espera por ela.",
        "At Hazeroth, Miriam and Aaron speak against Moses. Miriam becomes leprous; Moses cries out: “O God, please heal her!” She stays outside the camp seven days, and the people wait for her.",
        "En Hazerot, Miriam y Aarón hablan contra Moisés. Miriam queda leprosa; Moisés clama: «¡Oh Dios, sánala!» Ella pasa siete días fuera del campamento, y el pueblo la espera.",
        "À Hacéroth, Myriam et Aaron parlent contre Moïse. Myriam devient lépreuse ; Moïse crie : « Ô Dieu, guéris-la ! » Elle reste sept jours hors du camp, et le peuple l'attend.",
        "A Caserot, Miriam e Aronne parlano contro Mosè. Miriam diventa lebbrosa; Mosè grida: «Dio, guariscila!» Resta sette giorni fuori dell'accampamento, e il popolo la aspetta.",
        "In Hazerot reden Mirjam und Aaron gegen Mose. Mirjam wird aussätzig; Mose schreit: „Ach Gott, heile sie!“ Sie bleibt sieben Tage außerhalb des Lagers, und das Volk wartet auf sie.") },
      { id: "paran", placeId: "paran", ref: nm(12, 16), people: [], text: L(
        "Depois, o povo parte de Hazerote e acampa no deserto de Parã, perto da terra prometida.",
        "Afterwards the people set out from Hazeroth and camp in the wilderness of Paran, near the promised land.",
        "Después, el pueblo parte de Hazerot y acampa en el desierto de Parán, cerca de la tierra prometida.",
        "Ensuite, le peuple part de Hacéroth et campe au désert de Paran, près de la terre promise.",
        "Poi il popolo parte da Caserot e si accampa nel deserto di Paran, vicino alla terra promessa.",
        "Danach bricht das Volk von Hazerot auf und lagert in der Wüste Paran, nahe dem verheißenen Land.") },
    ],
    checkpoint: {
      ref: nm(11, 26, 29), answer: 1,
      question: L("O que Moisés responde quando Josué pede que ele proíba Eldade e Medade de profetizar?", "What does Moses answer when Joshua asks him to stop Eldad and Medad prophesying?", "¿Qué responde Moisés cuando Josué le pide que impida profetizar a Eldad y Medad?", "Que répond Moïse quand Josué lui demande d'empêcher Eldad et Médad de prophétiser ?", "Che cosa risponde Mosè quando Giosuè gli chiede di impedire a Eldad e Medad di profetizzare?", "Was antwortet Mose, als Josua ihn bittet, Eldad und Medad das Weissagen zu verbieten?"),
      options: L(
        ["Que os dois sejam levados para fora do acampamento", "Que quem dera todo o povo do Senhor fosse profeta", "Que só os setenta anciãos podem profetizar"],
        ["That the two be taken outside the camp", "That he wishes all the Lord's people were prophets", "That only the seventy elders may prophesy"],
        ["Que los dos sean llevados fuera del campamento", "Que ojalá todo el pueblo del Señor fuera profeta", "Que solo los setenta ancianos pueden profetizar"],
        ["Que les deux soient conduits hors du camp", "Qu'il voudrait que tout le peuple du Seigneur soit prophète", "Que seuls les soixante-dix anciens peuvent prophétiser"],
        ["Che i due siano portati fuori dell'accampamento", "Che vorrebbe tutti profeti nel popolo del Signore", "Che solo i settanta anziani possono profetizzare"],
        ["Dass die beiden aus dem Lager gebracht werden", "Dass er wünscht, alle im Volk des Herrn wären Propheten", "Dass nur die siebzig Ältesten weissagen dürfen"]),
      explanation: L(
        "Moisés não sente ciúme: «Quem dera todo o povo do Senhor fosse profeta, e que o Senhor pusesse o seu Espírito sobre eles!» (Nm 11:29).",
        "Moses is not jealous: “Would that all the Lord's people were prophets, that the Lord would put his Spirit on them!” (Num 11:29).",
        "Moisés no siente celos: «¡Ojalá todo el pueblo del Señor fuera profeta, y que el Señor pusiera su Espíritu sobre ellos!» (Nm 11:29).",
        "Moïse n'est pas jaloux : « Si seulement tout le peuple du Seigneur était prophète, et que le Seigneur mette son Esprit sur eux ! » (Nb 11,29).",
        "Mosè non è geloso: «Fossero tutti profeti nel popolo del Signore e volesse il Signore dare loro il suo Spirito!» (Nm 11,29).",
        "Mose ist nicht eifersüchtig: „Wollte Gott, dass alle im Volk des Herrn Propheten wären und der Herr seinen Geist über sie gäbe!“ (4. Mose 11,29)."),
    },
    era: [],
  },
  rebellion: {
    stops: [
      { id: "spies", placeId: "paran", ref: nm(13, 1, 20), people: ["moses", "joshua", "caleb"], text: L(
        "Do deserto de Parã, Moisés envia doze homens, um por tribo, para observar Canaã. Entre eles estão Calebe e Oseias, a quem Moisés chama Josué.",
        "From the wilderness of Paran, Moses sends twelve men, one from each tribe, to scout Canaan. Among them are Caleb and Hoshea, whom Moses calls Joshua.",
        "Desde el desierto de Parán, Moisés envía doce hombres, uno por tribu, a explorar Canaán. Entre ellos están Caleb y Oseas, a quien Moisés llama Josué.",
        "Du désert de Paran, Moïse envoie douze hommes, un par tribu, explorer Canaan. Parmi eux, Caleb et Hoshéa, que Moïse appelle Josué.",
        "Dal deserto di Paran, Mosè manda dodici uomini, uno per tribù, a esplorare Canaan. Tra loro ci sono Caleb e Osea, che Mosè chiama Giosuè.",
        "Aus der Wüste Paran sendet Mose zwölf Männer, einen aus jedem Stamm, um Kanaan zu erkunden. Unter ihnen sind Kaleb und Hoschea, den Mose Josua nennt.") },
      { id: "eshcol", placeId: "eshcol", ref: nm(13, 23, 24), people: [], text: L(
        "No vale de Escol, os espias cortam um cacho de uvas tão grande que dois homens o levam numa vara. Trazem também romãs e figos.",
        "In the Valley of Eshcol the spies cut a cluster of grapes so large that two men carry it on a pole. They also bring pomegranates and figs.",
        "En el valle de Escol, los espías cortan un racimo de uvas tan grande que lo llevan dos hombres en una vara. Traen también granadas e higos.",
        "Dans la vallée d'Eshkol, les espions coupent une grappe de raisin si grande que deux hommes la portent sur une perche. Ils rapportent aussi des grenades et des figues.",
        "Nella valle di Escol gli esploratori tagliano un grappolo d'uva così grande che due uomini lo portano con una stanga. Portano anche melagrane e fichi.",
        "Im Tal Eschkol schneiden die Kundschafter eine Traube ab, so groß, dass zwei Männer sie an einer Stange tragen. Sie bringen auch Granatäpfel und Feigen.") },
      { id: "report", placeId: "kadesh-barnea", ref: nm(13, 26, 10, 14), people: ["caleb", "joshua", "moses", "aaron"], text: L(
        "Em Cades, os espias dizem que a terra mana leite e mel, mas que o povo dela é forte. A comunidade chora e quer voltar ao Egito. Calebe e Josué pedem que ninguém tenha medo, porque o Senhor está com o povo.",
        "At Kadesh the spies say the land flows with milk and honey, but its people are strong. The community weeps and wants to return to Egypt. Caleb and Joshua say: “Do not fear; the Lord is with us.”",
        "En Cades, los espías dicen que la tierra fluye leche y miel, pero que su pueblo es fuerte. La comunidad llora y quiere volver a Egipto. Caleb y Josué dicen: «No teman; el Señor está con nosotros.»",
        "À Kadès, les espions disent que le pays ruisselle de lait et de miel, mais que son peuple est fort. La communauté pleure et veut retourner en Égypte. Caleb et Josué disent : « N'ayez pas peur ; le Seigneur est avec nous. »",
        "A Kades gli esploratori dicono che la terra stilla latte e miele, ma che il suo popolo è forte. La comunità piange e vuole tornare in Egitto. Caleb e Giosuè dicono: «Non temete; il Signore è con noi.»",
        "In Kadesch sagen die Kundschafter, das Land fließe von Milch und Honig, doch sein Volk sei stark. Die Gemeinde weint und will nach Ägypten zurück. Kaleb und Josua sagen: „Fürchtet euch nicht; der Herr ist mit uns.“") },
      { id: "korah", title: L("A revolta de Corá", "Korah's rebellion", "La rebelión de Coré", "La révolte de Coré", "La rivolta di Core", "Der Aufstand Korachs"), ref: nm(16, 1, 35), people: ["korah", "dathan", "abiram", "moses", "aaron"], text: L(
        "Corá, Datã e Abirão desafiam Moisés e Arão com duzentos e cinquenta líderes. A terra abre a boca e os engole, e um fogo do Senhor consome os duzentos e cinquenta.",
        "Korah, Dathan and Abiram rise against Moses and Aaron with two hundred and fifty leaders. The ground opens and swallows them, and fire from the Lord consumes the two hundred and fifty.",
        "Coré, Datán y Abiram se levantan contra Moisés y Aarón con doscientos cincuenta jefes. La tierra se abre y los traga, y un fuego del Señor consume a los doscientos cincuenta.",
        "Coré, Dathân et Abiram se dressent contre Moïse et Aaron avec deux cent cinquante chefs. La terre s'ouvre et les engloutit, et un feu du Seigneur dévore les deux cent cinquante.",
        "Core, Datan e Abiram insorgono contro Mosè e Aronne con duecentocinquanta capi. La terra si apre e li inghiotte, e un fuoco del Signore divora i duecentocinquanta.",
        "Korach, Datan und Abiram erheben sich mit zweihundertfünfzig Anführern gegen Mose und Aaron. Die Erde öffnet sich und verschlingt sie, und ein Feuer des Herrn verzehrt die Zweihundertfünfzig.") },
      { id: "meribah", placeId: "zin", ref: nm(20, 1, 13), people: ["miriam", "moses", "aaron"], text: L(
        "No deserto de Zim, em Cades, Miriam morre. Falta água. Deus manda falar à rocha, mas Moisés a golpeia duas vezes. A água jorra, e Moisés e Arão ouvem que não levarão o povo à terra.",
        "In the wilderness of Zin, at Kadesh, Miriam dies. There is no water. God says to speak to the rock, but Moses strikes it twice. Water gushes out, and Moses and Aaron hear that they will not bring the people into the land.",
        "En el desierto de Zin, en Cades, muere Miriam. Falta agua. Dios manda hablar a la roca, pero Moisés la golpea dos veces. El agua brota, y Moisés y Aarón oyen que no llevarán al pueblo a la tierra.",
        "Au désert de Tsin, à Kadès, Myriam meurt. L'eau manque. Dieu dit de parler au rocher, mais Moïse le frappe deux fois. L'eau jaillit, et Moïse et Aaron apprennent qu'ils ne feront pas entrer le peuple dans le pays.",
        "Nel deserto di Sin, a Kades, muore Miriam. Manca l'acqua. Dio dice di parlare alla roccia, ma Mosè la percuote due volte. L'acqua sgorga, e Mosè e Aronne sentono che non condurranno il popolo nella terra.",
        "In der Wüste Zin, in Kadesch, stirbt Mirjam. Es fehlt Wasser. Gott sagt, sie sollen zum Felsen reden, doch Mose schlägt ihn zweimal. Wasser strömt heraus, und Mose und Aaron hören, dass sie das Volk nicht ins Land bringen werden.") },
      { id: "hor", placeId: "mount-hor", ref: nm(20, 22, 29), people: ["aaron", "eleazar", "moses"], text: L(
        "No monte Hor, na fronteira de Edom, Moisés passa as vestes de Arão para Eleazar. Arão morre no alto do monte, e Israel chora por ele trinta dias.",
        "On Mount Hor, on the border of Edom, Moses puts Aaron's garments on Eleazar. Aaron dies on the mountaintop, and Israel mourns him thirty days.",
        "En el monte Hor, en la frontera de Edom, Moisés pasa las vestiduras de Aarón a Eleazar. Aarón muere en la cumbre, e Israel llora por él treinta días.",
        "Sur le mont Hor, à la frontière d'Édom, Moïse revêt Éléazar des vêtements d'Aaron. Aaron meurt au sommet, et Israël le pleure trente jours.",
        "Sul monte Or, al confine di Edom, Mosè fa indossare a Eleazar le vesti di Aronne. Aronne muore in cima al monte, e Israele lo piange trenta giorni.",
        "Auf dem Berg Hor, an der Grenze Edoms, legt Mose die Kleider Aarons Eleasar an. Aaron stirbt auf dem Gipfel, und Israel beweint ihn dreißig Tage.") },
    ],
    checkpoint: {
      ref: nm(14, 33, 34), answer: 2,
      question: L("Por que Israel fica quarenta anos no deserto?", "Why does Israel stay forty years in the wilderness?", "¿Por qué Israel pasa cuarenta años en el desierto?", "Pourquoi Israël reste-t-il quarante ans au désert ?", "Perché Israele resta quarant'anni nel deserto?", "Warum bleibt Israel vierzig Jahre in der Wüste?"),
      options: L(
        ["Porque se perdeu no caminho", "Porque Edom não deixou o povo passar", "Um ano por cada dia em que espiaram a terra"],
        ["Because they lost their way", "Because Edom would not let them pass", "One year for each day they spied out the land"],
        ["Porque se perdió en el camino", "Porque Edom no lo dejó pasar", "Un año por cada día que exploraron la tierra"],
        ["Parce qu'il s'est égaré en chemin", "Parce qu'Édom a refusé le passage", "Une année pour chaque jour d'exploration du pays"],
        ["Perché si era perso lungo la strada", "Perché Edom non lo lasciò passare", "Un anno per ogni giorno di esplorazione della terra"],
        ["Weil es sich verirrte", "Weil Edom es nicht durchziehen ließ", "Ein Jahr für jeden Tag, an dem sie das Land erkundeten"]),
      explanation: L(
        "Depois da recusa em Cades, Deus diz: quarenta dias de exploração, quarenta anos, um ano por dia (Nm 14:34). Só Calebe e Josué entrarão na terra (Nm 14:30).",
        "After the refusal at Kadesh, God says: forty days of scouting, forty years, a year for each day (Num 14:34). Only Caleb and Joshua will enter the land (Num 14:30).",
        "Tras el rechazo en Cades, Dios dice: cuarenta días de exploración, cuarenta años, un año por día (Nm 14:34). Solo Caleb y Josué entrarán en la tierra (Nm 14:30).",
        "Après le refus à Kadès, Dieu dit : quarante jours d'exploration, quarante ans, une année par jour (Nb 14,34). Seuls Caleb et Josué entreront dans le pays (Nb 14,30).",
        "Dopo il rifiuto a Kades, Dio dice: quaranta giorni di esplorazione, quarant'anni, un anno per ogni giorno (Nm 14,34). Solo Caleb e Giosuè entreranno nella terra (Nm 14,30).",
        "Nach der Weigerung in Kadesch sagt Gott: vierzig Tage Erkundung, vierzig Jahre, ein Jahr für jeden Tag (4. Mose 14,34). Nur Kaleb und Josua werden ins Land kommen (4. Mose 14,30)."),
    },
    era: [
      { year: -1407, label: L("Morte de Arão no monte Hor", "Aaron's death on Mount Hor", "Muerte de Aarón en el monte Hor", "Mort d'Aaron au mont Hor", "Morte di Aronne sul monte Or", "Aarons Tod auf dem Berg Hor") },
    ],
  },
  "new-generation": {
    stops: [
      { id: "arad", placeId: "arad", ref: nm(21, 1, 3), people: [], text: L(
        "O rei cananeu de Arade ataca Israel. O povo faz um voto ao Senhor, e o Senhor dá a vitória a Israel. O lugar recebe o nome de Hormá.",
        "The Canaanite king of Arad attacks Israel. The people make a vow to the Lord, and the Lord gives them victory. The place is named Hormah.",
        "El rey cananeo de Arad ataca a Israel. El pueblo hace un voto al Señor, y el Señor le da la victoria. El lugar recibe el nombre de Horma.",
        "Le roi cananéen d'Arad attaque Israël. Le peuple fait un vœu au Seigneur, et le Seigneur lui donne la victoire. Le lieu est appelé Horma.",
        "Il re cananeo di Arad attacca Israele. Il popolo fa un voto al Signore, e il Signore gli dà la vittoria. Il luogo prende il nome di Corma.",
        "Der kanaanitische König von Arad greift Israel an. Das Volk legt dem Herrn ein Gelübde ab, und der Herr gibt den Sieg. Der Ort wird Horma genannt.") },
      { id: "serpent", title: L("A serpente de bronze", "The bronze serpent", "La serpiente de bronce", "Le serpent de bronze", "Il serpente di bronzo", "Die eherne Schlange"), ref: nm(21, 4, 9), people: ["moses"], text: L(
        "Contornando Edom, o povo fala contra Deus e contra Moisés. Serpentes venenosas mordem o povo. Moisés ora e faz uma serpente de bronze num poste: quem olha para ela vive.",
        "Going around Edom, the people speak against God and against Moses. Venomous snakes bite them. Moses prays and makes a bronze serpent on a pole: whoever looks at it lives.",
        "Rodeando Edom, el pueblo habla contra Dios y contra Moisés. Serpientes venenosas lo muerden. Moisés ora y hace una serpiente de bronce sobre un asta: quien la mira vive.",
        "En contournant Édom, le peuple parle contre Dieu et contre Moïse. Des serpents venimeux le mordent. Moïse prie et fait un serpent de bronze sur une perche : qui le regarde vit.",
        "Aggirando Edom, il popolo parla contro Dio e contro Mosè. Serpenti velenosi lo mordono. Mosè prega e fa un serpente di bronzo su un'asta: chi lo guarda vive.",
        "Auf dem Weg um Edom redet das Volk gegen Gott und gegen Mose. Giftige Schlangen beißen es. Mose betet und macht eine eherne Schlange an einer Stange: Wer sie ansieht, bleibt am Leben.") },
      { id: "sihon", placeId: "jahaz", ref: nm(21, 21, 25), people: ["sihon"], text: L(
        "Seom, rei dos amorreus, recusa a passagem e sai à luta em Jaza. Israel vence e ocupa a terra do Arnom ao Jaboque, incluindo Hesbom.",
        "Sihon, king of the Amorites, refuses passage and comes out to fight at Jahaz. Israel wins and takes the land from the Arnon to the Jabbok, Heshbon included.",
        "Sehón, rey de los amorreos, niega el paso y sale a combatir en Jahaza. Israel vence y ocupa la tierra desde el Arnón hasta el Jaboc, con Hesbón.",
        "Sihôn, roi des Amorites, refuse le passage et sort combattre à Yahats. Israël l'emporte et occupe le pays de l'Arnon au Yabboq, Heshbôn compris.",
        "Sicon, re degli Amorrei, nega il passaggio ed esce a combattere a Iaas. Israele vince e occupa la terra dall'Arnon allo Iabbok, compresa Chesbon.",
        "Sihon, der König der Amoriter, verweigert den Durchzug und kämpft bei Jahaz. Israel siegt und nimmt das Land vom Arnon bis zum Jabbok ein, auch Heschbon.") },
      { id: "og", placeId: "edrei", ref: nm(21, 33, 35), people: ["og", "moses"], text: L(
        "Ogue, rei de Basã, sai contra Israel em Edrei. O Senhor diz a Moisés: «Não tenha medo dele.» Israel vence e toma a sua terra.",
        "Og, king of Bashan, comes out against Israel at Edrei. The Lord tells Moses: “Do not fear him.” Israel wins and takes his land.",
        "Og, rey de Basán, sale contra Israel en Edrei. El Señor dice a Moisés: «No le tengas miedo.» Israel vence y toma su tierra.",
        "Og, roi du Bashân, sort contre Israël à Édréï. Le Seigneur dit à Moïse : « Ne le crains pas. » Israël l'emporte et prend son pays.",
        "Og, re di Basan, esce contro Israele a Edrei. Il Signore dice a Mosè: «Non temerlo.» Israele vince e prende la sua terra.",
        "Og, der König von Baschan, zieht bei Edreï gegen Israel. Der Herr sagt zu Mose: „Fürchte dich nicht vor ihm.“ Israel siegt und nimmt sein Land.") },
      { id: "balaam", placeId: "pisgah", ref: nm(23, 13, 26), people: ["balaam", "balak"], text: L(
        "Balaque, rei de Moabe, leva Balaão ao alto do Pisga para amaldiçoar Israel. Balaão responde: «Recebi ordem de abençoar; ele abençoou, e eu não posso revogar.»",
        "Balak, king of Moab, takes Balaam to the top of Pisgah to curse Israel. Balaam answers: “I received a command to bless; he has blessed, and I cannot revoke it.”",
        "Balac, rey de Moab, lleva a Balaam a la cumbre del Pisga para maldecir a Israel. Balaam responde: «He recibido orden de bendecir; él bendijo, y no lo puedo revocar.»",
        "Balaq, roi de Moab, conduit Balaam au sommet du Pisga pour maudire Israël. Balaam répond : « J'ai reçu l'ordre de bénir ; il a béni, je ne puis le révoquer. »",
        "Balak, re di Moab, porta Balaam sulla cima del Pisga per maledire Israele. Balaam risponde: «Ho ricevuto l'ordine di benedire; egli ha benedetto, e io non posso revocare.»",
        "Balak, der König von Moab, führt Bileam auf den Gipfel des Pisga, um Israel zu verfluchen. Bileam antwortet: „Ich habe den Auftrag zu segnen; er hat gesegnet, und ich kann es nicht wenden.“") },
      { id: "peor", placeId: "shittim", ref: nm(25, 1, 13), people: ["phinehas", "eleazar", "moses"], text: L(
        "Em Sitim, o povo adere ao culto de Baal-Peor e uma praga atinge Israel. Fineias, neto de Arão, age com zelo pelo Senhor, e a praga cessa. Deus faz com ele uma aliança de paz.",
        "At Shittim the people join in the worship of Baal of Peor, and a plague falls on Israel. Phinehas, Aaron's grandson, acts with zeal for the Lord, and the plague stops. God gives him a covenant of peace.",
        "En Sitim, el pueblo se une al culto de Baal-Peor y cae sobre Israel una plaga. Finees, nieto de Aarón, actúa con celo por el Señor, y la plaga cesa. Dios le da una alianza de paz.",
        "À Shittim, le peuple s'attache au culte de Baal-Péor et un fléau frappe Israël. Phinéas, petit-fils d'Aaron, agit avec zèle pour le Seigneur, et le fléau s'arrête. Dieu lui donne une alliance de paix.",
        "A Sittim il popolo si unisce al culto di Baal-Peor e su Israele cade una piaga. Pincas, nipote di Aronne, agisce con zelo per il Signore, e la piaga si ferma. Dio gli dà un'alleanza di pace.",
        "In Schittim schließt sich das Volk dem Kult des Baal-Peor an, und eine Plage trifft Israel. Pinhas, Aarons Enkel, eifert für den Herrn, und die Plage hört auf. Gott gibt ihm einen Bund des Friedens.") },
    ],
    checkpoint: {
      ref: nm(24, 10), answer: 1,
      question: L("O que acontece quando Balaque pede a Balaão que amaldiçoe Israel?", "What happens when Balak asks Balaam to curse Israel?", "¿Qué sucede cuando Balac pide a Balaam que maldiga a Israel?", "Que se passe-t-il quand Balaq demande à Balaam de maudire Israël ?", "Che cosa accade quando Balak chiede a Balaam di maledire Israele?", "Was geschieht, als Balak Bileam bittet, Israel zu verfluchen?"),
      options: L(
        ["Balaão amaldiçoa Israel três vezes", "Balaão abençoa Israel", "Balaão vai embora sem falar"],
        ["Balaam curses Israel three times", "Balaam blesses Israel", "Balaam leaves without speaking"],
        ["Balaam maldice a Israel tres veces", "Balaam bendice a Israel", "Balaam se va sin hablar"],
        ["Balaam maudit Israël trois fois", "Balaam bénit Israël", "Balaam s'en va sans parler"],
        ["Balaam maledice Israele tre volte", "Balaam benedice Israele", "Balaam se ne va senza parlare"],
        ["Bileam verflucht Israel dreimal", "Bileam segnet Israel", "Bileam geht, ohne zu reden"]),
      explanation: L(
        "Balaão só fala o que Deus põe na sua boca. Balaque reclama que o chamou para amaldiçoar os seus inimigos, e ele os abençoou três vezes (Nm 24:10).",
        "Balaam speaks only what God puts in his mouth. Balak protests: “I called you to curse my enemies, and you have blessed them these three times” (Num 24:10).",
        "Balaam solo dice lo que Dios pone en su boca. Balac protesta: «Te llamé para maldecir a mis enemigos, y los has bendecido ya tres veces» (Nm 24:10).",
        "Balaam ne dit que ce que Dieu met dans sa bouche. Balaq proteste : « Je t'ai appelé pour maudire mes ennemis, et tu les as bénis par trois fois » (Nb 24,10).",
        "Balaam dice solo ciò che Dio gli mette in bocca. Balak protesta: «Ti ho chiamato per maledire i miei nemici, e li hai benedetti per tre volte» (Nm 24,10).",
        "Bileam redet nur, was Gott ihm in den Mund legt. Balak klagt: „Ich habe dich gerufen, meine Feinde zu verfluchen, und du hast sie nun dreimal gesegnet“ (4. Mose 24,10)."),
    },
    era: [],
  },
  "promised-land": {
    stops: [
      { id: "census2", placeId: "plains-of-moab", ref: nm(26, 63, 65), people: ["moses", "eleazar", "caleb", "joshua"], text: L(
        "Nas planícies de Moabe, junto ao Jordão, Moisés e Eleazar contam o povo outra vez. Dos que foram contados no Sinai, só restam Calebe e Josué.",
        "On the plains of Moab, by the Jordan, Moses and Eleazar count the people again. Of those counted at Sinai, only Caleb and Joshua remain.",
        "En las llanuras de Moab, junto al Jordán, Moisés y Eleazar cuentan de nuevo al pueblo. De los contados en el Sinaí solo quedan Caleb y Josué.",
        "Dans les plaines de Moab, près du Jourdain, Moïse et Éléazar recensent de nouveau le peuple. De ceux comptés au Sinaï, il ne reste que Caleb et Josué.",
        "Nelle steppe di Moab, presso il Giordano, Mosè ed Eleazar contano di nuovo il popolo. Di quelli contati al Sinai restano solo Caleb e Giosuè.",
        "In den Steppen Moabs, am Jordan, zählen Mose und Eleasar das Volk erneut. Von den am Sinai Gezählten sind nur Kaleb und Josua übrig.") },
      { id: "daughters", title: L("As filhas de Zelofeade", "The daughters of Zelophehad", "Las hijas de Zelofehad", "Les filles de Celofehad", "Le figlie di Zelofcad", "Die Töchter Zelofhads"), ref: nm(27, 1, 7), people: ["mahlah", "noa", "hoglah", "milcah", "tirzah", "moses"], text: L(
        "Maalá, Noa, Hogla, Milca e Tirza pedem herança, pois o seu pai morreu sem filhos. Moisés leva o caso ao Senhor, que responde: «As filhas de Zelofeade têm razão.»",
        "Mahlah, Noah, Hoglah, Milcah and Tirzah ask for an inheritance, since their father died without sons. Moses brings the case to the Lord, who answers: “The daughters of Zelophehad are right.”",
        "Maala, Noa, Hogla, Milca y Tirsa piden herencia, pues su padre murió sin hijos varones. Moisés lleva el caso al Señor, que responde: «Las hijas de Zelofehad tienen razón.»",
        "Mahla, Noa, Hogla, Milka et Tirtsa demandent un héritage, car leur père est mort sans fils. Moïse porte la cause devant le Seigneur, qui répond : « Les filles de Celofehad ont raison. »",
        "Macla, Noa, Cogla, Milca e Tirza chiedono un'eredità, perché il padre è morto senza figli maschi. Mosè porta il caso al Signore, che risponde: «Le figlie di Zelofcad dicono bene.»",
        "Machla, Noa, Hogla, Milka und Tirza bitten um ein Erbe, denn ihr Vater starb ohne Söhne. Mose bringt die Sache vor den Herrn, und er antwortet: „Die Töchter Zelofhads haben recht.“") },
      { id: "successor", title: L("Josué, sucessor de Moisés", "Joshua, Moses' successor", "Josué, sucesor de Moisés", "Josué, successeur de Moïse", "Giosuè, successore di Mosè", "Josua, Moses Nachfolger"), ref: nm(27, 15, 23), people: ["moses", "joshua", "eleazar"], text: L(
        "Moisés pede um líder para que o povo não fique como ovelhas sem pastor. Diante de Eleazar e de todo o povo, ele impõe as mãos sobre Josué.",
        "Moses asks for a leader so that the people will not be like sheep without a shepherd. Before Eleazar and all the people, he lays his hands on Joshua.",
        "Moisés pide un jefe para que el pueblo no sea como ovejas sin pastor. Ante Eleazar y todo el pueblo, impone las manos sobre Josué.",
        "Moïse demande un chef pour que le peuple ne soit pas comme des brebis sans berger. Devant Éléazar et tout le peuple, il pose les mains sur Josué.",
        "Mosè chiede una guida perché il popolo non sia come pecore senza pastore. Davanti a Eleazar e a tutto il popolo, impone le mani su Giosuè.",
        "Mose bittet um einen Anführer, damit das Volk nicht sei wie Schafe ohne Hirten. Vor Eleasar und dem ganzen Volk legt er Josua die Hände auf.") },
      { id: "gilead", placeId: "gilead", ref: nm(32, 1, 33), people: ["moses", "eleazar"], text: L(
        "Rúben e Gade têm muito gado e pedem a terra de Gileade, a leste do Jordão. Moisés aceita, desde que os seus guerreiros atravessem o rio com os irmãos.",
        "Reuben and Gad have many livestock and ask for the land of Gilead, east of the Jordan. Moses agrees, provided their warriors cross the river with their brothers.",
        "Rubén y Gad tienen mucho ganado y piden la tierra de Galaad, al este del Jordán. Moisés acepta, con tal de que sus guerreros crucen el río con sus hermanos.",
        "Ruben et Gad ont beaucoup de bétail et demandent le pays de Galaad, à l'est du Jourdain. Moïse accepte, à condition que leurs guerriers passent le fleuve avec leurs frères.",
        "Ruben e Gad hanno molto bestiame e chiedono la terra di Galaad, a est del Giordano. Mosè accetta, purché i loro guerrieri attraversino il fiume con i fratelli.",
        "Ruben und Gad haben viel Vieh und bitten um das Land Gilead östlich des Jordan. Mose willigt ein, wenn ihre Krieger mit ihren Brüdern über den Fluss ziehen.") },
      { id: "jordan", placeId: "jordan", ref: nm(33, 50, 53), people: ["moses"], text: L(
        "Junto ao Jordão, em frente a Jericó, Deus fala a Moisés: quando atravessarem o rio para Canaã, tomem posse da terra, porque ele a dá ao povo.",
        "By the Jordan, across from Jericho, God speaks to Moses: when they cross the river into Canaan, they are to take possession of the land, for he gives it to the people.",
        "Junto al Jordán, frente a Jericó, Dios habla a Moisés: cuando crucen el río hacia Canaán, tomen posesión de la tierra, porque él se la da al pueblo.",
        "Près du Jourdain, en face de Jéricho, Dieu parle à Moïse : quand ils passeront le fleuve vers Canaan, ils prendront possession du pays, car il le donne au peuple.",
        "Presso il Giordano, di fronte a Gerico, Dio parla a Mosè: quando attraverseranno il fiume verso Canaan, prendano possesso della terra, perché egli la dà al popolo.",
        "Am Jordan, gegenüber Jericho, spricht Gott zu Mose: Wenn sie über den Fluss nach Kanaan ziehen, sollen sie das Land einnehmen, denn er gibt es dem Volk.") },
      { id: "refuge", title: L("As cidades de refúgio", "The cities of refuge", "Las ciudades de refugio", "Les villes de refuge", "Le città di rifugio", "Die Zufluchtsstädte"), ref: nm(35, 9, 15), people: [], text: L(
        "Seis cidades, três de cada lado do Jordão, abrigam quem matou alguém sem intenção, até ser julgado diante da comunidade.",
        "Six cities, three on each side of the Jordan, shelter anyone who has killed someone unintentionally, until the case is judged before the community.",
        "Seis ciudades, tres a cada lado del Jordán, acogen a quien mató a alguien sin intención, hasta ser juzgado ante la comunidad.",
        "Six villes, trois de chaque côté du Jourdain, abritent celui qui a tué quelqu'un sans le vouloir, jusqu'à son jugement devant la communauté.",
        "Sei città, tre per ogni lato del Giordano, accolgono chi ha ucciso qualcuno senza volerlo, finché non sia giudicato davanti alla comunità.",
        "Sechs Städte, drei auf jeder Seite des Jordan, bergen den, der jemanden ohne Absicht getötet hat, bis er vor der Gemeinde gerichtet wird.") },
    ],
    checkpoint: {
      ref: nm(27, 18, 20), answer: 1,
      question: L("Quem Deus indica para conduzir o povo depois de Moisés?", "Whom does God appoint to lead the people after Moses?", "¿A quién designa Dios para guiar al pueblo después de Moisés?", "Qui Dieu désigne-t-il pour conduire le peuple après Moïse ?", "Chi indica Dio per guidare il popolo dopo Mosè?", "Wen bestimmt Gott, das Volk nach Mose zu führen?"),
      options: L(
        ["Eleazar, o sacerdote", "Josué, filho de Num", "Calebe, filho de Jefoné"],
        ["Eleazar the priest", "Joshua son of Nun", "Caleb son of Jephunneh"],
        ["Eleazar, el sacerdote", "Josué, hijo de Nun", "Caleb, hijo de Jefone"],
        ["Éléazar, le prêtre", "Josué, fils de Noun", "Caleb, fils de Yephounné"],
        ["Eleazar, il sacerdote", "Giosuè, figlio di Nun", "Caleb, figlio di Iefunne"],
        ["Eleasar, der Priester", "Josua, der Sohn Nuns", "Kaleb, der Sohn Jefunnes"]),
      explanation: L(
        "Josué, «homem em quem está o Espírito» (Nm 27:18). Moisés impõe as mãos sobre ele diante de Eleazar e de toda a comunidade.",
        "Joshua, “a man in whom is the Spirit” (Num 27:18). Moses lays his hands on him before Eleazar and the whole community.",
        "Josué, «hombre en quien está el Espíritu» (Nm 27:18). Moisés le impone las manos ante Eleazar y toda la comunidad.",
        "Josué, « un homme en qui est l'Esprit » (Nb 27,18). Moïse lui impose les mains devant Éléazar et toute la communauté.",
        "Giosuè, «uomo in cui è lo Spirito» (Nm 27,18). Mosè gli impone le mani davanti a Eleazar e a tutta la comunità.",
        "Josua, „ein Mann, in dem der Geist ist“ (4. Mose 27,18). Mose legt ihm vor Eleasar und der ganzen Gemeinde die Hände auf."),
    },
    family: { ref: nm(27, 1), root: { person: "zelophehad", highlight: true, children: [
      { person: "mahlah" }, { person: "noa" }, { person: "hoglah" }, { person: "milcah" }, { person: "tirzah" },
    ] } },
    era: [
      { year: -1406, label: L("Israel nas planícies de Moabe", "Israel on the plains of Moab", "Israel en las llanuras de Moab", "Israël dans les plaines de Moab", "Israele nelle steppe di Moab", "Israel in den Steppen Moabs") },
    ],
  },
};
