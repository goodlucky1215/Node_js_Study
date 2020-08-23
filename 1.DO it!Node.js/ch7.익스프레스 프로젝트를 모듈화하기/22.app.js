//Express 기본 모듈 불러오기
const express = require("express"),
  http = require("http"),
  path = require("path");

//Express 미들웨어 불러오기
const bodyParser = require("body-parser"),
  cookieParser = require("cookie-parser"),
  static = require("serve-static");

//오류 핸들러 모듈 사용
const expressErrorHandler = require("express-error-handler");

const user = require("./routes/user");

//Session 미들웨어 불러오기
const expressSession = require("express-session");

// mongoose 모듈 불러들이기
const mongoose = require("mongoose");

//익스프레스 객체 생성
const app = express();

//기본 속성 설정
app.set("port", process.env.PORT || 3000);

//body-parser를 사용해 application/x-www-form-urlencoded 파싱
app.use(bodyParser.urlencoded({ extended: false }));

//body-parser를 사용해 application/json파싱
app.use(bodyParser.json());

//public 폴더를 static으로 오픈
app.use(static(path.join(__dirname, "public")));

//cookie-parser설정
app.use(cookieParser());

//세션 설정
app.use(
  expressSession({
    secret: "my key",
    resave: true,
    saveUninitialized: true,
  })
);

//데이터베이스에 연결
function connectDB() {
  //데이터베이스 연결 정보
  const databaseUrl = "mongodb://localhost:27017/local";

  //데이터베이스 연결
  console.log("데이터베이스 연결을 시도합니다.");
  mongoose.set("useCreateIndex", true);
  mongoose.Promise = global.Promise;
  mongoose.connect(databaseUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  database = mongoose.connection;

  database.on(
    "error",
    console.error.bind(console, "mongoose connection error.")
  );
  database.on("open", function () {
    console.log("데이터베이스에 연결되었습니다.:" + databaseUrl);
  });

  //user 스키마 및 모델 객체 생성
  createUserSchema();

  //연결 끊어졌을 때 5초 후 재연결
  database.on("disconnected", function () {
    console.log("연결이 끊어졌습니다. 5초 후 다시 연결합니다.");
    setInterval(connectDB, 5000);
  });

  app.set("database", database);
}

//user 스키마 및 모델 객체 생성
function createUserSchema() {
  //user_schema.js 모듈 불러오기
  UserSchema = require("./database/1.user_schema").createSchema(mongoose);

  //UserModel 모델 정의
  UserModel = mongoose.model("users3", UserSchema);
  console.log("UserModel 정의함.");

  //init 호출
  user.init(database, UserSchema, UserModel);
}

//라우터 객체 참조
const router = express.Router();

//사용자 리스트 함수
router.route("/process/listuser").post(user.listuser);
//사용자 추가 라우팅 함수 - 클라이언트에서 보내온 데이터를 이용해 데이터베이스에 추가
router.route("/process/adduser").post(user.adduser);
//로그인 라우팅 함수 - 데이터베이스의 정보와 비교
router.route("/process/login").post(user.login);

//라우터 객체 등록
app.use("/", router);

//====== 404 오류 페이지 처리 ======//
const errorHandler = expressErrorHandler({
  static: {
    "404": "./public/404.html",
  },
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

//==== 서버 시작 ====//
http.createServer(app).listen(app.get("port"), function () {
  console.log("서버가 시작되었습니다. 포트:" + app.get("port"));

  //데이터베이스 연결
  connectDB();
});
