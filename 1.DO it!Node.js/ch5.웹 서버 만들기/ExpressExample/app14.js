//Express 기본 모듈 불러오기
const express = require("express"),
  http = require("http"),
  path = require("path");

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

//라우터 객체 참조
const router = express.Router();

//라우터 함수 등록
router.route("/process/mymemo").post(function (req, res) {
  console.log("process/mymemo 처리함.");

  const paramName = req.body.name || req.query.name;
  const paramDay = req.body.day || req.query.day;
  const paramDaily = req.body.daily || req.query.daily;

  res.writeHead("200", { "Content-Type": "text/html; charset=utf8" });
  res.write("<h1>나의 메모</h1>");
  res.write("<div><p>작성자:" + paramName + "</p></div>");
  res.write("<div><p>작성 날짜:" + paramDay + "</p></div>");
  res.write("<div><p>내용:" + paramDaily + "</p></div>");
  res.write("<div>메모가 저장 되었습니다.</div>");
  res.write("<br><br><a href='/mymemo.html'>다시 작성</a>");
  res.end();
});

//라우터 객체를 app객체에 등록
app.use("/", router);

http.createServer(app).listen(3000, function () {
  console.log("Express서버가 3000번 포트에서 시작됨.");
});
