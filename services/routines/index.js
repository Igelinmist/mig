function rValue(val) {
  if (Math.abs(val) < 10) return val.toFixed(2);
  if (Math.abs(val) < 1000) return val.toFixed(1);
  return Math.round(val);
}

module.exports = {rValue: rValue};