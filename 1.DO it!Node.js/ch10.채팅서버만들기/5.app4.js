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

//socket.io 모듈 불러들이기
const socketio = require("socket.io");

//cors 사용 - 클라이언트에서 ajax로 요청하면 CORS 지원
const cors = require("cors");

//모듈화한 파일들
const config = require("./2.config");
const database_loader = require("./database/2.database");
const route_loader = require("./routes/route_loader");

//익스프레스 객체 생성
const app = express();

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

//cors 미들웨어로 사용하도록 등록
app.use(cors());

//라우팅 정보를 읽어 들여 라우팅 설정
const router = express.Router();
route_loader.init(app, router);

const configPassport = require("./config/passport");
configPassport(app, passport);

const userPassport = require("./routes/user_passport");
userPassport(app, passport);

//====== 404 오류 페이지 처리 ======//
const errorHandler = expressErrorHandler({
  static: {
    "404": "./public/404.html",
  },
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

//==== 시작된 서버 객체를 반환받습니다. ====//
const server = http.createServer(app).listen(app.get("port"), function () {
  console.log("서버가 시작되었습니다. 포트:" + app.get("port"));

  //데이터베이스 연결
  database_loader.init(app, config);
});

//socket.io 서버를 시작합니다.

//로그인 아이디 매핑(로그인ID -> 소켓ID)
let login_ids = {};

const io = socketio.listen(server);
//클라이언트가 연결했을 때의 이벤트 처리
io.sockets.on("connection", function (socket) {
  console.log("connection info: ", socket.request.connection._peername);

  //소켓 객체에 클라이언트 Host, Port 정보 속성으로 추가
  socket.remoteAddress = socket.request.connection._peername.address;
  socket.remotePort = socket.request.connection._peername.port;

  //'login'이벤트를 받았을 때의 처리
  socket.on("login", function (login) {
    console.log("login 이벤트를 받았습니다.");
    console.dir(login);

    //기존 클라이언트 ID가 없으면 클라이언트 ID를 맵에 추가
    console.log("접속한 소켓의 ID : " + socket.id);
    login_ids[login.id] = socket.id;
    socket.login_id = login.id;

    console.log(
      "접속한 클라이언트 ID 개수 : %d",
      Object.keys(login_ids).length
    );

    //응답 메시지 전송
    sendResponse(socket, "login", "200", "로그인되었습니다.");
  });

  socket.on("room", function (room) {
    console.log("room 이벤트를 받았습니다");
    console.dir(room);

    if (room.command === "create") {
      if (io.sockets.adapter.rooms[room.roomId]) {
        //방이 이미 만들어져 있는 경우
        console.log("방이 이미 만들어져 있습니다.");
      } else {
        console.log("방을 새로 만듭니다.");

        socket.join(room.roomId);

        let curRoom = io.sockets.adapter.rooms[room.roomId];
        curRoom.id = room.roomId;
        curRoom.name = room.roomName;
        curRoom.owner = room.roomOwner;
      }
    } else if (room.command === "update") {
      let curRoom = io.sockets.adapter.rooms[room.roomId];
      curRoom.id = room.roomId;
      curRoom.name = room.roomName;
      curRoom.owner = room.roomOwner;
    } else if (room.command === "delete") {
      socket.leave(room.roomId);

      if (io.sockets.adapter.rooms[room.roomId]) {
        //방이 만들어져 있는 경우
        delete io.sockets.adapter.rooms[room.roomId];
      } else {
        //방이 만들어져 있지 않은 경우
        console.log("방이 만들어져 있지 않습니다.");
      }
    }
    let roomList = getRoomList();
    let output = { command: "list", rooms: roomList };
    console.log("클라이언트로 보낼 데이터 : " + JSON.stringify(output));

    io.sockets.emit("room", output);
  });

  //'massage'이벤트를 받았을 때의 처리
  socket.on("message", function (message) {
    console.log("message 이벤트를 받았습니다.");
    console.dir(message);

    if (message.recepient == "ALL") {
      //나를 포함한 모든 클라이언트에게 메시지 전달
      console.dir(
        "나를 포함한 모든 클라이언트에게 message 이벤트를 전송합니다."
      );
      io.sockets.emit("message", message);
    } else {
      //일대일 채팅 대상에게 메시지 전달
      if (login_ids[message.recepient]) {
        io.sockets.connected[login_ids[message.recepient]].emit(
          "message",
          message
        );

        //응답 메시지 전송
        sendResponse(socket, "message", "200", "메시지를 전송했습니다.");
      } else {
        //응답 메시지 전송
        sendResponse(
          socket,
          "login",
          "404",
          "상대방의 로그인ID를 찾을 수 없습니다."
        );
      }
    }
  });
});

console.log("socket.io 요청을 받아들일 준비가 되었습니다.");

function getRoomList() {
  console.dir(io.sockets.adapter.rooms);

  let roomList = [];

  Object.keys(io.sockets.adapter.rooms).forEach(function (roomId) {
    //각각의 방에 대한 처리
    console.log("current room id : " + roomId);
    let outRoom = io.sockets.adapter.rooms[roomId];

    //find default room using all attributes
    let foundDefault = false;
    let index = 0;
    Object.keys(outRoom.sockets).forEach(function (key) {
      console.log("#" + index + " : " + key + ", " + outRoom.sockets[key]);

      if (roomId == key) {
        //default room
        foundDefault = true;
        console.log("this is default room.");
      }
      index++;
    });
    if (!foundDefault) {
      roomList.push(outRoom);
    }
  });

  console.log("[ROOM LIST");
  console.dir(roomList);

  return roomList;
}

// 응답 메시지 전송 메소드
function sendResponse(socket, command, code, message) {
  let statusObj = { command: command, code: code, message: message };
  socket.emit("response", statusObj);
}
