//Express 기본 모듈 불러오기
const express = require("express"),
  http = require("http"),
  path = require("path"),
  expressErrorHandler = require("express-error-handler"),
  cookieParser = require("cookie-parser");

//Express 미들웨어 불러오기
const bodyParser = require("body-parser"),
  static = require("serve-static");

//익스프레스 객체 생성
const app = express();

//기본 속성 설정
app.set("port", process.env.PORT || 3000);

//body-parser를 사용해 application/x-www-form-urlencoded 파싱
app.use(bodyParser.urlencoded({ extended: false }));

//body-parser를 사용해 application/json 파싱
app.use(bodyParser.json());

app.use(static(path.join(__dirname, "public")));

app.use(cookieParser());
//라우터 객체 참조
const router = express.Router();

//라우터 함수 등록
router.route("/process/showCookie").get(function (req, res) {
  console.log("process/showCookie 호출됨.");

  res.send(req.cookies);
});

router.route("/process/setUserCookie").get(function (req, res) {
  console.log("process/setUserCookie 호출됨.");

  // 쿠키 설정
  res.cookie("user", {
    id: "miny",
    name: "소녀시대",
    authorized: true,
  });

  //redirect로 응답
  res.redirect("/process/showCookie");
});

//라우터 객체를 app객체에 등록
app.use("/", router);

//모든 라우터 처리 후, 404 오류 페이지 처리
const errorHandler = expressErrorHandler({
  static: {
    "404": "./ExpressExample/public/404.html",
  },
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

http.createServer(app).listen(3000, function () {
  console.log("Express서버가 3000번 포트에서 시작됨.");
});
