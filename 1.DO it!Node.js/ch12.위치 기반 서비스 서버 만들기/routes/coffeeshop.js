const { find } = require("lodash");

const addCoffeeShop = function (
  database,
  name,
  address,
  tel,
  longitude,
  latitude,
  callback
) {
  console.log("addCoffeeShop 호출됨.");

  //CoffeeShopModel 인스턴스 생성
  const coffeeshop = new database.CoffeeShopModel({
    name: name,
    address: address,
    tel: tel,
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
  });
  //save()로 저장
  coffeeshop.save(function (err) {
    if (err) {
      callback(err, null);
      return;
    }
    console.log("커피숍 데이터 추가함.");
    callback(null, coffeeshop);
  });
};

const list = function (req, res) {
  console.log("coffeeshop 모듈 안에 있는 list 호출됨.");

  //데이터베이스 객체 참조
  const database = req.app.get("database");

  //데이터베이스 객체가 초기화 된 경우
  if (database.db) {
    //1.모든 커피숍 검색
    database.CoffeeShopModel.findAll(function (err, results) {
      if (err) {
        console.error("커피숍 리스트 조회 중 오류 발생: " + err.stack);

        res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
        res.write("<h2>커피숍 리스트 조회 중 오류 발생</h2>");
        res.write("<p>" + err.stack + "<p>");
        res.end();
        return;
      }
      if (results) {
        console.dir(results);
        res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
        res.write("<h2>커피숍 리스트</h2>");
        res.write("<div><ul>");

        for (var i = 0; i < results.length; i++) {
          const curName = results[i]._doc.name;
          const curAddress = results[i]._doc.address;
          const curTel = results[i]._doc.tel;
          const curLongitude = results[i]._doc.geometry.coordinates[0];
          const curLatitude = results[i]._doc.geometry.coordinates[1];

          res.write(
            "    <li>#" +
              i +
              " : " +
              curName +
              ", " +
              curAddress +
              ", " +
              curTel +
              ", " +
              curLongitude +
              ", " +
              curLatitude +
              "</li>"
          );
        }
        res.write("</ul></div>");
        res.end();
      } else {
        res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
        res.write("<h2>데이터베이스 연결 실패</h2>");
        res.end();
      }
    });
  }
};

const add = function (req, res) {
  console.log("coffeeshop 모듈 안에 있는 add 호출됨.");

  const paramName = req.body.name || req.query.name;
  const paramAddress = req.body.address || req.query.address;
  const paramTel = req.body.tel || req.query.tel;
  const paramLongitude = req.body.longitude || req.query.longitude;
  const paramLatitude = req.body.latitude || req.query.latitude;

  console.log(
    "요청 파라미터 : " +
      paramName +
      ", " +
      paramAddress +
      ", " +
      paramTel +
      ", " +
      paramLongitude +
      ", " +
      paramLatitude
  );

  //데이터베이스 객체 참조
  const database = req.app.get("database");

  //데이터베이스 객체가 초기화 된 경우
  if (database.db) {
    addCoffeeShop(
      database,
      paramName,
      paramAddress,
      paramTel,
      paramLongitude,
      paramLatitude,
      function (err, result) {
        if (err) {
          console.error("커피숍 추가 중 오류 발생 : " + err.stack);
          res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
          res.write("<h2>커피숍 추가 중 오류 발생</h2>");
          res.write("<p>" + err.stack + "</p>");
          res.end();
          return;
        }
        if (result) {
          console.dir(result);
          res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
          res.write("<h2>커피숍 추가 성공</h2>");
          res.end();
        } else {
          res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
          res.write("<h2>커피숍 추가 실패</h2>");
          res.end();
        }
      }
    );
  } else {
    res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
    res.write("<h2>데이터 베이스 연결 실패</h2>");
    res.end();
  }
};

const findNear = function (req, res) {
  console.log("coffeeshop 모듈 안에 있는 findNear 호출됨.");

  const maxDistance = 1000;

  const paramLongitude = req.body.longitude || req.query.longitude;
  const paramLatitude = req.body.latitude || req.query.latitude;

  console.log("요청 파라미터 : " + paramLongitude + ", " + paramLatitude);

  //데이터베이스 객체 참조
  const database = req.app.get("database");

  //데이터베이스 객체가 초기화 된 경우
  if (database.db) {
    //1.가까운 커피숍 검색
    database.CoffeeShopModel.findNear(
      paramLongitude,
      paramLatitude,
      maxDistance,
      function (err, results) {
        if (err) {
          console.error("커피숍 검색 중 오류 발생 : " + err.stack);

          res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
          res.write("<h2>커피숍 검색 중 오류 발생</h2>");
          res.write("<p>" + err.stack + "</p>");
          res.end();

          return;
        }
        if (results) {
          console.dir(results);
          res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
          res.write("<h2>가까운 커피숍 찾기</h2>");
          res.write("<div><ul>");

          for (let i = 0; i < results.length; i++) {
            const curName = results[i]._doc.name;
            const curAddress = results[i]._doc.address;
            const curTel = results[i]._doc.tel;
            const curLongitude = results[i]._doc.geometry.coordinates[0];
            const curLatitude = results[i]._doc.geometry.coordinates[1];
            res.write(
              "    <li>#" +
                i +
                " : " +
                curName +
                ", " +
                curAddress +
                ", " +
                curTel +
                ", " +
                curLongitude +
                ", " +
                curLatitude +
                "</li>"
            );
          }
          res.write("</ul></div>");
          res.end();
        } else {
          res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
          res.write("<h2>데이터 베이스 연결 실패</h2>");
          res.end();
        }
      }
    );
  }
};

const findWithin = function (req, res) {
  console.log("coffeeshop 모듈 안에 있는 findWithin 호출됨.");

  const paramTopLeftLongitude =
    req.body.topleft_longitude || req.query.topleft_longitude;
  const paramTopLeftLatitude =
    req.body.topleft_latitude || req.query.topleft_latitude;
  const paramBottomRightLongtitude =
    req.body.bottomright_longitude || req.query.bottomright_longitude;
  const paramBottomRightLatitude =
    req.body.bottomright_latitude || req.query.bottomright_latitude;

  console.log(
    "요청 파라미터 : " +
      paramTopLeftLongitude +
      ", " +
      paramTopLeftLatitude +
      ", " +
      paramBottomRightLongtitude +
      ", " +
      paramBottomRightLatitude
  );

  //데이터베이스 객체 참조
  const database = req.app.get("database");

  //데이터베이스 객체가 초기화된 경우
  if (database.db) {
    //1.가까운 커피숍 검색
    database.CoffeeShopModel.findWithin(
      paramTopLeftLongitude,
      paramTopLeftLatitude,
      paramBottomRightLongtitude,
      paramBottomRightLatitude,
      function (err, results) {
        if (err) {
          console.log("커피숍 검색 중 오류 발생 : " + err.stack);

          res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
          res.write("<h2>커피숍 검색 중 오류 발생</h2>");
          res.write("<p>" + err.stack + "<p>");
          res.end();

          return;
        }
        if (results) {
          console.dir(results);
          res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
          res.write("<h2>가까운 커피숍 찾기</h2>");
          res.write("<div><ul>");

          for (let i = 0; i < results.length; i++) {
            const curName = results[i]._doc.name;
            const curAddress = results[i]._doc.address;
            const curTel = results[i]._doc.tel;
            const curLongitude = results[i]._doc.geometry.coordinates[0];
            const curLatitude = results[i]._doc.geometry.coordinates[1];
            res.write(
              "    <li>#" +
                i +
                " : " +
                curName +
                ", " +
                curAddress +
                ", " +
                curTel +
                ", " +
                curLongitude +
                ", " +
                curLatitude +
                "</li>"
            );
          }
          res.write("</ul></div>");
          res.end();
        } else {
          res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
          res.write("<h2>데이터 베이스 연결 실패</h2>");
          res.end();
        }
      }
    );
  } else {
    res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
    res.write("<h2>데이터베이스 연결 실패</h2>");
    res.end();
  }
};

const findCircle = function (req, res) {
  console.log("coffeeshop 모듈 안에 있는 findCircle 호출됨.");

  const paramCircleLongitude =
    req.body.center_longitude || req.query.center_longitude;
  const paramCircleLatitude =
    req.body.center_latitude || req.query.center_latitude;
  const paramRadius = req.body.radius || req.query.radius;

  console.log(
    "요청 파라미터 : " +
      paramCircleLongitude +
      ", " +
      paramCircleLatitude +
      ", " +
      paramRadius
  );

  //데이터베이스 객체 참조
  const database = req.app.get("database");

  //데이터베이스 객체가 초기화된 경우
  if (database.db) {
    //1.가까운 커피숍 검색
    database.CoffeeShopModel.findCircle(
      paramCircleLongitude,
      paramCircleLatitude,
      paramRadius,
      function (err, results) {
        if (err) {
          console.log("커피숍 검색 중 오류 발생 : " + err.stack);

          res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
          res.write("<h2>커피숍 검색 중 오류 발생</h2>");
          res.write("<p>" + err.stack + "<p>");
          res.end();

          return;
        }
        if (results) {
          console.dir(results);
          res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
          res.write("<h2>가까운 커피숍 찾기</h2>");
          res.write("<div><ul>");

          for (let i = 0; i < results.length; i++) {
            const curName = results[i]._doc.name;
            const curAddress = results[i]._doc.address;
            const curTel = results[i]._doc.tel;
            const curLongitude = results[i]._doc.geometry.coordinates[0];
            const curLatitude = results[i]._doc.geometry.coordinates[1];
            res.write(
              "    <li>#" +
                i +
                " : " +
                curName +
                ", " +
                curAddress +
                ", " +
                curTel +
                ", " +
                curLongitude +
                ", " +
                curLatitude +
                "</li>"
            );
          }
          res.write("</ul></div>");
          res.end();
        } else {
          res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
          res.write("<h2>데이터 베이스 연결 실패</h2>");
          res.end();
        }
      }
    );
  } else {
    res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
    res.write("<h2>데이터베이스 연결 실패</h2>");
    res.end();
  }
};

const findNear2 = function (req, res) {
  console.log("coffeeshop 모듈 안에 있는 findNear2 호출됨.");

  const maxDistance = 1000;

  const paramLongitude = req.body.longitude || req.query.longitude;
  const paramLatitude = req.body.latitude || req.query.latitude;

  console.log("요청 파라미터 : " + paramLongitude + ", " + paramLatitude);

  //데이터베이스 객체 참조
  const database = req.app.get("database");

  //데이터베이스 객체가 초기화 된 경우
  if (database.db) {
    //1.가까운 커피숍 검색
    database.CoffeeShopModel.findNear(
      paramLongitude,
      paramLatitude,
      maxDistance,
      function (err, results) {
        if (err) {
          console.error("커피숍 검색 중 오류 발생 : " + err.stack);

          res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
          res.write("<h2>커피숍 검색 중 오류 발생</h2>");
          res.write("<p>" + err.stack + "</p>");
          res.end();

          return;
        }
        if (results) {
          console.dir(results);
          if (results.length > 0) {
            res.render("findnear.ejs", {
              result: results[0]._doc,
              paramLatitude: paramLatitude,
              paramLongitude: paramLongitude,
            });
          } else {
            res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
            res.write("<h2>가까운 커피숍 데이터가 없습니다.</h2>");
            res.end();
          }
        } else {
          res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
          res.write("<h2>가까운 커피숍 조회 실패</h2>");
          res.end();
        }
      }
    );
  } else {
    res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
    res.write("<h2>데이터 베이스 연결 실패</h2>");
    res.end();
  }
};

const findWithin2 = function (req, res) {
  console.log("coffeeshop 모듈 안에 있는 findWithin2 호출됨.");

  const paramLongitude = req.body.longitude || req.query.longitude;
  const paramLatitude = req.body.latitude || req.query.latitude;

  const paramTopLeftLongitude =
    req.body.topleft_longitude || req.query.topleft_longitude;
  const paramTopLeftLatitude =
    req.body.topleft_latitude || req.query.topleft_latitude;
  const paramBottomRightLongitude =
    req.body.bottomright_longitude || req.query.bottomright_longitude;
  const paramBottomRightLatitude =
    req.body.bottomright_latitude || req.query.bottomright_latitude;

  console.log(
    "요청 파라미터 : " +
      paramLongitude +
      ", " +
      paramLatitude +
      ", " +
      paramTopLeftLongitude +
      ", " +
      paramTopLeftLatitude +
      ", " +
      paramBottomRightLongitude +
      ", " +
      paramBottomRightLatitude
  );

  //데이터베이스 객체 참조
  const database = req.app.get("database");

  //데이터베이스 객체가 초기화된 경우
  if (database.db) {
    //1.가까운 커피숍 검색
    database.CoffeeShopModel.findWithin(
      paramTopLeftLongitude,
      paramTopLeftLatitude,
      paramBottomRightLongitude,
      paramBottomRightLatitude,
      function (err, results) {
        if (err) {
          console.log("커피숍 검색 중 오류 발생 : " + err.stack);

          res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
          res.write("<h2>커피숍 검색 중 오류 발생</h2>");
          res.write("<p>" + err.stack + "<p>");
          res.end();

          return;
        }
        if (results) {
          console.dir(results);
          if (results.length > 0) {
            res.render("findwithin.ejs", {
              result: results[0]._doc,
              paramLatitude: paramLatitude,
              paramLongitude: paramLongitude,
              paramTopLeftLongitude: paramTopLeftLongitude,
              paramTopLeftLatitude: paramTopLeftLatitude,
              paramBottomRightLongitude: paramBottomRightLongitude,
              paramBottomRightLatitude: paramBottomRightLatitude,
            });
          } else {
            res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
            res.write("<h2>영역 안에 커피숍 데이터가 없습니다.</h2>");
            res.end();
          }
        } else {
          res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
          res.write("<h2>영역 안의 커피숍 조회 실패</h2>");
          res.end();
        }
      }
    );
  } else {
    res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
    res.write("<h2>데이터베이스 연결 실패</h2>");
    res.end();
  }
};

module.exports.findWithin2 = findWithin2;
module.exports.findNear2 = findNear2;
module.exports.findCircle = findCircle;
module.exports.findWithin = findWithin;
module.exports.findNear = findNear;
module.exports.list = list;
module.exports.add = add;
