function rValue(val) {
  if (Math.abs(val) < 10) return parseFloat(val.toFixed(2));
  if (Math.abs(val) < 1000) return parseFloat(val.toFixed(1));
  return Math.round(val);
}

module.exports = {rValue: rValue};