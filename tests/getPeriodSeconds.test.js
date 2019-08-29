/* global test describe expect */

const MIN = 60;
const HOUR = MIN * 60;
const DAY = HOUR * 24;
const WEEK = 7 * DAY;

const getPeriodSeconds = require('../lib/getPeriodSeconds');

describe('Функция getPeriodSeconds', () => {
  test('Разбирает плэйсхолдеры', () => {
    expect(getPeriodSeconds('1w')).toBe(WEEK);
    expect(getPeriodSeconds('1d')).toBe(DAY);
    expect(getPeriodSeconds('1h')).toBe(HOUR);
    expect(getPeriodSeconds('1m')).toBe(MIN);
  });

  test('Преобразует строки в числа', () => {
    expect(getPeriodSeconds('1000')).toBe(1000);
    expect(getPeriodSeconds('130')).toBe(130);
  });

  test('Не трогает числа', () => {
    expect(getPeriodSeconds(1000)).toBe(1000);
    expect(getPeriodSeconds(130)).toBe(130);
  });

  test('Не трогает null', () => {
    expect(getPeriodSeconds(null)).toBe(null);
  })
});
