"use strict";

//------------------------------------- Data -------------------------------------//
const account1 = {
  owner: "Jonas Schmedtmann",
  movements: [200, 455.23, -306.5, 25000, -642.21, -133.9, 79.97, 1300],
  interestRate: 1.2, // %
  pin: 1111,
  movementsDates: ["2019-11-18T21:31:17.178Z", "2019-12-23T07:42:02.383Z", "2020-01-28T09:15:04.904Z", "2020-04-01T10:17:24.185Z", "2020-05-08T14:11:59.604Z", "2020-07-26T17:01:17.194Z", "2024-10-04T19:57:04.599Z", "2024-10-01T19:59:37.220Z"],
  currency: "EUR",
  locale: "pt-PT",
  currency: "EUR",
};

const account2 = {
  owner: "Jessica Davis",
  movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
  interestRate: 1.5,
  pin: 2222,
  movementsDates: ["2019-11-01T13:15:33.035Z", "2019-11-30T09:48:16.867Z", "2019-12-25T06:04:23.907Z", "2020-01-25T14:18:46.235Z", "2020-02-05T16:33:06.386Z", "2020-04-10T14:43:26.374Z", "2020-06-25T18:49:59.371Z", "2020-07-26T12:01:20.894Z"],
  locale: "en-US",
  currency: "USD",
};

const account3 = {
  owner: "Mohammad Noohi",
  movements: [5_000_000, 3400_000_000, -150_000, -790_000, -3_210_000, -1_000_000, 8_500_000, -30_000],
  interestRate: 1.5,
  pin: 3333,
  movementsDates: ["2019-11-01T13:15:33.035Z", "2019-11-30T09:48:16.867Z", "2019-12-25T06:04:23.907Z", "2020-01-25T14:18:46.235Z", "2020-02-05T16:33:06.386Z", "2020-04-10T14:43:26.374Z", "2020-06-25T18:49:59.371Z", "2020-07-26T12:01:20.894Z"],
  locale: "fa-IR",
  currency: "IRR",
};

const accounts = [account1, account2, account3];

// Global Variables
let currentAccount;
let sortedState = false; // false => default movements sort , true => ascending movements sort
let theme = localStorage.getItem("theme") ?? "light";
let timer; // this is for control logout timer
//-------------------------------------- Elements --------------------------------------//

// Text( Label ) Elements
const labelWelcome = document.querySelector(".welcome");
const labelDate = document.querySelector(".date");
const labelBalance = document.querySelector(".balance__value");
const labelSumIn = document.querySelector(".summary__value--in");
const labelSumOut = document.querySelector(".summary__value--out");
const labelSumInterest = document.querySelector(".summary__value--interest");
const labelTimer = document.querySelector(".timer");

//  Container Elements
const containerApp = document.querySelector(".app");
const containerMovements = document.querySelector(".movements");
const root = document.querySelector(":root");

// Button Elementes
const btnLogin = document.querySelector(".login__btn");
const btnTransfer = document.querySelector(".form__btn--transfer");
const btnLoan = document.querySelector(".form__btn--loan");
const btnClose = document.querySelector(".form__btn--close");
const btnSort = document.querySelector(".btn--sort");
const themeToggler = document.querySelector(".theme-toggler-btn");

// Input Elements
const inputLoginUsername = document.querySelector(".login__input--user");
const inputLoginPin = document.querySelector(".login__input--pin");
const inputTransferTo = document.querySelector(".form__input--to");
const inputTransferAmount = document.querySelector(".form__input--amount");
const inputLoanAmount = document.querySelector(".form__input--loan-amount");
const inputCloseUsername = document.querySelector(".form__input--user");
const inputClosePin = document.querySelector(".form__input--pin");

//----------------------------------- Functions -----------------------------------//
function formatCur(value, locale, currency) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(value);
}

const formatMovementDate = (date, locale) => {
  const calcDaysPassed = (date1, date2) => Math.round(Math.abs((date2 - date1) / (24 * 60 * 60 * 1000)));

  const daysPassed = calcDaysPassed(new Date(), date);

  if (daysPassed === 0) {
    return "today";
  } else if (daysPassed === 1) {
    return "yesterday";
  } else if (daysPassed <= 7) {
    return `${daysPassed} days ago`;
  } else {
    /* 
    // instead of this we use Intl to show the date

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${day}/${month}/${year}`; 
    */
    const intlDate = new Intl.DateTimeFormat(locale).format(date);

    return intlDate;
  }
};

// Create username for each account automaticly ( call one time )
function createUsername(accs) {
  accs.forEach(acc => {
    acc.username = acc.owner
      .toLowerCase()
      .split(" ")
      .map(word => word[0])
      .join("");
  });
}
createUsername(accounts);

// Show All movements( transactions , تراکنش ها )
function displayMovements(account, sort = false) {
  // First Clear Previous Content
  containerMovements.innerHTML = "";

  // we got a copy with [...movments] => because we shouldn't change the original data
  // define the
  const arrangedMovements = sort ? [...account.movements].sort((a, b) => a - b) : account.movements;
  // Add New Content
  arrangedMovements.forEach((mov, i) => {
    const type = mov > 0 ? "deposit" : "withdrawal";
    // Calculate Date
    const date = new Date(account.movementsDates[i]);

    const html = `
    <div class="movements__row">
      <div class="movements__type movements__type--${type}">${i + 1} deposit</div>
      <div class="movements__date">${formatMovementDate(date, currentAccount.locale)}</div>
      <div class="movements__value">${formatCur(mov, account.locale, account.currency)}</div>
    </div>
    `;

    containerMovements.insertAdjacentHTML("afterbegin", html);
  });
}

// Calc Total Balance and Display it
function calcDisplyBalance(account) {
  account.balance = account.movements.reduce((prev, curr) => prev + curr, 0);
  labelBalance.textContent = `${formatCur(account.balance.toFixed(2), account.locale, account.currency)}`;
}

// Calculate and Display Summary
function calcDisplaySummary(account) {
  // محاسبه ی مجموع درامد
  const incomes = account.movements.filter(mov => mov > 0).reduce((prev, curr) => prev + curr, 0);

  // محاسبه ی مجموع برداشت ها
  const outcomes = account.movements.filter(mov => mov < 0).reduce((prev, curr) => prev + curr, 0);

  // محاسبه ی سود دریافتی
  const interest = account.movements
    .filter(mov => mov > 0)
    .map(deposite => (deposite * account.interestRate) / 100)
    .reduce((prev, curr) => prev + curr, 0);

  labelSumIn.textContent = `${formatCur(incomes.toFixed(2), account.locale, account.currency)}`;
  labelSumOut.textContent = `${formatCur(outcomes.toFixed(2), account.locale, account.currency)}`;
  labelSumInterest.textContent = `${formatCur(interest.toFixed(2), account.locale, account.currency)}`;
}

function updateUI(account) {
  displayMovements(account);
  calcDisplyBalance(account);
  calcDisplaySummary(account);
}

function setTheme(theme) {
  if (theme === "light") {
    // set light theme
    root.style = `--yellow-gradient: linear-gradient(to top left, #ffb003, #ffcb03);
  --green-gradient: linear-gradient(to top left, #39b385, #9be15d);
  --red-gradient: linear-gradient(to top left, #e52a5a, #ff585f);
  --green-color: #66c873;
  --red-color: #f5465d;
  --body-color: #444;
  --body-background: #f3f3f3;
  --border-color: #ccc;
  --white-color: #fff;
  --gray-color-e: #eee;
  --gray-color-b: #bbb;
  --gray-color-3: #333;
  --gray-color-6: #666;
  --gray-color-7: #777;
  --gray-color-8: #888;
  --form-input-bg: rgba(255, 255, 255, 0.4);
  --form-input-focus-bg: rgba(255, 255, 255, 0.6);
  --form-focus-btn: rgba(255, 255, 255, 0.8);`;
    // change theme icon
    themeToggler.classList.remove("dark");
  } else if (theme === "dark") {
    // set dark theme
    root.style = `--yellow-gradient: linear-gradient(to top left, #eda60c, #edc00c);
  --green-gradient: linear-gradient(to top left, #53c197, #5d9d25);
  --red-gradient: linear-gradient(to top left, #cc2448, #a00810);
  --green-color: #3d9448;
  --red-color: #af1227;
  --body-color: #bababa;
  --body-background: #0d0d0d;
  --border-color: #333333;
  --white-color: #000;
  --gray-color-e: #ffffff42;
  --gray-color-b: #454545;
  --gray-color-3: #ffffff;
  --gray-color-6: #999999;
  --gray-color-7: #878787;
  --gray-color-8: #787878;
  --form-input-bg: rgba(5, 5, 5, 0.4);
  --form-input-focus-bg: rgba(5, 5, 5, 0.6);
  --form-focus-btn: rgba(5, 5, 5, 0.8);
  --shadow-color : rgba(255,255,255,0.12);
  `;
    // change theme icon
    themeToggler.classList.add("dark");
  }
}

setTheme(theme);

function startLogoutTimer() {}

//------------------------------- Events Hadnlers -------------------------------//

// Login Functionality
btnLogin.addEventListener("click", e => {
  e.preventDefault();
  currentAccount = accounts.find(account => account.username === inputLoginUsername.value.toLowerCase());
  if (currentAccount?.pin === Number(inputLoginPin.value)) {
    // Display UI and welcome message
    containerApp.style.opacity = 1;
    labelWelcome.textContent = `Good afternoon ${currentAccount.owner.split(" ")[0]}`;

    // Disply current Date and Time
    /* 
    // instead of this code we use Internationaliziation API in our project
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0"); 
    labelDate.textContent = `${day}/${month}/${year} , ${hour}:${min}`;
    */

    const now = new Date();

    labelDate.textContent = new Intl.DateTimeFormat(currentAccount.locale, {
      hour: "numeric",
      minute: "numeric",
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }).format(now);

    // Update UI
    updateUI(currentAccount);

    // Clear Input Fields and remove focus on pin input
    // the assingment oprator apply from right to left
    inputLoginUsername.value = inputLoginPin.value = "";
    inputLoginPin.blur();

    // show logout timer
    // First restart previous timer
    clearInterval(timer);

    let min = 5;
    let sec = 30;

    timer = setInterval(() => {
      // The timer algorithem
      if (min === 0 && sec === 0) {
        clearInterval(timer);
        // logout the user;
        containerApp.style.opacity = 0;
      } else if (sec === 0) {
        sec = 60;
        min--;
      } else {
        sec--;
        labelTimer.textContent = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
      }
    }, 1000);
  } else {
    alert("wrong username or pin try again");
  }
});

// Transfer Money Functionality
btnTransfer.addEventListener("click", e => {
  e.preventDefault();

  // 1. amount of transfer
  const amount = +inputTransferAmount.value;
  // یک نکته ای برای فهم بیشتر مینویسم اینکه وقتی میریم و اون ابجکت رو پیدا میکنیم و توی یه وریبل دیگه ذخیره میکنیم این یه رفرنس کپی هست یعنی این وریبل یه کپی از اون نیست و در واقع یه اشاره گر به همون ابجکت هست پس خیلی راحت میتونیم تغییرش بدیم به همین راحتی

  // 2. find reciver user
  const reciverAcc = accounts.find(account => account.username === inputTransferTo.value.toLowerCase().trim());

  // 3. check conditions: 1. the target is exist ? 2. can't transfer to ourselves 3. have enough money
  /* 
  instead of reciverAcc && reciverAcc.username !== currentAccount.username we can use optional chaning in this way => reciverAcc?.username !== currentAccount.username the both condition is the same
  */
  if (reciverAcc && reciverAcc.username !== currentAccount.username && amount > 0 && amount <= currentAccount.balance) {
    // Withdrawal from current account and add the time of withdrawal
    currentAccount.movements.push(-amount);
    currentAccount.movementsDates.push(new Date().toISOString());
    // Add desposite to reciver account and add the time of deposite for reciver
    reciverAcc.movements.push(amount);
    reciverAcc.movementsDates.push(new Date().toISOString());

    console.log("can transfer");
    // update UI
    updateUI(currentAccount);

    // Clear Inputs
    inputTransferAmount.value = inputTransferTo.value = "";
  } else {
    alert("you don't have enough money ⚠️");
    inputTransferAmount.focus();
  }
});

// Close Account Functionality
// 1. Just the owner of accoutn can delete the account not anyone else
btnClose.addEventListener("click", e => {
  e.preventDefault();

  if (inputCloseUsername.value.toLowerCase() === currentAccount.username && Number(inputClosePin.value) === currentAccount.pin) {
    const accountIndex = accounts.findIndex(account => account.username === inputCloseUsername.value.toLowerCase());
    // Delete corresponding account from database(accounts array)
    accounts.splice(accountIndex, 1);

    // Hide UI
    containerApp.style.opacity = 0;

    // Clear Inputs
    inputCloseUsername.value = inputClosePin.value = "";
  } else {
    alert("you can't delete account \n Please enter correct information");
    // Focus on username input
    inputCloseUsername.focus();
  }
});

// Sort Movements
btnSort.addEventListener("click", e => {
  sortedState = !sortedState;
  displayMovements(currentAccount, sortedState);
});

// Loan Request ( درخواست وام )
/* 
شرط درخواست وام:
باید حداقل یه واریزی داشتی باشی که مقدار این واریزی از ۱۰ درصد مبلغ وام درخواستی بیشتر باشه مثلا اگر بیست میلیون درخواست وام میدی باید حداقل یه واریزی داشته باشی که بیشتر از دو میلیون باشه
*/
btnLoan.addEventListener("click", e => {
  e.preventDefault();
  const loanAmount = Math.floor(inputLoanAmount.value);

  if (loanAmount > 0 && currentAccount.movements.some(mov => mov > loanAmount * 0.1)) {
    // Update UI , Simulation is a time-consuming process with setTimeout method
    setTimeout(() => {
      // add data of loan in database like : amount of movements and time of movments in the corresponding place in database
      currentAccount.movements.push(loanAmount); // add amount of load in DB
      currentAccount.movementsDates.push(new Date().toISOString()); // add time of loan in DB

      updateUI(currentAccount);
    }, 3000);
    // Clear Input
    inputLoanAmount.value = "";
  } else {
    alert("You are not eligible for a loan");
  }
});
``;

themeToggler.addEventListener("click", e => {
  console.log("click on theme toggler");
  if (theme === "light") {
    theme = "dark";
    localStorage.setItem("theme", theme);
    setTheme(theme);
  } else if (theme === "dark") {
    theme = "light";
    localStorage.setItem("theme", theme);
    setTheme(theme);
  }
});
