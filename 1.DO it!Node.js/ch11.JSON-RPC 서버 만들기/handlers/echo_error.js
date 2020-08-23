//echo 오류 테스트 함수
const echo_error = function (parmas, callback) {
  console.log("JSON_RPC echo_error 호출됨.");
  console.dir(parmas);

  //파라미터 체크
  if (parmas.length < 2) {
    //파라미터 개수 부족
    callback(
      {
        code: 400,
        message: "Insufficient parameters",
      },
      null
    );
    return;
  }
  const output = "Success";
  callback(null, output);
};

module.exports = echo_error;
