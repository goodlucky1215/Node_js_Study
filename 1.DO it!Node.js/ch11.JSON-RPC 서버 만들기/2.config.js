//1.app.js랑 3.app.js 둘이 같이 공유해서 쓰는 거임.
module.exports = {
  server_port: 3000,
  db_url: "mongodb://localhost:27017/local",
  jsonrpc_api_path: "/api",
  db_schemas: [
    {
      file: "./1.user_schema",
      collection: "users5",
      schemaName: "UserSchema",
      modelName: "UserModel",
    },
  ],
  route_info: [],
};
