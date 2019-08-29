/* global test describe expect */

const getTimeSeconds = require('../lib/getTimeSeconds');

const times = [
  [[1], 3600],
  [[1, 30], 5400],
  [[15, 20, 18], 55218]
];

const stringTimes = [
  ['01:00', 3600],
  ['1:30', 5400],
  ['15:20:18', 55218],
  ['00:00', 0],
  ['0:0', 0]
];

describe('Функция getTimeSeconds', () => {
  test('Разбирает массив', () => {
    for (const [time, result] of times) {
      expect(getTimeSeconds(time)).toBe(result);
    }
  });

  test('Разбирает строку', () => {
    for (const [time, result] of stringTimes) {
      expect(getTimeSeconds(time)).toBe(result);
    }
  });
});
