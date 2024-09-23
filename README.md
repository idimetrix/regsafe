# regsafe

**regsafe** is a powerful, TypeScript-based regular expression tokenizer. This library breaks down complex regular expressions into meaningful tokens, allowing you to analyze, debug, and process regex strings programmatically.

### Features

- **Tokenizes all common regular expression components**: character classes, groups, quantifiers, lookaheads, backreferences, escapes, and more.
- **Support for advanced regex features**: Unicode escapes, Hexadecimal escapes, and both positive/negative lookaheads.
- **Error-handling**: Tracks the position in the regex string for debugging purposes.

## Installation

You can install the package using **npm**, **yarn**, or **pnpm**.

```bash
pnpm add regsafe

yarn install regsafe

npm install regsafe
```

## Usage

```typescript
import { RegexTokenizer, Token, TokenType } from "regsafe";

const tokenizer = new RegexTokenizer("(a|b)*[a-z]{1,3}\\d+\\u0041");
const tokens = tokenizer.tokenize();
console.log(tokens);

// [
//    { "type": "GROUP_OPEN", "value": "(", "position": 0 },
//    { "type": "CHAR", "value": "a", "position": 1 },
//    { "type": "PIPE", "value": "|", "position": 2 },
//    { "type": "CHAR", "value": "b", "position": 3 },
//    { "type": "GROUP_CLOSE", "value": ")", "position": 4 },
//    { "type": "META_CHAR", "value": "*", "position": 5 }
// ]
```

## tsup

Bundle your TypeScript library with no config, powered by esbuild.

https://tsup.egoist.dev/

## How to use this

1. install dependencies

```
# pnpm
$ pnpm install

# yarn
$ yarn install

# npm
$ npm install
```

2. Add your code to `src`
3. Add export statement to `src/index.ts`
4. Test build command to build `src`.
   Once the command works properly, you will see `dist` folder.

```zsh
# pnpm
$ pnpm run build

# yarn
$ yarn run build

# npm
$ npm run build
```

5. Publish your package

```zsh
$ npm publish
```

## test package

https://www.npmjs.com/package/regsafe
