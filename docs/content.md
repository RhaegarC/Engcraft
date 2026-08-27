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
| ___ am going to the store. | **I** | Use I with am — I am the person speaking. | — |
| Can you help ___? | **me** | Use me after a verb or to — me receives the action. | you, him, her, us, them |
| ___ is my best friend. | **he** | He is a boy or man who does the action. | she |
| I will call ___ later. | **her** | Use her after a verb or to — a girl receives the action. | me, you, him, us, them, it |
| ___ are going to the park. | **we** | We means me and other people together. | you, they |
| The teacher gave ___ a book. | **us** | Use us after a verb or to — our group receives the action. | me, you, him, her, them |
| ___ are playing outside. | **they** | They is for two or more people. | you |
| Please tell ___ the truth. | **them** | Use them after a verb or to — other people receive the action. | me, you, him, her, us, it |
| ___ is raining outside. | **it** | It is for animals and things. | — |

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
- **Possessive:** `PA` = possessive adjective, used before a noun (*my, your, his, her, its, our, their*); `PP` = possessive pronoun, stands alone (*mine, yours, hers, ours, theirs*).
- **Note:** *his* is form-invariant — the same word works as both adjective ("his bike") and pronoun ("this is his"). It is tagged `PA` in the data.

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
| This is ___ jacket. | **my** | Use my + a thing: my jacket. | your, his, her, its, our, their |
| This jacket is ___. | **mine** | Use mine alone, without the thing: this is mine. | yours, his, hers, ours, theirs |
| Is this ___ favorite book? | **your** | Use your + a thing: your favorite book. | my, his, her, its, our, their |
| This is ___ home. | **their** | Use their + a thing: their home. | my, your, his, her, our, its |
| This home is ___. | **theirs** | Use theirs alone, without the thing: this is theirs. | mine, yours, his, hers, ours |
| This is ___ favorite color. | **her** | Use her + a thing for a girl: her favorite color. | my, your, his, its, our, their |
| The bag is ___. | **hers** | Use hers alone for a girl: this is hers. | mine, yours, his, ours, theirs |
| This is ___ first day. | **our** | Use our + a thing: our first day. | my, your, his, her, its, their |
| The school is ___. | **ours** | Use ours alone, without the thing: this is ours. | mine, yours, his, hers, theirs |
| That is ___ cat. | **my** | Use my + a thing: my cat. | your, his, her, its, our, their |

---

## There Be Sentences（There be 句型）

A fifth activity — a **single-option grammar choice** for "there be" sentences.
Each question has its own small word bank (is/are, Is/Are, isn't/aren't, any/some,
was/were, Was/Were); exactly one option is grammatically correct. The bank holds
**40 sentences**; each round draws 10 at random.

| Sentence (blank = answer) | Answer | Options | Why (shown on wrong tap) |
|---|---|---|---|
| There ___ a dog under the tree. | **is** | is / are | One thing → is. |
| There ___ 3 cats running. | **are** | is / are | Two or more → are. |
| There ___ a book on the table. | **is** | is / are | One thing → is. |
| There ___ 2 apples in the bowl. | **are** | is / are | Two or more → are. |
| There ___ a bird in the sky. | **is** | is / are | One thing → is. |
| There ___ 5 students in the class. | **are** | is / are | Two or more → are. |
| There ___ milk in the cup. | **is** | is / are | Milk is uncountable → is. |
| There ___ some water in the bottle. | **is** | is / are | Some water is uncountable → is. |
| There ___ a big tree in the park. | **is** | is / are | One thing → is. |
| There ___ many stars in the sky. | **are** | is / are | Two or more → are. |
| There ___ a pencil on the desk. | **is** | is / are | One thing → is. |
| There ___ 2 windows in the room. | **are** | is / are | Two or more → are. |
| ___ there a pencil on the desk? | **Is** | Is / Are | Asking about one thing → Is. |
| ___ there any books in the bag? | **Are** | Is / Are | Asking about two or more → Are. |
| ___ there a cat under the chair? | **Is** | Is / Are | Asking about one thing → Is. |
| ___ there many people at the party? | **Are** | Is / Are | Asking about two or more → Are. |
| ___ there a teacher in the classroom? | **Is** | Is / Are | Asking about one thing → Is. |
| ___ there 2 dogs in the park? | **Are** | Is / Are | Asking about two or more → Are. |
| ___ there any water in the glass? | **Is** | Is / Are | Water is uncountable → Is. |
| ___ there 3 birds on the roof? | **Are** | Is / Are | Asking about two or more → Are. |
| There isn't ___ pencil. | **any** | any / some | Negatives use any. |
| There aren't ___ apples in the basket. | **any** | any / some | Negatives use any. |
| There are ___ birds in the tree. | **some** | any / some | Positive sentences use some. |
| There is ___ milk in the fridge. | **some** | any / some | Positive sentences use some. |
| There isn't ___ milk in the cup. | **any** | any / some | Negatives use any. |
| There aren't ___ books on the shelf. | **any** | any / some | Negatives use any. |
| There is ___ water in the bottle. | **some** | any / some | Positive sentences use some. |
| There aren't ___ children in the park. | **any** | any / some | Negatives use any. |
| There ___ a pen on the desk. | **isn't** | isn't / aren't | One thing, not → isn't. |
| There ___ any chairs in the room. | **aren't** | isn't / aren't | Two or more, not → aren't. |
| There ___ a cat in the box. | **isn't** | isn't / aren't | One thing, not → isn't. |
| There ___ 2 birds in the cage. | **aren't** | isn't / aren't | Two or more, not → aren't. |
| There ___ any milk in the cup. | **isn't** | isn't / aren't | Milk is uncountable → isn't. |
| There ___ any students in the classroom. | **aren't** | isn't / aren't | Two or more, not → aren't. |
| There ___ a big dog in the yard yesterday. | **was** | was / were | One thing in the past → was. |
| There ___ 3 cats on the roof last night. | **were** | was / were | Two or more in the past → were. |
| There ___ a cake on the table this morning. | **was** | was / were | One thing in the past → was. |
| There ___ many people at the party yesterday. | **were** | was / were | Two or more in the past → were. |
| ___ there a park near your home last year? | **Was** | Was / Were | Asking about one thing in the past → Was. |
| ___ there any toys in the box yesterday? | **Were** | Was / Were | Asking about two or more in the past → Were. |

---

### Review checklist

- [ ] All 24 Chinese translations are correct for your classes
- [ ] All 43 usage sentences (21 personal + 22 possessive) are age-appropriate (7–11) and unambiguous
- [ ] All 40 there-be questions are age-appropriate (7–11) and unambiguous
- [ ] Each "why" explanation is short enough and correct
- [ ] Sentences avoid any words your classes may not know (or tell me to swap)

> Note: subject/object pairs like 我 → I/me and 我的 → my/mine share a Chinese prompt; the spoken English audio disambiguates which English word to type.
