//1.app.js랑 3.app.js 둘이 같이 공유해서 쓰는 거임.
module.exports = {
  server_port: 3000,
  db_url: "mongodb://localhost:27017/local",

  db_schemas: [
    {
      file: "./1.user_schema",
      collection: "users6",
      schemaName: "UserSchema",
      modelName: "UserModel",
    },
    {
      file: "./coffeeshop_schema",
      collection: "coffeeshop",
      schemaName: "CoffeeShopSchema",
      modelName: "CoffeeShopModel",
    },
  ],
  route_info: [
    //===== CoffeeShop =====//
    {
      file: "./coffeeshop",
      path: "/process/addcoffeeshop",
      method: "add",
      type: "post",
    },
    {
      file: "./coffeeshop",
      path: "/process/listcoffeeshop",
      method: "list",
      type: "post",
    },
    {
      file: "./coffeeshop",
      path: "/process/nearcoffeeshop",
      method: "findNear",
      type: "post",
    },
    {
      file: "./coffeeshop",
      path: "/process/withincoffeeshop",
      method: "findWithin",
      type: "post",
    },
    {
      file: "./coffeeshop",
      path: "/process/circlecoffeeshop",
      method: "findCircle",
      type: "post",
    },
    {
      file: "./coffeeshop",
      path: "/process/nearcoffeeshop2",
      method: "findNear2",
      type: "post",
    },
    {
      file: "./coffeeshop",
      path: "/process/withincoffeeshop2",
      method: "findWithin2",
      type: "post",
    },
  ],
};
