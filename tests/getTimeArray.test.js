/* global test describe expect */

const getTimeArray = require('../lib/getTimeArray');

const hours = {
  '01': [1],
  '05': [5],
  '12': [12],
  '10': [10]
};

const minutes = {
  '11:43': [11, 43],
  '22:01': [22, 1],
  '01:01': [1, 1]
};

const seconds = {
  '11:43:12': [11, 43, 12],
  '22:01:05': [22, 1, 5],
  '01:01:36': [1, 1, 36]
};

describe('Функция getTimeArray', () => {
  test('Разбирает часы', () => {
    for (const [from, to] of Object.entries(hours)) {
      expect(getTimeArray(from)).toEqual(to);
    }
  });

  test('Разбирает минуты', () => {
    for (const [from, to] of Object.entries(minutes)) {
      expect(getTimeArray(from)).toEqual(to);
    }
  });

  test('Разбирает секунды', () => {
    for (const [from, to] of Object.entries(seconds)) {
      expect(getTimeArray(from)).toEqual(to);
    }
  });

  test('Не пропускает дичь', () => {
    expect(getTimeArray('Дичь')).toBe(null);
  });

  test('Не пропускает «удлиненное время»', () => {
    expect(getTimeArray('10:00:12:34')).toBe(null);
  });


  test('Не пропускает время с дичью', () => {
    expect(getTimeArray('10:Дичь:00')).toBe(null);
  });
});
