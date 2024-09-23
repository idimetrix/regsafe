import { Regsafe } from ".";

(async () => {
  const regexString = "(a|b)*[a-z]{1,3}\\d+\\u0041";
  const tokenizer = new Regsafe(regexString);
  const tokens = tokenizer.tokenize();

  console.log(tokens);
})();
