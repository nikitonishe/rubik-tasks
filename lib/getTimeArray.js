const isString = require('lodash/isString');

/**
 * Получить массив из временной строки
 * Например 00:11 будет преобразовано в [0, 11].
 * Если строка оказалась невалидной, то вернет null
 * @param  {String} time время в одном из форматов: HH, HH:mm, HH:mm:ss
 * @return {Array|null}
 */
function getTimeArray(time) {
  if (!isString(time)) return null;
  const split = time.split(':');
  if (!(split.length > 0 && split.length <= 3)) return null;

  let isInvalid = false;

  const timeArray = split.map((value) => {
    value = +value;
    if (isNaN(value)) isInvalid = true;
    return value;
  });

  if (isInvalid) return null;
  return timeArray
}

module.exports = getTimeArray;
