//ejs 뷰 템플릿을 사용

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

//Session 미들웨어 불러오기
const expressSession = require("express-session");

// = = = = passport 사용 = = = = //
const passport = require("passport");
const flash = require("connect-flash");

//모듈화한 파일들
const config = require("./2.config");
const database_loader = require("./database/2.database");
const route_loader = require("./routes/route_loader");

//jayson 모듈 사용을 위해 핸들러 호출
const handler_loader = require("./handlers/handler_loader");
//JSON_RPC 사용
const jayson = require("jayson");

const cors = require("cors");
//익스프레스 객체 생성
const app = express();

//뷰 엔진 설정
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
console.log("뷰 엔진이 ejs로 설정되었습니다.");

app.use(cors());
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

// = = = = passport 사용 설정 = = = = //
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//라우팅 정보를 읽어 들여 라우팅 설정
const router = express.Router();
route_loader.init(app, router);

const configPassport = require("./config/passport");
configPassport(app, passport);

const userPassport = require("./routes/user_passport");
userPassport(app, passport);

//===== jayson 미들웨어 사용 =====//

//JSON-RPC 핸들러 정보를 읽어 들여 핸들러 경로 설정
const jsonrpc_api_path = config.jsonrpc_api_path || "/api";
handler_loader.init(jayson, app, jsonrpc_api_path);
console.log(
  "JSON_RPC를 [" + jsonrpc_api_path + "] 패스에서 사용하도록 설정함."
);

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
  global.database = database_loader;
});
