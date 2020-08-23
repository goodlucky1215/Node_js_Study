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

//====== MySQL 데이터베이스를 사용할 수 있는 mysql 모듈 불러오기 ======//
const mysql = require("mysql");

//====== MySQL 데이터베이스 연결 설정 ======//
const pool = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  password: "0000",
  database: "test",
  debug: false,
});

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
const authUser = function (id, password, callback) {
  console.log("authUser호출됨.");

  //커넥션 풀에서 연결 객체를 가져옵니다.
  pool.getConnection(function (err, conn) {
    if (err) {
      if (conn) {
        conn.release();
      }

      callback(err, null);
      return;
    }
    console.log("데이터베이스 연결 스레드 아이디: " + conn.threadId);

    const columns = ["id", "name", "age"];
    const tablename = "users";

    //SQL문을 실행합니다.
    const exec = conn.query(
      "select ?? from ?? where id = ? and password = ?",
      [columns, tablename, id, password],
      function (err, rows) {
        conn.release(); //반드시 해제해야함!!!
        console.log("실행 대상 SQL: " + exec.sql);

        if (rows.length > 0) {
          console.log(
            "아이디 [%s], 패스워드[%s] 일치하는 사용자 찾음.",
            id,
            password
          );

          callback(null, rows);
        } else {
          console.log("일치하는 사용자 찾지 못함.");

          callback(null, null);
        }
      }
    );
  });
};

//로그인 처리 함수
router.route("/process/login2").post(function (req, res) {
  console.log("/process/login2 호출됨.");

  const paramId = req.body.id || req.query.id;
  const paramPassword = req.body.password || req.query.password;
  console.log("요청 파라미터:" + paramId + ", " + paramPassword);

  //pool 객체가 초기화된 경우, authUser 함수 호출하여 사용자 인증
  if (pool) {
    authUser(paramId, paramPassword, function (err, rows) {
      if (err) {
        throw err;
      }

      if (rows) {
        console.dir(rows);
        console.log(rows[0].name);

        const username = rows[0].name;

        res.writeHead("200", { "Content-Type": "text/html; charset=utf8" });
        res.write("<h1>로그인 성공</h1>");
        res.write("<div><p>사용자 아이디:" + paramId + "</p></div>");
        res.write("<div><p>사용자 이름:" + username + "</p></div>");
        res.write("<br><br><a href='/login2.html'>다시 로그인하기</a>");
        res.end();
      } else {
        res.writeHead("200", { "Content-Type": "text/html; charset=utf8" });
        res.write("<h1>로그인 실패</h1>");
        res.write("<div><p>아이디와 비밀번호를 다시 확인 하십시오.</p></div>");
        res.write("<br><br><a href='/login2.html'>다시 로그인하기</a>");
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

//사용자를 등록하는 함수
const addUser = function (id, name, age, password, callback) {
  console.log("addUser호출됨.");

  //커넥션 풀에서 연결 객체를 가져옵니다.
  pool.getConnection(function (err, conn) {
    if (err) {
      if (conn) {
        conn.release();
      }

      callback(err, null);
      return;
    }
    console.log("데이터베이스 연결 스레드 아이디: " + conn.threadId);

    //데이터를 객체로 만듭니다.
    const data = { id: id, name: name, age: age, password: password };

    //SQL문을 실행합니다.
    const exec = conn.query("insert into users set ?", data, function (
      err,
      result
    ) {
      conn.release(); //반드시 해제해야함!!!
      console.log("실행 대상 SQL: " + exec.sql);

      if (err) {
        console.log("SQL실행시 오류가 발생.");
        console.dir(err);

        callback(err, null);

        return;
      }

      callback(null, result);
    });
  });
};

router.route("/process/adduser2").post(function (req, res) {
  console.log("/process/adduser2 호출됨.");

  const paramId = req.body.id || req.query.id;
  const paramPassword = req.body.password || req.query.password;
  const paramName = req.body.name || req.query.name;
  const paramAge = req.body.age || req.query.age;

  //pool 객체가 초기화 된 경우, addUser 함수 호출하여 사용자 추가
  if (pool) {
    addUser(paramId, paramName, paramAge, paramPassword, function (
      err,
      addedUser
    ) {
      //동일한 id로 추가할 때 오류 발생 - 클라이언트로 오류 전송
      if (err) {
        throw err;
      }

      //결과 객체 있으면 성공 응답 전송
      if (addedUser) {
        console.dir(addedUser);

        console.log("inserted" + addedUser.affectedRows + "rows");

        const insertId = addedUser.insertId;
        console.log("추가한 레코드 아이디: " + insertId);

        res.writeHead("200", { "Content-Type": "text/html; charset=utf8" });
        res.write("<h1>사용자 추가 성공</h1>");
        res.end();
      } else {
        res.writeHead("200", { "Content-Type": "text/html; charset=utf8" });
        res.write("<h1>사용자 추가 실패</h1>");
        res.end();
      }
    });
  } else {
    //데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
    res.writeHead("200", { "Content-Type": "text/html; charset=utf8" });
    res.write("<h1>데이터베이스 연결 실패</h1>");
    res.end();
  }
});

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
});
