/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const LinkedList = require("../LinkedList/LinkedList")

/* eslint-disable no-undef */
const LanguageService = {
  getUsersLanguage(db, user_id) {
    return db
      .from('language')
      .select(
        'language.id',
        'language.name',
        'language.user_id',
        'language.head',
        'language.total_score',
      )
      .where('language.user_id', user_id)
      .first()
  },

  getLanguageWords(db, language_id) {
    return db
      .from('word')
      .select(
        'id',
        'language_id',
        'original',
        'translation',
        'next',
        'memory_value',
        'correct_count',
        'incorrect_count',
      )
      .where({ language_id })
  },
  getNext(db, id){
    return db
      .from('word')
      .select(
        'id',
        'language_id',
        'original',
        'translation',
        'next',
        'memory_value',
        'correct_count',
        'incorrect_count',
      )
      .where({id})
      .first()
  },

  createLinkedList(db, list){

    const LL =new LinkedList();

    list.map(item=> {
      LL.insertLast(item)
    })
    return LL;
  },

  updateWords(db, updateWords, language_id, total_score){
    return db.transaction(async trx=>{
      return Promise.all([
        trx('language')
        .where({id : language_id})
        .update({total_score : total_score,
        head: updateWords[0].id}),
        ...updateWords.map((word, i) => {
          if(i +1 >= updateWords.length){
            word.next = null;
          }
          else{
            word.next = updateWords[i+1].id;
          }
          return trx('word')
                .where({id : word.id})
                .update({...word})
        })
      ])
    })
  }
}

module.exports = LanguageService
