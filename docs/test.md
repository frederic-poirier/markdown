# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

---

## Paragraphe

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Emphasis

**Gras**  
*Italique*  
***Gras et italique***  
~~Barré~~  
**Combiné avec _italique_ imbriqué**

## Blockquote

> Ceci est une citation simple.
>
> Avec plusieurs paragraphes.
>
>> Citation imbriquée.

## Listes

### Non ordonnée

- Item 1
- Item 2
  - Sous-item 2.1
  - Sous-item 2.2
    - Sous-sous-item
- Item 3

### Ordonnée

1. Premier
2. Deuxième
   1. Sous-item
   2. Sous-item
3. Troisième

### Task list (GFM)

- [x] Tâche complétée
- [ ] Tâche en attente
- [x] Autre tâche complétée
- [ ] Autre tâche en attente

## Code

### Inline

Voici du code inline : `const x = 42`

### Bloc sans langage

```
Bloc de code sans langage spécifié
  avec indentation préservée
```

### Bloc avec langage

```js
function greet(name) {
  return `Hello, ${name}!`
}

const result = greet('World')
console.log(result)
```

```ts
interface User {
  id: number
  name: string
  email?: string
}

function getUser(id: number): User {
  return { id, name: 'Alice' }
}
```

```python
def fibonacci(n: int) -> list[int]:
    seq = [0, 1]
    for _ in range(n - 2):
        seq.append(seq[-1] + seq[-2])
    return seq
```

```css
.container {
  display: flex;
  align-items: center;
  gap: 1rem;
}
```

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "solid-js": "^1.8.0"
  }
}
```

```bash
npm install
npm run dev
```

## Liens

[Lien simple](https://example.com)  
[Lien avec titre](https://example.com "Titre du lien")  
<https://example.com>  
<contact@example.com>

### Lien par référence

[Texte du lien][ref]

[ref]: https://example.com "Référence"

## Images

![Alt text](https://picsum.photos/400/200 "Titre optionnel")

### Image par référence

![Alt text][image-ref]

[image-ref]: https://picsum.photos/200/200

## Tableaux (GFM)

| Nom     | Âge | Ville      |
| ------- | --- | ---------- |
| Alice   | 30  | Paris      |
| Bob     | 25  | Lyon       |
| Charlie | 35  | Marseille  |

### Alignement des colonnes

| Gauche  | Centre  | Droite  |
| :------ | :-----: | ------: |
| A       | B       | C       |
| Long    | Texte   | 1234    |

## Footnotes (GFM)

Ceci est une phrase avec une note de bas de page.[^1]

Une autre phrase avec une seconde note.[^note]

[^1]: Contenu de la première note.
[^note]: Contenu de la note nommée.

## Horizontal rule

---

***

___

## HTML inline

Du texte avec du <kbd>HTML</kbd> inline et une <mark>mise en surbrillance</mark>.

<details>
  <summary>Contenu masqué</summary>
  Ce contenu est caché par défaut.
</details>

## Échappement

\*non italique\*  
\`non code\`  
\# non titre  
\[non lien\]

## Texte dur à la ligne

Première ligne  
Deuxième ligne (deux espaces avant le saut)

Ou avec backslash\
Troisième ligne
