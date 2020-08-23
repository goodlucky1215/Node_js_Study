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

//모듈화한 파일들
const config = require("./2.config");
const database_loader = require("./database/2.database");
const route_loader = require("./routes/route_loader");

//Session 미들웨어 불러오기
const expressSession = require("express-session");

//익스프레스 객체 생성
const app = express();

// = = = = passport 사용 = = = = //
const passport = require("passport");
const flash = require("connect-flash");

//뷰 엔진 설정
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
console.log("뷰 엔진이 ejs로 설정되었습니다.");

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

const LocalStrategy = require("passport-local").Strategy;

// 패스포트 로그인 설정
passport.use(
  "local-login",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    function (req, email, password, done) {
      console.log("passport의 local-login 호출됨 :" + email + ", " + password);

      const database = app.get("database");
      database.UserModel.findOne({ email: email }, function (err, user) {
        if (err) {
          return done(err);
        }

        //등록된 사용자가 없는 경우
        if (!user) {
          console.log("계정이 일치하지 않음");
          return done(
            null,
            false,
            req.flash("loginMessage", "등록된 계정이 없습니다.")
          );
        }
        //비밀번호를 비교하여 맞지 않는 경우
        const authenicated = user.authenicate(
          password,
          user._doc.salt,
          user._doc.hashed_password
        );
        if (!authenicated) {
          console.log("비밀번호 일치하지 않음");
          return done(
            null,
            false,
            req.flash("loginMessage", "비밀번호가 일치하지 않습니다.")
          );
        }

        //정상인 경우
        console.log("계정과 비밀번호가 일치함.");
        return done(null, user);
      });
    }
  )
);

// 패스포트 회원가입 설정
passport.use(
  "local-signup",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    function (req, email, password, done) {
      //요청 파라미터 중 name 파라미터 확인
      var paramName = req.body.name || req.query.name;
      console.log(
        "passport의 local-signup 호출됨: " +
          email +
          ", " +
          password +
          ", " +
          paramName
      );

      //User.findOne이 blocking되므로 async 방식으로 변경할 수 도 있음
      const database = req.app.get("database");
      database.UserModel.findOne({ email: email }, function (err, user) {
        //오류가 발생하면
        if (err) {
          console.log("에러가 나요");
          return done(err);
        }

        //기존에 이메일이 있다면
        if (user) {
          console.log("기존에 계정이 있음.");
          return done(
            null,
            false,
            req.flash("signupMessage", "계정이 이미 있습니다.")
          );
        } else {
          //모델 인스턴스 객체 만들어 저장
          let user = new database.UserModel({
            email: email,
            password: password,
            name: paramName,
          });

          user.save(function (err) {
            if (err) {
              console.log("데이터베이스 저장시 에러.");
              return done(null, false, req.flash("signupMessage", "에러발생"));
            }
            console.log("사용자 데이터 추가함");
            return done(null, user);
          });
        }
      });
    }
  )
);

//사용자 인증에 성공했을 때 호출
passport.serializeUser(function (user, done) {
  console.log("serializedUser() 호출됨");
  console.dir(user);

  done(null, user);
});
//사용자 인증 이후 사용자 요청이 있을 때마다 호출
passport.deserializeUser(function (user, done) {
  console.log("deserializeUser() 호출됨");
  console.dir(user);

  done(null, user);
});

//라우팅 정보를 읽어 들여 라우팅 설정
const router = express.Router();
route_loader.init(app, router);

// 홈 화면 - index.ejs 템플릿으로 홈 화면이 보이도록 함
router.route("/").get(function (req, res) {
  console.log("/패스 요청됨.");
  res.render("index.ejs");
});

//로그인 폼 링크
router.route("/login").get(function (req, res) {
  console.log("/login 패스 요청됨.");
  res.render("login.ejs", { message: req.flash("loginMessage") });
});

router.route("/login").post(
  passport.authenticate("local-login", {
    successRedirect: "/profile",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

//회원가입 폼 링크
router.route("/signup").get(function (req, res) {
  console.log("/signup 패스 요청됨.");
  res.render("signup.ejs", { message: req.flash("signupMessage") });
});
router.route("/signup").post(
  passport.authenticate("local-signup", {
    successRedirect: "/profile",
    failureRedirect: "/signup",
    failureFlash: true,
  })
);

//로그아웃
router.route("/logout").get(function (req, res) {
  console.log("/logout 패스 요청됨");
  req.logout();
  res.redirect("/");
});

//프로필 화면 - 로그인 여부를 확인할 수 있도록 먼저 isLoggedIn 미들웨어 실행
router.route("/profile").get(function (req, res) {
  console.log("/profile 패스 요청됨.");

  //인증된 경우 req.user 객체에 사용자 정보 있으면, 인증이 안 된 경우 req.user는 fasle 값임
  console.log("req.user 객체의 값");
  console.dir(req.user);

  //인증이 안 된 경우
  if (!req.user) {
    console.log("사용자 인증이 안 된 상태임.");
    res.redirect("/");
    return;
  }

  //인증된 경우
  console.log("사용자 인증된 상태임.");
  if (Array.isArray(req.user)) {
    res.render("profile.ejs", { user: req.user[0]._doc });
  } else {
    res.render("profile.ejs", { user: req.user });
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

  //데이터베이스 연결
  database_loader.init(app, config);
});
