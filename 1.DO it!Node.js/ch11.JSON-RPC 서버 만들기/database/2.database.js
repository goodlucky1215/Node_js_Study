const mongoose = require("mongoose");
const { userInfo } = require("os");

//database 객체에 db,schema,model 모두 추가
let database = {};

database.init = function (app, config) {
  console.log("init 호출됨");

  connect(app, config);
};

//데이터베이스에 연결하고 응답 객체의 속성으로 db 객체 추가
function connect(app, config) {
  console.log("connect 호출됨");
  mongoose.set("useCreateIndex", true);
  mongoose.Promise = global.Promise;
  mongoose.connect(config.db_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  database.db = mongoose.connection;

  database.db.on(
    "error",
    console.error.bind(console, "mongoose connection error.")
  );
  database.db.on("open", function () {
    console.log("데이터베이스에 연결되었습니다.");
  });

  createSchema(app, config);

  //연결 끊어졌을 때 5초 후 재연결
  database.db.on("disconnected", function () {
    console.log("연결이 끊어졌습니다. 5초 후 다시 연결합니다.");
    setInterval(connectDB, 5000);
  });
}

//config에 정의한 스키마 및 모델 객체 생성
function createSchema(app, config) {
  console.log("설정에 정의된 스키마의 수: %d", config.db_schemas.length);

  for (var i = 0; i < config.db_schemas.length; i++) {
    let curItem = config.db_schemas[i];

    //모듈 파일에서 모듈 불러온 후 createSchema( )함수 호출하기
    let curSchema = require(curItem.file).createSchema(mongoose);
    console.log("%s 모듈을 이용해 스키마 생성함.", curItem.file);

    //User 모델 정의
    let curModel = mongoose.model(curItem.collection, curSchema);
    console.log("%s 컬렉션을 위해 모델 정의함.", curItem.collection);

    // database 객체에 속성으로 추가
    database[curItem.schemaName] = curSchema;
    database[curItem.modelName] = curModel;
    console.log(
      "스키마 [%s], 모델 [%s] 생성함.",
      curItem.schemaName,
      curItem.modelName
    );
  }

  app.set("database", database);
}

//database 객체를 module.exports에 할당
module.exports = database;
