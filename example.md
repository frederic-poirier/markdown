# Markdown Viewer Example

This is an example markdown file to showcase all the features supported by this markdown viewer.

## Table of Contents

- [Headings](#headings)
- [Text Formatting](#text-formatting)
- [Lists](#lists)
- [Code Blocks](#code-blocks)
- [Tables](#tables)
- [Links and Images](#links-and-images)
- [Blockquotes](#blockquotes)

---

## Headings

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

---

## Text Formatting

This is **bold text** and this is *italic text*.

You can also use ~~strikethrough~~ text.

Here's some `inline code` in a paragraph.

---

## Lists

### Unordered List

- First item
- Second item
  - Nested item
  - Another nested item
- Third item

### Ordered List

1. First item
2. Second item
3. Third item

### Task List (GFM)

- [x] Completed task
- [ ] Incomplete task
- [ ] Another task

---

## Code Blocks

Here's a JavaScript code block with syntax highlighting:

```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
  return true;
}

const user = 'World';
greet(user);
```

Python example:

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
```

---

## Tables

| Feature | Supported | Notes |
|---------|-----------|-------|
| Syntax Highlighting | ✅ | Uses rehype-highlight |
| GFM Tables | ✅ | Full support |
| Task Lists | ✅ | Checkbox rendering |
| Hot Reload | ✅ | WebSocket-based |

---

## Links and Images

Here's a [link to Google](https://www.google.com).

Here's an internal link to [another section](#headings).

Images are supported too:

![Placeholder Image](https://via.placeholder.com/600x300/3b82f6/ffffff?text=Example+Image)

---

## Blockquotes

> This is a blockquote.
> 
> It can span multiple lines and contains formatted text like **bold** and *italic*.
> 
> — Author Name

---

## Horizontal Rule

You can use horizontal rules to separate sections:

---

## More Features

### Inline HTML

You can mix in <strong>inline HTML</strong> if needed.

### Nested Elements

You can combine different elements:

- **Bold list item** with `inline code`
- *Italic list item* with a [link](https://example.com)
- ~~Strikethrough~~ item

---

That's it! This markdown viewer supports all these features and more. Enjoy editing your markdown files with live hot reload!
