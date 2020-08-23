const utils = require("../utils/utils");

let SchemaObj = {};

SchemaObj.createSchema = function (mongoose) {
  //글 스키마 정의
  const PostSchema = mongoose.Schema({
    title: { type: String, trim: true, default: "" }, //글 제목
    contents: { type: String, trim: true, default: "" }, //글 내용
    writer: { type: mongoose.Schema.ObjectId, ref: "users5" }, //글 쓴 사람
    tags: { type: [], default: "" },
    created_at: { type: Date, index: { unique: false }, default: Date.now },
    updated_at: { type: Date, index: { unique: false }, dafault: Date.now },
    comments: [
      {
        //댓글
        contents: { type: String, trim: true, default: "" }, //댓글 내용
        writer: { type: mongoose.Schema.ObjectId, ref: "users5" },
        created_at: { type: Date, default: Date.now },
      },
    ],
  });

  //필수 속성의 'required' validation
  PostSchema.path("title").required(true, "글 제목을 입력하셔야 합니다.");
  PostSchema.path("contents").required(true, "글 내용을 입력하셔야 합니다.");

  PostSchema.methods = {
    savePost: function (callback) {
      //글 저장
      const self = this;

      this.validate(function (err) {
        if (err) return callback(err);

        self.save(callback);
      });
    },

    addComment: function (user, comment, callback) {
      //댓글 추가
      this.comment.push({
        contents: comment.contents,
        writer: user._id,
      });
      this.save(callback);
    },

    removeComment: function (id, callback) {
      //댓글 삭제
      const index = utils.indexOf(this.comments, { id: id });

      if (~index) {
        this.comments.splice(index, 1);
      } else {
        return callback("ID [" + id + "]를 가진 댓글 객체를 찾을 수 없습니다.");
      }
      this.save(callback);
    },
  };

  PostSchema.statics = {
    //ID로 글 찾기
    load: function (id, callback) {
      this.findOne({ _id: id })
        .populate("writer", "name provider email")
        .populate("comments.writer")
        .exec(callback);
    },
    list: function (options, callback) {
      const criteria = options.criteria || {};

      this.find(criteria)
        .populate("writer", "name provider email")
        .sort({ created_at: -1 })
        .limit(Number(options.perPage))
        .skip(options.perPage * options.page)
        .exec(callback);
    },
  };
  console.log("PostSchema 정의함.");

  return PostSchema;
};

//module.exports에 PostSchema객체를 직접 할당
module.exports = SchemaObj;
