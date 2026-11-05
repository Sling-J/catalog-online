import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Button } from './Button.js';
import { ChangingValue } from './ChangingValue.js';
import { Chip } from './Chip.js';
import { Field } from './Field.js';
import { StockPill } from './StockPill.js';
import { Switch } from './Switch.js';

beforeAll(() => {
  i18n.loadAndActivate({ locale: 'ru', messages: {} });
});

afterEach(cleanup);

const withI18n = (node: ReactNode) => render(<I18nProvider i18n={i18n}>{node}</I18nProvider>);

describe('Button', () => {
  it('по умолчанию type=button, чтобы не отправлять формы случайно', () => {
    render(<Button>В корзину</Button>);
    expect(screen.getByRole('button', { name: 'В корзину' })).toHaveProperty('type', 'button');
  });

  it('вариант задаёт цвет и подложку', () => {
    render(<Button variant="primary">Создать каталог</Button>);
    expect(screen.getByRole('button').className).toContain('bg-sun');
    expect(screen.getByRole('button').className).toContain('shadow-press-sun');
  });
});

describe('ChangingValue', () => {
  it('при смене показывает новое значение', () => {
    const { rerender } = render(<ChangingValue value="9 500 ₸" />);
    rerender(<ChangingValue value="19 000 ₸" />);
    expect(screen.getByText('19 000 ₸')).toBeTruthy();
  });
});

describe('Chip', () => {
  it('сообщает о выборе через aria-pressed', () => {
    render(<Chip selected>Куртки</Chip>);
    expect(screen.getByRole('button', { name: 'Куртки' }).getAttribute('aria-pressed')).toBe('true');
  });
});

describe('Field', () => {
  it('связывает подпись и ошибку с полем', () => {
    render(<Field label="Название" error="Обязательно" />);
    const input = screen.getByLabelText('Название');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(screen.getByText('Обязательно').id);
  });
});

describe('Switch', () => {
  it('переключается по нажатию', () => {
    function Demo() {
      const [checked, setChecked] = useState(false);
      return <Switch label="Только в наличии" checked={checked} onCheckedChange={setChecked} />;
    }
    render(<Demo />);
    const toggle = screen.getByRole('switch', { name: 'Только в наличии' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });
});

describe('StockPill', () => {
  it('показывает уровни наличия словами', () => {
    withI18n(
      <>
        <StockPill level="in" />
        <StockPill level="low" />
        <StockPill level="out" />
      </>,
    );
    expect(screen.getByText('В наличии')).toBeTruthy();
    expect(screen.getByText('Осталось мало')).toBeTruthy();
    expect(screen.getByText('Нет в наличии')).toBeTruthy();
  });

  it('показывает точное количество, если магазин так настроил', () => {
    withI18n(<StockPill level="low" quantity={1} />);
    expect(screen.getByText('Осталось 1 шт.')).toBeTruthy();
  });
});
