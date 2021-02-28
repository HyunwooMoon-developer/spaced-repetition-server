/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const { LinkedList } = require("../LinkedList/LinkedList");

const LanguageService = {
  getUsersLanguage(db, user_id) {
    return db
      .from("language")
      .select(
        "language.id",
        "language.name",
        "language.user_id",
        "language.head",
        "language.total_score"
      )
      .where("language.user_id", user_id)
      .first();
  },

  getLanguageWords(db, language_id) {
    return db
      .from("word")
      .select(
        "id",
        "language_id",
        "original",
        "translation",
        "next",
        "memory_value",
        "correct_count",
        "incorrect_count"
      )
      .where({ language_id });
  },
  getLanguageHead(db, language_id) {
    return db
      .from("word")
      .select(
        "word.id",
        "word.language_id",
        "word.original",
        "word.translation",
        "word.next",
        "word.memory_value",
        "word.correct_count",
        "word.incorrect_count",
        "language.total_score"
      )
      .leftJoin("language", "language.head", "word.id")
      .where("language.id", language_id)
      .first();
  },

  populateLinkedList(language, list) {
    const LL = new LinkedList({
      id: language.id,
      name: language.name,
      total_score: language.total_score,
    });

    let words = list.find((word) => word.id === language.head);

    LL.insert({
      id: words.id,
      original: words.original,
      translation: words.translation,
      memory_value: words.memory_value,
      correct_count: words.correct_count,
      incorrect_count: words.incorrect_count,
    });

    while (words.next) {
      words = list.find((word) => word.id === words.next);

      LL.insert({
        id: words.id,
        original: words.original,
        translation: words.translation,
        memory_value: words.memory_value,
        correct_count: words.correct_count,
        incorrect_count: words.incorrect_count,
      });
    }

    return LL;
  },

  persistLinkedList(db, LL) {
    return db.transaction((trx) =>
      Promise.all([
        db("language").transacting(trx).where("id", LL.id).update({
          total_score: LL.total_score,
          head: LL.head.value.id,
        }),
        ...LL.map((node) =>
          db("word")
            .transacting(trx)
            .where("id", node.value.id)
            .update({
              memory_value: node.value.memory_value,
              correct_count: node.value.correct_count,
              incorrect_count: node.value.incorrect_count,
              next: node.next ? node.next.value.id : null,
            })
        ),
      ])
    );
  },
};

module.exports = LanguageService;
