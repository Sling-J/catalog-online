/** Где мерить: артборд на холсте (по номеру или части заголовка) или страница приложения целиком. */
export type Scope = { kind: 'board'; frame: string } | { kind: 'app' };

export type Rgba = [number, number, number, number];

/** Подложка текста: ближайший предок с фоном, рамкой или тенью; `text` — весь текст внутри неё. */
export type Box = { x: number; y: number; w: number; h: number; bg: Rgba; radius: number; text: string };

export type Item = {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Подсказка в поле или выбранный вариант: ширина у поля своя, её не сравниваем. */
  input: boolean;
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  color: Rgba;
  box: Box | null;
};

export type Collected = {
  /** Артборды на доске — для подсказки, если нужный не найден. */
  frames: { title: string; width: number; height: number }[];
  /** Найденная область: заголовок экрана и положение на странице (для снимка). */
  frame: { title: string; x: number; y: number; width: number; height: number } | null;
  items: Item[];
};

export type Diff = { text: string; y: number; problems: string[] };

export type Report = {
  matched: number;
  total: number;
  diffs: Diff[];
  onlyDesign: string[];
  onlyApp: string[];
};
