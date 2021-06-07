//express모듈을 설정하면 간단한 코드로 웹 서버 기능 구현 가능
//특히 express에서 제공하는 미들웨어와 라우터의 사용이 그렇다.
//express는 http위에서 동작하므로 항상 http모듈도 따라와야한다.
let express = require('express')
 ,  http =require('http');

 //익스프레스 객체 생성
 //process.env.PORT 지정된 포트가 있으면 얘를 가져오고 없으면 3000포트를 가져온다는 얘기임.
let app = express();
//객체 안에 바로 포트를 setting을 해두자.
app.set('port',process.env.PORT||3000);

//Express로 서버 시작
http.createServer(app).listen(app.get('port'),function(){
  console.log('익스프레스 서버를 시작했습니다.'+app.get('port'));
})
