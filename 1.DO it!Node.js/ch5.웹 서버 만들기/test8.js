const http = require("http");

const opts = {
  host: "www.google.com", //구글 사이트는 포스트 메소드 요청을 받지 못해 결과적으로 에러가 뜨긴하나 과정을 보여주기 위해 만든 것임!
  port: 80,
  method: "POST",
  path: "/",
  headers: {},
};

let resData = "";
const req = http.request(opts, function (res) {
  //응답 처리
  res.on("data", function (chunk) {
    resData += chunk;
  });

  res.on("end", function () {
    console.log(resData);
  });
});

opts.headers["Content-Type"] = "application/x-www-form-urlencoded";
req.data = "q=actor";
opts.headers["Content-Length"] = req.data.length;

req.on("error", function (err) {
  console.log("오류 발생 :" + err.message);
});

//요청 전송
req.write(req.data);
req.end();
