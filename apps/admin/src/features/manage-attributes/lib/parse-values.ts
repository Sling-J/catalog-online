/** Значения из строки «синий, красный, белый» (запятая, точка с запятой или новая строка): без пустых и повторов. */
export function parseValues(text: string): string[] {
  const result: string[] = [];
  for (const value of text
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean))
    if (!result.some((item) => item.toLowerCase() === value.toLowerCase())) result.push(value);
  return result;
}
