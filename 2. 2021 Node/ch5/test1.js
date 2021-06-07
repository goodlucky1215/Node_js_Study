let http = require('http');

//웹 서버 객체를 만든다.
let server = http.createServer();

// 웹 서버는 3002 포트에서 대기
let port = 3002;
let host = 'localhost';
server.listen(port, host,'50000',function(){
  console.log('웹 서버 시작',host,":",port);
});

//클라이언트 접속 - addr.address는 사용자으 IP, addr.port는 사용자에게 주는 임의의 포트겠지
server.on('connection',function(socket){
  let addr = socket.address();
  console.log(addr.address,":",addr.port);
});

//클라이언트의 요청 처리
server.on('request',function(req,res){
  console.log('클라의 요청을 확인!');
  console.dir(req);
  
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.write("<!DOCTYPE html>");
  res.write("<html>");
  res.write("   <head>");
  res.write("       <title>응답페이지</title>");
  res.write("   </head>");
  res.write("   <body>");
  res.write("       <h1>노드제이에스로부터의 응답 페이지</h1>");
  res.write("   </body>");
  res.write("</html>");
  res.end();
});

//서버 종료 하기
server.on('close',function(){
  console.log("서버 끈다")
});