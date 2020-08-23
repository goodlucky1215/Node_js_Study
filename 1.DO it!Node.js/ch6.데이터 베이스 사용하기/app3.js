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

// mongoose 모듈 불러들이기
const mongoose = require("mongoose");

//데이터 베이스 객체를 위한 변수 선언
let database;

//데이터베이스 스키마 객체를 위한 변수 선언
let UserSchema;

//데이터베이스 모델 객체를 위한 변수 선언
let UserModel;

//데이터베이스에 연결
function connectDB() {
  //데이터베이스 연결 정보
  const databaseUrl = "mongodb://localhost:27017/local";

  //데이터베이스 연결
  console.log("데이터베이스 연결을 시도합니다.");
  mongoose.set("useUnifiedTopology", true);
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

    //스키마 정의
    UserSchema = mongoose.Schema({
      id: String,
      name: String,
      password: String,
    });
    console.log("UserSchema 정의함.");

    //UserModel 모델 정의
    UserModel = mongoose.model("users", UserSchema);
    console.log("UserModel 정의함.");
  });

  //연결 끊어졌을 때 5초 후 재연결
  database.on("disconnected", function () {
    console.log("연결이 끊어졌습니다. 5초 후 다시 연결합니다.");
    setInterval(connectDB, 5000);
  });
}

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

//라우터 객체 참조
const router = express.Router();

//사용자를 인증하는 함수
const authUser = function (database, id, password, callback) {
  console.log("authUser호출됨." + id + ", " + password);

  //아이디와 비밀번호를 사용해 검색
  UserModel.find({ id: id, password: password }, function (err, docs) {
    if (err) {
      callback(err, null);
      return;
    }

    console.log("아이디 [%s], 비밀번호 [%s]로 사용자 검색 결과", id, password);

    if (docs.length > 0) {
      console.log("일치하는 사용자 찾음", id, password);
      callback(null, docs);
    } else {
      console.log("일치하는 사용자를 찾지 못함.");
      callback(null, null);
    }
  });
};

//사용자를 추가하는 함수
const addUser = function (database, id, password, name, callback) {
  console.log("addUser 호출됨 : " + id + ", " + password);

  //UsersModel의 인스턴스 생성
  const user = new UserModel({ id: id, password: password, name: name });

  //save()로 저장
  user.save(function (err) {
    if (err) {
      callback(err, null);
      return;
    }

    console.log("사용자 데이터 추가");
    callback(null, user);
  });
};

//사용자 추가 라우팅 함수 - 클라이언트에서 보내온 데이터를 이용해 데이터베이스에 추가
router.route("/process/adduser").post(function (req, res) {
  console.log("/process/adduser 호출됨");

  const paramId = req.body.id || req.query.id;
  const paramPassword = req.body.password || req.query.password;
  const paramName = req.body.name || req.query.name;

  console.log(
    "요청 파라미터:" + paramId + ", " + paramPassword + ", " + paramName
  );

  //데이터베이스 객체가 초기화 된 경우, addUser 함수 호출하여 사용자 추가
  if (database) {
    addUser(database, paramId, paramPassword, paramName, function (
      err,
      result
    ) {
      if (err) {
        console.log("왜 안돼지");
      }

      //결과 객체 확인하여 추가된 데이터 있으면 성공 응답 전송
      if (result) {
        console.dir(result);

        res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
        res.write("<h2>사용자 추가 성공</h2>");
        res.write("<br><br><a href='/login.html'>로그인하기</a>");
        res.end();
      } else {
        //결과 객체가 없으면 실패 응답 전송
        console.log("실패 하였습니다");
        res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
        res.write("<h2>사용자 추가 실패</h2>");
        res.end();
      }
    });
  } else {
    //데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
    res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
    res.write("<h2>데이터 베이스 연결 실패</h2>");
    res.end();
  }
});
//로그인 라우팅 함수 - 데이터베이스의 정보와 비교
router.route("/process/login").post(function (req, res) {
  console.log("/process/login 호출됨.");

  const paramId = req.body.id || req.query.id;
  const paramPassword = req.body.password || req.query.password;
  console.log("요청 파라미터:" + paramId + ", " + paramPassword);

  if (database) {
    authUser(database, paramId, paramPassword, function (err, docs) {
      if (err) {
        throw err;
      }

      if (docs) {
        console.dir(docs);
        const username = docs[0].name;
        res.writeHead("200", { "Content-Type": "text/html; charset=utf8" });
        res.write("<h1>로그인 성공</h1>");
        res.write("<div><p>사용자 아이디:" + paramId + "</p></div>");
        res.write("<div><p>사용자 이름:" + username + "</p></div>");
        res.write("<br><br><a href='/login.html'>다시 로그인하기</a>");
        res.end();
      } else {
        res.writeHead("200", { "Content-Type": "text/html; charset=utf8" });
        res.write("<h1>로그인 실패</h1>");
        res.write("<div><p>아이디와 비밀번호를 다시 확인 하십시오.</p></div>");
        res.write("<br><br><a href='/login.html'>다시 로그인하기</a>");
        res.end();
      }
    });
  } else {
    res.writeHead("200", { "Content-Type": "text/html; charset=utf8" });
    res.write("<h1>데이터 베이스 연결 실패</h1>");
    res.write("<div><p>데이터베이스 연결하지 못했습니다</p></div>");
    res.end();
  }
});

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
