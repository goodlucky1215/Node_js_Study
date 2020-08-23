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

//모듈화한 파일들
const user = require("./routes/user");

const user_schema = require("./database/1.user_schema");

const config = require("./23.config");

const database_loader = require("./database/2.database");

const route_loader = require("./routes/route_loader");

//Session 미들웨어 불러오기
const expressSession = require("express-session");

//암호화 모듈
const crypto = require("crypto");

//익스프레스 객체 생성
const app = express();

//기본 속성 설정
console.log("config.server_port: %d", config.server_port);
app.set("port", config.server_port || 3000);

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

route_loader.init(app, express.Router());

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
  database_loader.init(app, config);
});
