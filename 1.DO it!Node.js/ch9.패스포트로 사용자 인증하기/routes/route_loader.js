let route_loader = {};

const config = require("../2.config");

route_loader.init = function (app, router) {
  console.log("route_loader.init 호출됨.");

  initRoutes(app, router);
};

function initRoutes(app, router) {
  console.log("initRoutes 호출됨");

  for (var i = 0; i < config.route_info.length; i++) {
    let curItem = config.route_info[i];

    let curModule = require(curItem.file);
    if (curItem.type == "get") {
      router.route(curItem.path).get(curModule[curItem.method]);
    } else if (curItem.type == "post") {
      router.route(curItem.path).post(curModule[curItem.method]);
    } else {
      console.error("라우팅 함수의 타입을 알 수 없음: " + curItem.type);
    }
  }
  app.use("/", router);
}

module.exports = route_loader;
