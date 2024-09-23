/**
 * Enum representing different token types in a regular expression.
 */
enum TokenType {
  CHAR = "CHAR",
  META_CHAR = "META_CHAR",
  GROUP_OPEN = "GROUP_OPEN",
  GROUP_CLOSE = "GROUP_CLOSE",
  RANGE_OPEN = "RANGE_OPEN",
  RANGE_CLOSE = "RANGE_CLOSE",
  PIPE = "PIPE",
  QUANTIFIER = "QUANTIFIER",
  ESCAPE = "ESCAPE",
  ANCHOR = "ANCHOR",
  LOOKAHEAD = "LOOKAHEAD",
  NEG_LOOKAHEAD = "NEG_LOOKAHEAD",
  UNICODE_ESCAPE = "UNICODE_ESCAPE",
  HEX_ESCAPE = "HEX_ESCAPE",
  BACKREFERENCE = "BACKREFERENCE",
}

/**
 * Interface representing a token in the regular expression.
 */
interface Token {
  type: TokenType;
  value: string;
  position: number; // Position in the input regex string (for error/debugging)
}

/**
 * Class responsible for tokenizing regular expressions into a structured array of tokens.
 */
class Regsafe {
  private position: number = 0;

  constructor(private readonly regex: string) {}

  /**
   * Tokenizes the input regular expression into an array of tokens.
   * @returns Token[] - Array of tokens representing the regex components.
   */
  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.position < this.regex.length) {
      const char = this.regex[this.position];

      if (this.isAnchor(char)) {
        tokens.push(this.createToken(TokenType.ANCHOR, char));
        this.position++; // Move to the next character
      } else if (this.isMetaChar(char)) {
        tokens.push(this.createToken(TokenType.META_CHAR, char));
        this.position++; // Move to the next character
      } else if (char === "(") {
        tokens.push(...this.parseGroup());
      } else if (char === "[") {
        tokens.push(...this.parseRange());
      } else if (this.isQuantifierStart(char)) {
        tokens.push(this.parseQuantifier());
      } else if (char === "\\") {
        tokens.push(this.parseEscape());
      } else if (char === "|") {
        tokens.push(this.createToken(TokenType.PIPE, char));
        this.position++; // Move to the next character
      } else {
        tokens.push(this.createToken(TokenType.CHAR, char));
        this.position++; // Move to the next character
      }
    }

    return tokens;
  }

  private createToken(type: TokenType, value: string): Token {
    return { type, value, position: this.position };
  }

  private isMetaChar(char: string): boolean {
    return ["*", "+", "?", "."].includes(char);
  }

  private isAnchor(char: string): boolean {
    return char === "^" || char === "$";
  }

  private isQuantifierStart(char: string): boolean {
    return char === "{";
  }

  /**
   * Parses a quantifier, such as `{1,3}` or `{3,}`.
   */
  private parseQuantifier(): Token {
    let quantifier = "";
    this.position++; // Skip the '{'
    while (
      this.regex[this.position] !== "}" &&
      this.position < this.regex.length
    ) {
      quantifier += this.regex[this.position];
      this.position++;
    }
    quantifier += "}";
    this.position++; // Skip the '}'
    return this.createToken(TokenType.QUANTIFIER, quantifier);
  }

  /**
   * Parses a group (capturing or non-capturing).
   * Supports lookaheads, lookbehinds, and non-capturing groups.
   */
  private parseGroup(): Token[] {
    const tokens: Token[] = [this.createToken(TokenType.GROUP_OPEN, "(")];
    this.position++; // Skip the '('

    if (this.regex[this.position] === "?") {
      // Handle lookaheads or non-capturing groups
      this.position++;
      if (this.regex[this.position] === "=") {
        tokens.push(this.createToken(TokenType.LOOKAHEAD, "(?="));
        this.position++;
      } else if (this.regex[this.position] === "!") {
        tokens.push(this.createToken(TokenType.NEG_LOOKAHEAD, "(?!)"));
        this.position++;
      }
    }

    // Continue parsing the group until we find the closing ')'
    while (
      this.regex[this.position] !== ")" &&
      this.position < this.regex.length
    ) {
      tokens.push(...this.tokenizeGroupContent());
    }
    tokens.push(this.createToken(TokenType.GROUP_CLOSE, ")"));
    this.position++; // Skip the ')'

    return tokens;
  }

  /**
   * Parses the content inside a group.
   * This prevents recursion inside `tokenize()`.
   */
  private tokenizeGroupContent(): Token[] {
    const tokens: Token[] = [];
    while (
      this.position < this.regex.length &&
      this.regex[this.position] !== ")"
    ) {
      const char = this.regex[this.position];

      if (this.isAnchor(char)) {
        tokens.push(this.createToken(TokenType.ANCHOR, char));
        this.position++;
      } else if (this.isMetaChar(char)) {
        tokens.push(this.createToken(TokenType.META_CHAR, char));
        this.position++;
      } else if (char === "[") {
        tokens.push(...this.parseRange());
      } else if (this.isQuantifierStart(char)) {
        tokens.push(this.parseQuantifier());
      } else if (char === "\\") {
        tokens.push(this.parseEscape());
      } else if (char === "|") {
        tokens.push(this.createToken(TokenType.PIPE, char));
        this.position++;
      } else {
        tokens.push(this.createToken(TokenType.CHAR, char));
        this.position++;
      }
    }
    return tokens;
  }

  /**
   * Parses character classes like `[a-z]`.
   */
  private parseRange(): Token[] {
    const tokens: Token[] = [this.createToken(TokenType.RANGE_OPEN, "[")];
    this.position++; // Skip the '['

    while (
      this.regex[this.position] !== "]" &&
      this.position < this.regex.length
    ) {
      if (this.regex[this.position] === "-") {
        tokens.push(this.createToken(TokenType.CHAR, "-"));
        this.position++;
      } else {
        tokens.push(
          this.createToken(TokenType.CHAR, this.regex[this.position]),
        );
        this.position++;
      }
    }

    tokens.push(this.createToken(TokenType.RANGE_CLOSE, "]"));
    this.position++; // Skip the ']'

    return tokens;
  }

  /**
   * Parses escape sequences such as `\d`, `\w`, or Unicode `\uXXXX`.
   */
  private parseEscape(): Token {
    this.position++; // Skip the backslash
    const escapeChar = this.regex[this.position];

    if (escapeChar === "u") {
      return this.parseUnicodeEscape();
    } else if (escapeChar === "x") {
      return this.parseHexEscape();
    } else if (/[0-9]/.test(escapeChar)) {
      return this.parseBackreference();
    } else {
      const escapeToken = this.createToken(TokenType.ESCAPE, `\\${escapeChar}`);
      this.position++;
      return escapeToken;
    }
  }

  private parseUnicodeEscape(): Token {
    let unicode = "\\u";
    this.position++; // Skip the 'u'
    for (let i = 0; i < 4; i++) {
      unicode += this.regex[this.position];
      this.position++;
    }
    return this.createToken(TokenType.UNICODE_ESCAPE, unicode);
  }

  private parseHexEscape(): Token {
    let hex = "\\x";
    this.position++; // Skip the 'x'
    for (let i = 0; i < 2; i++) {
      hex += this.regex[this.position];
      this.position++;
    }
    return this.createToken(TokenType.HEX_ESCAPE, hex);
  }

  private parseBackreference(): Token {
    let backref = "\\";
    backref += this.regex[this.position];
    this.position++;
    return this.createToken(TokenType.BACKREFERENCE, backref);
  }
}

export { Regsafe, Token, TokenType };
