/* eslint-disable no-undef */
const express = require("express");
const LanguageService = require("./language-service");
const { requireAuth } = require("../middleware/jwt-auth");

const languageRouter = express.Router();
const jsonBodyParser = express.json();

languageRouter.use(requireAuth).use(async (req, res, next) => {
  try {
    const language = await LanguageService.getUsersLanguage(
      req.app.get("db"),
      req.user.id
    );

    if (!language)
      return res.status(404).json({
        error: `You don't have any languages`,
      });

    req.language = language;
    next();
  } catch (error) {
    next(error);
  }
});

languageRouter.get("/", async (req, res, next) => {
  try {
    const words = await LanguageService.getLanguageWords(
      req.app.get("db"),
      req.language.id
    );

    res.json({
      language: req.language,
      words,
    });
    next();
  } catch (error) {
    next(error);
  }
});

languageRouter.get("/head", async (req, res, next) => {
  try {
    const word = await LanguageService.getLanguageHead(
      req.app.get("db"),
      req.language.id
    );

    res.json({
      nextWord: word.original,
      wordCorrectCount: word.correct_count,
      wordIncorrectCount: word.incorrect_count,
      totalScore: word.total_score,
    });
  } catch (error) {
    next(error);
  }
});

languageRouter.post("/guess", jsonBodyParser, async (req, res, next) => {
  try {
    const { guess } = req.body;

    if (!guess)
      return res.status(400).json({
        error: `Missing 'guess' in request body`,
      });

    const words = await LanguageService.getLanguageWords(
      req.app.get("db"),
      req.language.id
    );

    const LL = LanguageService.populateLinkedList(req.language, words);

    const Head = LL.head;
    const answer = Head.value.translation;

    let isCorrect;


    if (guess === answer) {
      isCorrect = true;

      LL.head.value.memory_value = Number(Head.value.memory_value) * 2;

      LL.head.value.correct_count = Number(LL.head.value.correct_count) + 1;

      LL.total_score = Number(LL.total_score) + 1;
    } else {
      isCorrect = false;

      LL.head.value.memory_value = 1;

      LL.head.value.incorrect_count = Number(LL.head.value.incorrect_count) + 1;
    }

    LL.shiftHeadBy(LL.head.value.memory_value);

    await LanguageService.persistLinkedList(req.app.get("db"), LL);

    res.json({
      nextWord: LL.head.value.original,
      wordCorrectCount: LL.head.value.correct_count,
      wordIncorrectCount: LL.head.value.incorrect_count,
      totalScore: LL.total_score,
      answer,
      isCorrect,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = languageRouter;
