const express = require("express");
const app = express();
const mongoose = require("mongoose");
const favicon = require("serve-favicon");
const User = require("./models/user");
const path = require("path");
const bodyParser = require("body-parser");
const uniqid = require("uniqid");
const nodemailer = require("nodemailer");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const arraySort = require("array-sort");
const sortArray = require("sort-array");
const axios = require("axios");
const request = require("request");
const fetch = require("node-fetch");
const questionsAsked = [];
const rn = require("random");
const ejslint = require("ejs-lint");
const expressLayouts = require("express-ejs-layouts");

// questions.init();
// console.log(arraySort([3, 4, 5, 1, 2, 8, 9, 6, 7, 10, 127391892, 1212112312, 2131213123, 4345233242]))

const defaultAvatarUrl =
  "https://usercontent.one/wp/adtpest.com/wp-content/uploads/2018/08/default-avatar.jpg";

// app.use(expressLayouts);
app.use(cookieParser());

const HOSTNAME = "0.0.0.0";
const PORT = process.env.PORT || 3000;
const URI =
  "mongodb+srv://BecomeTheRichestSite:Shabbar52@userinfologinsystem.fimrz.mongodb.net/Users?retryWrites=true&w=majority";

let SIGNED_IN = false;

app.set("view engine", "ejs");
app.use("/style", express.static("style"));
app.use("/img", express.static("img"));
app.use("/sounds", express.static("sound"));
app.use(favicon(path.join(__dirname, "img", "cash.jpg")));

var urlencodedParser = bodyParser.urlencoded({ extended: false });

mongoose
  .connect(URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, HOSTNAME, () =>
      console.log(`App running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.log("An error has occured during connection: ", err));

function signInValidationCookie(req, res, next) {
  let { cookies } = req;
  User.findOne({ id: cookies.id })
    .exec()
    .then((result) => {
      if (!result) return next();
      res.render("index", {
        personName: result.name,
        personAvatar: result.avatarUrl,
      });
      SIGNED_IN = true;
      return;
    })
    .catch((err) => {
      SIGNED_IN = false;
      console.log("An error occured while using the cookie, error: ");
      console.log(err);
      next();
    });
}

app.get("/", signInValidationCookie, (req, res) => {
  console.log("did not work");
  res.render("index", { personName: "", personAvatar: "" });
});

app.post("/", urlencodedParser, (req, res) => {
  if (req.body.id) {
    res.cookie("id", req.body.id);
  } else {
    console.log("That is not the right way");
  }
});

app.get("/sign_in", (req, res) => {
  if (SIGNED_IN) {
    res.redirect("/sign_out");
    return;
  } else {
    res.render("sign-in");
  }
});

app.post("/sign_in", urlencodedParser, (req, res) => {
  console.log(req.body.email);
  User.findOne({ email: req.body.email })
    .exec()
    .then((result) => {
      let passwordCheck = bcrypt.compare(
        req.body.password,
        result.password,
        (err, res) => {
          if (err) console.log(err);
        }
      );
      // SIGNED_IN = true;
      res.cookie("id", result.id, { maxAge: 90000000, overwrite: true });
      res.redirect("/");
      return;
    })
    .catch((err) => {
      if (err) {
        res.send("The email does not exist");
        console.log(err);
      }
    });
});

app.get("/sign_up", (req, res) => {
  if (SIGNED_IN) {
    res.redirect("/sign_out");
    return;
  } else {
    res.render("sign-up");
  }
});

app.post("/sign_up", urlencodedParser, async (req, res) => {
  let hashedPassword = "";

  try {
    hashedPassword = await bcrypt.hash(req.body.password, 10);
  } catch {
    res
      .status(500)
      .send("An Error has occurred during saving try again, in a few seconds");
    console.log(
      "An Error has occurred during saving try again, in a few seconds"
    );
  }

  let newId = uniqid();
  const newUser = new User({
    name: req.body.name,
    id: newId,
    email: req.body.email,
    password: hashedPassword,
    avatarUrl: req.body.avatarUrl || defaultAvatarUrl,
    profile: {
      coins: 0,
      streak: 0,
      level: 1,
      reqxp: 1,
      currentxp: 0,
      xpBooster: 1,
      permanentxpbooster: 0,
      moneyBooster: 1,
      boostersBought: 0,
    },
  });

  newUser.save((err) => {
    if (err) res.redirect("/sign_in"), console.log(err);
    else {
      // SIGNED_IN = true;
      // res.cookie('id', newId, {maxAge: 2628000000})
      res.redirect("/sign_in");
    }
  });

  // res.redirect('/')
});

app.get("/sign_out", (req, res) => {
  res.render("sign-out");
});

app.post("/sign_out", (req, res) => {
  SIGNED_IN = false;
  res.clearCookie("id");
  res.redirect("/");
});

function profileValidationCookie(req, res, next) {
  let { cookies } = req;
  User.findOne({ id: cookies.id })
    .exec()
    .then((result) => {
      if (!result) return next();
      res.render("profile", {
        personName: result.name,
        personAvatar: result.avatarUrl,
        personEmail: result.email,
        personCoins: result.profile.coins,
        personLevel: result.profile.level,
        personMoneyBooster: result.profile.moneyBooster,
        personXpBooster: result.profile.xpBooster,
        personStreak: result.profile.streak,
      });
      SIGNED_IN = true;
      return;
    })
    .catch((err) => {
      console.log("An error occured while using the cookie, error: ");
      console.log(err);
      next();
    });
}

app.get("/profile", profileValidationCookie, (req, res) => {
  // res.render("/profile")
  res.status(404).redirect("/");
});

function questionsValidationCookie(req, res, next) {
  let { cookies } = req;
  User.findOne({ id: cookies.id })
    .exec()
    .then((result) => {
      if (!result) return next();
      fetch(
        "https://opentdb.com/api.php?amount=50&category=9&difficulty=easy&type=multiple"
      )
        .then((res) => {
          return res.json();
        })
        .then((loadedQuestions) => {
          questions = loadedQuestions.results;
          let generatedQuestion;

          let randomizer = rn.int(0, loadedQuestions.results.length);

          let rightAnswerIndex;

          let shuffledChoices = [];

          let copyArray = loadedQuestions.results[randomizer].incorrect_answers;
          // console.log(copyArray)
          copyArray.push(loadedQuestions.results[randomizer].correct_answer);

          // console.log('copyArray: ',copyArray)
          for (i = 0; i < 4; i++) {
            let randomize = Math.floor(Math.random() * copyArray.length);
            shuffledChoices.push(copyArray[randomize]);
            copyArray.splice(randomize, 1);
          }

          for (i = 0; i < 4; i++) {
            if (
              shuffledChoices[i] ===
              loadedQuestions.results[randomizer].correct_answer
            ) {
              rightAnswerIndex = i;
            }
          }

          // console.log(shuffledChoice)

          generatedQuestion = {
            q: loadedQuestions.results[randomizer].question,
            rightAnswer: rightAnswerIndex,
            choices: shuffledChoices,
          };

          let uniqIdForQuestion = uniqid();

          res.render("questions", {
            question: generatedQuestion.q,
            choice1: generatedQuestion.choices[0],
            choice2: generatedQuestion.choices[1],
            choice3: generatedQuestion.choices[2],
            choice4: generatedQuestion.choices[3],
            personName: result.name,
            personAvatar: result.avatarUrl,
            questionId: uniqIdForQuestion,
            whoAsked: result.id,
            rightAnserNumber: rightAnswerIndex,
          });

          questionsAsked.push({
            question: generatedQuestion.q,
            choice1: generatedQuestion.choices[0],
            choice2: generatedQuestion.choices[1],
            choice3: generatedQuestion.choices[2],
            choice4: generatedQuestion.choices[3],
            personName: result.name,
            personAvatar: result.avatarUrl,
            questionId: uniqIdForQuestion,
            whoAsked: result.id,
            rightAnswerNumber: rightAnswerIndex,
          });

          console.log(questionsAsked);

          SIGNED_IN = true;
          // question = generatedQuestion;
          // console.log(generatedQuestion)
          // genQuestion(generatedQuestion);
        })
        .catch((err) => {
          console.log(err);
        });
      return;
    })
    .catch((err) => {
      console.log("An error occured while using the cookie, error: ");
      console.log(err);
      next();
    });
}

app.get("/start", questionsValidationCookie, (req, res) => {
  res.status(404).redirect("/");
});

app.post("/play", urlencodedParser, (req, res) => {
  for (i = 0; i < questionsAsked.length; i++) {
    if (
      questionsAsked[i].whoAsked === req.cookies.id &&
      req.body.questionId == questionsAsked[i].questionId
    ) {
      let choices = ["choice1", "choice2", "choice3", "choice4"];
      if (req.body.answer === choices[questionsAsked[i].rightAnswerNumber]) {
        User.findOne({ id: questionsAsked[i].whoAsked })
          .then((result) => {
            let leveledUp = false;
            let coins = result.profile.coins;
            let level = result.profile.level;
            let reqXp = result.profile.reqxp;
            let currentxp = result.profile.currentxp;
            let streak = result.profile.streak;

            streak++;

            let moneyEarned = Math.round(
              75 * result.profile.moneyBooster * Math.round(level / 1.5) +
                streak * Math.floor(Math.random() * 10)
            );

            let random = [20, 21, 22, 23, 24, 25];

            let xpEarned =
              level *
                random[Math.floor(Math.random() * 7)] *
                (result.profile.xpBooster + result.profile.permanentxpbooster) +
              streak * Math.floor(Math.random() * 10);

            coins += moneyEarned;
            currentxp += xpEarned;

            console.log(moneyEarned, xpEarned, level);

            while (currentxp >= reqXp) {
              leveledUp = true;
              level++;
              currentxp = currentxp - reqXp;
              reqXp = level * (level * 20);
            }
            if (currentxp < 0) {
              currentxp = -currentxp;
            } else if (currentxp === null) {
              currentxp = 0;
            } else if (currentxp === NaN) {
              currentxp = 0;
            }

            res.render("answer-given", {
              answerStatus: true,
              leveledUp: leveledUp,
              level: level,
              moneyEarned: moneyEarned,
              avatarUrl: result.avatarUrl,
            });

            User.updateOne(
              { id: result.id },
              {
                $set: {
                  profile: {
                    coins: coins,
                    streak: streak,
                    level: level,
                    reqxp: reqXp,
                    currentxp: currentxp,
                    xpBooster: result.profile.xpBooster,
                    permanentxpbooster: result.profile.permanentxpbooster,
                    moneyBooster: result.profile.moneyBooster,
                    boostersBought: result.profile.boostersBought,
                  },
                },
              }
            )
              .then((result) => {
                console.log("Updated");
              })
              .catch((err) => {
                console.log(err);
              });
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        User.findOne()
          .then((result) => {
            User.updateOne(
              { id: result.id },
              {
                $set: {
                  profile: {
                    coins: result.profile.coins,
                    streak: 0,
                    level: result.profile.level,
                    reqxp: result.profile.reqXp,
                    currentxp: result.profile.currentxp,
                    xpBooster: result.profile.xpBooster,
                    permanentxpbooster: result.profile.permanentxpbooster,
                    moneyBooster: result.profile.moneyBooster,
                    boostersBought: result.profile.boostersBought,
                  },
                },
              }
            )
              .then((result) => {
                res.render("answer-given", { answerStatus: false });
                console.log("updated");
              })
              .catch((err) => console.log(err));
          })
          .catch((err) => {
            console.log(err);
          });
      }
    }
  }
});

function shopValidation(req, res, next) {
  let { cookies } = req;
  User.findOne({ id: cookies.id })
    .exec()
    .then((result) => {
      if (!result) return next();
      res.render("shop", {
        personName: result.name,
        personAvatar: result.avatarUrl,
      });
      SIGNED_IN = true;
      return;
    })
    .catch((err) => {
      SIGNED_IN = false;
      console.log("An error occured while using the cookie, error: ");
      console.log(err);
      next();
    });
}

app.get("/shop", shopValidation, (req, res) => {
  res.render("shop");
});

app.post("/shop", urlencodedParser, (req, res) => {});
