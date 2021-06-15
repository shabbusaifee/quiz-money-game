const fetch = require('node-fetch');
const rn = require('random');

let questions = [];
let question;

function genQuestion(data = 0){
    if (data !== 0){
        return data;
    }else{
        loadQuestion();
    }
}


function loadQuestion(){

let hi;
    function dataOutput(data){
        return data;
    }
}
// console.log(genQuestion())
// module.exports.init = init;
console.log(genQuestion(0))

module.exports.genQuestion = genQuestion;