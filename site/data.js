// Pronoun Trainer — content data.
// English-only UI; Chinese appears ONLY in spelling prompts (spec §4.2).
// REVIEW ME: usage sentences, "why" explanations, and zh translations are
// drafts for the tutor's review (spec §10 open item).

const MODULES = [
  {
    id: "personal",
    title: "Personal Pronouns",
    shortTitle: "Personal",
    zhTitle: "人称代词",
    color: "#6C5CE7",   // purple card
    words: [
      { en: "I", zh: "我" },
      { en: "me", zh: "我" },
      { en: "you", zh: "你" },
      { en: "he", zh: "他" },
      { en: "him", zh: "他" },
      { en: "she", zh: "她" },
      { en: "her", zh: "她" },
      { en: "it", zh: "它" },
      { en: "we", zh: "我们" },
      { en: "us", zh: "我们" },
      { en: "they", zh: "他们" },
      { en: "them", zh: "他们" },
    ],
    usage: [
      { prompt: "___ am a student.", answer: "I", why: "Use I with am — I is the person speaking.", alsoCorrect: [] },
      { prompt: "Please give the book to ___.", answer: "me", why: "Use me after a verb or to — it receives the action.", alsoCorrect: ["you", "him", "her", "us", "them"] },
      { prompt: "Are ___ ready?", answer: "you", why: "You is the person you are talking to.", alsoCorrect: ["we", "they"] },
      { prompt: "___ is my brother.", answer: "he", why: "He is a boy or man who does the action.", alsoCorrect: [] },
      { prompt: "I can see ___ over there.", answer: "him", why: "Use him after a verb or to — a boy who receives the action.", alsoCorrect: ["me", "you", "her", "us", "them", "it"] },
      { prompt: "___ is my sister.", answer: "she", why: "She is a girl or woman who does the action.", alsoCorrect: [] },
      { prompt: "I like ___ very much.", answer: "her", why: "Use her after a verb or to — a girl who receives the action.", alsoCorrect: ["me", "you", "him", "us", "them", "it"] },
      { prompt: "___ is a small cat.", answer: "it", why: "It is for animals and things.", alsoCorrect: [] },
      { prompt: "___ are good friends.", answer: "we", why: "We means me and other people together.", alsoCorrect: ["you", "they"] },
      { prompt: "The teacher teaches ___ English.", answer: "us", why: "Use us after a verb or to — our group receives the action.", alsoCorrect: ["me", "you", "him", "her", "them"] },
      { prompt: "___ are my classmates.", answer: "they", why: "They is for two or more people.", alsoCorrect: ["you"] },
      { prompt: "I will help ___ tomorrow.", answer: "them", why: "Use them after a verb or to — other people receive the action.", alsoCorrect: ["me", "you", "him", "her", "us", "it"] },
    ],
  },
  {
    id: "possessive",
    title: "Possessive Pronouns",
    shortTitle: "Possessive",
    zhTitle: "物主代词",
    color: "#00A8FF",   // blue card
    words: [
      { en: "my", zh: "我的" },
      { en: "mine", zh: "我的" },
      { en: "your", zh: "你的" },
      { en: "yours", zh: "你的" },
      { en: "his", zh: "他的" },
      { en: "her", zh: "她的" },
      { en: "hers", zh: "她的" },
      { en: "its", zh: "它的" },
      { en: "our", zh: "我们的" },
      { en: "ours", zh: "我们的" },
      { en: "their", zh: "他们的" },
      { en: "theirs", zh: "他们的" },
    ],
    usage: [
      { prompt: "This is ___ pencil.", answer: "my", why: "Use my + a thing: my pencil.", alsoCorrect: ["your", "his", "her", "its", "our", "their"] },
      { prompt: "This pencil is ___.", answer: "mine", why: "Use mine alone, without the thing: this is mine.", alsoCorrect: ["yours", "his", "hers", "ours", "theirs"] },
      { prompt: "Is this ___ bag?", answer: "your", why: "Use your + a thing: your bag.", alsoCorrect: ["my", "his", "her", "its", "our", "their"] },
      { prompt: "This bag is ___.", answer: "yours", why: "Use yours alone, without the thing: this is yours.", alsoCorrect: ["mine", "his", "hers", "ours", "theirs"] },
      { prompt: "This is ___ bike.", answer: "his", why: "Use his for a boy or a man: his bike.", alsoCorrect: ["my", "your", "her", "its", "our", "their"] },
      { prompt: "This is ___ hat.", answer: "her", why: "Use her + a thing for a girl: her hat.", alsoCorrect: ["my", "your", "his", "its", "our", "their"] },
      { prompt: "This hat is ___.", answer: "hers", why: "Use hers alone for a girl: this is hers.", alsoCorrect: ["mine", "yours", "his", "ours", "theirs"] },
      { prompt: "The bird is in ___ nest.", answer: "its", why: "Use its for an animal or a thing: its nest.", alsoCorrect: ["my", "your", "his", "her", "our", "their"] },
      { prompt: "___ school is very big.", answer: "our", why: "Use our + a thing: our school.", alsoCorrect: ["my", "your", "his", "her", "its", "their"] },
      { prompt: "This classroom is ___.", answer: "ours", why: "Use ours alone, without the thing: this is ours.", alsoCorrect: ["mine", "yours", "his", "hers", "theirs"] },
      { prompt: "___ house is near the park.", answer: "their", why: "Use their + a thing: their house.", alsoCorrect: ["my", "your", "his", "her", "our", "its"] },
      { prompt: "That house is ___.", answer: "theirs", why: "Use theirs alone, without the thing: that is theirs.", alsoCorrect: ["mine", "yours", "his", "hers", "ours"] },
    ],
  },
];
