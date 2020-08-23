var Calc = require("./test4-calc");

var calc = new Calc();
calc.emit("stop");
calc.add(3, 4);
console.log(Calc.title + "에 stop 이벤트 전달함");
