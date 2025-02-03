// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const database = firebase.database();
const firestore = firebase.firestore();

// Initialine categories for each transaction type
const categories = {
  add: ["Salary", "Investment", "Other"],
  subtract: ["Food", "Transport", "Health", "Entertainment", "Other"]
};

var dLimit = 3;
var wLimit = 0;
var docRef;
var money;

// Make loading screen disappear
function showPage() {
  document.getElementById("loading").style.display = "none";
}

// Draggable window functionality
let draggedHeader = null;
let draggedWindow = null;
const headers = document.querySelectorAll('.header');

headers.forEach(header => {
  header.addEventListener('dragstart', dragStart);
  header.addEventListener('dragover', dragOver);
  header.addEventListener('dragend', dragEnd);
});

function dragStart(event) {
  draggedHeader = event.target;
  draggedWindow = draggedHeader.parentNode;
  draggedWindow.classList.add('dragged');

  // Add 'scaled-down' class to all other windows
  const allWindows = document.querySelectorAll('.window');
  allWindows.forEach(window => {
    if (window !== draggedWindow) {
      window.classList.add('scaled-down');
    }
  });
}

// Dragging over a target window
function dragOver(event) {
  event.preventDefault();
  const target = event.target.closest('.window');
  
  if (target && target !== draggedWindow) {
    const windowsContainer = target.parentNode;
    const allWindows = Array.from(windowsContainer.querySelectorAll('.window'));
    const draggedIndex = allWindows.indexOf(draggedWindow);
    const targetIndex = allWindows.indexOf(target);
    
    // Determine direction
    const isSlidingLeft = draggedIndex < targetIndex;

    // Apply slide animation based on the direction
    draggedWindow.classList.remove('slide-left', 'slide-right');
    draggedWindow.classList.add(isSlidingLeft ? 'slide-right' : 'slide-left');

    // Reorder the windows
    if (isSlidingLeft) {
      windowsContainer.insertBefore(draggedWindow, target.nextSibling);
    } else {
      windowsContainer.insertBefore(draggedWindow, target);
    }
  }
}

// End of dragging
function dragEnd(event) {
  draggedWindow.classList.remove('dragged', 'slide-left', 'slide-right'); // Remove sliding classes

  // Remove 'scaled-down' class from all windows
  const allWindows = document.querySelectorAll('.window');
  allWindows.forEach(window => window.classList.remove('scaled-down'));

  draggedHeader = null;
  draggedWindow = null;
}

// Function to toggle the settings 
function toggleSettings() {
  const popup = document.getElementById("myForm");

  if (popup.style.display != "block") {
    popup.style.display = "block";  // Open the popup

    docRef.get().then((doc) => {
      if (doc.exists) {
          var data = doc.data();
          // Set the values in the HTML popup fields
          document.getElementById("currency").value = data.Currency;
          document.getElementById("theme").value = data.Theme;
          document.getElementById("limit").value = data.Limit;
          document.getElementById("wLimit").value = data.wLimit;
      }
      else {
        throw "Doesnt Exist";
      }

      // Add the outside click listener
      handleOutsideClick = (event) => closeOnClickOutside(event, popup);
      document.addEventListener("click", handleOutsideClick);

    }).catch((error) => {
        console.error("Error getting document:", error);
        update();
        loadSavedSettings();
    });

  } else {
    popup.style.display = "none";
    document.removeEventListener("click", handleOutsideClick);  // Remove the listener
  }
} 

// Function to close the settings popup if clicked outside
function closeOnClickOutside(event, element) {
  if (!element.contains(event.target)) {
    element.style.display = "none";
    document.removeEventListener("click", handleOutsideClick);  // Remove the listener
  }
}

// Function to apply the theme
function applyTheme(theme) {
  // If there is no value in the database update it to the default
  if (!theme) {
    docRef.update({
      Theme: 'dark'
    })
  }

  const body = document.body;
  
  if (theme === "light") {
    body.classList.add("light-mode");
  } else {
    body.classList.remove("light-mode");
  }
}

// Function to apply the currency
function applyCurrency(currency) { 
  // If there is no value in the database update it to the default
  if (!currency) {
    docRef.update({
      Currency: '$'
    })
  }

  if (currency === "USD") {
    money = '$';
  } 
  else if (currency === "EUR"){
    money = '€';
  }
  else if (currency === "GBP"){
    money = '£';
  }
  
  // Change the limit label currency in the settings popup
  const wLimitInput = document.getElementById('wLimitLabel');
  wLimitInput.textContent = `Monthly Budget (In ${money})`;
}

// Function to apply the timeline history limit
function applyLimit (limit) {
  // If there is no value in the database update it to the default
  if (!limit) {
    docRef.update({
      Limit: 3
    })
  } else {
    dLimit = Number(limit);
  }
}

// Function to apply the withdraw monthly limit
function applyWithdrawLimit (limit) {
  // If there is no value in the database update it to the default
  if (!limit) {
    docRef.update({
      wLimit: 0
    })
  } else {
    wLimit = Number(limit);
  }
}

// On page load, apply the theme stored in localStorage
function loadSavedSettings() {
  docRef.get().then((doc) => {
    if (doc.exists) {
      var data = doc.data();

      applyLimit(data.Limit);
      applyWithdrawLimit(data.wLimit);
      applyTheme(data.Theme);
      applyCurrency(data.Currency);
      update();
    }
    else {
      throw "Doesnt Exist";
    }
  }).catch((error) => {
      console.error("Error getting document:", error);
      docRef.set({
        Currency: 'USD',
        Theme: 'dark',
        Limit: 3,
        wLimit: 0
      })
      update();
      loadSavedSettings();
  });
};

// Save settings in firestore
document.getElementById('saveSettingsBtn').addEventListener('click', function() {
  document.getElementById("loading").style.display = "block";

  const selectedCurrency = document.getElementById("currency").value;
  const selectedTheme = document.getElementById("theme").value;
  const selectedlimit = document.getElementById("limit").value;
  const withdrawLimit = document.getElementById("wLimit").value;

  docRef.update({
    Currency: selectedCurrency,
    Theme: selectedTheme,
    Limit: selectedlimit,
    wLimit: withdrawLimit
    })
    .then(() => {
        // console.log("Document successfully written!", selectedCurrency, selectedTheme);
        loadSavedSettings();
        // Close the settings panel after saving
        toggleSettings();
        setTimeout(showPage, 600);
    })
    .catch((error) => {
        console.error("Error writing document: ", error);
    })
});

// Add event listener for logout button
document.getElementById("logoutBtn").addEventListener("click", function() {
  // Sign-out and redirect
  firebase.auth().signOut().then(function() {
    window.location.href = 'login.html';
  }).catch(function(error) {
    console.error('Error logging out:', error);
  });
});

// -----------------------------------------------

// Function to update the balance from the database
function updateBalance(uid) {
  const balanceRef = database.ref('users/' + uid + '/balance/total');

  balanceRef.once("value").then(function(snapshot) {
    document.getElementById('balance').textContent = "Balance: "+ money + snapshot.val().toFixed(2);
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });
}

document.getElementById('transactionType').addEventListener("change", function () {
  const category = document.getElementById("category");

  // Clear current category options
  category.innerHTML = '<option value="" disabled hidden selected>Category</option>';
  
  // Get selected type and corresponding categories
  const selectedType = this.value;
  const selectedCategories = categories[selectedType] || [];

  // Populate category dropdown based on selected type
  selectedCategories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    category.appendChild(option);
  });
});

// Function to display timeline entries
function displayTimeline(uid, showFull) {
  var timelineList = document.getElementById('timelineList');
  var timelineRef = database.ref('users/' + uid + "/balance/timeline").orderByChild('timestamp');

  if (!showFull) {
    timelineRef = timelineRef.limitToLast(dLimit);
  }

  timelineList.innerHTML = ''; // Clear previous entries

  timelineRef.once("value").then(function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      var entry = childSnapshot.val();
      var entryId = childSnapshot.key; // Get the unique key for the entry
      var listItem = document.createElement("li");

      var amount = entry.amount.toFixed(2);
      var description = entry.description;
      var balance = entry.balance.toFixed(2);
      var time = entry.timestamp;
      var date = new Date(time);

      // Get the components of the date
      var year = date.getFullYear();
      var month = date.getMonth() + 1; // Month is zero-based
      var day = date.getDate();
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var seconds = date.getSeconds();

      // Format the date as desired
      var formattedDate = " " + day + "-" + month + "-" + year + " | " + hours + ":" + minutes + ":" + seconds;

      if (description !== "") {
        if (entry.type === "income") {
          listItem.textContent = "+" + money + amount + " | " + description + " | Balance: " + money + balance + " | " + formattedDate;
        } else if (entry.type === "expense") {
          listItem.textContent = "-" + money + amount + " | " + description + " | Balance: " + money + balance + " | " + formattedDate;
        }
      } else {
        if (entry.type === "income") {
          listItem.textContent = "+" + money + amount + " | Balance: " + money + balance + " | " + formattedDate;
        } else if (entry.type === "expense") {
          listItem.textContent = "-" + money + amount + " | Balance: " + money + balance + " | " + formattedDate;
        }
      }

      // Set data attributes for identification
      listItem.setAttribute("data-entry-id", entryId); // Unique ID of the timeline entry
      listItem.setAttribute("data-linked-key", entry.linkedKey); // The linked key to income/expense
      listItem.setAttribute("data-entry-type", entry.type); // Type (income or expense)

      var linkedKey = listItem.getAttribute("data-linked-key");
      listItem.classList.add("text-break");
    
      // Create an info object to pass to the toggle function
      var info = {
        amount: entry.amount,
        type: entry.type,
        description: entry.description || "No description",
        entryId: linkedKey
      };

      // Add onclick event listener
      listItem.onclick = () => toggle(info);

      timelineList.prepend(listItem);
    });
  });
}

// Function to toggle the settings visibility and display transaction info
function toggle(info) {
  const popup = document.getElementById('timeline-popup');

  // Clear existing content in the popup (except buttons)
  while (popup.firstChild && popup.firstChild.id !== 'x' && popup.firstChild.id !== 'del') {
    popup.removeChild(popup.firstChild);
  }

  // Update the content of the popup with the passed info
  const amountElem = document.createElement("p");
  amountElem.textContent = "Amount: " + info.amount.toFixed(2);

  const typeElem = document.createElement("p");
  typeElem.textContent = "Type: " + info.type;
  
  // Example: Set the info inside the popup
  const descriptionElem = document.createElement("p");
  descriptionElem.style.maxWidth = "300px";
  descriptionElem.textContent = "Description: " + info.description;

  // Append new content
  popup.insertBefore(amountElem, popup.querySelector('#x'));
  popup.insertBefore(typeElem, popup.querySelector('#x'));
  popup.insertBefore(descriptionElem, popup.querySelector('#x'));

  // Set the entry ID as a data attribute on the popup for later use
  popup.setAttribute("data-entry-id", info.entryId);
  popup.setAttribute("data-entry-type", info.type);

  popup.style.display = "block";  // Open the popup
}

function delTransaction() {
  const popup = document.getElementById('timeline-popup');
  const entryId = popup.getAttribute("data-entry-id");
  const uid = firebase.auth().currentUser.uid; // Replace with your function to get the current user ID

  if (!entryId) {
    console.error("No entry ID found for deletion.");
    return;
  }

  // Reference to the entry in the timeline
  const timelineRef = database.ref('users/' + uid + '/balance/timeline/' + entryId);
  const balanceRef = database.ref('users/' + uid + '/balance/total');

  timelineRef.once('value')
    .then((snapshot) => {
      if (!snapshot.exists()) {
        throw new Error("Transaction not found.");
      }

      const entry = snapshot.val();
      const amount = parseFloat(entry.amount);
      const type = entry.type; // 'income' or 'expense'

      // Fetch current balance
      return balanceRef.once('value').then((balanceSnapshot) => {
        let currentBalance = parseFloat(balanceSnapshot.val());
        const updates = {};

        // Remove from the income/expenses path
        if (type === 'income') {
          currentBalance -= amount; // Subtract income amount
          updates['users/' + uid + '/balance/income/' + entryId] = null;
        } else if (type === 'expense') {
          currentBalance += amount; // Add expense amount back
          updates['users/' + uid + '/balance/expenses/' + entryId] = null;
        }

        // Update the total balance
        updates['users/' + uid + '/balance/total'] = currentBalance;

        // Remove from the timeline
        updates['users/' + uid + '/balance/timeline/' + entryId] = null;

        // Reference to all timeline entries for subsequent balance adjustment
        const allTimelinesRef = database.ref('users/' + uid + '/balance/timeline');

        // Adjust subsequent balances
        return allTimelinesRef.once('value').then((allSnapshots) => {
          if (allSnapshots.exists()) {
            allSnapshots.forEach((childSnapshot) => {
              const childKey = childSnapshot.key;
              const childData = childSnapshot.val();

              // Skip the current entry being deleted
              if (childKey === entryId) return;

              // Adjust balances for entries after the deleted transaction
              if (childData.timestamp > entry.timestamp) {
                let updatedBalance = parseFloat(childData.balance);

                if (type === 'income') {
                  updatedBalance -= amount; // Subtract the deleted income
                } else if (type === 'expense') {
                  updatedBalance += amount; // Add back the deleted expense
                }

                // Add to the updates object
                updates['users/' + uid + '/balance/timeline/' + childKey + '/balance'] = updatedBalance;
              }
            });
          }

          // Apply all updates to the database
          return database.ref().update(updates);
        });
      });
    })
    .then(() => {
      // Hide the popup after deletion
      popup.style.display = "none";

      // Optionally, refresh the timeline display
      update();
    })
    .catch((error) => {
      console.error("Error deleting transaction:", error);
    });
}

document.getElementById("showTimelineButton").addEventListener("click", function() {
  var showFull = this.textContent === "Show More";
  this.textContent = showFull ? "Show Less" : "Show More";
  var timelineContainer = document.querySelector('.timeline-container');
  var user = firebase.auth().currentUser;
  if (user) {
    var uid = user.uid;

    // Add/remove the expanded class to apply the transition
    if (showFull) {
      timelineContainer.classList.add('expanded');
      displayTimeline(uid, showFull);
    } else {
      timelineContainer.classList.remove('expanded');
      displayTimeline(uid, showFull);
    }
  } else {
    console.log("No user logged in");
    window.location.href = 'login.html';
  }
});

// Handle form submission
document.getElementById("submitForm").addEventListener("submit", function(event) {
  event.preventDefault();
  
  var amountInput = document.getElementById("amount");
  var descriptionInput = document.getElementById("description");
  var categoryInput = document.getElementById("category");
  var transactionTypeInput = document.getElementById("transactionType").value;

  var amount = parseFloat(amountInput.value);
  var description = descriptionInput.value;
  var category = categoryInput.value;
  var mode = transactionTypeInput;

  var uid = firebase.auth().currentUser.uid;

  // Initialize updates object with necessary paths
  var updates = {};
  var balanceRef = database.ref('users/' + uid + "/balance");

  balanceRef.once("value").then(function(snapshot) {
    var balance = parseFloat(snapshot.child("total").val()); // Get total balance
    var incomeKey = firebase.database().ref().child('users/' + uid + '/balance/income').push().key;
    var expenseKey = firebase.database().ref().child('users/' + uid + '/balance/expenses').push().key;
    
    if (isNaN(balance)) {
      // Restarting balance in case something goes wrong
      balance = 0;
    }

    if (mode === "add") {
      balance += amount;
      updates['users/' + uid + '/balance/income/' + incomeKey] = {
        category: category,
        amount: amount,
        description: description,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      };
      updates['users/' + uid + '/balance/timeline/' + incomeKey] = {
        type: "income",
        amount: amount,
        description: description,
        category: category,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        balance: balance,
        linkedKey: incomeKey // Save the income key reference
      };
    } else if (mode === "subtract") {
      balance -= amount;
      updates['users/' + uid + '/balance/expenses/' + expenseKey] = {
        category: category,
        amount: amount,
        description: description,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      };
      updates['users/' + uid + '/balance/timeline/' + expenseKey] = {
        type: "expense",
        amount: amount,
        description: description,
        category: category,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        balance: balance,
        linkedKey: expenseKey // Save the expense key reference
      };
    }
    
    updates['users/' + uid + '/balance/total'] = balance;

    // Update the database
    return firebase.database().ref().update(updates);

  }).then(function() {
    // Update the balance display and charts after database update
    update();

    // Clear input fields
    amountInput.value = '';
    descriptionInput.value = '';
    categoryInput.value = 'Other';

  }).catch(function(error) {
    console.error('Error updating database:', error);
  });
});

// Store chart instances to be destroyed later
let incomeChartInstance;
let expensesChartInstance;
let balanceChartInstance;

// Function to create pie charts and destroy if they already exist
function createPieChart(chartId, data, labels, chartTitle) {
  // Destroy the chart if it already exists
  if (chartId === 'incomeChart' && incomeChartInstance) {
    incomeChartInstance.destroy();
  }
  if (chartId === 'expensesChart' && expensesChartInstance) {
    expensesChartInstance.destroy();
  }

  const ctx = document.getElementById(chartId).getContext('2d');
  const chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: ['#4caf50', '#ff9800', '#f44336', '#2196f3', '#9c27b0', '#ffeb3b'],
      }],
    },
    options: {
      responsive: true,
      title: {
        display: true,
        text: chartTitle,
      },
    },
  });

  // Assign the chart instance to the corresponding variable
  if (chartId === 'incomeChart') {
    incomeChartInstance = chartInstance;
  } else if (chartId === 'expensesChart') {
    expensesChartInstance = chartInstance;
  }
}

// Function to fetch income and expenses data and create charts
function updatePieCharts(uid) {
  const incomeRef = database.ref('users/' + uid + '/balance/income');
  const expensesRef = database.ref('users/' + uid + '/balance/expenses');

  const incomeData = [];
  const incomeLabels = [];
  const expensesData = [];
  const expensesLabels = [];

  incomeRef.once('value', function (snapshot) {
    snapshot.forEach(function (childSnapshot) {
      const income = childSnapshot.val();
      const category = income.category || 'Other';
      const index = incomeLabels.indexOf(category);
      if (index === -1) {
        incomeLabels.push(category);
        incomeData.push(income.amount);
      } else {
        incomeData[index] += income.amount;
      }
    });

    createPieChart('incomeChart', incomeData, incomeLabels, 'Income by Category');
  });

  expensesRef.once('value', function (snapshot) {
    snapshot.forEach(function (childSnapshot) {
      const expense = childSnapshot.val();
      const category = expense.category || 'Other';
      const index = expensesLabels.indexOf(category);
      if (index === -1) {
        expensesLabels.push(category);
        expensesData.push(expense.amount);
      } else {
        expensesData[index] += expense.amount;
      }
    });

    createPieChart('expensesChart', expensesData, expensesLabels, 'Expenses by Category');
  });
}

// Function to create or update balance chart with filtered data
function createBalanceChart(ctx, data, labels, chartTitle) {
  // Destroy the chart if it already exists
  if (balanceChartInstance) {
    balanceChartInstance.destroy();
  }

  // Create the new balance chart
  balanceChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: chartTitle,
        data: data,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        fill: true,
      }],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
          },
          title: {
            display: true,
            text: 'Date',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Balance (' + money + ')',
          },
        },
      },
    },
  });
}

// Function to fetch and update the balance chart
function updateBalanceChart(uid, startDate, endDate) {
  const timelineRef = database.ref('users/' + uid + '/balance/timeline').orderByChild('timestamp');

  timelineRef.once('value').then((snapshot) => {
    const labels = [];
    const data = [];

    var Exceeds = false;
    let startingBalance = null;
    let finalBalance = null;
    let date1 = null;
    let date2 = null;

    snapshot.forEach((childSnapshot) => {
      const entry = childSnapshot.val();
      const entryDate = new Date(entry.timestamp);
      
      // Filter entries based on the provided date range
      if (entryDate >= startDate && entryDate <= endDate) {
        labels.push(entryDate);
        data.push(entry.balance);

        // Set starting balance (first entry in the range)
        if (!startingBalance) {
          startingBalance = entry.balance;
        }

        // Set final balance (last entry in the range)
        finalBalance = entry.balance;
      }
    })

    let currentStartDate = new Date(startDate); // Initialize to the start date

    // Loop through the date range in 30-day segments
    while (currentStartDate <= endDate) {
      const currentEndDate = new Date(currentStartDate);
      currentEndDate.setDate(currentEndDate.getDate() + 30); // Set the end of the 30-day segment
      if (currentEndDate > endDate) currentEndDate.setTime(endDate.getTime()); // Cap to overall end date

      let segmentExpenses = 0;

      // Process snapshot entries within the current segment
      snapshot.forEach((childSnapshot) => {
        const entry = childSnapshot.val();
        const entryDate = new Date(entry.timestamp);

        if (entryDate >= currentStartDate && entryDate <= currentEndDate) {
          if (entry.type === "expense") {
            segmentExpenses += entry.amount;
          }
        }
      });

      // Check if the segment exceeds the limit
      if (segmentExpenses >= wLimit) {
        Exceeds = true;
        date1 = Intl.DateTimeFormat('en-GB').format(currentStartDate);
        date2 = Intl.DateTimeFormat('en-GB').format(endDate);

        break; // Exit the loop if the limit is exceeded
      }

      // Move to the next segment
      currentStartDate.setDate(currentStartDate.getDate() + 30);
    }
    
    // Create or update the balance chart with filtered data
    const ctx = document.getElementById('balanceChart').getContext('2d');
    createBalanceChart(ctx, data, labels, 'Total Balance Over Time');

    // Calculate the percentage difference
    let percentage = 0;
    const statsElement = document.getElementById('stats');

    if (!isNaN(finalBalance) && !isNaN(startingBalance)) {
      percentage = (Math.abs(((finalBalance - startingBalance) / startingBalance) * 100)).toFixed(2);
    }
    if (startingBalance > finalBalance) {
      stats = `<strong>${percentage}%</strong> Income Decrease`;
      statsElement.style.border = 'medium solid brown';
    }
    else {
      stats = `<strong>${percentage}%</strong> Income Increase`;
      statsElement.style.border = 'medium solid seagreen';
    }

    if (wLimit != 0 && Exceeds) {
      stats += '<br><br><i class="fa fa-exclamation-triangle" style="font-size:18px;color:red;"></i> <strong>WARNING!</strong><br>Budget Exceeded during:<br><strong>[' + date1 + '] - [' + date2 + ']</strong>';
      statsElement.style.border = 'medium solid brown';
    } else if (startingBalance <= finalBalance) {
      statsElement.style.border = 'medium solid seagreen';
    }

    // Display starting and final balances
    statsElement.innerHTML = stats;
  })
}

// Event listener for filtering data by date range
document.getElementById('filterButton').addEventListener('click', () => {
  const startDate = new Date(document.getElementById('startDate').value);
  const endDate = new Date(document.getElementById('endDate').value);
  endDate.setHours(23, 59, 59, 999);
  const uid = firebase.auth().currentUser.uid;

  if (!isNaN(startDate) && !isNaN(endDate) && uid) {
    updateBalanceChart(uid, startDate, endDate);
  } else {
    alert('Please select a valid date range and make sure you are logged in.');
  }
});

function update() {
  // Initialize the current date as endDate
  const endDate = new Date();

  // Initialize the date 6 months before as startDate
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  endDate.setHours(23, 59, 59, 999);

  var timelineContainer = document.querySelector('.timeline-container');
  var isExpanded = timelineContainer.classList.contains('expanded');

  uid = firebase.auth().currentUser.uid;

  updateBalance(uid);
  displayTimeline(uid, isExpanded);
  updateBalanceChart(uid, startDate, endDate);
  updatePieCharts(uid);
}

function nameEmailCheck (user) {
  // Display the username in the header
  var usernameElement = document.getElementById('userName');
  var displayName = user.displayName ? user.displayName : "???"; // Fallback if no displayName is set
  usernameElement.textContent = displayName;
  
  // Check if the email is verified
  var element = document.getElementById('emailVerify');

  if (user.emailVerified) {
    element.innerHTML = '<i class="fa fa-check" style="color:seagreen;" title="Your email is verified"></i>';
  } else {
    element.innerHTML = '<i class="fa fa-exclamation-triangle" style="font-size:18px;color:red;" onclick="sendEmail()" title="Email Not Verified!\nClick To Resend" ></i>';   
  }
}

function sendEmail() {
  // Send a verification email
  firebase.auth().currentUser.sendEmailVerification().then(() => {
    console.log("Verification email sent.");
    // alert("Verification email sent! Please check your inbox.");
  }).catch((error) => {
      console.error("Error sending verification email: ", error);
  });
}

function x_btn(element) {
  const parent = element.parentNode;

  parent.style.display = "none";
}

function Swipe() {
  const windowall = document.querySelectorAll('.window');
  const windows = ["window1", "window2", "window3"];

  let touchStartListener;
  let touchEndListener;

  if (window.innerWidth <= 768) {
    let currentWindowIndex = 1;

    // Show or hide windows based on the current index
    function updateDisplay() {
      windows.forEach((win, i) => {
        document.getElementById(win).style.display = i === currentWindowIndex ? "block" : "none";
      });
    }

    let startX = 0;

    // Define the touchstart listener
    touchStartListener = (e) => {
      startX = e.touches[0].clientX;
    };

    // Define the touchend listener
    touchEndListener = (e) => {
      const endX = e.changedTouches[0].clientX;
      const threshold = 50; // Minimum swipe distance

      if (endX < startX - threshold) {
        // Swipe left
        currentWindowIndex = (currentWindowIndex + 1) % windows.length;
      } else if (endX > startX + threshold) {
        // Swipe right
        currentWindowIndex = (currentWindowIndex - 1 + windows.length) % windows.length;
      }

      updateDisplay();
    };

    // Attach the touch event listeners
    const footer = document.getElementById("footer");
    footer.addEventListener("touchstart", touchStartListener);
    footer.addEventListener("touchend", touchEndListener);

    // Initialize by showing the first window
    updateDisplay();
  } else {
    // Revert changes for non-mobile: display all windows and remove swipe listeners
    windowall.forEach((window) => {
      window.style.display = 'block';
    });

    // Remove swipe listeners if they exist
    const footer = document.getElementById("footer");
    if (touchStartListener) footer.removeEventListener("touchstart", touchStartListener);
    if (touchEndListener) footer.removeEventListener("touchend", touchEndListener);
  }
}


window.addEventListener("resize", Swipe);

window.addEventListener("DOMContentLoaded", function() {
  // Check if user is logged in before calling functions
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      var uid = user.uid;
      docRef = firestore.collection("settings").doc(uid);

      loadSavedSettings();
      nameEmailCheck(user);
      Swipe();
      setTimeout(showPage, 1500);
    } else {
      console.log("No user logged in");
      window.location.href = 'login.html'; // Redirect to login page if not logged in
    }
  });
});