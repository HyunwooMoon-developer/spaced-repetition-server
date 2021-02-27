/* eslint-disable no-undef */
const express = require("express");
const LanguageService = require("./language-service");
const { requireAuth } = require("../middleware/jwt-auth");

const languageRouter = express.Router();
const jsonParser = express.json();

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
    const nextWord = await LanguageService.getNext(
      req.app.get("db"),
      req.language.id
    );
    /*"nextWord": "Testnextword",
    "wordCorrectCount": 222,
    "wordIncorrectCount": 333,
    "totalScore": 999*/
    res.json({
      nextWord: nextWord.original,
      totalScore: req.language.total_score,
      wordCorrectCount: nextWord.correct_count,
      wordIncorrectCount: nextWord.incorrect_count,
    });
    next();
  } catch (error) {
    next(error);
  }
});

languageRouter.post("/guess", jsonParser, async (req, res, next) => {
  const { guess } = req.body;
  if (!guess) {
    res.status(400).json({
      error: `Missing 'guess' in request body`,
    });
  }
  try {
    const words = await LanguageService.getLanguageWords(
      req.app.get("db"),
      req.language.id
    );

    const language = await LanguageService.getUsersLanguage(
      req.app.get("db"),
      req.user.id
    );

    const wordList = await LanguageService.createLinkedList(
      req.app.get("db"),
      words
    );

    let isCorrect;
    let Head = wordList.head;
    let answer = wordList.head.value.translation;
    let nextWord = Head.next.value.original;
    let correct_count = Head.next.value.correct_count;
    let M = Head.value.memory_value;

    if (guess === wordList.head.value.translation) {
      isCorrect = true;
      language.total_score += 1;
      Head.value.correct_count += 1;
      M *= 2;
      Head.value.memory_value = M;
      wordList.head = Head.next;
      wordList.insertAt(Head.value, M);
    } else {
      isCorrect = false;
      wordList.head.value.incorrect_count += 1;
      Head.value.memory_value = 1;
      wordList.head = Head.next;
      wordList.insertAt(Head.value, M);
    }

    let Nodes = [];
    let currentNode = wordList.head;
    while (currentNode.next !== null) {
      Nodes = [...Nodes, currentNode.value];
      currentNode = currentNode.next;
    }
    Nodes = [...Nodes, currentNode.value];

    await LanguageService.updateWords(
      req.app.get("db"),
      Nodes,
      language.id,
      language.total_score
    );

    res.json({
      answer: answer,
      isCorrect: isCorrect,
      nextWord: nextWord,
      totalScore: language.total_score,
      wordCorrectCount: correct_count,
      wordIncorrectCount: wordList.head.value.incorrect_count,
    });
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = languageRouter;
