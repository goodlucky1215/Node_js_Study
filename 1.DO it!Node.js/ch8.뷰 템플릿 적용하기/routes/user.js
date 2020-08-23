const { write } = require("fs");

//데이터 베이스 객체를 위한 변수 선언
let database;

//데이터베이스 스키마 객체를 위한 변수 선언
let UserSchema;

//데이터베이스 모델 객체를 위한 변수 선언
let UserModel;

//데이터 베이스 객체, 스키마 객체, 모델 객체를 이 모듈에서 사용할 수 있도록 전달함.
const init = function (db, schema, model) {
  console.log("init 호출됨.");

  database = db;
  UserSchema = schema;
  UserModel = model;
};

const login = function (req, res) {
  console.log("user(user2.js) 모듈 안에 있는 login 호출됨.");

  const paramId = req.body.id || req.query.id;
  const paramPassword = req.body.password || req.query.password;
  console.log("요청 파라미터:" + paramId + ", " + paramPassword);

  // 데이터 베이스 객체 참조
  const database = req.app.get("database");

  //데이터베이스 객체가 초기화 된 경우, authuser 함수 호출하여 사용자 인증
  if (database.db) {
    authUser(database, paramId, paramPassword, function (err, docs) {
      if (err) {
        throw err;
      }

      if (docs) {
        console.dir(docs);
        const username = docs[0].name;

        //뷰 템플릿을 사용하여 렌더링한 후 전송
        let context = { userid: paramId, username: username };
        req.app.render("login_success", context, function (err, html) {
          if (err) {
            console.error("뷰 렌더링 중 오류 발생: " + err.stack);

            res.writeHead("200", { "Content-Type": "text/html; charset=utf8" });
            res.write("<h1>뷰 렌더링 중 오류 발생</h1>");
            res.write("<p>" + err.stack + "</p>");
            res.end();

            return;
          }
          console.log("redered: " + html);

          res.end(html);
        });
      } else {
        res.writeHead("200", { "Content-Type": "text/html; charset=utf8" });
        res.write("<h1>데이터 베이스 연결 실패</h1>");
        res.write("<div><p>데이터베이스 연결하지 못했습니다</p></div>");
        res.end();
      }
    });
  }
};

const adduser = function (req, res) {
  console.log("/process/adduser 호출됨");

  const paramId = req.body.id || req.query.id;
  const paramPassword = req.body.password || req.query.password;
  const paramName = req.body.name || req.query.name;

  console.log(
    "요청 파라미터:" + paramId + ", " + paramPassword + ", " + paramName
  );

  //데이터베이스 객체가 초기화 된 경우, addUser 함수 호출하여 사용자 추가
  const database = req.app.get("database");

  if (database) {
    addUser(database, paramId, paramPassword, paramName, function (
      err,
      result
    ) {
      res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
      //뷰 템플릿으로 렌더링한 후 전송
      const context = { title: "사용자 추가 성공" };
      req.app.render("adduser", context, function (err, html) {
        if (err) {
          //결과 객체가 없으면 실패 응답 전송
          console.log("뷰 렌더링 중 오류 발생: " + err.stack);
          res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
          res.write("<h2>뷰 렌더링 중 오류 발생/h2>");
          res.write("<p>" + err.stack + "</p>");
          res.end();

          return;
        }
        console.log("rendered: " + html);

        res.end(html);
      });
    });
  } else {
    //데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
    res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
    res.write("<h2>데이터 베이스 연결 실패</h2>");
    res.end();
  }
};

const listuser = function (req, res) {
  console.log("user(user2.js) 모듈 안에 있는 listuser 호출됨.");

  //데이터베이스 객체 참조
  const database = req.app.get("database");

  //데이터베이스 객체가 초기화된 경우, 모델 객체의 findAll 메소드 호출
  if (database.db) {
    //1. 모든 사용자 검색
    database.UserModel.find(function (err, results) {
      //오류가 발생했을 때 클라이언트로 오류 전송
      if (err) {
        console.log("에러");

        res.writeHead("200", { "Content-Type": "text/html;charset=utf-8" });
        res.write("<h2>사용자 리스트 조회 중 오류 발생</h2>");
        res.write("<p>" + err.stack + "</p>");
        res.end();

        return;
      }

      if (results) {
        // 결과 객체 있으면 리스트 전송
        console.dir(results);

        res.writeHead("200", { "Content-Type": "text/html;charset=utf-8" });

        //뷰 템블릿을 이용하여 렌더링한 후 전송
        let context = { results: results };
        req.app.render("listuser", context, function (err, html) {
          if (err) {
            throw err;
          }
          res.end(html);
        });
      } else {
        // 결과 객체가 없으면 실패 응답 전송
        res.writeHead("200", { "Content-Type": "text/html;charset=utf-8" });
        res.write("<h2>사용자 리스트 조회 실패</h2>");
        res.end();
      }
    });
  } else {
    //데이터베이스 객체가 초기화되지 않았을 때 실패 응답 전송
    res.writeHead("200", { "Content-Type": "text/html;charset=utf-8" });
    res.write("<h2>데이터베이스 연결 실패</h2>");
    res.end();
  }
};

//사용자를 인증하는 함수
const authUser = function (db, id, password, callback) {
  console.log("authUser호출됨.");

  //1. 아이디를 사용해 검색
  db.UserModel.findById(id, function (err, results) {
    if (err) {
      callback(err, null);
      return;
    }

    if (results.length > 0) {
      console.log("아이디 일치하는 사용자 찾음");

      //2. 비밀번호 확인
      let user = new db.UserModel({ id: id });
      let authenticated = user.authenticate(
        password,
        results[0]._doc.salt,
        results[0]._doc.hashed_password
      );

      if (authenticated) {
        console.log("비밀번호 일치함.");
        callback(null, results);
      } else {
        console.log("비밀번호 일치하지 않음");
        callback(null, null);
      }
    } else {
      console.log("아이디와 일치하는 사용자를 찾지 못함.");
      callback(null, null);
    }
  });
};

//사용자를 추가하는 함수
const addUser = function (database, id, password, name, callback) {
  console.log("addUser 호출됨 : " + id + ", " + password);

  //UsersModel의 인스턴스 생성
  let user = new database.UserModel({ id: id, password: password, name: name });

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

module.exports.init = init;
module.exports.login = login;
module.exports.adduser = adduser;
module.exports.listuser = listuser;
