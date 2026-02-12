Markdown live editor with custom shortcuts for mobile. Sync on Firestone and save on indexedb for offline editing. Fast and lightweight. Easily customized. Implement only the necessary. Mobile first.

### eventAnalysis(e)
- returns deleted runs
- determine actions
	- runInsertion
	- shiftType
	- runDeletion
- If start = 0 and end, look it surrounded by a run
- [ ] getNodes adjency strict
- [ ] getNodes block context strict
- [ ] getNodes monter dom 
- [ ] if runInsertion collect deletion only if range exceed block context.
- [ ] get proper character (look nextSibling)

|                            |                                                                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Fonction                   | Changement                                                                                                                       |
| eventAnalysis              | Utiliser getCharacterAround(...) pour des updates fiables.                                                                       |
| getCharacterAround         | Nouvelle fonction pour retrouver un caractère réel adjacent, même s’il est dans un autre TextNode sibling ou parent.             |
| getNodes                   | Ajoute stopIfNotAdjacent pour court-circuiter la recherche dès qu’on perd l’adjacence. Supprime la limite stricte au .block > *. |
| updates dans eventAnalysis | Récupère les caractères adjacents avec getCharacterAround pour éviter des null trop précoces.                                    |

```js
function eventAnalysis(event) {
  const category = eventType[event.inputType];
  if (!category || category === "formatManipulation" || category === "blockManipulation") return;

  const data = event.data;
  const range = event.getTargetRanges()[0];
  const isCollapsed = range.collapsed;

  const startContainer = range.startContainer;
  const endContainer = range.endContainer;

  const startOffset = range.startOffset;
  const endOffset = range.endOffset;

  const startSpan = startContainer.parentNode.tagName === "SPAN";
  const endSpan = endContainer.parentNode.tagName === "SPAN";

  let action = "none";
  if (inlineSyntax.includes(data)) action = "runInsertion";
  else if (startSpan && endSpan && isCollapsed) action = "shiftInsertion";

  const deletion = [];
  if (!isCollapsed) deletion.push(...getDeletion(range));
  if (startSpan && !data) deletion.push(startContainer.parentNode);
  if (endSpan && !data) deletion.push(endContainer.parentNode);

  const updates = [];
  if (!inlineSyntax.includes(data)) {
    const charAtStart = data || endContainer.textContent.charAt(endOffset) || null;
    const charAtEnd = data || startContainer.textContent.charAt(startOffset - 1) || null;

    if (startOffset === 0) {
      const prev = getNodes(startContainer, "previous");
      if (prev.adjacent) updates.push({ node: prev.span, direction: "following", character: charAtStart });
    }

    if (endOffset === endContainer.length) {
      const next = getNodes(endContainer, "next");
      if (next.adjacent) updates.push({ node: next.span, direction: "previous", character: charAtEnd });
    }

    if (startSpan && data) {
      updates.push({ node: startContainer.parentNode, direction: "following", character: data });
    }
  }

  return { action, deletion, updates };
}
```


- [ ] Update data when needed
	- [ ] Type
	- [ ] Adjacent
	- [ ] On selection
	- [ ] On block manipulation
	- [ ] Other indirect interaction 
	- [ ] Other direct interaction
- [ ] getPair
	- [ ] Pairing conditions 
	- [ ] Pair on update 
	- [ ] Pair on addition 
- [ ] setPair
	- [ ] Base the array return on getPair do the less dom manipulation possible 
- [ ] Block
- [ ] Undo Redo
- [ ] Link
- [ ] Image
- [ ] Saving



[[DOM V2]]
 
[[block]]
[[inline]]

# edge case
- if no pairs like « ** » and type one between might need to be paired.

## CommonMark
- `openingSyntax` = previous character is a space or has no previous character.
- `closingSyntax` = following character is a space or has no following character.
- Else its invalid.
- Multi character syntax are matched first.
- Invalid If syntax has space around
- Syntax surrounds by text is open close
- Select Unicode white space & punctuation 

1. `openingSyntax` : preceded by any Unicode white space or punctuation and cannot be followed by Unicode white space or punctuation.
2. `closingSyntax` : followed by any Unicode white space or punctuation and cannot be preceded by Unicode white space or punctuation 
3. `bothSyntax` : can be both open and close when surrounded by any Unicode that is not white space or punctuation.
4. When blur trim extra space to prevent invalid markdown?



## Wanted
- Only valid markdown (commonMark)
- abréviations (creation de dictionnaire d’abréviation et de leur mot complet)
- Définition et footnote s’affiche au clique
- Image, add files  et link 
- Affiche image en tas, en vertical, horizontal et flex, 
- Par drop down 
- Mermaid

While do
- use three walker
- Normalize()
- \u200b
- After() & before ()
- range
- .closest(« \#editor > \*)
- delay apparition (?)

Roadmap 
1. Inline 
2. Selection style or remove
3. Inline nesting
4. Block
5. Code
6. List
7. Checklist 
8. Definition footnote 
9. Image
10. Link
11. Save
12. Ctrl z et y
13. **Ctrl c et v
14. Firestore or supabase
15. Google cloud for image(?)
16. Multiple notes 
17. Table of content
18. Link notes 
19. Abréviations 
20. UI
21. Mermaid
22. Table
23. Download md file
24. 
==test== salut *test*test amusement 
**test salu** test
Test hey mec \* funzo*
 *fashinly*fashion* test*
## Seamless 
- use of \u200b to prevent collapse
- character inside and outside syntax
- 
## JS Performance
- RequestOnFrame
- range.insertNode
- range.setStartAfter
- range.surroundContent
- Document.fragment
- Schedule task?

`surroundContent()`



Range API
- Collapsed: true = carte, false = selection
- Collapse: selection -> caret

Syntax
- Definition list
- Heading ID
- Subscript Superscript
- Automatic link
- Footnote
- Abréviations dictionary is 


## CommonMark rules
The following rules define emphasis and strong emphasis:

1. A single `*` character [can open emphasis](https://spec.commonmark.org/0.31.2/#can-open-emphasis) iff (if and only if) it is part of a [left-flanking delimiter run](https://spec.commonmark.org/0.31.2/#left-flanking-delimiter-run).

2. A single `_` character [can open emphasis](https://spec.commonmark.org/0.31.2/#can-open-emphasis) iff it is part of a [left-flanking delimiter run](https://spec.commonmark.org/0.31.2/#left-flanking-delimiter-run) and either (a) not part of a [right-flanking delimiter run](https://spec.commonmark.org/0.31.2/#right-flanking-delimiter-run) or (b) part of a [right-flanking delimiter run](https://spec.commonmark.org/0.31.2/#right-flanking-delimiter-run)preceded by a [Unicode punctuation character](https://spec.commonmark.org/0.31.2/#unicode-punctuation-character).

3. A single `*` character [can close emphasis](https://spec.commonmark.org/0.31.2/#can-close-emphasis) iff it is part of a [right-flanking delimiter run](https://spec.commonmark.org/0.31.2/#right-flanking-delimiter-run).

4. A single `_` character [can close emphasis](https://spec.commonmark.org/0.31.2/#can-close-emphasis) iff it is part of a [right-flanking delimiter run](https://spec.commonmark.org/0.31.2/#right-flanking-delimiter-run) and either (a) not part of a [left-flanking delimiter run](https://spec.commonmark.org/0.31.2/#left-flanking-delimiter-run) or (b) part of a [left-flanking delimiter run](https://spec.commonmark.org/0.31.2/#left-flanking-delimiter-run)followed by a [Unicode punctuation character](https://spec.commonmark.org/0.31.2/#unicode-punctuation-character).

5. A double `**` [can open strong emphasis](https://spec.commonmark.org/0.31.2/#can-open-strong-emphasis) iff it is part of a [left-flanking delimiter run](https://spec.commonmark.org/0.31.2/#left-flanking-delimiter-run).

6. A double `__` [can open strong emphasis](https://spec.commonmark.org/0.31.2/#can-open-strong-emphasis) iff it is part of a [left-flanking delimiter run](https://spec.commonmark.org/0.31.2/#left-flanking-delimiter-run) and either (a) not part of a [right-flanking delimiter run](https://spec.commonmark.org/0.31.2/#right-flanking-delimiter-run) or (b) part of a [right-flanking delimiter run](https://spec.commonmark.org/0.31.2/#right-flanking-delimiter-run)preceded by a [Unicode punctuation character](https://spec.commonmark.org/0.31.2/#unicode-punctuation-character).

7. A double `**` [can close strong emphasis](https://spec.commonmark.org/0.31.2/#can-close-strong-emphasis) iff it is part of a [right-flanking delimiter run](https://spec.commonmark.org/0.31.2/#right-flanking-delimiter-run).

8. A double `__` [can close strong emphasis](https://spec.commonmark.org/0.31.2/#can-close-strong-emphasis) iff it is part of a [right-flanking delimiter run](https://spec.commonmark.org/0.31.2/#right-flanking-delimiter-run) and either (a) not part of a [left-flanking delimiter run](https://spec.commonmark.org/0.31.2/#left-flanking-delimiter-run) or (b) part of a [left-flanking delimiter run](https://spec.commonmark.org/0.31.2/#left-flanking-delimiter-run) followed by a [Unicode punctuation character](https://spec.commonmark.org/0.31.2/#unicode-punctuation-character).

9. Emphasis begins with a delimiter that [can open emphasis](https://spec.commonmark.org/0.31.2/#can-open-emphasis) and ends with a delimiter that [can close emphasis](https://spec.commonmark.org/0.31.2/#can-close-emphasis), and that uses the same character (`_` or `*`) as the opening delimiter. The opening and closing delimiters must belong to separate [delimiter runs](https://spec.commonmark.org/0.31.2/#delimiter-run). If one of the delimiters can both open and close emphasis, then the sum of the lengths of the delimiter runs containing the opening and closing delimiters must not be a multiple of 3 unless both lengths are multiples of 3.

10. Strong emphasis begins with a delimiter that[can open strong emphasis](https://spec.commonmark.org/0.31.2/#can-open-strong-emphasis) and ends with a delimiter that [can close strong emphasis](https://spec.commonmark.org/0.31.2/#can-close-strong-emphasis), and that uses the same character (`_` or `*`) as the opening delimiter. The opening and closing delimiters must belong to separate [delimiter runs](https://spec.commonmark.org/0.31.2/#delimiter-run). If one of the delimiters can both open and close strong emphasis, then the sum of the lengths of the delimiter runs containing the opening and closing delimiters must not be a multiple of 3 unless both lengths are multiples of 3.

11. A literal `*` character cannot occur at the beginning or end of `*`-delimited emphasis or `**`-delimited strong emphasis, unless it is backslash-escaped.

12. A literal `_` character cannot occur at the beginning or end of `_`-delimited emphasis or `__`-delimited strong emphasis, unless it is backslash-escaped.


Where rules 1–12 above are compatible with multiple parsings, the following principles resolve ambiguity:

1. The number of nestings should be minimized. Thus, for example, an interpretation `<strong>...</strong>` is always preferred to `<em><em>...</em></em>`.

2. An interpretation `<em><strong>...</strong></em>` is always preferred to `<strong><em>...</em></strong>`.

3. When two potential emphasis or strong emphasis spans overlap, so that the second begins before the first ends and ends after the first ends, the first takes precedence. Thus, for example, `*foo _bar* baz_` is parsed as `<em>foo _bar</em> baz_` rather than `*foo <em>bar* baz</em>`.

4. When there are two potential emphasis or strong emphasis spans with the same closing delimiter, the shorter one (the one that opens later) takes precedence. Thus, for example,`**foo **bar baz**` is parsed as `**foo <strong>bar baz</strong>` rather than `<strong>foo **bar baz</strong>`.

5. Inline code spans, links, images, and HTML tags group more tightly than emphasis. So, when there is a choice between an interpretation that contains one of these elements and one that does not, the former always wins. Thus, for example, `*[foo*](bar)` is parsed as `*<a href="bar">foo*</a>` rather than as `<em>[foo</em>](bar)`.