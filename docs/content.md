# Pronoun Trainer — Content for Review

Drafted content embedded in site/data.js. **Please review** — especially the usage sentences (level-appropriateness for ages 7–11) and the Chinese translations. The multiple-choice distractors are drawn at runtime from the module word list, so they are not listed here.

## Personal Pronouns（人称代词）

### Spelling prompts (Chinese + spoken English)

| English | Form | Chinese prompt |
|---|---|---|
| I | subject | 我 |
| me | object | 我 |
| you | subject / object | 你 |
| he | subject | 他 |
| him | object | 他 |
| she | subject | 她 |
| her | object | 她 |
| it | subject / object | 它 |
| we | subject | 我们 |
| us | object | 我们 |
| they | subject | 他们 |
| them | object | 他们 |

### Usage sentences (multiple choice)

The app never shows an "also correct" word as a wrong option, so exactly one of the four choices is right.

| Sentence (blank = answer) | Answer | Why (shown on wrong tap) | Also correct (kept out of options) |
|---|---|---|---|
| ___ am a student. | **I** | Use I with am — I is the person speaking. | — |
| Please give the book to ___. | **me** | Use me after a verb or to — it receives the action. | you, him, her, us, them |
| Are ___ ready? | **you** | You is the person you are talking to. | we, they |
| ___ is my brother. | **he** | He is a boy or man who does the action. | — |
| I can see ___ over there. | **him** | Use him after a verb or to — a boy who receives the action. | me, you, her, us, them, it |
| ___ is my sister. | **she** | She is a girl or woman who does the action. | — |
| I like ___ very much. | **her** | Use her after a verb or to — a girl who receives the action. | me, you, him, us, them, it |
| ___ is a small cat. | **it** | It is for animals and things. | — |
| ___ are good friends. | **we** | We means me and other people together. | you, they |
| The teacher teaches ___ English. | **us** | Use us after a verb or to — our group receives the action. | me, you, him, her, them |
| ___ are my classmates. | **they** | They is for two or more people. | you |
| I will help ___ tomorrow. | **them** | Use them after a verb or to — other people receive the action. | me, you, him, her, us, it |

## Possessive Pronouns（物主代词）

### Spelling prompts (Chinese + spoken English)

| English | Form | Chinese prompt |
|---|---|---|
| my | possessive adjective | 我的 |
| mine | possessive pronoun | 我的 |
| your | possessive adjective | 你的 |
| yours | possessive pronoun | 你的 |
| his | possessive adjective | 他的 |
| her | possessive adjective | 她的 |
| hers | possessive pronoun | 她的 |
| its | possessive adjective | 它的 |
| our | possessive adjective | 我们的 |
| ours | possessive pronoun | 我们的 |
| their | possessive adjective | 他们的 |
| theirs | possessive pronoun | 他们的 |

---

### Form legend (the `forms` field in `site/data.js`)

- **Personal:** `sub` = subject (*I, he, she, it, we, they*); `obj` = object (*me, him, her, us, them*); `sub/obj` = the same word in both roles (*you, it*).
- **Possessive:** `poss-adj` = possessive adjective, used before a noun (*my, your, his, her, its, our, their*); `poss-pron` = possessive pronoun, stands alone (*mine, yours, hers, ours, theirs*).
- **Note:** *his* is form-invariant — the same word works as both adjective ("his bike") and pronoun ("this is his"). It is tagged `poss-adj` in the data.

### Usage sentences (multiple choice)

The app never shows an "also correct" word as a wrong option, so exactly one of the four choices is right.

| Sentence (blank = answer) | Answer | Why (shown on wrong tap) | Also correct (kept out of options) |
|---|---|---|---|
| This is ___ pencil. | **my** | Use my + a thing: my pencil. | your, his, her, its, our, their |
| This pencil is ___. | **mine** | Use mine alone, without the thing: this is mine. | yours, his, hers, ours, theirs |
| Is this ___ bag? | **your** | Use your + a thing: your bag. | my, his, her, its, our, their |
| This bag is ___. | **yours** | Use yours alone, without the thing: this is yours. | mine, his, hers, ours, theirs |
| This is ___ bike. | **his** | Use his for a boy or a man: his bike. | my, your, her, its, our, their |
| This is ___ hat. | **her** | Use her + a thing for a girl: her hat. | my, your, his, its, our, their |
| This hat is ___. | **hers** | Use hers alone for a girl: this is hers. | mine, yours, his, ours, theirs |
| The bird is in ___ nest. | **its** | Use its for an animal or a thing: its nest. | my, your, his, her, our, their |
| ___ school is very big. | **our** | Use our + a thing: our school. | my, your, his, her, its, their |
| This classroom is ___. | **ours** | Use ours alone, without the thing: this is ours. | mine, yours, his, hers, theirs |
| ___ house is near the park. | **their** | Use their + a thing: their house. | my, your, his, her, our, its |
| That house is ___. | **theirs** | Use theirs alone, without the thing: that is theirs. | mine, yours, his, hers, ours |

---

### Review checklist

- [ ] All 24 Chinese translations are correct for your classes
- [ ] All 24 usage sentences are age-appropriate (7–11) and unambiguous
- [ ] Each "why" explanation is short enough and correct
- [ ] Sentences avoid any words your classes may not know (or tell me to swap)

> Note: subject/object pairs like 我 → I/me and 我的 → my/mine share a Chinese prompt; the spoken English audio disambiguates which English word to type.
