const isString = require('lodash/isString');

const SECOND = 1;
const MIN = SECOND * 60;
const HOUR = MIN * 60;
const DAY = HOUR * 24;
const WEEK = 7 * DAY;

const time = {
  w: WEEK,
  d: DAY,
  h: HOUR,
  m: MIN,
  s: SECOND
}

const placeholderRegex = /(\d+)([wdhms]{1})/i;

/**
 * Получить период в секундах
 * @param  {Mixed} period который нужно преобразовать
 * @return {Number|Mixed} полученный период, или начальное значение
 */
function getPeriodSeconds(period) {
  if (isString(period)) {
    const match = period.match(placeholderRegex);
    if (!match) return +period;
    const [, count, placeholder] = match;
    return +count * time[placeholder];
  }
  return period;
}

module.exports =  getPeriodSeconds;
