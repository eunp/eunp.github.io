// Constants
// ------------------------
var ALERT = "<img src='alert.jpg' height='21' width='21' />";
var SUCCESS = "<img src='success.jpg' height='21' width='21' />";

// Timeout for call to name check API
var API_TIMEOUT = 1000;

// Username validity configuration
//
// Minimum username length
var MIN_LENGTH = 3;
var MIN_LEN_MSG = "Username must have at least " + MIN_LENGTH + " characters."
// Regular expression to test for valid username
var USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9]+$/;
var REGEX_MSG = "Username must start with a letter followed by letters or numers."

// Username suggestion configuration
//
// The PREFIX and SUFFIX will be added to username with numbers taken off
var PREFIX = ['A','Iam','The','ThisIs','User'];
var SUFFIX = ['IsIt','Mon','S','TheOne','User'];
// This limits how many suggestions will be created with 4 digit random number appended to username
var RANDOM = 20;

// Main entry point
// ------------------------
$("#chg-balloon-submit").click(function() {
    var username = $("#chg-balloon-input").val().trim();

    // 1. check if username is blank
    if (!username) {
      $("#chg-balloon-status").html(ALERT + " Please provide a username.");
      return;
    }

    // 2. check if username is valid
    var nameCheck = validCheck(username);
    if (!nameCheck.valid) {
      $("#chg-balloon-status").html(ALERT + " " + nameCheck.message);
      return;
    }

    // 3. check if username is available
    var userExists = checkUserExist(username);
    userExists.fail(function(failObj, err) {
      $("#chg-balloon-status").html(ALERT + " Problems encountered while checking username. Try again later.");
      return;
    });
    userExists.success(function(data) {
      if (data && data.length === 0) {
        $("#chg-balloon-status").html(SUCCESS + " Congrats! <b>" + username + "</b> is available.");
        return;
      } else {
        // 4. look for username suggestions
        suggestAlternatives(username);
      }
    });
});

// Functions
// ------------------------
function validCheck(username) {
    if (username.length < MIN_LENGTH) {
      return {
          valid: false,
          message: "Invalid username. " + MIN_LEN_MSG
      };
    }
    if (!username.match(USERNAME_REGEX)) {
      return {
          valid: false,
          message: "Invalid username. " + REGEX_MSG
      };
    }
    return {
        valid: true,
        message: ''
    };
};

function checkUserExist(username) {
    return $.ajax({
        url: "https://chegg-tutors.appspot.com/coding-challenge/api/user/?username=" + username,
        timeout: API_TIMEOUT
    });
};

function suggestAlternatives(username) {
    var unameNoDigits = username.replace(/\d/g,'');
    var unames = PREFIX.map(function(pfx) { return pfx + unameNoDigits; })
         .concat(SUFFIX.map(function(sfx) { return unameNoDigits + sfx; }));
    var unamesRandom = [];

    for (var i = 0; i < RANDOM; i++) {
      unamesRandom.push(username + randomInt());
    }

    var userExists = checkUserExist(unames.concat(unamesRandom));
    userExists.fail(function(failObj, err) {
      $("#chg-balloon-status").html(ALERT + " <b>" + username + "</b> is not available."
                                  + " But problems encountered while checking for alternatives. Try again later.");
      return;
    });
    userExists.success(function(data) {
      // None of our suggestions are being used, so we can just pick the top 3.
      if (data && data.length === 0) {
        $("#chg-balloon-status").html(ALERT + " <b>" + username + "</b> is not available. How about one of these:"
                                    + "<br /><br />" + unames.slice(0,3).join("<br /><br />"));
        return;
      } else {
        // Check if we have at least 3 suggestions
        var c_idx, cr_idx, suggestStr;

        $.each(data, function(idx,obj) {
          // Remove from suggestion list if it's already taken
          c_idx = unames.indexOf(obj.username);
          if (c_idx > -1) {
            unames.splice(c_idx, 1);
          }
          // Do the same for random numbered suggestions
          cr_idx = unamesRandom.indexOf(obj.username);
          if (cr_idx > -1) {
            unamesRandom.splice(cr_idx, 1);
          }
        });

        // If we don't have 1 suggestion without a number (add more to PREFIX or SUFFIX)
        // OR we don't have enough alternatives (increase RANDOM)
        if (unames.length < 1 || (unames.length + unamesRandom.length) < 3) {
          $("#chg-balloon-status").html(ALERT + " <b>" + username + "</b> is not available."
                                      + " But unable to find adequate alternatives. Try another username.");
          return;
        } else {
          suggestStr = "<br /><br />" + unames.slice(0,3).join("<br /><br />");
          if (unames.length < 3) {
            suggestStr += "<br /><br />" + unamesRandom.slice(0,3 - unames.length).join("<br /><br />");
          }
          $("#chg-balloon-status").html(ALERT + " <b>" + username + "</b> is not available. How about one of these:" + suggestStr);
          return;
        }
      }
    });
};

function randomInt() {
    var min = 1000;
    var max = 9999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
