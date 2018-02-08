const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const formatMoney = m => {
  m = m/100
  console.log(m.toFixed(2), m)
  if (m.toFixed(2) !== m) m = m.toFixed(2)
  if(m < 1000) return m
  var dotPos = m.toString().indexOf('.')
  if(dotPos === -1) {
    dotPos = m.toString().length - 1
  }
  var arr = m.toString().split('')
  for(var i = dotPos - 3; i > 0; i-=3) {
    arr.splice(i,0,',')
  }
  return arr.join('')
}

module.exports = {
  formatTime,
  formatMoney
}
