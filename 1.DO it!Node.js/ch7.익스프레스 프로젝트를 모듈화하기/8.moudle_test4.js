//require() 메소드는 함수를 반환함
const user = require("./7.user4");

function showUser() {
  return user().name + ", " + "No Group";
}

console.log("사용자 정보: %s", showUser());
