//require()메소드는 객체를 반환함
const user = require("./5.user3");

function showUser() {
  return user.getUser().name + ", " + user.group.name;
}

console.log("사용자 정보 : %s ", showUser());
