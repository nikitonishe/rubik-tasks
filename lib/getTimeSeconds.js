const isString = require('lodash/isString');
const getTimeArray = require('./getTimeArray.js');

/**
 * Превратить массив времени в секунды от начала суток
 * Если передать строку, то она будет преобразована через getTimeArray.
 * Если строка оказалась невалидна, то вернет null.
 * @param  {Array} time массив времени
 * @return {Number|null} секунды от начала суток
 */
function getTimeSeconds(time) {
  if (isString(time)) {
    time = getTimeArray(time);
  }

  if (!Array.isArray(time)) return null;
  const [hours, minutes, seconds] = time;

  return (+hours || 0) * 3600 + (+minutes || 0) * 60 + (+seconds || 0);
}

module.exports = getTimeSeconds;
