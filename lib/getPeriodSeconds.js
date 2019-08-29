const isString = require('lodash/isString');

const MIN = 60;
const HOUR = MIN * 60;
const DAY = HOUR * 24;
const WEEK = 7 * DAY;

const placeholders = {
  '1w': WEEK,
  '1d': DAY,
  '1h': HOUR,
  '1m': MIN
}

/**
 * Получить период в секундах
 * @param  {Mixed} period который нужно преобразовать
 * @return {Number|Mixed} полученный период, или начальное значение
 */
function getPeriodSeconds(period) {
  if (placeholders[period]) return placeholders[period];
  if (isString(period)) return +period;
  return period;
}

module.exports =  getPeriodSeconds;
